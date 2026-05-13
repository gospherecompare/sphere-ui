import { generateSlug } from "./slugGenerator";
import { toCanonicalPagePath } from "./publicUrl";

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

const buildSlugPathFromNames = (names = []) => {
  const parts = (Array.isArray(names) ? names : [])
    .map((name) => normalizeCompareName(name))
    .filter(Boolean);

  if (parts.length < 2 || parts.length > 3) return "";
  return toCanonicalPagePath(`/compare/${parts.join("-and-")}-comparison`);
};

export const buildCanonicalComparePath = ({
  leftName = "",
  rightName = "",
} = {}) => {
  const path = buildSlugPathFromNames([leftName, rightName]);
  return path || toCanonicalPagePath("/compare");
};

export const toCanonicalCompareSlug = normalizeCompareName;

export const buildCanonicalComparePathFromDevices = ({
  devices = [],
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
      name: getName(device),
    }))
    .filter((entry) => entry.id);

  const canUseSlugOnly =
    entries.length >= 2 &&
    entries.length <= 3 &&
    entries.every((entry) => entry.variantIndex === 0);

  if (canUseSlugOnly) {
    const slugPath = buildSlugPathFromNames(entries.map((entry) => entry.name));
    if (slugPath) return slugPath;
  }

  return toCanonicalPagePath("/compare");
};
