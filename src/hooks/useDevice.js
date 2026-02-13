import { useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchSmartphones,
  fetchBrands,
  fetchCategories,
  fetchNetworking,
  fetchLaptops,
  fetchHomeAppliances,
  setDevicesForType,
  setDevice as setDeviceAction,
  addToHistory,
  clearHistory,
  setFilters,
  selectDeviceById as selectByIdAction,
  selectDeviceByModel as selectByModelAction,
  fetchSmartphone,
} from "../store/deviceSlice";

export function useDevice() {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.device || {});

  // load data when relevant flags show data is missing. Include explicit
  // dependencies so the effect won't be re-run unexpectedly and will only
  // dispatch actions when a resource is actually missing.
  useEffect(() => {
    if (!state.loaded && !state.loading) dispatch(fetchSmartphones());
    if (!state.networkingLoaded && !state.networkingLoading)
      dispatch(fetchNetworking());
    if (!state.laptopsLoaded && !state.laptopsLoading) dispatch(fetchLaptops());
    if (!state.homeAppliancesLoaded && !state.homeAppliancesLoading)
      dispatch(fetchHomeAppliances());
    if (!state.brandsLoaded && !state.brandsLoading) dispatch(fetchBrands());
    if (!state.categoriesLoaded && !state.categoriesLoading)
      dispatch(fetchCategories());
  }, [
    dispatch,
    state.loaded,
    state.loading,
    state.networkingLoaded,
    state.networkingLoading,
    state.laptopsLoaded,
    state.laptopsLoading,
    state.homeAppliancesLoaded,
    state.homeAppliancesLoading,
    state.brandsLoaded,
    state.brandsLoading,
    state.categoriesLoaded,
    state.categoriesLoading,
  ]);

  // Combined list of all device types for generic components.
  // Memoized to avoid re-creating the array on every render.
  const devices = useMemo(() => {
    return [
      ...((state.smartphoneAll && state.smartphoneAll.length
        ? state.smartphoneAll
        : state.smartphone) || []).map((d) => ({
        ...d,
        deviceType: "smartphone",
      })),
      ...(state.laptops || []).map((d) => ({ ...d, deviceType: "laptop" })),
      ...(state.networking || []).map((d) => ({
        ...d,
        deviceType: "networking",
      })),
      ...(state.homeAppliances || []).map((d) => ({
        ...d,
        deviceType: "homeAppliance",
      })),
    ];
  }, [
    state.smartphoneAll,
    state.smartphone,
    state.laptops,
    state.networking,
    state.homeAppliances,
  ]);

  const getDeviceById = useCallback(
    (id) => {
      if (id == null) return null;
      const found = devices.find(
        (s) => String(s.id) === String(id) || String(s.name) === String(id),
      );
      if (!found) return null;
      return {
        ...found,
        variants: Array.isArray(found.variants) ? found.variants : [],
      };
    },
    [devices],
  );

  const getDeviceByModel = useCallback(
    (model) => {
      if (!model) return null;
      const found = devices.find((s) => String(s.model) === String(model));
      if (!found) return null;
      return {
        ...found,
        variants: Array.isArray(found.variants) ? found.variants : [],
      };
    },
    [devices],
  );

  const addHistory = useCallback(
    (payload) => dispatch(addToHistory(payload)),
    [dispatch],
  );
  const clearHistoryFn = useCallback(
    () => dispatch(clearHistory()),
    [dispatch],
  );
  const setFiltersFn = useCallback((f) => dispatch(setFilters(f)), [dispatch]);
  const setDevices = useCallback(
    (type, devices) =>
      dispatch({ type: setDevicesForType.type, payload: { type, devices } }),
    [dispatch],
  );
  const selectDeviceById = useCallback(
    (id) => dispatch(selectByIdAction(id)),
    [dispatch],
  );
  const selectDeviceByModel = useCallback(
    (m) => dispatch(selectByModelAction(m)),
    [dispatch],
  );
  const refreshDevices = useCallback(
    () => dispatch(fetchSmartphones()),
    [dispatch],
  );

  const refreshNetworking = useCallback(
    () => dispatch(fetchNetworking()),
    [dispatch],
  );

  const refreshHomeAppliances = useCallback(
    () => dispatch(fetchHomeAppliances()),
    [dispatch],
  );

  const refreshLaptops = useCallback(
    () => dispatch(fetchLaptops()),
    [dispatch],
  );

  const fetchDevice = useCallback(
    (idOrModel) => dispatch(fetchSmartphone(idOrModel)),
    [dispatch],
  );

  // Get device by productType and productId from flat registry or by searching lists
  const getDevice = useCallback(
    (productType, productId) => {
      if (!productType || productId == null) return null;
      const key = `${productType}:${String(productId)}`;
      // try registry first
      if (state.devicesById && state.devicesById[key]) {
        const found = state.devicesById[key];
        return {
          ...found,
          variants: Array.isArray(found.variants) ? found.variants : [],
        };
      }
      // fallback: search combined lists by product_id / id / productId
      const pidStr = String(productId);
      const found = devices.find((d) => {
        const idCandidates = [d.productId, d.product_id, d.id, d.model, d.name];
        return idCandidates.some((c) => c != null && String(c) === pidStr);
      });
      if (!found) return null;
      return {
        ...found,
        variants: Array.isArray(found.variants) ? found.variants : [],
      };
    },
    [devices, state.devicesById],
  );
  const setDevice = useCallback(
    (productType, productId, device) =>
      dispatch({
        type: setDeviceAction.type,
        payload: { productType, productId, device },
      }),
    [dispatch],
  );

  // (devices already declared above)

  return {
    smartphone: state.smartphone,
    smartphoneAll: state.smartphoneAll,
    devices,
    categories: state.categories,
    brands: (state.brands || []).filter((c) => Boolean(c.status)),
    history: state.history,
    selectedDevice: state.selectedDevice,
    filters: state.filters,
    setFilters: setFiltersFn,
    addToHistory: addHistory,
    selectDeviceById,
    selectDeviceByModel,
    getDeviceById,
    getDeviceByModel,
    getDevice,
    fetchDevice,
    setDevices,
    setDevice,
    networking: state.networking,
    networkingLoading: state.networkingLoading,
    refreshNetworking,
    laptops: state.laptops,
    laptopsLoading: state.laptopsLoading,
    refreshLaptops,
    homeAppliances: state.homeAppliances,
    homeAppliancesLoading: state.homeAppliancesLoading,
    refreshHomeAppliances,
    clearHistory: clearHistoryFn,
    loading: state.loading,
    error: state.error,
    refreshDevices,
  };
}

export default useDevice;
