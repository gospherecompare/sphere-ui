import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import useDevice from "../../hooks/useDevice";
import { buildApiUrl } from "../../utils/apiUrl";
import { fetchPublicJson } from "../../utils/publicJsonRequest";
import {
  excludeProducts,
  normalizeBrand,
  normalizeComparison,
  normalizeHomeProduct,
  productRowsFromPayload,
  uniqueProducts,
} from "./homeData";

const HomeDataContext = createContext(null);

const MOST_COMPARED_ENDPOINT = buildApiUrl("/public/trending/most-compared");

const normalizeList = (rows, type = "smartphones") =>
  uniqueProducts(
    (Array.isArray(rows) ? rows : [])
      .map((row) => normalizeHomeProduct(row, type))
      .filter(Boolean),
  );

export const HomeDataProvider = ({ children }) => {
  const devices = useDevice({ resources: ["smartphones", "tvs", "brands"] });
  const [remote, setRemote] = useState({
    trending: [],
    latest: [],
    comparisons: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      const requests = await Promise.allSettled([
        fetchPublicJson(buildApiUrl("/public/trending/smartphones?limit=40"), {
          signal: controller.signal,
        }),
        fetchPublicJson(buildApiUrl("/public/new/smartphones"), {
          signal: controller.signal,
        }),
        fetchPublicJson(MOST_COMPARED_ENDPOINT, {
          signal: controller.signal,
        }),
      ]);
      if (!active) return;

      const trendingPayload = requests[0].status === "fulfilled" ? requests[0].value : {};
      const latestPayload = requests[1].status === "fulfilled" ? requests[1].value : {};
      const comparisonPayload = requests[2].status === "fulfilled" ? requests[2].value : {};

      setRemote({
        trending: normalizeList(productRowsFromPayload(trendingPayload)),
        latest: normalizeList(productRowsFromPayload(latestPayload)),
        comparisons: (comparisonPayload?.mostCompared || comparisonPayload?.results || [])
          .map(normalizeComparison)
          .filter(Boolean),
        loading: false,
        error: requests.every((request) => request.status === "rejected")
          ? "Live homepage feeds are temporarily unavailable."
          : "",
      });
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const value = useMemo(() => {
    const storeSmartphones = normalizeList(
      (devices.smartphoneAll?.length ? devices.smartphoneAll : devices.smartphone) || [],
    );
    const storeTvs = normalizeList(devices.homeAppliances || [], "tvs");
    const catalog = uniqueProducts([
      ...remote.trending,
      ...remote.latest,
      ...storeSmartphones,
      ...storeTvs,
    ]);

    const trendingSource = remote.trending.length
      ? remote.trending
      : [...storeSmartphones].sort((a, b) => (b.signal || 0) - (a.signal || 0));
    const latestSource = remote.latest.length
      ? remote.latest
      : [...storeSmartphones].sort((a, b) => {
          const left = a.launchDate instanceof Date ? a.launchDate.getTime() : 0;
          const right = b.launchDate instanceof Date ? b.launchDate.getTime() : 0;
          return right - left;
        });

    const heroProduct = trendingSource[0] || latestSource[0] || catalog[0] || null;
    const trendingProducts = excludeProducts(
      uniqueProducts([...trendingSource, ...catalog]),
      [heroProduct],
    ).slice(0, 6);
    const latestProducts = excludeProducts(
      uniqueProducts([...latestSource, ...storeSmartphones]),
      [heroProduct, ...trendingProducts],
    ).slice(0, 8);

    const valueProducts = excludeProducts(
      catalog
        .filter((product) => Number.isFinite(product.price) && product.price > 0)
        .sort((a, b) => {
          const leftScore = a.score || 50;
          const rightScore = b.score || 50;
          return rightScore / Math.max(b.price, 1) - leftScore / Math.max(a.price, 1);
        }),
      [heroProduct, ...trendingProducts, ...latestProducts],
    ).slice(0, 8);

    const brands = (devices.brands || [])
      .map(normalizeBrand)
      .filter(Boolean)
      .filter((brand, index, rows) =>
        rows.findIndex((candidate) => candidate.name.toLowerCase() === brand.name.toLowerCase()) === index,
      )
      .slice(0, 24);

    const categoryCounts = {
      smartphones: storeSmartphones.length || catalog.filter((item) => item.type === "smartphones").length,
      tvs: storeTvs.length || catalog.filter((item) => item.type === "tvs").length,
      brands: brands.length,
      comparisons: remote.comparisons.length,
    };

    return {
      loading: remote.loading || devices.loading || devices.homeAppliancesLoading,
      error: remote.error,
      heroProduct,
      trendingProducts,
      latestProducts,
      valueProducts,
      comparisons: remote.comparisons.slice(0, 6),
      brands,
      categoryCounts,
      catalog,
    };
  }, [devices, remote]);

  return <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>;
};

export const useHomeData = () => {
  const value = useContext(HomeDataContext);
  if (!value) throw new Error("useHomeData must be used inside HomeDataProvider");
  return value;
};

export default HomeDataContext;
