import { useEffect, useState, useCallback } from "react";
import STORE_LOGOS from "../constants/storeLogos";
import { buildApiUrl } from "../utils/apiUrl";

const API_URL = buildApiUrl("/public/online-stores");
let sharedStorePayload = null;
let sharedStoreError = null;
let sharedStorePromise = null;

const normalizeForConstants = (name) =>
  String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

export default function useStoreLogos() {
  const [apiMap, setApiMap] = useState(sharedStorePayload?.map || {});
  const [stores, setStores] = useState(sharedStorePayload?.stores || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(sharedStoreError);

  const fetchLogos = useCallback(async (options = {}) => {
    const force = Boolean(options?.force);

    if (!force && sharedStorePayload) {
      setApiMap(sharedStorePayload.map || {});
      setStores(sharedStorePayload.stores || []);
      setError(null);
      setLoading(false);
      return sharedStorePayload;
    }

    setLoading(true);

    if (!force && sharedStorePromise) {
      try {
        const payload = await sharedStorePromise;
        setApiMap(payload.map || {});
        setStores(payload.stores || []);
        setError(null);
        return payload;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    }

    sharedStorePromise = (async () => {
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
      return {
        map,
        stores: list.map((s) => ({
          id: s.id,
          name: s.name,
          logo: s.logo,
          status: s.status,
        })),
      };
    })();

    try {
      const payload = await sharedStorePromise;
      sharedStorePayload = payload;
      sharedStoreError = null;
      setApiMap(payload.map || {});
      setStores(payload.stores || []);
      setError(null);
      return payload;
    } catch (err) {
      sharedStoreError = err;
      setError(err);
      // keep existing apiMap if fetch fails
      throw err;
    } finally {
      sharedStorePromise = null;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // fetch once on mount
    fetchLogos().catch(() => {
      // keep prior state when fetch fails
    });
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
      const key = normalizeForConstants(storeName);
      if (STORE_LOGOS[key]) return STORE_LOGOS[key];
      const fallback = Object.entries(STORE_LOGOS).find(
        ([storeKey]) => key.includes(storeKey) || storeKey.includes(key),
      );
      return fallback?.[1] || null;
    } catch {
      return null;
    }
  };

  // backwards-compatible alias
  const getLogo = (storeName) => getStoreLogo(storeName);

  const getStore = useCallback(
    (storeName) => {
      const key = normalizeForConstants(storeName);
      if (key && apiMap[key]) return apiMap[key];
      return null;
    },
    [apiMap],
  );

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
