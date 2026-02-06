import { useEffect, useState, useCallback } from "react";

const API_URL = "https://api.apisphere.in/api/public/online-stores";

const normalizeKey = (name) =>
  String(name || "")
    .toLowerCase()
    .trim();

const normalizeForConstants = (name) =>
  String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

export default function useStoreLogos() {
  const [apiMap, setApiMap] = useState({});
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`Failed fetching stores: ${res.status}`);
      const json = await res.json();
      const map = {};
      const list = Array.isArray(json?.data) ? json.data : [];
      if (list.length) {
        list.forEach((s) => {
          const key = normalizeForConstants(s.name);
          if (key)
            map[key] = {
              id: s.id,
              name: s.name,
              logo: s.logo,
              status: s.status,
            };
        });
      }
      setApiMap(map);
      setStores(
        list.map((s) => ({
          id: s.id,
          name: s.name,
          logo: s.logo,
          status: s.status,
        })),
      );
      setError(null);
    } catch (err) {
      setError(err);
      // keep existing apiMap if fetch fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // fetch once on mount
    fetchLogos();
  }, [fetchLogos]);

  // memoized lookup map: normalized name -> store object
  const storeLookup = useCallback(
    (name) => {
      const key = normalizeForConstants(name);
      if (!key) return null;
      // prefer exact apiMap match (uses alphanumeric-normalized keys)
      if (apiMap && apiMap[key]) return apiMap[key];
      // fall back to exact match over fetched stores
      const exact = (stores || []).find(
        (s) => normalizeForConstants(s?.name) === key,
      );
      if (exact) return exact;
      // tolerant fallback: substring match (e.g., "amazon india" vs "amazon")
      const tolerant = (stores || []).find((s) => {
        const sKey = normalizeForConstants(s?.name || "");
        return sKey.includes(key) || key.includes(sKey);
      });
      return tolerant || null;
    },
    [apiMap, stores],
  );

  const getStoreLogo = (storeName) => {
    try {
      if (!storeName) return null;
      const storeObj = storeLookup(storeName);
      if (storeObj && storeObj.logo) return storeObj.logo;
      // no local asset fallback — caller should handle missing logos
      return null;
    } catch {
      return null;
    }
  };

  // backwards-compatible alias
  const getLogo = (storeName) => getStoreLogo(storeName);

  const getStore = (storeName) => {
    const key = normalizeForConstants(storeName);
    if (key && apiMap[key]) return apiMap[key];
    return null;
  };

  return {
    getLogo,
    getStore,
    getStoreLogo,
    stores,
    loading,
    error,
    refresh: fetchLogos,
  };
}
