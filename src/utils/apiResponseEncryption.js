import { API_BASE_URL } from "./apiUrl";

const CLIENT_KEY_HEADER = "X-MobilesX-Client-Key";
const BOOTSTRAP_PATH = "/api/crypto/public-key";
const KDF_SALT = new TextEncoder().encode("MobilesX API response ECDH v1");
const KDF_INFO = new TextEncoder().encode("AES-256-GCM");
const WINDOW_INSTALLED_KEY = "__MOBILESX_API_RESPONSE_ENCRYPTION__";
const decoder = new TextDecoder();
const contexts = new Map();
const readyContexts = new Map();

const toBase64Url = (bytes) => {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value) => {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const getApiOrigins = () => {
  const origins = new Set([window.location.origin]);
  try {
    origins.add(new URL(API_BASE_URL).origin);
  } catch {
    // A malformed API base disables encryption for that base only.
  }
  return origins;
};

const getApiUrl = (value) => {
  try {
    const raw =
      typeof value === "string" || value instanceof URL
        ? String(value)
        : value && typeof value.url === "string"
          ? value.url
          : "";
    if (!raw) return null;
    const url = new URL(raw, window.location.origin);
    if (!url.pathname.startsWith("/api/")) return null;
    if (!getApiOrigins().has(url.origin)) return null;
    return url;
  } catch {
    return null;
  }
};

const isBootstrapUrl = (url) => url?.pathname === BOOTSTRAP_PATH;

const generateClientKeyPair = async () => {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"],
  );
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey("spki", pair.publicKey),
  );
  return { privateKey: pair.privateKey, publicKey };
};

const createContext = async (origin, fetchImpl) => {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable");

  const keyPair = await generateClientKeyPair();
  const response = await fetchImpl(`${origin}${BOOTSTRAP_PATH}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) throw new Error("API encryption is not configured");

  const configuration = await response.json();
  if (!configuration?.enabled || !configuration?.publicKey) {
    throw new Error("API encryption is disabled");
  }

  const serverPublicKey = await crypto.subtle.importKey(
    "spki",
    fromBase64Url(configuration.publicKey),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: serverPublicKey },
    keyPair.privateKey,
    256,
  );
  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    "HKDF",
    false,
    ["deriveKey"],
  );
  const responseKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: KDF_SALT,
      info: KDF_INFO,
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  return {
    requestPublicKey: toBase64Url(keyPair.publicKey),
    responseKey,
  };
};

const getContext = (origin, fetchImpl) => {
  if (!contexts.has(origin)) {
    let pending;
    pending = createContext(origin, fetchImpl)
      .then((context) => {
        readyContexts.set(origin, context);
        return context;
      })
      .catch((error) => {
        window.setTimeout(() => {
          if (contexts.get(origin) === pending) contexts.delete(origin);
        }, 15_000);
        throw error;
      });
    contexts.set(origin, pending);
  }
  return contexts.get(origin);
};

const decryptEnvelope = async (envelope, responseKey) => {
  const iv = fromBase64Url(envelope.iv);
  const tag = fromBase64Url(envelope.tag);
  const data = fromBase64Url(envelope.data);
  const authenticatedData = new Uint8Array(data.length + tag.length);
  authenticatedData.set(data);
  authenticatedData.set(tag, data.length);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    responseKey,
    authenticatedData,
  );
  return decoder.decode(plaintext);
};

const decryptResponse = async (response, responseKey) => {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return response;
  }
  let envelope;
  try {
    envelope = await response.clone().json();
  } catch {
    return response;
  }
  if (
    !envelope?.encrypted ||
    envelope.version !== 1 ||
    envelope.algorithm !== "AES-256-GCM"
  ) {
    return response;
  }

  const plaintext = await decryptEnvelope(envelope, responseKey);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(plaintext, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const attachClientKey = async (input, init, requestPublicKey) => {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
  headers.set(CLIENT_KEY_HEADER, requestPublicKey);
  return new Request(input, { ...init, headers });
};

export const installApiResponseEncryption = () => {
  if (typeof window === "undefined" || window[WINDOW_INSTALLED_KEY]) return;
  if (typeof window.fetch !== "function") return;

  const innerFetch = window.fetch.bind(window);
  try {
    const apiOrigin = new URL(API_BASE_URL).origin;
    void getContext(apiOrigin, innerFetch).catch(() => {});
  } catch {
    // API requests can still proceed without response encryption.
  }

  window.fetch = async (input, init = undefined) => {
    const url = getApiUrl(input);
    if (!url || isBootstrapUrl(url)) return innerFetch(input, init);

    const context = readyContexts.get(url.origin);
    if (!context) {
      // Do not put initial page data behind the ECDH bootstrap request.
      void getContext(url.origin, innerFetch).catch(() => {});
      return innerFetch(input, init);
    }

    const request = await attachClientKey(input, init, context.requestPublicKey);
    const response = await innerFetch(request);
    return decryptResponse(response, context.responseKey);
  };

  window[WINDOW_INSTALLED_KEY] = true;
};

export default installApiResponseEncryption;
