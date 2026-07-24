import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  brotliCompress,
  constants as zlibConstants,
  gzip,
} from "node:zlib";
import { createDevMiddleware, renderPage } from "vike/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || process.env.CLIENT_PORT || 3000);
const root = __dirname;

const app = express();

const COMPRESSION_THRESHOLD_BYTES = 1024;
const COMPRESSIBLE_CONTENT_TYPE = /^(?:text\/|application\/(?:javascript|json|ld\+json|manifest|xml|wasm)|image\/svg\+xml|font\/(?:css|ttf|otf|woff|woff2))/i;

const getEncodingQuality = (acceptEncoding, encoding) => {
  const entries = String(acceptEncoding || "")
    .toLowerCase()
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, ...parameters] = entry.split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const quality = qualityParameter
        ? Number(qualityParameter.trim().slice(2))
        : 1;
      return { name: name.trim(), quality: Number.isFinite(quality) ? quality : 0 };
    });

  const direct = entries.find((entry) => entry.name === encoding);
  if (direct) return direct.quality;

  const wildcard = entries.find((entry) => entry.name === "*");
  return wildcard ? wildcard.quality : 0;
};

const chooseContentEncoding = (acceptEncoding = "") => {
  const brotliQuality = getEncodingQuality(acceptEncoding, "br");
  const gzipQuality = getEncodingQuality(acceptEncoding, "gzip");

  if (brotliQuality <= 0 && gzipQuality <= 0) return "";
  return brotliQuality >= gzipQuality && brotliQuality > 0 ? "br" : "gzip";
};

const appendVaryHeader = (res, value) => {
  const current = String(res.getHeader("Vary") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!current.some((item) => item.toLowerCase() === value.toLowerCase())) {
    current.push(value);
  }
  res.setHeader("Vary", current.join(", "));
};

const toResponseBuffer = (chunk, encoding) => {
  if (chunk === undefined || chunk === null || chunk === "") return null;
  return Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
};

// Compress text responses without changing their body or SEO markup. This is
// kept in-process so the same behavior works behind a simple Node deployment.
const responseCompression = (req, res, next) => {
  const originalEnd = res.end.bind(res);
  const chunks = [];

  res.write = (chunk, encoding, callback) => {
    if (typeof encoding === "function") {
      callback = encoding;
      encoding = undefined;
    }
    const buffer = toResponseBuffer(chunk, encoding);
    if (buffer) chunks.push(buffer);
    if (typeof callback === "function") callback();
    return true;
  };

  res.end = (chunk, encoding, callback) => {
    if (typeof encoding === "function") {
      callback = encoding;
      encoding = undefined;
    }

    const buffer = toResponseBuffer(chunk, encoding);
    if (buffer) chunks.push(buffer);

    const body = Buffer.concat(chunks);
    const contentType = String(res.getHeader("Content-Type") || "");
    const statusCode = Number(res.statusCode || 200);
    const alreadyEncoded = Boolean(res.getHeader("Content-Encoding"));
    const noTransform = /no-transform/i.test(
      String(res.getHeader("Cache-Control") || ""),
    );
    const canCompress =
      req.method !== "HEAD" &&
      !alreadyEncoded &&
      !noTransform &&
      !req.headers.range &&
      !res.getHeader("Content-Range") &&
      ![204, 304].includes(statusCode) &&
      body.length >= COMPRESSION_THRESHOLD_BYTES &&
      COMPRESSIBLE_CONTENT_TYPE.test(contentType);

    if (!canCompress) return originalEnd(body, callback);

    appendVaryHeader(res, "Accept-Encoding");
    const selectedEncoding = chooseContentEncoding(req.headers["accept-encoding"]);
    if (!selectedEncoding) return originalEnd(body, callback);

    const finish = (error, compressedBody) => {
      if (error) return originalEnd(body, callback);

      res.removeHeader("Content-Length");
      res.removeHeader("ETag");
      res.setHeader("Content-Encoding", selectedEncoding);
      res.setHeader("Content-Length", compressedBody.length);
      return originalEnd(compressedBody, callback);
    };

    if (selectedEncoding === "br") {
      return brotliCompress(
        body,
        {
          params: {
            [zlibConstants.BROTLI_PARAM_QUALITY]: 4,
          },
        },
        finish,
      );
    }

    return gzip(body, { level: 6 }, finish);
  };

  return next();
};

const findVikeClientDistDir = async () => {
  const candidates = [
    path.join(root, "dist", "client"),
    path.join(root, "dist"),
  ];
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) return candidate;
    } catch {
      // Try next candidate.
    }
  }
  return path.join(root, "dist");
};

const renderVikeRequest = async (req, res, next) => {
  try {
    const pageContext = await renderPage({
      urlOriginal: req.originalUrl,
      headersOriginal: req.headers,
    });
    const response = pageContext.httpResponse;

    if (!response) return next();

    response.headers.forEach(([name, value]) => res.setHeader(name, value));
    return res.status(response.statusCode).send(response.body);
  } catch (error) {
    return next(error);
  }
};

app.use(responseCompression);

if (isProduction) {
  const vikeClientDist = await findVikeClientDistDir();
  app.use(
    express.static(vikeClientDist, {
      index: false,
      setHeaders: (res, filePath) => {
        const normalizedPath = filePath.split(path.sep).join("/");
        if (normalizedPath.includes("/assets/")) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable",
          );
        } else {
          res.setHeader("Cache-Control", "public, max-age=300");
        }
      },
    }),
  );
} else {
  const { devMiddleware } = await createDevMiddleware({ root });
  app.use(devMiddleware);
}

app.get(/.*/, renderVikeRequest);

app.listen(port, () => {
  console.log(`Hooks SSR server running at http://localhost:${port}`);
});
