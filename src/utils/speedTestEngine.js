import { buildApiUrl } from "./apiUrl";
import {
  calculateAverage,
  calculateJitter,
  calculateMedian,
  calculateMbps,
  calculatePacketLossPercent,
} from "./speedTestMath";

const PING_TIMEOUT_MS = 2500;
const SERVER_SELECTION_PROBES = 3;
const IDLE_PING_PROBES = 10;
const TRANSFER_WORKERS = 3;
const DOWNLOAD_CHUNK_BYTES = 2 * 1024 * 1024;
const DOWNLOAD_MAX_BYTES = 48 * 1024 * 1024;
const DOWNLOAD_MAX_DURATION_MS = 7000;
const UPLOAD_CHUNK_BYTES = 512 * 1024;
const UPLOAD_MAX_BYTES = 48 * 1024 * 1024;
const UPLOAD_MAX_DURATION_MS = 7000;
const LOADED_PING_INTERVAL_MS = 350;

const now = () => performance.now();

const makeNonce = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const serverOrigin = (server) => {
  const parsed = new URL(server?.origin || "");
  const isLoopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    parsed.hostname,
  );
  if (parsed.protocol !== "https:" && !isLoopback) {
    throw new Error("Speed test servers must use HTTPS.");
  }
  return parsed.origin;
};

const isLoopbackServer = (server) => {
  try {
    const { hostname } = new URL(serverOrigin(server));
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
  } catch {
    return true;
  }
};

const endpointUrl = (server, endpoint, query = {}) => {
  const url = new URL(`/api/speed-test/${endpoint}`, serverOrigin(server));
  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const emitProgress = (onProgress, phase, details = {}) => {
  if (typeof onProgress !== "function") return;
  onProgress({ phase, ...details });
};

const measurePing = async (server, externalSignal = null) => {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener("abort", abortFromParent, { once: true });

  const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  const startedAt = now();
  try {
    const response = await fetch(
      endpointUrl(server, "ping", { nonce: makeNonce() }),
      {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
      },
    );
    if (!response.ok) return null;
    return Math.max(0, now() - startedAt);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromParent);
  }
};

const getServerCandidates = async () => {
  const response = await fetch(buildApiUrl("/speed-test/servers"), {
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error("Could not load speed test servers.");
  }

  const payload = await response.json();
  const candidates = Array.isArray(payload?.servers) ? payload.servers : [];
  return candidates.filter((server) => {
    try {
      serverOrigin(server);
      return true;
    } catch {
      return false;
    }
  });
};

const selectServer = async () => {
  const servers = await getServerCandidates();
  if (!servers.length) {
    throw new Error("No speed test servers are available. Check the API server configuration.");
  }
  const publicServers = servers.filter((server) => !isLoopbackServer(server));
  if (!publicServers.length) {
    throw new Error(
      "The only available test server is running on this device. That measures loopback traffic, not your Jio or ISP speed. Configure a publicly reachable server in SPEED_TEST_SERVERS, then run the test again.",
    );
  }

  const measured = await Promise.all(
    publicServers.map(async (server) => {
      // The warm-up request establishes a reusable connection and is excluded
      // from the server's latency samples.
      await measurePing(server);
      const probes = await Promise.all(
        Array.from({ length: SERVER_SELECTION_PROBES }, () => measurePing(server)),
      );
      const successful = probes.filter((sample) => sample !== null);
      return {
        ...server,
        medianLatencyMs: calculateMedian(successful),
        failedProbes: probes.length - successful.length,
        totalProbes: probes.length,
      };
    }),
  );

  const available = measured
    .filter((server) => server.medianLatencyMs !== null)
    .sort((left, right) => left.medianLatencyMs - right.medianLatencyMs);
  if (!available.length) {
    throw new Error("Could not reach any speed test server. Check your connection and try again.");
  }

  return { selected: available[0], candidates: measured };
};

const measureProbeSeries = async (server, count, onSample = () => {}) => {
  const samples = [];
  let failed = 0;

  for (let index = 0; index < count; index += 1) {
    const sample = await measurePing(server);
    if (sample === null) failed += 1;
    else samples.push(sample);
    onSample({ index: index + 1, total: count, sample, samples, failed });
  }

  return {
    samples,
    failed,
    total: count,
    medianMs: calculateMedian(samples),
    averageMs: calculateAverage(samples),
    jitterMs: calculateJitter(samples),
    packetLossPercent: calculatePacketLossPercent(failed, count),
  };
};

const withLoadedLatency = async (server, operation) => {
  const samples = [];
  let failed = 0;
  let stopped = false;
  let activeController = null;

  const sampler = (async () => {
    while (!stopped) {
      const probeStartedAt = now();
      activeController = new AbortController();
      const sample = await measurePing(server, activeController.signal);
      if (stopped) break;
      if (sample === null) failed += 1;
      else samples.push(sample);

      const remainingDelay = Math.max(
        0,
        LOADED_PING_INTERVAL_MS - (now() - probeStartedAt),
      );
      if (remainingDelay) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }
    }
  })();

  try {
    const result = await operation();
    return {
      ...result,
      loadedLatencySamplesMs: samples,
      loadedLatencyMs: calculateMedian(samples),
      loadedPacketLossPercent: calculatePacketLossPercent(
        failed,
        samples.length + failed,
      ),
    };
  } finally {
    stopped = true;
    activeController?.abort();
    await sampler;
  }
};

