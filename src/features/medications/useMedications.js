import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { FILTER_ALL, MEDICATION_PAGE_SIZE } from "@/constants/inventory";
import { api } from "@/lib/api";

const EMPTY_LIST = {
  medications: [],
  pagination: { page: 1, limit: MEDICATION_PAGE_SIZE, total: 0, totalPages: 1 },
};
const EMPTY_STATS = { totalItems: 0, lowStockCount: 0, outOfStockCount: 0, inventoryValue: 0 };

export function useMedications({ search, category, itemType, status, expiry, page }) {
  const [data, setData] = useState(EMPTY_LIST);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const silent = useRef(false);

  useEffect(() => {
    const c = new AbortController();
    if (!silent.current) setIsLoading(true);
    setError(null);
    api(API_ENDPOINTS.MEDICATIONS, {
      params: {
        search: search || undefined,
        category: category === FILTER_ALL ? undefined : category,
        itemType: itemType === FILTER_ALL ? undefined : itemType,
        status: status === FILTER_ALL ? undefined : status,
        expiry: expiry === FILTER_ALL ? undefined : expiry,
        page,
        limit: MEDICATION_PAGE_SIZE,
      },
      signal: c.signal,
    })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) {
          setIsLoading(false);
          silent.current = false;
        }
      });
    return () => c.abort();
  }, [search, category, itemType, status, expiry, page, reloadKey]);

  useEffect(() => {
    const c = new AbortController();
    setStatsLoading(true);
    api(API_ENDPOINTS.MEDICATIONS_STATS, { signal: c.signal })
      .then(setStats)
      .catch(() => {})
      .finally(() => {
        if (!c.signal.aborted) setStatsLoading(false);
      });
    return () => c.abort();
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const refresh = useCallback(() => {
    silent.current = true;
    reload();
  }, [reload]);

  const createMedication = useCallback(
    async (values) => {
      const r = await api(API_ENDPOINTS.MEDICATIONS, { method: HTTP_METHODS.POST, body: values });
      refresh();
      return r;
    },
    [refresh],
  );
  const updateMedication = useCallback(
    async (id, values) => {
      const r = await api(API_ENDPOINTS.medication(id), { method: HTTP_METHODS.PATCH, body: values });
      refresh();
      return r;
    },
    [refresh],
  );
  const removeMedication = useCallback(
    async (id) => {
      const r = await api(API_ENDPOINTS.medication(id), { method: HTTP_METHODS.DELETE });
      refresh();
      return r;
    },
    [refresh],
  );

  return {
    medications: data.medications,
    pagination: data.pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    reload,
    refresh,
    createMedication,
    updateMedication,
    removeMedication,
  };
}
