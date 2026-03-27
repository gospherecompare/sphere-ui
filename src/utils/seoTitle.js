const SEO_TITLE_SEPARATOR_RE = /\s+-\s+/g;

export const normalizeSeoTitle = (value = "") => {
  const text = String(value || "")
    .replace(SEO_TITLE_SEPARATOR_RE, " ")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text;
};
