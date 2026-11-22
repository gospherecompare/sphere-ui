import { useEffect, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBolt,
  FaGlobeAsia,
  FaPlay,
  FaRedoAlt,
  FaShieldAlt,
  FaWifi,
} from "react-icons/fa";
import SEO from "../SEO";
import { createWebApplicationSchema } from "../../utils/schemaGenerators";
import { runSpeedTest } from "../../utils/speedTestEngine";
import { calculateMbps } from "../../utils/speedTestMath";
import { buildApiUrl } from "../../utils/apiUrl";
import "./speed-test.css";

const SITE_ORIGIN = "https://mobilesx.in";

const phaseLabels = {
  "server-selection": "Finding the fastest test server",
  "server-selected": "Test server selected",
  "warming-up": "Preparing the connection",
  latency: "Measuring idle latency",
  "download-started": "Measuring download speed",
  download: "Measuring download speed",
  "upload-started": "Measuring upload speed",
  upload: "Measuring upload speed",
};

const formatSpeed = (value) =>
  value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
    ? Number(value).toFixed(1)
    : "—";

const formatMilliseconds = (value) =>
  value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
    ? `${Number(value).toFixed(1)} ms`
    : "—";

const formatLoss = (value) =>
  value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
    ? `${Number(value).toFixed(1)}%`
    : "—";

const formatBytes = (value = 0) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
};

const isLocalDevelopmentHost = () => {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    window.location.hostname,
  );
};

const Metric = ({ label, value, unit, icon: Icon, tone = "blue" }) => (
  <article className={`speedtest-metric speedtest-metric--${tone}`}>
    <span className="speedtest-metric__icon" aria-hidden="true">
      <Icon />
    </span>
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span className="speedtest-metric__unit">{unit}</span>
    </div>
  </article>
);

