import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { DOCTOR_PAGE_SIZE, SPECIALTY_FILTER_ALL } from "@/constants/doctors";
import { api } from "@/lib/api";

const EMPTY_LIST = {
  doctors: [],
  specialties: [],
  pagination: { page: 1, limit: DOCTOR_PAGE_SIZE, total: 0, totalPages: 1 },
};

const EMPTY_STATS = {
  total: 0,
  specialties: 0,
  patientsAssigned: 0,
  appointmentsToday: 0,
};

export function useDoctors({ search, specialty, page }) {
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

    api(API_ENDPOINTS.DOCTORS, {
      params: {
        search,
        specialty: specialty === SPECIALTY_FILTER_ALL ? undefined : specialty,
        page,
        limit: DOCTOR_PAGE_SIZE,
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
  }, [search, specialty, page, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    setStatsLoading(true);
    api(API_ENDPOINTS.DOCTORS_STATS, { signal: controller.signal })
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

  const addDoctor = useCallback(
    async (values) => {
      await api(API_ENDPOINTS.DOCTORS, { method: HTTP_METHODS.POST, body: values });
      refresh();
    },
    [refresh],
  );

  const updateDoctor = useCallback(
    async (id, values) => {
      const result = await api(API_ENDPOINTS.doctor(id), {
        method: HTTP_METHODS.PATCH,
        body: values,
      });
      refresh();
      return result;
    },
    [refresh],
  );

  const removeDoctor = useCallback(
    async (id) => {
      await api(API_ENDPOINTS.doctor(id), { method: HTTP_METHODS.DELETE });
      refresh();
    },
    [refresh],
  );

  return {
    doctors: data.doctors,
    specialties: data.specialties || [],
    pagination: data.pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    reload,
    addDoctor,
    updateDoctor,
    removeDoctor,
  };
}

export function useDoctor(id) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return undefined;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    api(API_ENDPOINTS.doctor(id), { signal: controller.signal })
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

  const updateDoctor = useCallback(
    async (values) => {
      const result = await api(API_ENDPOINTS.doctor(id), {
        method: HTTP_METHODS.PATCH,
        body: values,
      });
      setData((current) => ({
        ...current,
        doctor: result.doctor,
      }));
      return result;
    },
    [id],
  );

  const removeDoctor = useCallback(async () => {
    await api(API_ENDPOINTS.doctor(id), { method: HTTP_METHODS.DELETE });
  }, [id]);

  return { data, isLoading, error, reload, updateDoctor, removeDoctor };
}
