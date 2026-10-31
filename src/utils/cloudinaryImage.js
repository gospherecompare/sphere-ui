const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";
const OG_TRANSFORMATION = "c_fill,w_1200,h_630,g_auto,q_auto,f_auto";
const RESPONSIVE_TRANSFORMATION_KEYS =
  /^(?:w|h|c|f|q|dpr|g|ar|fl|e|bo|r|a|b|d|l|o|x|y|z|t)_/i;

export const toCloudinaryOgImage = (value) => {
  const raw = String(value || "").trim();
  if (!raw || !/https?:\/\/res\.cloudinary\.com\//i.test(raw)) return raw;

  const markerIndex = raw.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (markerIndex < 0) return raw;

  const prefixEnd = markerIndex + CLOUDINARY_UPLOAD_SEGMENT.length;
  const remainder = raw.slice(prefixEnd);
  if (remainder.startsWith(`${OG_TRANSFORMATION}/`)) return raw;

  return `${raw.slice(0, prefixEnd)}${OG_TRANSFORMATION}/${remainder}`;
};

export const toCloudinaryResponsiveImage = (value, width = 640) => {
  const raw = String(value || "").trim();
  if (!raw || !/https?:\/\/res\.cloudinary\.com\//i.test(raw)) return raw;

  const markerIndex = raw.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (markerIndex < 0) return raw;

  const prefixEnd = markerIndex + CLOUDINARY_UPLOAD_SEGMENT.length;
  const remainder = raw.slice(prefixEnd);
  const segments = remainder.split("/");
  let transformCount = 0;

  while (
    transformCount < segments.length &&
    RESPONSIVE_TRANSFORMATION_KEYS.test(segments[transformCount])
  ) {
    transformCount += 1;
  }

  const targetWidth = Math.max(64, Math.min(1600, Math.round(Number(width) || 640)));
  segments.splice(transformCount, 0, `c_limit,w_${targetWidth},q_auto,f_auto`);

  return `${raw.slice(0, prefixEnd)}${segments.join("/")}`;
};

export const toCloudinaryResponsiveSrcSet = (
  value,
  widths = [320, 640, 960],
) => {
  const raw = String(value || "").trim();
  if (!raw || !/https?:\/\/res\.cloudinary\.com\//i.test(raw)) return undefined;
  return widths
    .map((width) => `${toCloudinaryResponsiveImage(raw, width)} ${width}w`)
    .join(", ");
};

export const CLOUDINARY_OG_DIMENSIONS = Object.freeze({
  width: 1200,
  height: 630,
});
