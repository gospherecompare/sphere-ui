import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ORIGIN = "https://mobilesx.in";
const MAX_COMPARE_PAYLOAD_BYTES = 75_000;
const MAX_LISTING_PAYLOAD_BYTES = 512 * 1024;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, "..");
const distDir = path.join(clientRoot, "dist");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const decodeHtml = (value = "") =>
  String(value || "")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ");

const extract = (html, pattern, label) => {
  const value = html.match(pattern)?.[1] || "";
  assert(value, `Missing ${label}`);
  return decodeHtml(value.trim());
};

const normalizeDuplicateValue = (value = "") =>
  String(value || "").replace(/\s+/g, " ").trim().toLowerCase();

const routeFileFromUrl = (url) => {
  const pathname = new URL(url).pathname;
  const routeParts = pathname.split("/").filter(Boolean);
  return path.join(distDir, ...routeParts, "index.html");
};

const readRouteHtml = async (url) => {
  const filePath = routeFileFromUrl(url);
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Missing generated HTML for ${url}: ${filePath}`, {
      cause: error,
    });
  }
};

const inspectIndexableHead = (html, url) => {
  const title = extract(html, /<title>([\s\S]*?)<\/title>/i, `${url} title`);
  const description = extract(
    html,
    /<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i,
    `${url} meta description`,
  );
  const robots = extract(
    html,
    /<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["']/i,
    `${url} robots meta`,
  );
  const canonical = extract(
    html,
    /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
    `${url} canonical`,
  );
  const ogUrl = extract(
    html,
    /<meta\s+property=["']og:url["'][^>]*content=["']([^"']+)["']/i,
    `${url} og:url`,
  );

  assert(title.length >= 15, `${url} has an unexpectedly short title`);
  assert(
    description.length >= 50,
    `${url} has an unexpectedly short meta description`,
  );
  assert(/\bindex\b/i.test(robots), `${url} is missing robots index`);
  assert(/\bfollow\b/i.test(robots), `${url} is missing robots follow`);
  assert(!/noindex/i.test(robots), `${url} unexpectedly contains noindex`);
  assert(canonical === url, `${url} canonical points to ${canonical}`);
  assert(ogUrl === url, `${url} og:url points to ${ogUrl}`);
  assert(
    !/<meta\s+http-equiv=["']refresh["']/i.test(html),
    `${url} contains a meta refresh redirect`,
  );

  return { title, description, canonical };
};

const getPreloadedPayload = (
  html,
  url,
  maxBytes = MAX_COMPARE_PAYLOAD_BYTES,
) => {
  const source = extract(
    html,
    /<script\s+id=["']hook-prerender-data["'][^>]*>\s*window\.__HOOKS_PRERENDER_DATA__=([\s\S]*?);\s*<\/script>/i,
    `${url} route-specific prerender payload`,
  );
  const bytes = Buffer.byteLength(source, "utf8");
  assert(
    bytes <= maxBytes,
    `${url} embeds ${bytes.toLocaleString()} payload bytes; expected no more than ${maxBytes.toLocaleString()}`,
  );

  try {
    return { bytes, payload: JSON.parse(source) };
  } catch (error) {
    throw new Error(`${url} has invalid prerender payload JSON`, { cause: error });
  }
};

const findDuplicateGroups = (rows, field) => {
  const groups = new Map();
  rows.forEach((row) => {
    const key = normalizeDuplicateValue(row[field]);
    if (!key) return;
    groups.set(key, [...(groups.get(key) || []), row.url]);
  });
  return [...groups.values()].filter((urls) => urls.length > 1);
};

const assertNoDuplicates = (rows, field) => {
  const duplicates = findDuplicateGroups(rows, field);
  assert(
    duplicates.length === 0,
    `Duplicate comparison ${field} values: ${duplicates
      .map((urls) => urls.join(", "))
      .join("; ")}`,
  );
};

const verifyControlRoute = async (urls, pathnamePattern, label) => {
  const url = urls.find((candidate) => pathnamePattern.test(new URL(candidate).pathname));
  assert(url, `Sitemap has no ${label} control URL`);
  const html = await readRouteHtml(url);
  inspectIndexableHead(html, url);
  return url;
};

const getProductRows = (body) => {
  if (Array.isArray(body)) return body;
  for (const key of ["smartphones", "results", "items", "data"]) {
    if (Array.isArray(body?.[key])) return body[key];
    if (Array.isArray(body?.data?.[key])) return body.data[key];
  }
  return [];
};

const getProductName = (row = {}) =>
  String(
    row.product_name ||
      row.name ||
      row.model_number ||
      row.model ||
      row.basic_info?.product_name ||
      row.basic_info?.title ||
      row.basic_info?.model_number ||
      row.basic_info?.model ||
      "",
  ).trim();

const toNumericPrice = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getLowestProductPrice = (row = {}) => {
  const candidates = [
    row.price,
    row.best_price,
    row.bestPrice,
    row.starting_price,
    row.minimum_price,
    ...(Array.isArray(row.variants)
      ? row.variants.flatMap((variant) => [
          variant?.base_price,
          variant?.price,
          ...(Array.isArray(variant?.store_prices)
            ? variant.store_prices.map((store) => store?.price)
            : []),
        ])
      : []),
  ]
    .map(toNumericPrice)
    .filter((price) => price != null);
  return candidates.length ? Math.min(...candidates) : null;
};

const getDisplayedProductPrice = (row = {}) => {
  const direct = [
    row.starting_price,
    row.startingPrice,
    row.best_price,
    row.bestPrice,
    row.price,
    row.base_price,
    row.basePrice,
  ]
    .map(toNumericPrice)
    .find((price) => price != null);
  return direct ?? getLowestProductPrice(row);
};

const formatIndianPrice = (value) => {
  const price = toNumericPrice(value);
  return price == null
    ? ""
    : `₹${new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
      }).format(price)}`;
};

const getBrandName = (row = {}) => {
  const brand =
    row.brand_name ||
    row.brandName ||
    row.brand ||
    row.basic_info?.brand_name ||
    row.basic_info?.brandName ||
    row.basic_info?.brand;
  return String(brand?.name || brand || "").trim();
};

const getCameraMegapixels = (value, key = "") => {
  if (typeof value === "string") {
    const matches = [...value.matchAll(/(\d{1,3}(?:\.\d+)?)\s*MP\b/gi)];
    const textValues = matches.map((match) => Number(match[1]));
    if (/(megapixel|resolution|(?:^|_)mp$)/i.test(key)) {
      const numericValue = Number(value.trim());
      if (Number.isFinite(numericValue)) textValues.push(numericValue);
    }
    return textValues;
  }
  if (typeof value === "number") {
    return /(megapixel|resolution|(?:^|_)mp$)/i.test(key) ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => getCameraMegapixels(item, key));
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([childKey, child]) =>
    getCameraMegapixels(child, childKey),
  );
};

const getItemListUrls = (html, url) => {
  const jsonLdBlocks = [...html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )];
  const schemas = jsonLdBlocks.flatMap((match) => {
    try {
      const parsed = JSON.parse(match[1]);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  });
  const itemList = schemas.find((schema) => schema?.["@type"] === "ItemList");
  assert(itemList, `${url} is missing an ItemList JSON-LD block`);
  return (itemList.itemListElement || [])
    .map((item) => item.url)
    .filter(Boolean)
    .map((itemUrl) => new URL(itemUrl, url).pathname.replace(/\/$/, ""));
};

const getJsonLdSchemas = (html) =>
  [...html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )].flatMap((match) => {
    try {
      const parsed = JSON.parse(match[1]);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  });

const parseProductObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }
  return {};
};

const firstActualValue = (...values) =>
  values.find(
    (value) =>
      value != null &&
      value !== "" &&
      !(typeof value === "string" && !value.trim()) &&
      !(typeof value === "object" && !Array.isArray(value)),
  );

const formatActualSpec = (value, unit = "") => {
  if (value == null) return "";
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text) return "";
  const alreadyHasUnit =
    unit === "inch"
      ? /inch|inches|\"|″/i.test(text)
      : unit
        ? new RegExp(unit, "i").test(text)
        : true;
  if (alreadyHasUnit) return text;
  return `${text} ${unit}`;
};

const getProductDetailSpecValues = (product = {}) => {
  const display = parseProductObject(product.display ?? product.display_json);
  const performance = parseProductObject(
    product.performance ?? product.performance_json,
  );
  const battery = parseProductObject(product.battery ?? product.battery_json);
  const camera = parseProductObject(product.camera ?? product.camera_json);
  const rear = parseProductObject(
    camera.rear ?? camera.rear_camera ?? camera.rearCamera,
  );
  const rearMain = parseProductObject(rear.main ?? rear.main_camera);
  const front = parseProductObject(
    camera.front ?? camera.front_camera ?? camera.frontCamera,
  );
  const charging = parseProductObject(battery.charging);
  return [
    firstActualValue(
      display.size,
      display.screen_size,
      display.display_size,
      product.screen_size,
    ),
    firstActualValue(
      display.panel,
      display.type,
      display.panel_type,
      display.technology,
    ),
    firstActualValue(display.refresh_rate, display.refreshRate),
    firstActualValue(
      performance.processor,
      performance.chipset,
      performance.soc,
      product.processor,
      product.chipset,
    ),
    formatActualSpec(
      firstActualValue(
        battery.capacity_typical,
        battery.capacity_rated,
        battery.battery_capacity_mah,
        battery.battery_capacity,
        battery.capacity_mAh,
        battery.capacity_mah,
        battery.capacity,
      ),
      "mAh",
    ),
    firstActualValue(
      battery.fast_charging,
      battery.fastCharging,
      battery.fast_charge,
      battery.charging_speed,
      battery.wired_charging,
      charging.wired,
      charging.wired_charging,
      charging.fast_charging,
      charging.max_wattage,
      charging.wattage,
    ),
    formatActualSpec(
      firstActualValue(
        rearMain.megapixels,
        rearMain.resolution,
        rear.megapixels,
        rear.resolution,
        camera.rear_camera?.main?.resolution,
        camera.rear_camera?.main_camera?.resolution,
        camera.rear_camera?.resolution,
        camera.main_camera_megapixels,
        camera.mainCameraMegapixels,
      ),
      "MP",
    ),
    formatActualSpec(
      firstActualValue(
        front.megapixels,
        front.resolution,
        camera.front_camera?.resolution,
        camera.front_camera?.megapixels,
        camera.front_camera_megapixels,
        camera.selfie_camera_megapixels,
      ),
      "MP",
    ),
  ]
    .map((value) => String(value ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
};

const getTvDetailSpecValues = (product = {}) => {
  const keySpecs = parseProductObject(product.key_specs_json ?? product.key_specs);
  const basicInfo = parseProductObject(product.basic_info_json ?? product.basic_info);
  const display = parseProductObject(product.display_json ?? product.display);
  const video = parseProductObject(product.video_engine_json ?? product.video);
  const smartTv = parseProductObject(product.smart_tv_json ?? product.smart_tv);
  const audio = parseProductObject(product.audio_json ?? product.audio);
  return [
    formatActualSpec(
      firstActualValue(
        keySpecs.screen_size,
        display.screen_size,
        display.size,
        basicInfo.screen_size,
      ),
      "inch",
    ),
    firstActualValue(
      keySpecs.resolution,
      display.resolution,
      basicInfo.resolution,
    ),
    firstActualValue(
      keySpecs.panel_type,
      keySpecs.display_type,
      display.panel_type,
      display.panel,
      display.technology,
      video.display_technology,
    ),
    formatActualSpec(
      firstActualValue(keySpecs.refresh_rate, display.refresh_rate),
      "Hz",
    ),
    firstActualValue(
      keySpecs.operating_system,
      smartTv.operating_system,
      smartTv.os,
      basicInfo.operating_system,
    ),
    formatActualSpec(
      firstActualValue(
        keySpecs.audio_output,
        audio.output_power,
        audio.audio_output,
        audio.output,
      ),
      "W",
    ),
  ]
    .map((value) => String(value ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
};

const getLastmodForUrl = (sitemapXml, url) => {
  const entry = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/gi)].find(
    (match) => {
      const location = match[1].match(/<loc>([\s\S]*?)<\/loc>/i)?.[1];
      return location && decodeHtml(location.trim()) === url;
    },
  )?.[1];
  return entry?.match(/<lastmod>([\s\S]*?)<\/lastmod>/i)?.[1]?.trim() || null;
};

const getExpectedProductOffer = (product = {}) =>
  (Array.isArray(product.variants) ? product.variants : [])
    .flatMap((variant) =>
      (Array.isArray(variant?.store_prices) ? variant.store_prices : []).map(
        (store) => ({ variant, store }),
      ),
    )
    .map(({ variant, store }) => {
      const price = toNumericPrice(
        store?.price ?? store?.base_price ?? variant?.base_price,
      );
      let url;
      try {
        url = new URL(String(store?.url || store?.url_link || store?.link || ""));
      } catch {
        return null;
      }
      return price != null && url.protocol === "https:"
        ? { price, url: url.href }
        : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.price - right.price)[0] || null;

const getSchemaBrandName = (brand) =>
  normalizeDuplicateValue(
    typeof brand === "string" ? brand : brand?.name || brand?.legalName || "",
  );

const verifyProductOfferSchema = (productSchema, product, url) => {
  const expectedOffer = getExpectedProductOffer(product);
  if (!expectedOffer) {
    assert(!productSchema.offers, `${url} has Product offers without a valid HTTPS store offer`);
    return;
  }
  assert(productSchema.offers, `${url} omits its available store offer`);
  assert(
    Number(productSchema.offers.price) === expectedOffer.price,
    `${url} Product offer price does not match the API store price`,
  );
  assert(
    new URL(productSchema.offers.url).href === expectedOffer.url,
    `${url} Product offer URL does not match the API store URL`,
  );
};

const getProductPageStartingPrice = (product = {}) => {
  const directPrice = [
    product.starting_price,
    product.startingPrice,
    product.best_price,
    product.bestPrice,
    product.price,
    product.base_price,
    product.basePrice,
  ]
    .map(toNumericPrice)
    .find((price) => price != null);
  if (directPrice != null) return directPrice;

  const actualOffer = getExpectedProductOffer(product);
  if (actualOffer) return actualOffer.price;

  const variantBasePrices = (Array.isArray(product.variants) ? product.variants : [])
    .map((variant) =>
      toNumericPrice(
        variant?.base_price ??
          variant?.basePrice ??
          variant?.price ??
          variant?.starting_price,
      ),
    )
    .filter((price) => price != null);
  return variantBasePrices.length
    ? Math.min(...variantBasePrices)
    : getDisplayedProductPrice(product);
};

const verifySmartphoneProductRoute = async (
  url,
  sitemapXml,
  { label = "smartphone", expectedBrand = "", maxPrice = null } = {},
) => {
  assert(url, `Sitemap has no ${label} product route`);
  const html = await readRouteHtml(url);
  const htmlBytes = Buffer.byteLength(html, "utf8");
  assert(
    htmlBytes <= MAX_HTML_BYTES,
    `${url} HTML is ${htmlBytes.toLocaleString()} bytes; expected no more than ${MAX_HTML_BYTES.toLocaleString()}`,
  );
  inspectIndexableHead(html, url);
  assert(
    /<main\b[^>]*data-product-prerendered=["']true["']/i.test(html),
    `${url} is missing semantic initial product HTML`,
  );

  const { payload } = getPreloadedPayload(
    html,
    url,
    MAX_LISTING_PAYLOAD_BYTES,
  );
  const payloadEntries = Object.entries(payload?.byUrl || {});
  assert(
    payloadEntries.length === 1,
    `${url} embeds ${payloadEntries.length} API payloads instead of one product payload`,
  );
  assert(
    /\/public\/smartphones\/by-slug\//i.test(payloadEntries[0]?.[0] || ""),
    `${url} does not preload the product-specific smartphone endpoint`,
  );
  const product = payloadEntries[0]?.[1];
  assert(
    product && typeof product === "object" && !Array.isArray(product),
    `${url} product payload is not a product record`,
  );
  assert(
    product.product_type === "smartphone",
    `${url} API response is not a top-level smartphone product record`,
  );
  const productName = String(product.name || "").trim();
  assert(productName, `${url} top-level API product name is missing`);

  const main = html.match(
    /<main\b[^>]*data-product-prerendered=["']true["'][\s\S]*?<\/main>/i,
  )?.[0] || "";
  const h1 = extract(main, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i, `${url} initial product h1`);
  assert(
    normalizeDuplicateValue(h1).startsWith(normalizeDuplicateValue(productName)),
    `${url} initial product h1 does not use the API product name`,
  );

  const displayedPrice = getDisplayedProductPrice(product);
  assert(displayedPrice != null, `${url} top-level API product price is missing`);
  assert(
    main.includes(formatIndianPrice(displayedPrice)),
    `${url} initial product HTML is missing its API starting price`,
  );
  if (maxPrice != null) {
    assert(
      displayedPrice <= maxPrice,
      `${url} expected a product at or below ${formatIndianPrice(maxPrice)}`,
    );
  }
  const productBrand = getBrandName(product);
  assert(productBrand, `${url} top-level API product brand is missing`);
  if (expectedBrand) {
    assert(
      normalizeDuplicateValue(productBrand) ===
        normalizeDuplicateValue(expectedBrand),
      `${url} expected brand ${expectedBrand}, found ${productBrand}`,
    );
  }
  const detailSpecs = getProductDetailSpecValues(product);
  assert(detailSpecs.length > 0, `${url} API product has no key specifications`);
  detailSpecs.forEach((spec) => {
    assert(
      decodeHtml(main).includes(decodeHtml(spec)),
      `${url} initial product HTML is missing API specification: ${spec}`,
    );
  });

  const schemas = getJsonLdSchemas(html);
  const productSchema = schemas.find((schema) => schema?.["@type"] === "Product");
  const breadcrumbSchema = schemas.find(
    (schema) => schema?.["@type"] === "BreadcrumbList",
  );
  assert(productSchema, `${url} is missing initial Product JSON-LD`);
  assert(
    normalizeDuplicateValue(productSchema.name) ===
      normalizeDuplicateValue(productName),
    `${url} Product JSON-LD name differs from the API product name`,
  );
  assert(
    getSchemaBrandName(productSchema.brand) ===
      normalizeDuplicateValue(productBrand),
    `${url} Product JSON-LD brand differs from the API product brand`,
  );
  assert(breadcrumbSchema, `${url} is missing initial BreadcrumbList JSON-LD`);
  const breadcrumbItems = breadcrumbSchema.itemListElement || [];
  assert(
    breadcrumbItems.length >= 3 &&
      new URL(breadcrumbItems.at(-1)?.item || "", SITE_ORIGIN).pathname ===
        new URL(url).pathname,
    `${url} BreadcrumbList does not end at the product canonical URL`,
  );
  verifyProductOfferSchema(productSchema, product, url);
  assert(
    !productSchema.aggregateRating,
    `${url} Product JSON-LD invents a rating that was not verified by this build`,
  );

  const updatedAt = product.updated_at || product.updatedAt || null;
  const lastmod = getLastmodForUrl(sitemapXml, url);
  const updatedDate = updatedAt ? new Date(updatedAt) : null;
  if (
    updatedDate &&
    !Number.isNaN(updatedDate.getTime()) &&
    updatedDate.getUTCFullYear() >= 2000
  ) {
    assert(
      lastmod === updatedDate.toISOString().slice(0, 10),
      `${url} sitemap lastmod does not match the product updated_at value`,
    );
  } else {
    assert(!lastmod, `${url} has a sitemap lastmod without a source update date`);
  }
  const variant = (Array.isArray(product.variants) ? product.variants : []).find(
    (candidate) =>
      candidate?.ram ||
      candidate?.storage ||
      candidate?.variant_key ||
      getDisplayedProductPrice(candidate) != null,
  );
  if (variant) {
    const variantLabel = [
      variant.ram ? `${variant.ram} RAM` : "",
      variant.storage ? String(variant.storage) : "",
      variant.color_name || variant.color
        ? String(variant.color_name || variant.color)
        : "",
    ]
      .filter(Boolean)
      .join(" / ") ||
      String(variant.variant_key || variant.name || "");
    if (variantLabel) {
      assert(
        decodeHtml(main).includes(variantLabel),
        `${url} initial product HTML omits its API variant label`,
      );
    }
    const variantPrice = getDisplayedProductPrice(variant);
    if (variantPrice != null) {
      assert(
        main.includes(formatIndianPrice(variantPrice)),
        `${url} initial product HTML omits an API variant price`,
      );
    }
  }
  return { url, productName, displayedPrice, detailSpecs };
};

const verifyTvProductRoute = async (url) => {
  const html = await readRouteHtml(url);
  assert(
    Buffer.byteLength(html, "utf8") <= MAX_HTML_BYTES,
    `${url} HTML exceeds the configured size limit`,
  );
  inspectIndexableHead(html, url);
  assert(
    /<main\b[^>]*data-product-prerendered=["']true["']/i.test(html),
    `${url} is missing semantic initial TV product HTML`,
  );

  const { payload } = getPreloadedPayload(html, url, MAX_LISTING_PAYLOAD_BYTES);
  const entries = Object.entries(payload?.byUrl || {});
  assert(entries.length === 1, `${url} must preload one TV detail response`);
  assert(
    /\/public\/tvs\/by-slug\//i.test(entries[0]?.[0] || ""),
    `${url} does not preload the public TV-by-slug endpoint`,
  );
  const product = entries[0]?.[1];
  assert(
    product && typeof product === "object" && product.product_type === "tv",
    `${url} does not contain a top-level published TV record`,
  );
  if (Object.prototype.hasOwnProperty.call(product, "publish")) {
    assert(product.publish === true, `${url} prerendered an unpublished TV`);
  }
  const productName = String(product.name || "").trim();
  const productBrand = getBrandName(product);
  assert(productName, `${url} TV API response has no product name`);
  assert(productBrand, `${url} TV API response has no brand`);

  const main = html.match(
    /<main\b[^>]*data-product-prerendered=["']true["'][\s\S]*?<\/main>/i,
  )?.[0] || "";
  const h1 = extract(main, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i, `${url} TV h1`);
  assert(
    normalizeDuplicateValue(h1).startsWith(normalizeDuplicateValue(productName)),
    `${url} TV h1 does not use the API product name`,
  );
  assert(
    decodeHtml(main).includes(`Brand: ${productBrand}`),
    `${url} initial TV HTML omits the API product brand`,
  );

  const price = getProductPageStartingPrice(product);
  assert(price != null, `${url} TV API response has no usable product price`);
  assert(
    main.includes(formatIndianPrice(price)),
    `${url} initial TV HTML omits its API price`,
  );
  const detailSpecs = getTvDetailSpecValues(product);
  assert(detailSpecs.length > 0, `${url} TV API response has no key specifications`);
  detailSpecs.forEach((spec) => {
    assert(
      decodeHtml(main).includes(decodeHtml(spec)),
      `${url} initial TV HTML omits API specification: ${spec}`,
    );
  });

  const schemas = getJsonLdSchemas(html);
  const productSchema = schemas.find((schema) => schema?.["@type"] === "Product");
  const breadcrumbSchema = schemas.find(
    (schema) => schema?.["@type"] === "BreadcrumbList",
  );
  assert(productSchema, `${url} is missing TV Product JSON-LD`);
  assert(
    normalizeDuplicateValue(productSchema.name) ===
      normalizeDuplicateValue(productName),
    `${url} TV Product JSON-LD name differs from the API name`,
  );
  assert(
    getSchemaBrandName(productSchema.brand) ===
      normalizeDuplicateValue(productBrand),
    `${url} TV Product JSON-LD brand differs from the API brand`,
  );
  assert(breadcrumbSchema, `${url} is missing TV BreadcrumbList JSON-LD`);
  assert(
    new URL(breadcrumbSchema.itemListElement?.at(-1)?.item || "", SITE_ORIGIN)
      .pathname === new URL(url).pathname,
    `${url} TV breadcrumbs do not end at the product URL`,
  );
  verifyProductOfferSchema(productSchema, product, url);
  assert(
    !productSchema.aggregateRating,
    `${url} TV Product JSON-LD has an unverified rating`,
  );
  return { url, productName, price, detailSpecs };
};

const verifySmartphoneListingRoute = async (
  urls,
  pathname,
  kind,
  sitemapXml,
) => {
  const url = urls.find(
    (candidate) => new URL(candidate).pathname === pathname,
  );
  assert(url, `Sitemap has no smartphone listing URL for ${pathname}`);

  const html = await readRouteHtml(url);
  const htmlBytes = Buffer.byteLength(html, "utf8");
  assert(
    htmlBytes <= MAX_HTML_BYTES,
    `${url} HTML is ${htmlBytes.toLocaleString()} bytes; expected no more than ${MAX_HTML_BYTES.toLocaleString()}`,
  );
  inspectIndexableHead(html, url);
  assert(
    /<main\b[^>]*data-listing-prerendered=["']true["']/i.test(html),
    `${url} is missing semantic initial listing HTML`,
  );

  const { payload } = getPreloadedPayload(
    html,
    url,
    MAX_LISTING_PAYLOAD_BYTES,
  );
  const payloadEntries = Object.entries(payload?.byUrl || {});
  assert(
    payloadEntries.length === 1,
    `${url} embeds ${payloadEntries.length} API payloads instead of one route-specific listing payload`,
  );
  const rows = getProductRows(payloadEntries[0]?.[1]);
  assert(rows.length > 0, `${url} has no route-specific smartphone products`);

  const main = html.match(
    /<main\b[^>]*data-listing-prerendered=["']true["'][\s\S]*?<\/main>/i,
  )?.[0] || "";
  const productLinks = [...main.matchAll(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )]
    .map((match) => ({
      path: new URL(decodeHtml(match[1]), url).pathname.replace(/\/$/, ""),
      name: decodeHtml(match[2].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim(),
    }))
    .filter((link) => link.path.startsWith("/smartphones/"));
  assert(productLinks.length > 0, `${url} has no initial product links`);
  const productCards = new Map(
    [...main.matchAll(
      /<li\b[^>]*data-prerendered-product=["']([^"']+)["'][^>]*>([\s\S]*?)<\/li>/gi,
    )].map((match) => [
      normalizeDuplicateValue(decodeHtml(match[1])),
      decodeHtml(match[2]),
    ]),
  );

  const itemListPaths = getItemListUrls(html, url);
  assert(
    JSON.stringify([...itemListPaths].sort()) ===
      JSON.stringify(productLinks.map((link) => link.path).sort()),
    `${url} product links do not match its ItemList structured data`,
  );

  const rowNames = new Set(rows.map(getProductName).filter(Boolean).map(normalizeDuplicateValue));
  productLinks.forEach((link) => {
    const normalizedName = normalizeDuplicateValue(link.name);
    assert(
      rowNames.has(normalizedName),
      `${url} links to ${link.name}, which is absent from its route-specific payload`,
    );
    const cardHtml = productCards.get(normalizedName) || "";
    assert(cardHtml, `${url} is missing an initial card for ${link.name}`);
    const row = rows.find(
      (candidate) =>
        normalizeDuplicateValue(getProductName(candidate)) === normalizedName,
    );
    const displayedPrice = getDisplayedProductPrice(row);
    if (displayedPrice != null) {
      assert(
        cardHtml.includes(formatIndianPrice(displayedPrice)),
        `${url} does not show the API price for ${link.name}`,
      );
    }
    const productText = JSON.stringify({
      display: row?.display,
      performance: row?.performance,
      battery: row?.battery,
      camera: row?.camera ?? row?.camera_json,
    });
    const specTokens = [
      ...productText.matchAll(/\b\d+(?:\.\d+)?\s*(?:MP|mAh|Hz|W|inch)\b/gi),
    ].map((match) => match[0]);
    if (specTokens.length) {
      assert(
        specTokens.some((token) => cardHtml.toLowerCase().includes(token.toLowerCase())),
        `${url} does not show a key specification for ${link.name}`,
      );
    }
  });

  if (kind === "under-20000") {
    rows.forEach((row) => {
      const price = getLowestProductPrice(row);
      assert(
        price != null && price <= 20000,
        `${url} includes ${getProductName(row)} with no valid price or a price above ₹20,000`,
      );
    });
  } else if (kind === "google") {
    rows.forEach((row) => {
      assert(
        normalizeDuplicateValue(getBrandName(row)) === "google",
        `${url} includes a non-Google product: ${getProductName(row)} (${getBrandName(row) || "unknown brand"})`,
      );
    });
  } else if (kind === "high-camera") {
    rows.forEach((row) => {
      const camera = row.camera ?? row.camera_json ?? row.basic_info?.camera;
      const megapixels = getCameraMegapixels(camera);
      assert(
        megapixels.some((value) => value >= 50),
        `${url} includes ${getProductName(row)} without a 50 MP camera field`,
      );
    });
  }

  assert(
    !getLastmodForUrl(sitemapXml, url),
    `${url} advertises lastmod without a route-specific update timestamp`,
  );

  return {
    pathname,
    productUrls: productLinks.map((link) => new URL(link.path, SITE_ORIGIN).href),
  };
};

const run = async () => {
  const sitemapXml = await fs.readFile(path.join(distDir, "sitemap.xml"), "utf8");
  const urls = [...sitemapXml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(
    (match) => decodeHtml(match[1].trim()),
  );
  const sitemapEntries = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/gi)];
  sitemapEntries.forEach((match) => {
    const lastmod = match[1].match(/<lastmod>([\s\S]*?)<\/lastmod>/i)?.[1]?.trim();
    if (!lastmod) return;
    const parsedLastmod = new Date(lastmod);
    assert(
      /^\d{4}-\d{2}-\d{2}$/.test(lastmod) &&
        !Number.isNaN(parsedLastmod.getTime()) &&
        parsedLastmod.getUTCFullYear() >= 2000,
      `Sitemap contains an invalid or placeholder lastmod: ${lastmod}`,
    );
  });

  assert(urls.length > 0, "dist/sitemap.xml contains no URLs");
  assert(new Set(urls).size === urls.length, "dist/sitemap.xml contains duplicate URLs");
  urls.forEach((url) => {
    const parsed = new URL(url);
    assert(parsed.origin === SITE_ORIGIN, `Sitemap URL uses another origin: ${url}`);
    assert(!parsed.search && !parsed.hash, `Sitemap URL contains a query or hash: ${url}`);
    assert(
      parsed.pathname === "/" || !parsed.pathname.endsWith("/"),
      `Sitemap URL has an unexpected trailing slash: ${url}`,
    );
  });

  const compareUrls = urls.filter((url) => /^\/compare\/[^/]+$/.test(new URL(url).pathname));
  assert(compareUrls.length > 0, "Sitemap contains no comparison detail URLs");

  const rows = [];
  let totalPayloadBytes = 0;
  for (const url of compareUrls) {
    const html = await readRouteHtml(url);
    const head = inspectIndexableHead(html, url);

    assert(
      /<main\b[^>]*data-compare-prerendered=["']detail["']/i.test(html),
      `${url} is missing semantic initial comparison HTML`,
    );
    assert(/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html), `${url} is missing an initial h1`);
    const productArticles = html.match(/<article\b/gi) || [];
    assert(
      productArticles.length >= 2 && productArticles.length <= 3,
      `${url} has ${productArticles.length} initial product cards`,
    );
    for (const schemaType of ["BreadcrumbList", "WebApplication", "ItemList"]) {
      assert(
        new RegExp(`["']@type["']\\s*:\\s*["']${schemaType}["']`, "i").test(html),
        `${url} is missing ${schemaType} JSON-LD`,
      );
    }

    const { bytes, payload } = getPreloadedPayload(html, url);
    const payloadEntries = Object.entries(payload?.byUrl || {});
    assert(
      payloadEntries.length === 1,
      `${url} embeds ${payloadEntries.length} API payloads instead of one route-specific payload`,
    );
    const [endpoint, response] = payloadEntries[0] || [];
    assert(
      /\/public\/compare-pages\/resolve\?slug=/i.test(endpoint || ""),
      `${url} prerender payload is not the comparison resolver response`,
    );
    const items = Array.isArray(response?.page?.items) ? response.page.items : [];
    assert(
      items.length >= 2 && items.length <= 3,
      `${url} resolver payload has ${items.length} products`,
    );
    assert(
      new URL(url).pathname.replace(/\/$/, "") ===
        String(response.page.route_path || "").replace(/\/$/, ""),
      `${url} resolver route_path does not match its canonical path`,
    );

    totalPayloadBytes += bytes;
    rows.push({ url, ...head });
  }

  for (const field of ["title", "description", "canonical"]) {
    assertNoDuplicates(rows, field);
  }

  const controls = await Promise.all([
    verifyControlRoute(
      urls,
      /^\/smartphones\/(?!brand\/|filter\/|feature\/)[^/]+$/,
      "smartphone detail",
    ),
    verifyControlRoute(
      urls,
      /^\/tvs\/(?!brand\/|filter\/|feature\/)[^/]+$/,
      "TV detail",
    ),
    verifyControlRoute(urls, /^\/news\/[^/]+$/, "news article"),
  ]);
  const smartphoneListings = await Promise.all([
    verifySmartphoneListingRoute(
      urls,
      "/smartphones/filter/under-20000",
      "under-20000",
      sitemapXml,
    ),
    verifySmartphoneListingRoute(
      urls,
      "/smartphones/brand/google",
      "google",
      sitemapXml,
    ),
    verifySmartphoneListingRoute(
      urls,
      "/smartphones/feature/high-camera",
      "high-camera",
      sitemapXml,
    ),
  ]);
  const findSitemapUrl = (pathname, label) => {
    const match = urls.find((candidate) => new URL(candidate).pathname === pathname);
    assert(match, `Sitemap has no ${label} route at ${pathname}`);
    return match;
  };
  const chooseListedSitemapUrl = (listing, label) => {
    const match = listing.productUrls.find((candidate) => urls.includes(candidate));
    assert(match, `${label} listing has no product route in the sitemap`);
    return match;
  };
  const smartphoneProductChecks = new Map([
    [
      findSitemapUrl(
        "/smartphones/apple-iphone-17-price-in-india",
        "Apple iPhone 17 product",
      ),
      { label: "Apple iPhone 17", expectedBrand: "Apple" },
    ],
    [
      chooseListedSitemapUrl(smartphoneListings[0], "Under-₹20,000"),
      { label: "under-₹20,000 smartphone", maxPrice: 20000 },
    ],
    [
      chooseListedSitemapUrl(smartphoneListings[1], "Google brand"),
      { label: "Google smartphone", expectedBrand: "Google" },
    ],
  ]);
  const smartphoneProductUrls = urls.filter((candidate) => {
    const pathname = new URL(candidate).pathname;
    return (
      pathname.startsWith("/smartphones/") &&
      pathname.endsWith("-price-in-india") &&
      !pathname.slice("/smartphones/".length).includes("/")
    );
  });
  assert(
    smartphoneProductUrls.length > 0,
    "Sitemap has no smartphone product detail routes",
  );
  const smartphoneProducts = await Promise.all(
    smartphoneProductUrls.map((url) =>
      verifySmartphoneProductRoute(
        url,
        sitemapXml,
        smartphoneProductChecks.get(url) || { label: "smartphone" },
      ),
    ),
  );
  const tvProductUrls = urls.filter((candidate) => {
    const pathname = new URL(candidate).pathname;
    return /^\/tvs\/[^/]+$/.test(pathname) && pathname !== "/tvs/latest";
  });
  assert(tvProductUrls.length > 0, "Sitemap has no TV product detail routes");
  const tvProducts = await Promise.all(tvProductUrls.map(verifyTvProductRoute));
  assert(
    tvProducts.some((product) => product.price != null),
    "TV product pages have no actual price in their initial HTML",
  );
  assert(
    tvProducts.some((product) => product.detailSpecs.length > 0),
    "TV product pages have no actual specifications in their initial HTML",
  );
  const aboutUrl = urls.find(
    (candidate) => new URL(candidate).pathname === "/about",
  );
  assert(aboutUrl, "Sitemap has no /about control URL");
  assert(
    !getLastmodForUrl(sitemapXml, aboutUrl),
    "/about has a sitemap lastmod without an authoritative source timestamp",
  );

  console.log(
    `[indexable-routes] Verified ${compareUrls.length} comparison detail URLs, ${controls.length} unrelated control routes, ${smartphoneListings.length} route-filtered smartphone listings, ${smartphoneProducts.length} independently checked smartphone product routes, ${tvProducts.length} TV product routes, sitemap product dates, sitemap/canonical parity, initial content, schemas, unique metadata, and slim route-specific payloads (${Math.round(totalPayloadBytes / compareUrls.length).toLocaleString()} average comparison payload bytes).`,
  );
};

await run();
