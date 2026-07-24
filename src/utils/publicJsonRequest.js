const DEFAULT_CACHE_TTL_MS = 30_000;
const responseCache = new Map();
const inFlightRequests = new Map();

const createAbortError = () => {
  if (typeof DOMException === "function") {
    return new DOMException("The request was aborted.", "AbortError");
  }
  const error = new Error("The request was aborted.");
  error.name = "AbortError";
  return error;
};

const waitForSubscriber = (promise, signal) => {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(createAbortError());

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };
    const cleanup = () => signal.removeEventListener("abort", onAbort);

    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error) => {
        cleanup();
        reject(error);
      },
    );
  });
};

export const fetchPublicJson = (
  url,
  {
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    fetchOptions = {},
    signal,
  } = {},
) => {
  const key = String(url);
  const now = Date.now();
  const cached = responseCache.get(key);

  if (cached && cached.expiresAt > now) {
    return waitForSubscriber(Promise.resolve(cached.value), signal);
  }
  if (cached) responseCache.delete(key);

  let request = inFlightRequests.get(key);
  if (!request) {
    const { signal: _ignoredSignal, ...safeFetchOptions } = fetchOptions || {};
    request = (async () => {
      const response = await fetch(key, {
        ...safeFetchOptions,
        headers: {
          Accept: "application/json",
          ...(safeFetchOptions.headers || {}),
        },
      });
      const contentType = String(
        response.headers.get("content-type") || "",
      ).toLowerCase();
      const data = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : null;

      if (!response.ok) {
        const error = new Error(
          data?.message || `Request failed with HTTP ${response.status}`,
        );
        error.status = response.status;
        throw error;
      }
      if (!contentType.includes("application/json")) {
        throw new Error("The API returned a non-JSON response");
      }

      if (cacheTtlMs > 0) {
        responseCache.set(key, {
          expiresAt: Date.now() + cacheTtlMs,
          value: data,
        });
      }
      return data;
    })();

    inFlightRequests.set(key, request);
    request.then(
      () => inFlightRequests.delete(key),
      () => inFlightRequests.delete(key),
    );
  }

  return waitForSubscriber(request, signal);
};

export const clearPublicJsonRequestCache = (url) => {
  if (url) {
    responseCache.delete(String(url));
    return;
  }
  responseCache.clear();
};

