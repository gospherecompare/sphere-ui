const hasOwn = (value, key) =>
  Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);

const parsePublishedFlag = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "published" ||
    normalized === "active" ||
    normalized === "visible"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "no" ||
    normalized === "draft" ||
    normalized === "inactive" ||
    normalized === "hidden" ||
    normalized === "unpublished"
  ) {
    return false;
  }

  return null;
};

export const isPublishedProduct = (
  product,
  { defaultVisible = true } = {},
) => {
  if (!product || typeof product !== "object") return defaultVisible;

  const sources = [product, product.raw].filter(
    (value, index, array) =>
      value && typeof value === "object" && array.indexOf(value) === index,
  );
  const keys = ["published", "is_published", "isPublished", "publish"];

  for (const source of sources) {
    for (const key of keys) {
      if (!hasOwn(source, key)) continue;
      const parsed = parsePublishedFlag(source[key]);
      if (parsed !== null) return parsed;
    }
  }

  return defaultVisible;
};

export default isPublishedProduct;
