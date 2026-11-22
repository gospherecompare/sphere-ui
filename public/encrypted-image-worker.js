const API_BASE_URL =
  new URL(self.location.href).searchParams.get("apiBaseUrl") || "";
const BOOTSTRAP_PATH = "/api/crypto/public-key";
const IMAGE_PATH = "/api/crypto/image";
const CLIENT_KEY_HEADER = "x-mobilesx-client-key";
const KDF_SALT = new TextEncoder().encode("MobilesX API response ECDH v1");
const KDF_INFO = new TextEncoder().encode("AES-256-GCM");
let contextPromise;

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value) => {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const getEncryptionContext = () => {
  if (!contextPromise) {
    contextPromise = (async () => {
      const apiOrigin = new URL(API_BASE_URL).origin;
      const pair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveBits"],
      );
      const publicKey = new Uint8Array(
        await crypto.subtle.exportKey("spki", pair.publicKey),
      );
      const bootstrapResponse = await fetch(`${apiOrigin}${BOOTSTRAP_PATH}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!bootstrapResponse.ok) throw new Error("Image encryption unavailable");
      const configuration = await bootstrapResponse.json();
      if (!configuration?.enabled || !configuration?.publicKey) {
        throw new Error("Image encryption unavailable");
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
        pair.privateKey,
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
        apiOrigin,
        responseKey,
        clientPublicKey: toBase64Url(publicKey),
      };
    })().catch((error) => {
      contextPromise = undefined;
      throw error;
    });
  }
  return contextPromise;
};

const decryptImage = async (sourceUrl) => {
  const context = await getEncryptionContext();
  const proxyUrl = new URL(`${context.apiOrigin}${IMAGE_PATH}`);
  proxyUrl.searchParams.set("url", sourceUrl);
  const response = await fetch(proxyUrl, {
    headers: { [CLIENT_KEY_HEADER]: context.clientPublicKey },
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Encrypted image request failed");

  const envelope = await response.json();
  if (
    envelope?.encrypted !== true ||
    envelope.version !== 1 ||
    envelope.algorithm !== "AES-256-GCM"
  ) {
    throw new Error("Invalid encrypted image response");
  }
  const iv = fromBase64Url(envelope.iv);
  const tag = fromBase64Url(envelope.tag);
  const data = fromBase64Url(envelope.data);
  const ciphertextAndTag = new Uint8Array(data.length + tag.length);
  ciphertextAndTag.set(data);
  ciphertextAndTag.set(tag, data.length);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    context.responseKey,
    ciphertextAndTag,
  );
  return new Response(plaintext, {
    status: 200,
    headers: {
      "Content-Type": envelope.contentType || "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
};

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.destination !== "image") return;

  const sourceUrl = new URL(request.url);
  if (
    sourceUrl.protocol !== "https:" ||
    (sourceUrl.hostname !== "res.cloudinary.com" &&
      !sourceUrl.hostname.endsWith(".cloudinary.com"))
  ) {
    return;
  }

  event.respondWith(
    decryptImage(sourceUrl.href).catch(() =>
      new Response("", {
        status: 502,
        statusText: "Encrypted image unavailable",
        headers: { "Cache-Control": "no-store" },
      }),
    ),
  );
});