const SpeedTestPage = () => {
  const [running, setRunning] = useState(false);
  const [activity, setActivity] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetch(buildApiUrl("/speed-test/network-info"), {
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load network information.");
        return response.json();
      })
      .then((payload) => {
        if (active) setNetworkInfo(payload);
      })
      .catch(() => {
        if (active && !controller.signal.aborted) {
          setNetworkInfo({ message: "Network details are unavailable." });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const startTest = async () => {
    if (running) return;
    setRunning(true);
    setActivity({ phase: "server-selection" });
    setResult(null);
    setError("");

    try {
      const nextResult = await runSpeedTest({ onProgress: setActivity });
      setResult(nextResult);
      setActivity({ phase: "complete" });
    } catch (testError) {
      setError(testError?.message || "The speed test could not be completed.");
      setActivity({ phase: "error" });
    } finally {
      setRunning(false);
    }
  };

  const currentPhase = activity?.phase || "idle";
  const clientNetworkInfo = networkInfo?.client;
  const networkInfoMessage =
    !clientNetworkInfo?.ip && isLocalDevelopmentHost()
      ? "Local development sends requests from this machine, so the API sees a loopback address. The deployed test API can identify your public IP when its trusted proxy is configured correctly."
      : networkInfo?.message || "ISP, ASN, and location lookup is not configured.";
  const gaugeLabel = result
    ? "Download"
    : currentPhase === "download"
      ? "Download"
      : currentPhase === "upload"
        ? "Upload"
        : running
          ? "Testing"
          : "Ready";
  const liveTransferSpeed = (() => {
    if (!running || activity?.startedAt == null) return null;
    const elapsedMs = performance.now() - activity.startedAt;
    if (currentPhase === "download" && activity.bytesReceived > 0) {
      return calculateMbps(activity.bytesReceived, elapsedMs);
    }
    if (currentPhase === "upload" && activity.bytesAccepted > 0) {
      return calculateMbps(activity.bytesAccepted, elapsedMs);
    }
    return null;
  })();
  const pageTitle = "Internet Speed Test | Download, Upload and Ping | MobilesX";
  const pageDescription =
    "Measure your internet download and upload speeds, ping, jitter, probe loss, and latency under load with the free MobilesX speed test.";
  const canonical = `${SITE_ORIGIN}/speed-test`;
  const schema = createWebApplicationSchema({
    name: "MobilesX Internet Speed Test",
    description: pageDescription,
    url: canonical,
    applicationCategory: "UtilitiesApplication",
  });

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        url={canonical}
        schema={schema}
      />

      <main className="speedtest-page">
        <div className="speedtest-shell">
          <header className="speedtest-heading">
            <span className="speedtest-eyebrow">
              <FaWifi aria-hidden="true" /> MobilesX network tools
            </span>
            <h1>Internet Speed Test</h1>
            <p>
              Check how your connection performs right now. We measure download,
              upload, latency, jitter, and latency while your connection is busy.
            </p>
          </header>

          <section className="speedtest-console" aria-label="Internet speed test">
            <div className="speedtest-console__main">
              <div className="speedtest-gauge" aria-live="polite">
                <div className="speedtest-gauge__inner">
                  <span className="speedtest-gauge__label">
                    {gaugeLabel}
                  </span>
                  <strong>
                    {result
                      ? formatSpeed(result.downloadMbps)
                      : liveTransferSpeed !== null
                        ? formatSpeed(liveTransferSpeed)
                        : running
                          ? "…"
                          : "—"}
                  </strong>
                  <span className="speedtest-gauge__unit">Mbps</span>
                </div>
              </div>

              <p className="speedtest-status" role="status" aria-live="polite">
                {running
                  ? phaseLabels[currentPhase] || "Measuring your connection"
                  : result
                    ? "Test complete"
                    : "Ready to test your connection"}
              </p>
              {running && currentPhase === "download" && (
                <p className="speedtest-transfer-note">
                  {formatBytes(activity?.bytesReceived)} received
                </p>
              )}
              {running && currentPhase === "upload" && (
                <p className="speedtest-transfer-note">
                  {formatBytes(activity?.bytesAccepted)} accepted by the server
                </p>
              )}

              <button
                type="button"
                className="speedtest-start"
                onClick={startTest}
                disabled={running}
              >
                {running ? (
                  <>
                    <span className="speedtest-spinner" aria-hidden="true" />
                    Testing connection
                  </>
                ) : result ? (
                  <>
                    <FaRedoAlt aria-hidden="true" /> Run test again
                  </>
                ) : (
                  <>
                    <FaPlay aria-hidden="true" /> Start test
                  </>
                )}
              </button>

              {error && (
                <p className="speedtest-error" role="alert">
                  {error}
                </p>
              )}

              <div className="speedtest-server" aria-live="polite">
                <FaGlobeAsia aria-hidden="true" />
                <span>
                  {result?.server
                    ? `${result.server.name} · ${result.server.location} · Multi (${result.transferStreams} streams)`
                    : activity?.server
                      ? `${activity.server.name} · ${activity.server.location}`
                      : "Server chosen by lowest measured latency · 3 concurrent streams"}
                </span>
              </div>
            </div>

            <div className="speedtest-console__metrics">
              <Metric
                label="Download"
                value={result ? formatSpeed(result.downloadMbps) : "—"}
                unit="Mbps"
                icon={FaArrowDown}
                tone="blue"
              />
              <Metric
                label="Upload"
                value={result ? formatSpeed(result.uploadMbps) : "—"}
                unit="Mbps"
                icon={FaArrowUp}
                tone="violet"
              />
              <Metric
                label="Ping"
                value={result ? formatMilliseconds(result.pingMs) : "—"}
                unit="idle latency"
                icon={FaBolt}
                tone="green"
              />
            </div>
          </section>

          <section className="speedtest-network" aria-labelledby="speedtest-network-title">
            <div className="speedtest-network__heading">
              <span className="speedtest-eyebrow">Connection details</span>
              <h2 id="speedtest-network-title">Your internet connection</h2>
            </div>
            <div className="speedtest-network__grid">
              <div>
                <span>Public IP</span>
                <strong>{clientNetworkInfo?.ip || (networkInfo ? "Unavailable" : "Detecting…")}</strong>
              </div>
              <div>
                <span>ISP / network operator</span>
                <strong>{clientNetworkInfo?.isp || "—"}</strong>
              </div>
              <div>
                <span>Organization</span>
                <strong>{clientNetworkInfo?.asnName || "—"}</strong>
              </div>
              <div>
                <span>ASN</span>
                <strong>{clientNetworkInfo?.asn || "—"}</strong>
              </div>
              <div>
                <span>Approximate location</span>
                <strong>
                  {[clientNetworkInfo?.city, clientNetworkInfo?.region, clientNetworkInfo?.country]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </strong>
              </div>
              <div>
                <span>Reverse DNS</span>
                <strong>{clientNetworkInfo?.hostname || "—"}</strong>
              </div>
            </div>
            <p className="speedtest-network__note">
              {networkInfo?.provider
                ? `Your IP is sent to ${networkInfo.provider} for this lookup. ISP and location matches are approximate; the network operator may differ from your retail broadband brand.`
                : networkInfoMessage}
            </p>
          </section>

          {result && (
            <section className="speedtest-details" aria-labelledby="speedtest-details-title">
              <div className="speedtest-details__heading">
                <div>
                  <span className="speedtest-eyebrow">Connection quality</span>
                  <h2 id="speedtest-details-title">More than download speed</h2>
                </div>
                <span className="speedtest-result-size">
                  {formatBytes(result.downloadBytes)} down · {formatBytes(result.uploadBytes)} up
                </span>
              </div>

              <div className="speedtest-detail-grid">
                <article className="speedtest-detail-card">
                  <span>Jitter</span>
                  <strong>{formatMilliseconds(result.jitterMs)}</strong>
                  <p>Mean change between consecutive idle ping samples.</p>
                </article>
                <article className="speedtest-detail-card">
                  <span>HTTP probe loss</span>
                  <strong>{formatLoss(result.packetLossPercent)}</strong>
                  <p>
                    Failed HTTP probes divided by all idle probes; this is not
                    an IP packet loss measurement.
                  </p>
                </article>
                <article className="speedtest-detail-card">
                  <span>Transfer mode</span>
                  <strong>Multi</strong>
                  <p>{result.transferStreams} concurrent browser streams for download and upload.</p>
                </article>
                <article className="speedtest-detail-card">
                  <span>Download loaded latency</span>
                  <strong>{formatMilliseconds(result.loadedDownloadLatencyMs)}</strong>
                  <p>
                    {result.downloadLatencyIncreaseMs === null
                      ? "Latency measured while downloading."
                      : `${Number(result.downloadLatencyIncreaseMs).toFixed(1)} ms change from idle.`}
                  </p>
                </article>
                <article className="speedtest-detail-card">
                  <span>Upload loaded latency</span>
                  <strong>{formatMilliseconds(result.loadedUploadLatencyMs)}</strong>
                  <p>
                    {result.uploadLatencyIncreaseMs === null
                      ? "Latency measured while uploading."
                      : `${Number(result.uploadLatencyIncreaseMs).toFixed(1)} ms change from idle.`}
                  </p>
                </article>
              </div>
            </section>
          )}

          <section className="speedtest-method" aria-label="How the speed test works">
            <span className="speedtest-method__icon" aria-hidden="true">
              <FaShieldAlt />
            </span>
            <div>
              <h2>Measured from your browser</h2>
              <p>
                The test uses uncached, incompressible data and multiple
                simultaneous connections. Throughput is calculated from the
                bytes received or confirmed by the server over a shared timing
                window. Results are not saved to an account.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default SpeedTestPage;
