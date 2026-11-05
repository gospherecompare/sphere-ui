const SITE_NAME = "MobilesX";

const cleanCompareNames = (names = []) =>
  (Array.isArray(names) ? names : [])
    .map((name) => String(name || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3);

const formatNames = (names, conjunction = "and") => {
  if (names.length < 2) return names[0] || "";
  if (names.length === 2) return `${names[0]} ${conjunction} ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} ${conjunction} ${names[names.length - 1]}`;
};

const formatTitleNames = (names) => {
  if (names.length < 2) return names[0] || "";
  if (names.length === 2) return `${names[0]} vs ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
};

export const getCompareNamesFromSlug = (slug = "") => {
  const value = String(slug || "").replace(/-comparison$/i, "");
  const parts = value.split(/-and-|-vs-/i).filter(Boolean);
  const brandNames = {
    apple: "Apple",
    google: "Google",
    iqoo: "iQOO",
    iphone: "iPhone",
    motorola: "Motorola",
    oneplus: "OnePlus",
    oppo: "OPPO",
    pixel: "Pixel",
    poco: "POCO",
    realme: "realme",
    redmi: "Redmi",
    samsung: "Samsung",
    vivo: "vivo",
    xiaomi: "Xiaomi",
  };

  return parts
    .map((part) =>
      part
        .split("-")
        .filter(Boolean)
        .map((word) => brandNames[word.toLowerCase()] || `${word[0]?.toUpperCase() || ""}${word.slice(1)}`)
        .join(" "),
    )
    .filter(Boolean);
};

export const buildCompareSeoMetadata = (rawNames = []) => {
  const names = cleanCompareNames(rawNames);

  if (names.length < 2) {
    const title = "Compare Smartphones and Devices | MobilesX";
    return {
      heading: "Compare Phones Your Way",
      title,
      description:
        "Compare smartphones and devices in India. Explore specifications, prices, features and key differences on MobilesX.",
      ogTitle: title,
      ogDescription:
        "Explore device specifications, features, prices and important differences with MobilesX.",
    };
  }

  if (names.length === 2) {
    const [first, second] = names;
    return {
      heading: `${first} vs ${second} Comparison`,
      title: `${first} vs ${second} Specs & Differences | ${SITE_NAME}`,
      description: `Compare ${first} and ${second} in India. Explore their display, processor, cameras, battery, specifications and key differences.`,
      ogTitle: `${first} vs ${second} Comparison | ${SITE_NAME}`,
      ogDescription: `Explore the specifications, features and important differences between ${first} and ${second}.`,
    };
  }

  const titleNames = formatTitleNames(names);
  const proseNames = formatNames(names);
  const title = `Compare ${titleNames} | ${SITE_NAME}`;
  return {
    heading: `Compare ${titleNames}`,
    title,
    description: `Compare ${proseNames} in India. Explore their displays, processors, cameras, batteries, specifications and key differences.`,
    ogTitle: title,
    ogDescription: `Explore the specifications, features and important differences between ${proseNames}.`,
  };
};
