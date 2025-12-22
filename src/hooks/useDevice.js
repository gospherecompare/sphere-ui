import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchSmartphones,
  fetchBrands,
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

  // load data once when first used
  useEffect(() => {
    if (!state.loaded && !state.loading) dispatch(fetchSmartphones());
    if ((state.brands || []).length === 0 && !state.brandsLoading)
      dispatch(fetchBrands());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDeviceById = useCallback(
    (id) => {
      if (id == null) return null;
      const found = (state.smartphone || []).find(
        (s) => String(s.id) === String(id) || String(s.name) === String(id)
      );
      if (!found) return null;
      return {
        ...found,
        variants: Array.isArray(found.variants) ? found.variants : [],
      };
    },
    [state.smartphone]
  );

  const getDeviceByModel = useCallback(
    (model) => {
      if (!model) return null;
      const found = (state.smartphone || []).find(
        (s) => String(s.model) === String(model)
      );
      if (!found) return null;
      return {
        ...found,
        variants: Array.isArray(found.variants) ? found.variants : [],
      };
    },
    [state.smartphone]
  );

  const addHistory = useCallback(
    (payload) => dispatch(addToHistory(payload)),
    [dispatch]
  );
  const clearHistoryFn = useCallback(
    () => dispatch(clearHistory()),
    [dispatch]
  );
  const setFiltersFn = useCallback((f) => dispatch(setFilters(f)), [dispatch]);
  const selectDeviceById = useCallback(
    (id) => dispatch(selectByIdAction(id)),
    [dispatch]
  );
  const selectDeviceByModel = useCallback(
    (m) => dispatch(selectByModelAction(m)),
    [dispatch]
  );
  const refreshDevices = useCallback(
    () => dispatch(fetchSmartphones()),
    [dispatch]
  );

  const fetchDevice = useCallback(
    (idOrModel) => dispatch(fetchSmartphone(idOrModel)),
    [dispatch]
  );

  return {
    smartphone: state.smartphone,
    categories: state.brands,
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
    fetchDevice,
    clearHistory: clearHistoryFn,
    loading: state.loading,
    error: state.error,
    refreshDevices,
  };
}

export default useDevice;
