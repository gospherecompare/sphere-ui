import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
import { dangerouslySkipEscape, escapeInject } from "vike/server";
import "../src/index.css";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "../src/ssr/seo.js";

export { onRenderHtml };

const escapeInlineJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const createSchemaScripts = (schemas = []) =>
  (Array.isArray(schemas) ? schemas : [])
    .filter(Boolean)
    .map(
      (schema) =>
        `<script type="application/ld+json">${escapeInlineJson(schema)}</script>`,
    )
    .join("\n");

const renderReactPage = (element) =>
  new Promise((resolve, reject) => {
    let didError = false;
    const stream = renderToPipeableStream(element, {
      onAllReady() {
        const output = new PassThrough();
        const chunks = [];

        output.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        output.on("error", reject);
        output.on("end", () => {
          if (didError) {
            reject(new Error("React SSR rendering failed"));
            return;
          }
          resolve(Buffer.concat(chunks).toString("utf8"));
        });

        stream.pipe(output);
      },
      onShellError: reject,
      onError(error) {
        didError = true;
        console.error("[ssr] React render error", error);
      },
    });
  });

async function onRenderHtml(pageContext) {
  const { Page, data } = pageContext;
  const helmetContext = {};
  const pageHtml = Page
    ? await renderReactPage(
        <Page
          pageContext={{ ...pageContext, helmetContext }}
          data={data}
          helmetContext={helmetContext}
        />,
      )
    : "";
  const seo = data?.seo || {};
  const helmet = helmetContext.helmet;
  const helmetPriority = helmet?.priority?.toString() || "";
  const helmetTitle = helmet?.title?.toString() || "";
  const helmetMeta = helmet?.meta?.toString() || "";
  const helmetLinks = helmet?.link?.toString() || "";
  const helmetScripts = helmet?.script?.toString() || "";
  const helmetHead = [
    helmetPriority,
    helmetTitle,
    helmetMeta,
    helmetLinks,
    helmetScripts,
  ]
    .filter(Boolean)
    .join("\n");
  const helmetTitleText = helmetTitle.replace(/<[^>]+>/g, "").trim();
  const title =
    seo.title || helmetTitleText || `${SITE_NAME} - Device Comparison Platform`;
  const description = seo.description || DEFAULT_DESCRIPTION;
  const canonicalUrl = seo.canonicalUrl || "https://tryhook.shop/";
  const image = seo.image || "https://tryhook.shop/hook-logo.png";
  const schemaScripts = createSchemaScripts(data?.schemas);

  return escapeInject`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="google-site-verification" content="fTw8uOxdp363NuqcHL3t8lscmW1EqIBng-ck6PM33_4" />
        ${dangerouslySkipEscape(
          helmetHead ||
            `<title>${title}</title><meta name="description" content="${description}" /><link rel="canonical" href="${canonicalUrl}" />`,
        )}
        <link rel="icon" href="/hook-logo.png?v=2" type="image/png" />
        <link rel="shortcut icon" href="/hook-logo.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/hook-logo.png?v=2" />
        ${
          helmetHead
            ? ""
            : dangerouslySkipEscape(`
              <meta property="og:type" content="website" />
              <meta property="og:site_name" content="Hooks" />
              <meta property="og:title" content="${title}" />
              <meta property="og:description" content="${description}" />
              <meta property="og:url" content="${canonicalUrl}" />
              <meta property="og:image" content="${image}" />
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content="${title}" />
              <meta name="twitter:description" content="${description}" />
              <meta name="twitter:image" content="${image}" />
            `)
        }
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        ${dangerouslySkipEscape(schemaScripts)}
      </head>
      <body>
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`;
}