const measureDownload = async (server, onProgress) => {
  const controller = new AbortController();
  const run = {
    totalBytes: 0,
    firstByteAt: null,
    lastByteAt: null,
    failedRequests: 0,
  };
  const startedAt = now();
  let lastProgressAt = 0;
  const stopTimer = setTimeout(
    () => controller.abort(),
    DOWNLOAD_MAX_DURATION_MS,
  );

  const recordBytes = (byteLength) => {
    const timestamp = now();
    if (run.firstByteAt === null) run.firstByteAt = timestamp;
    run.lastByteAt = timestamp;
    run.totalBytes += byteLength;
    if (
      timestamp - lastProgressAt >= 100 ||
      run.totalBytes >= DOWNLOAD_MAX_BYTES
    ) {
      lastProgressAt = timestamp;
      emitProgress(onProgress, "download", {
        bytesReceived: run.totalBytes,
        startedAt: run.firstByteAt,
      });
    }
    if (run.totalBytes >= DOWNLOAD_MAX_BYTES) controller.abort();
  };

  const worker = async (workerIndex) => {
    while (
      !controller.signal.aborted &&
      now() - startedAt < DOWNLOAD_MAX_DURATION_MS &&
      run.totalBytes < DOWNLOAD_MAX_BYTES
    ) {
      try {
        const response = await fetch(
          endpointUrl(server, "download", {
            size: DOWNLOAD_CHUNK_BYTES,
            nonce: `${makeNonce()}-${workerIndex}`,
          }),
          {
            cache: "no-store",
            credentials: "omit",
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error(`Download request failed (${response.status}).`);

        if (!response.body?.getReader) {
          const data = await response.arrayBuffer();
          recordBytes(data.byteLength);
          continue;
        }

        const reader = response.body.getReader();
        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value?.byteLength) recordBytes(value.byteLength);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          run.failedRequests += 1;
          if (run.totalBytes === 0) throw error;
        }
        break;
      }
    }
  };

  try {
    const workers = Array.from({ length: TRANSFER_WORKERS }, (_, index) =>
      worker(index),
    );
    const outcomes = await Promise.allSettled(workers);
    const firstFailure = outcomes.find((outcome) => outcome.status === "rejected");
    if (run.totalBytes === 0 && firstFailure) throw firstFailure.reason;
    emitProgress(onProgress, "download", {
      bytesReceived: run.totalBytes,
      startedAt: run.firstByteAt,
    });
  } finally {
    clearTimeout(stopTimer);
    controller.abort();
  }

  const durationMs =
    run.firstByteAt !== null && run.lastByteAt !== null
      ? Math.max(0, run.lastByteAt - run.firstByteAt)
      : 0;
  if (!run.totalBytes || durationMs <= 0) {
    throw new Error("The download test did not receive enough data to measure speed.");
  }

  return {
    bytes: run.totalBytes,
    durationMs,
    mbps: calculateMbps(run.totalBytes, durationMs),
    failedRequests: run.failedRequests,
  };
};

