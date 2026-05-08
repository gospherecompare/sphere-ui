import { generateSlug } from "./slugGenerator";

const normalizeCompareName = (value = "") =>
  generateSlug(String(value || "").trim()).replace(/-price-in-india$/i, "");

const normalizeCompareIdentifier = (value = null) => {
  if (value == null) return "";
  return String(value).trim();
};

const normalizeCompareVariantIndex = (value = 0) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : 0;
};

const stringifyCompareEntries = (entries = []) =>
  entries
    .map((entry) => {
      const id = normalizeCompareIdentifier(entry?.id);
      if (!id) return "";
      return `${id}:${normalizeCompareVariantIndex(entry?.variantIndex)}`;
    })
    .filter(Boolean)
    .join(",");

export const buildCanonicalComparePath = ({
  leftName = "",
  rightName = "",
  leftId = null,
  rightId = null,
  type = "",
} = {}) => {
  const leftSlug = normalizeCompareName(leftName);
  const rightSlug = normalizeCompareName(rightName);

  if (leftSlug && rightSlug && leftSlug !== rightSlug) {
    return `/compare/${leftSlug}-vs-${rightSlug}`;
  }

  const normalizedLeftId = Number(leftId);
  const normalizedRightId = Number(rightId);
  if (
    Number.isFinite(normalizedLeftId) &&
    normalizedLeftId > 0 &&
    Number.isFinite(normalizedRightId) &&
    normalizedRightId > 0
  ) {
    const params = new URLSearchParams();
    params.set("devices", `${normalizedLeftId}:0,${normalizedRightId}:0`);
    if (type) params.set("type", String(type));
    return `/compare?${params.toString()}`;
  }

  return "/compare";
};

export const toCanonicalCompareSlug = normalizeCompareName;

export const buildCanonicalComparePathFromDevices = ({
  devices = [],
  type = "",
  getName = (device) =>
    device?.name ||
    device?.model ||
    device?.title ||
    device?.product_name ||
    "",
  getId = (device) =>
    device?.productId ??
    device?.product_id ??
    device?.id ??
    device?.baseId ??
    device?.model ??
    null,
  getVariantIndex = (device) =>
    device?.variantIndex ?? device?.selectedVariantIndex ?? 0,
} = {}) => {
  const normalizedDevices = Array.isArray(devices) ? devices.filter(Boolean) : [];
  if (normalizedDevices.length === 0) return "/compare";

  const entries = normalizedDevices
    .map((device) => ({
      id: normalizeCompareIdentifier(getId(device)),
      variantIndex: normalizeCompareVariantIndex(getVariantIndex(device)),
    }))
    .filter((entry) => entry.id);

  const basePath =
    normalizedDevices.length === 2
      ? buildCanonicalComparePath({
          leftName: getName(normalizedDevices[0]),
          rightName: getName(normalizedDevices[1]),
          leftId: entries[0]?.id || null,
          rightId: entries[1]?.id || null,
          type,
        })
      : "/compare";

  const canUseSlugOnly =
    normalizedDevices.length === 2 &&
    !basePath.startsWith("/compare?") &&
    entries.length === 2 &&
    entries.every((entry) => entry.variantIndex === 0);

  if (canUseSlugOnly) return basePath;

  const devicesParam = stringifyCompareEntries(entries);
  if (!devicesParam) return basePath || "/compare";

  const params = new URLSearchParams();
  params.set("devices", devicesParam);
  if (type) params.set("type", String(type));
  const canonicalBasePath =
    normalizedDevices.length === 2 && !basePath.startsWith("/compare?")
      ? basePath
      : "/compare";
  return `${canonicalBasePath}?${params.toString()}`;
};
