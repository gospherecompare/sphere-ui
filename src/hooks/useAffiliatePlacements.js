import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../utils/apiUrl";

const normalizeIdList = (values) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [values])
        .flatMap((value) =>
          Array.isArray(value) ? value : String(value || "").split(","),
        )
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

const normalizePlacement = (placement = {}) => ({
  ...placement,
  id: Number(placement.id) || placement.id,
  priority: Number(placement.priority || 0),
  match_score: Number(placement.match_score || 0),
  total_clicks: Number(placement.total_clicks || 0),
  matched_product_id: Number(placement.matched_product_id) || null,
  matched_blog_id: Number(placement.matched_blog_id) || null,
  price:
    placement.price === null || placement.price === undefined
      ? null
      : Number(placement.price),
});

export const buildAffiliateRedirectHref = ({
  placementId,
  pageType,
  slot = "",
  productId = null,
  blogId = null,
}) => {
  if (!placementId) return "#";
  const params = new URLSearchParams();
  if (pageType) params.set("pageType", String(pageType));
  if (slot) params.set("slot", String(slot));
  if (productId) params.set("productId", String(productId));
  if (blogId) params.set("blogId", String(blogId));
  return buildApiUrl(
    `/public/affiliate-redirect/${encodeURIComponent(placementId)}${
      params.toString() ? `?${params.toString()}` : ""
    }`,
  );
};

export const useAffiliatePlacements = ({
  pageType = "",
  productId = null,
  productIds = [],
  blogId = null,
  enabled = true,
} = {}) => {
  const normalizedProductIds = useMemo(
    () => normalizeIdList([productId, productIds]),
    [productId, productIds],
  );
  const serializedProductIds = normalizedProductIds.join(",");
  const endpoint = useMemo(() => {
    if (!pageType) return "";
    const params = new URLSearchParams();
    params.set("pageType", pageType);
    if (serializedProductIds) params.set("productIds", serializedProductIds);
    if (productId) params.set("productId", String(productId));
    if (blogId) params.set("blogId", String(blogId));
    return buildApiUrl(
      `/public/affiliate-placements?${params.toString()}`,
    );
  }, [blogId, pageType, productId, serializedProductIds]);

  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled && pageType));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !endpoint) {
      setPlacements([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    const loadPlacements = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(endpoint, {
          signal: controller.signal,
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            data?.message || `Affiliate request failed (${response.status})`,
          );
        }
        if (!active) return;
        setPlacements(
          Array.isArray(data?.placements)
            ? data.placements.map(normalizePlacement)
            : [],
        );
      } catch (err) {
        if (!active || err?.name === "AbortError") return;
        setPlacements([]);
        setError(err?.message || "Failed to load affiliate placements");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPlacements();

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, endpoint]);

  return { placements, loading, error };
};

export default useAffiliatePlacements;
