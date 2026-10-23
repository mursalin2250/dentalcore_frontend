import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { FILTER_ALL, MOVEMENT_PAGE_SIZE } from "@/constants/inventory";
import { api } from "@/lib/api";

const EMPTY_LIST = {
  movements: [],
  pagination: { page: 1, limit: MOVEMENT_PAGE_SIZE, total: 0, totalPages: 1 },
};
const EMPTY_STATS = { movementsToday: 0, stockInUnits: 0, stockOutUnits: 0, adjustmentsCount: 0 };

export function useStockMovements({ search, type, medication, from, to, page }) {
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
    api(API_ENDPOINTS.STOCK_MOVEMENTS, {
      params: {
        search: search || undefined,
        type: type === FILTER_ALL ? undefined : type,
        medication: medication === FILTER_ALL ? undefined : medication,
        from: from || undefined,
        to: to || undefined,
        page,
        limit: MOVEMENT_PAGE_SIZE,
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
  }, [search, type, medication, from, to, page, reloadKey]);

  useEffect(() => {
    const c = new AbortController();
    setStatsLoading(true);
    api(API_ENDPOINTS.STOCK_MOVEMENTS_STATS, { signal: c.signal })
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

  const createMovement = useCallback(
    async (values) => {
      const r = await api(API_ENDPOINTS.STOCK_MOVEMENTS, { method: HTTP_METHODS.POST, body: values });
      refresh();
      return r;
    },
    [refresh],
  );

  return {
    movements: data.movements,
    pagination: data.pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    reload,
    refresh,
    createMovement,
  };
}
