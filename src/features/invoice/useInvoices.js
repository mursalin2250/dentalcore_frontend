import { useCallback, useEffect, useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { api } from "@/lib/api";

export function useInvoices({ search = "", status = "", page = 1, limit = 12 } = {}) {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, pages: 1 });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const c = new AbortController();
    setIsLoading(true);
    setError(null);
    api(API_ENDPOINTS.INVOICES, {
      params: {
        search: search || undefined,
        status: status && status !== "all" ? status : undefined,
        page,
        limit,
        sort: "-updatedAt",
      },
      signal: c.signal,
    })
      .then((data) => {
        setInvoices(data.invoices || []);
        setPagination(data.pagination || { page, limit, total: 0, pages: 1 });
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) setIsLoading(false);
      });
    return () => c.abort();
  }, [search, status, page, limit, reloadKey]);

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

  const createInvoice = async (body) => {
    const data = await api(API_ENDPOINTS.INVOICES, { method: HTTP_METHODS.POST, body });
    reload();
    return data.invoice;
  };

  const updateInvoice = async (id, body) => {
    const data = await api(API_ENDPOINTS.invoice(id), { method: HTTP_METHODS.PATCH, body });
    reload();
    return data.invoice;
  };

  const deleteInvoice = async (id) => {
    await api(API_ENDPOINTS.invoice(id), { method: HTTP_METHODS.DELETE });
    reload();
  };

  const addPayment = async (id, body) => {
    const data = await api(API_ENDPOINTS.invoicePayments(id), { method: HTTP_METHODS.POST, body });
    reload();
    return data.invoice;
  };

  return {
    invoices,
    pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    reload,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    addPayment,
  };
}