const createRandomPayload = (size) => {
  const bytes = new Uint8Array(size);
  for (let offset = 0; offset < size; offset += 65_536) {
    crypto.getRandomValues(bytes.subarray(offset, Math.min(size, offset + 65_536)));
  }
  return bytes;
};

const sendUploadChunk = (server, payload, onProgress, signal = null) =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    let settled = false;
    const finish = (handler, value) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", abortRequest);
      handler(value);
    };
    const abortRequest = () => {
      request.abort();
      finish(reject, new Error("Upload request was interrupted."));
    };

    request.open("POST", endpointUrl(server, "upload", { nonce: makeNonce() }));
    request.responseType = "json";
    request.timeout = 20_000;
    request.setRequestHeader("Content-Type", "application/octet-stream");
    if (signal?.aborted) {
      abortRequest();
      return;
    }
    signal?.addEventListener("abort", abortRequest, { once: true });

    request.upload.addEventListener("loadstart", () => {
      onProgress({ loaded: 0, total: payload.byteLength, at: now() });
    });
    request.upload.addEventListener("progress", (event) => {
      onProgress({ loaded: event.loaded, total: event.total || payload.byteLength, at: now() });
    });

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        finish(reject, new Error(`Upload request failed (${request.status}).`));
        return;
      }

      const response = request.response;
      const receivedBytes = response?.acceptedBytes ?? response?.receivedBytes;
      if (!response || !Number.isFinite(Number(receivedBytes))) {
        finish(reject, new Error("The test server did not confirm the uploaded byte count."));
        return;
      }
      finish(resolve, {
        acceptedBytes: Number(receivedBytes),
        serverDurationMs: Number(response.serverDurationMs) || 0,
      });
    };
    request.onerror = () => finish(reject, new Error("Upload connection failed."));
    request.ontimeout = () => finish(reject, new Error("Upload request timed out."));
    request.onabort = () => finish(reject, new Error("Upload request was interrupted."));
    request.send(payload);
  });

const measureUpload = async (server, onProgress) => {
  const payload = createRandomPayload(UPLOAD_CHUNK_BYTES);
  const startedAt = now();
  const deadline = startedAt + UPLOAD_MAX_DURATION_MS;
  const controller = new AbortController();
  const stopTimer = setTimeout(
    () => controller.abort(),
    UPLOAD_MAX_DURATION_MS,
  );
  const run = {
    acceptedBytes: 0,
    pendingBytes: 0,
    firstByteAt: null,
    lastByteAt: null,
    failedRequests: 0,
    serverDurationMs: 0,
  };
  let lastProgressAt = 0;

  const recordProgress = ({ loaded, total, at }) => {
    if (run.firstByteAt === null) run.firstByteAt = at;
    if (loaded >= total) run.lastByteAt = Math.max(run.lastByteAt || 0, at);
    if (at - lastProgressAt < 100 && loaded < total) return;
    lastProgressAt = at;
    emitProgress(onProgress, "upload", {
      bytesAccepted: run.acceptedBytes,
      bytesInFlight: run.pendingBytes,
      startedAt: run.firstByteAt,
    });
  };

  const worker = async () => {
    while (
      !controller.signal.aborted &&
      now() < deadline &&
      run.acceptedBytes + run.pendingBytes < UPLOAD_MAX_BYTES
    ) {
      run.pendingBytes += payload.byteLength;
      try {
        const result = await sendUploadChunk(
          server,
          payload,
          recordProgress,
          controller.signal,
        );
        run.pendingBytes = Math.max(0, run.pendingBytes - payload.byteLength);
        run.acceptedBytes += result.acceptedBytes;
        run.serverDurationMs += result.serverDurationMs;
        emitProgress(onProgress, "upload", {
          bytesAccepted: run.acceptedBytes,
          bytesInFlight: run.pendingBytes,
          startedAt: run.firstByteAt,
        });
      } catch {
        run.pendingBytes = Math.max(0, run.pendingBytes - payload.byteLength);
        if (!controller.signal.aborted) run.failedRequests += 1;
        break;
      }
    }
  };

  try {
    await Promise.all(
      Array.from({ length: TRANSFER_WORKERS }, () => worker()),
    );
  } finally {
    clearTimeout(stopTimer);
    controller.abort();
  }

  emitProgress(onProgress, "upload", {
    bytesAccepted: run.acceptedBytes,
    bytesInFlight: run.pendingBytes,
    startedAt: run.firstByteAt,
  });

  const durationMs =
    run.firstByteAt !== null && run.lastByteAt !== null
      ? Math.max(0, run.lastByteAt - run.firstByteAt)
      : 0;
  if (!run.acceptedBytes || durationMs <= 0) {
    throw new Error("The upload test did not complete enough data to measure speed.");
  }

  return {
    bytes: run.acceptedBytes,
    durationMs,
    mbps: calculateMbps(run.acceptedBytes, durationMs),
    serverDurationMs: run.serverDurationMs,
    failedRequests: run.failedRequests,
  };
};

