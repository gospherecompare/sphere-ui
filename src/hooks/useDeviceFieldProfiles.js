import { useEffect, useState } from "react";
import {
  DEFAULT_DEVICE_FIELD_PROFILES,
  normalizeDeviceFieldProfiles,
} from "../utils/deviceFieldProfiles";

const PROFILE_API_CANDIDATES = String(
  import.meta.env.VITE_DEVICE_FIELD_PROFILES_API || "",
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

let cachedProfiles = null;
let cachedPromise = null;

const readProfilePayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  if (payload.profiles && typeof payload.profiles === "object") {
    return payload.profiles;
  }
  if (
    payload.smartphone ||
    payload.laptop ||
    payload.tv ||
    payload.television ||
    payload.home_appliance
  ) {
    return payload;
  }
  return null;
};

const fetchProfiles = async () => {
  if (!PROFILE_API_CANDIDATES.length) {
    return normalizeDeviceFieldProfiles(DEFAULT_DEVICE_FIELD_PROFILES);
  }

  for (const url of PROFILE_API_CANDIDATES) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) continue;
      const payload = await response.json();
      const profilePayload = readProfilePayload(payload);
      return normalizeDeviceFieldProfiles(
        profilePayload || DEFAULT_DEVICE_FIELD_PROFILES,
      );
    } catch {
      // try next candidate
    }
  }

  return normalizeDeviceFieldProfiles(DEFAULT_DEVICE_FIELD_PROFILES);
};

const useDeviceFieldProfiles = () => {
  const [profiles, setProfiles] = useState(
    normalizeDeviceFieldProfiles(cachedProfiles || DEFAULT_DEVICE_FIELD_PROFILES),
  );

  useEffect(() => {
    let cancelled = false;

    if (cachedProfiles) {
      setProfiles(normalizeDeviceFieldProfiles(cachedProfiles));
      return undefined;
    }

    if (!cachedPromise) {
      cachedPromise = fetchProfiles()
        .then((normalized) => {
          cachedProfiles = normalized;
          return normalized;
        })
        .catch(() => {
          const fallback = normalizeDeviceFieldProfiles(
            DEFAULT_DEVICE_FIELD_PROFILES,
          );
          cachedProfiles = fallback;
          return fallback;
        })
        .finally(() => {
          cachedPromise = null;
        });
    }

    cachedPromise
      .then((resolved) => {
        if (cancelled) return;
        setProfiles(normalizeDeviceFieldProfiles(resolved));
      })
      .catch(() => {
        if (cancelled) return;
        setProfiles(normalizeDeviceFieldProfiles(DEFAULT_DEVICE_FIELD_PROFILES));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return profiles;
};

export default useDeviceFieldProfiles;
