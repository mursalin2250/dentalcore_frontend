import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { FILTER_ALL, INVOICE_PAGE_SIZE } from "@/constants/billing";
import { api } from "@/lib/api";

const EMPTY_LIST = {
  invoices: [],
  pagination: { page: 1, limit: INVOICE_PAGE_SIZE, total: 0, totalPages: 1 },
};
const EMPTY_STATS = {
  total: 0,
  pending: 0,
  paid: 0,
  overdue: 0,
  cancelled: 0,
  outstanding: 0,
  collected: 0,
};

export function useInvoices({ search, status, page }) {
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
    api(API_ENDPOINTS.INVOICES, {
      params: {
        search: search || undefined,
        status: status === FILTER_ALL ? undefined : status,
        page,
        limit: INVOICE_PAGE_SIZE,
        sort: "-updatedAt",
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
  }, [search, status, page, reloadKey]);

  useEffect(() => {
    const c = new AbortController();
    setStatsLoading(true);
    api(API_ENDPOINTS.INVOICES_STATS, { signal: c.signal })
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

  const createInvoice = useCallback(
    async (values) => {
      const r = await api(API_ENDPOINTS.INVOICES, { method: HTTP_METHODS.POST, body: values });
      refresh();
      return r;
    },
    [refresh],
  );
  const updateInvoice = useCallback(
    async (id, values) => {
      const r = await api(API_ENDPOINTS.invoice(id), { method: HTTP_METHODS.PATCH, body: values });
      refresh();
      return r;
    },
    [refresh],
  );
  const addPayment = useCallback(
    async (id, values) => {
      const r = await api(API_ENDPOINTS.invoicePayments(id), { method: HTTP_METHODS.POST, body: values });
      refresh();
      return r;
    },
    [refresh],
  );
  const removeInvoice = useCallback(
    async (id) => {
      const r = await api(API_ENDPOINTS.invoice(id), { method: HTTP_METHODS.DELETE });
      refresh();
      return r;
    },
    [refresh],
  );

  return {
    invoices: data.invoices,
    pagination: data.pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    reload,
    refresh,
    createInvoice,
    updateInvoice,
    addPayment,
    removeInvoice,
  };
}