const warmUploadConnection = async (server) => {
  const payload = createRandomPayload(32 * 1024);
  await sendUploadChunk(server, payload, () => {});
};

export const runSpeedTest = async ({ onProgress } = {}) => {
  emitProgress(onProgress, "server-selection");
  const { selected, candidates } = await selectServer();
  emitProgress(onProgress, "server-selected", {
    server: selected,
    candidates,
  });

  emitProgress(onProgress, "warming-up");
  await measurePing(selected);
  await warmUploadConnection(selected);

  emitProgress(onProgress, "latency");
  const idle = await measureProbeSeries(selected, IDLE_PING_PROBES, (progress) =>
    emitProgress(onProgress, "latency", progress),
  );
  if (!idle.samples.length) {
    throw new Error("Latency probes failed. Check the connection and try again.");
  }

  emitProgress(onProgress, "download-started");
  const downloadStage = await withLoadedLatency(selected, () =>
    measureDownload(selected, onProgress),
  );

  emitProgress(onProgress, "upload-started");
  const uploadStage = await withLoadedLatency(selected, () =>
    measureUpload(selected, onProgress),
  );

  return {
    server: {
      id: selected.id,
      name: selected.name,
      location: selected.location,
      origin: serverOrigin(selected),
      selectionLatencyMs: selected.medianLatencyMs,
    },
    downloadMbps: downloadStage.mbps,
    uploadMbps: uploadStage.mbps,
    downloadBytes: downloadStage.bytes,
    uploadBytes: uploadStage.bytes,
    downloadDurationMs: downloadStage.durationMs,
    uploadDurationMs: uploadStage.durationMs,
    pingMs: idle.medianMs,
    averagePingMs: idle.averageMs,
    jitterMs: idle.jitterMs,
    packetLossPercent: idle.packetLossPercent,
    idlePingSamplesMs: idle.samples,
    idlePingProbeCount: idle.total,
    idlePingFailedCount: idle.failed,
    loadedDownloadLatencyMs: downloadStage.loadedLatencyMs,
    loadedDownloadPacketLossPercent: downloadStage.loadedPacketLossPercent,
    downloadLatencyIncreaseMs:
      downloadStage.loadedLatencyMs === null
        ? null
        : downloadStage.loadedLatencyMs - idle.medianMs,
    loadedUploadLatencyMs: uploadStage.loadedLatencyMs,
    loadedUploadPacketLossPercent: uploadStage.loadedPacketLossPercent,
    uploadLatencyIncreaseMs:
      uploadStage.loadedLatencyMs === null
        ? null
        : uploadStage.loadedLatencyMs - idle.medianMs,
    loadedDownloadSamplesMs: downloadStage.loadedLatencySamplesMs,
    loadedUploadSamplesMs: uploadStage.loadedLatencySamplesMs,
    downloadFailedRequests: downloadStage.failedRequests,
    uploadFailedRequests: uploadStage.failedRequests,
    transferStreams: TRANSFER_WORKERS,
  };
};

export default runSpeedTest;
