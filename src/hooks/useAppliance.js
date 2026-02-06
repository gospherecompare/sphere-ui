import { useState, useCallback } from "react";

const BASE = "https://api.apisphere.in/api/public/appliance";

export function useAppliance() {
  const [selectedAppliance, setSelectedAppliance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppliance = useCallback(async (identifier) => {
    setLoading(true);
    setError(null);
    try {
      if (!identifier) {
        setSelectedAppliance(null);
        setLoading(false);
        return null;
      }

      // Try fetching by identifier (id or model)
      try {
        const res = await fetch(`${BASE}/${encodeURIComponent(identifier)}`);
        if (res.ok) {
          const body = await res.json();
          const obj = body && (body.appliance || body || null);
          if (obj) {
            const result = Array.isArray(obj) ? obj[0] : obj;
            setSelectedAppliance(result);
            setLoading(false);
            return result;
          }
        }
      } catch (e) {
        // ignore and try list fallback
      }

      // Fallback: fetch list and search by model/id/name
      const listRes = await fetch(BASE);
      if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
      const data = await listRes.json();
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.appliances)
          ? data.appliances
          : Array.isArray(data.data)
            ? data.data
            : [];

      const found = (arr || []).find(
        (d) =>
          String(d.id) === String(identifier) ||
          String(d.model) === String(identifier) ||
          String(d.name) === String(identifier),
      );

      if (!found) throw new Error("Appliance not found");
      setSelectedAppliance(found);
      setLoading(false);
      return found;
    } catch (err) {
      setError(err.message || String(err));
      setLoading(false);
      return null;
    }
  }, []);

  return { selectedAppliance, fetchAppliance, loading, error };
}

export default useAppliance;
