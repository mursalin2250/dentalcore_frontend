import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { PATIENT_PAGE_SIZE, STATUS_FILTER_ALL } from "@/constants/patients";
import { api } from "@/lib/api";

const EMPTY_LIST = {
  patients: [],
  pagination: { page: 1, limit: PATIENT_PAGE_SIZE, total: 0, totalPages: 1 },
};

const EMPTY_STATS = {
  total: 0,
  newThisMonth: 0,
  inTreatment: 0,
  appointmentsToday: 0,
};

export function usePatients({ search, status, page }) {
  const [data, setData] = useState(EMPTY_LIST);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const silentReload = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    if (!silentReload.current) setIsLoading(true);
    silentReload.current = false;
    setError(null);

    api(API_ENDPOINTS.PATIENTS, {
      params: {
        search,
        status: status === STATUS_FILTER_ALL ? undefined : status,
        page,
        limit: PATIENT_PAGE_SIZE,
      },
      signal: controller.signal,
    })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [search, status, page, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    setStatsLoading(true);
    api(API_ENDPOINTS.PATIENTS_STATS, { signal: controller.signal })
      .then(setStats)
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setStatsLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  const refresh = useCallback(() => {
    silentReload.current = true;
    reload();
  }, [reload]);

  const addPatient = useCallback(
    async (values) => {
      await api(API_ENDPOINTS.PATIENTS, { method: HTTP_METHODS.POST, body: values });
      refresh();
    },
    [refresh],
  );

  const updatePatient = useCallback(
    async (id, values) => {
      const data = await api(API_ENDPOINTS.patient(id), {
        method: HTTP_METHODS.PATCH,
        body: values,
      });
      refresh();
      return data;
    },
    [refresh],
  );

  const removePatient = useCallback(
    async (id) => {
      await api(API_ENDPOINTS.patient(id), { method: HTTP_METHODS.DELETE });
      refresh();
    },
    [refresh],
  );

  const bulkRemovePatients = useCallback(
    async (ids) => {
      await api(API_ENDPOINTS.PATIENTS_BULK_DELETE, {
        method: HTTP_METHODS.POST,
        body: { ids },
      });
      refresh();
    },
    [refresh],
  );

  return {
    ...data,
    stats,
    isLoading,
    statsLoading,
    error,
    reload,
    addPatient,
    updatePatient,
    removePatient,
    bulkRemovePatients,
  };
}

export function usePatient(id) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return undefined;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    api(API_ENDPOINTS.patient(id), { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [id, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const updatePatient = useCallback(
    async (values) => {
      const result = await api(API_ENDPOINTS.patient(id), {
        method: HTTP_METHODS.PATCH,
        body: values,
      });
      setData((current) => ({
        ...current,
        patient: result.patient,
      }));
      return result;
    },
    [id],
  );

  const addPrescription = useCallback(
    async (payload) => {
      const result = await api(API_ENDPOINTS.patientPrescriptions(id), {
        method: HTTP_METHODS.POST,
        body: payload,
      });
      setData((current) => ({
        ...current,
        patient: result.patient,
      }));
      return result;
    },
    [id],
  );

  return { data, isLoading, error, reload, updatePatient, addPrescription };
}
