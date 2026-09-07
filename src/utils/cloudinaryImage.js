const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";
const OG_TRANSFORMATION = "c_fill,w_1200,h_630,g_auto,q_auto,f_auto";

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

export const CLOUDINARY_OG_DIMENSIONS = Object.freeze({
  width: 1200,
  height: 630,
});
