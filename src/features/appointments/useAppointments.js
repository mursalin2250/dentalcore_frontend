import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { APPOINTMENT_PAGE_SIZE, DOCTOR_FILTER_ALL, STATUS_FILTER_ALL } from "@/constants/appointments";
import { api } from "@/lib/api";

const EMPTY_LIST = {
  appointments: [],
  pagination: { page: 1, limit: APPOINTMENT_PAGE_SIZE, total: 0, totalPages: 1 },
};
const EMPTY_STATS = { todayTotal: 0, pending: 0, completed: 0, doctorsPresentToday: 0 };

export function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
}

export function monthKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
  })
    .format(date)
    .slice(0, 7);
}

export function useAppointmentStats(date) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setIsLoading(true);
    setError(null);
    api(API_ENDPOINTS.APPOINTMENTS_STATS, { params: { date: date || todayKey() }, signal: c.signal })
      .then(setStats)
      .catch((e) => { if (e.name !== "AbortError") setError(e); })
      .finally(() => { if (!c.signal.aborted) setIsLoading(false); });
    return () => c.abort();
  }, [date, reloadKey]);
  return { stats, isLoading, error, reload: useCallback(() => setReloadKey((k) => k + 1), []) };
}

export function useAppointmentCalendar(month) {
  const [days, setDays] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    if (!month) return undefined;
    const c = new AbortController();
    setIsLoading(true);
    setError(null);
    api(API_ENDPOINTS.APPOINTMENTS_CALENDAR, { params: { month }, signal: c.signal })
      .then((d) => setDays(d.days || {}))
      .catch((e) => { if (e.name !== "AbortError") setError(e); })
      .finally(() => { if (!c.signal.aborted) setIsLoading(false); });
    return () => c.abort();
  }, [month, reloadKey]);
  return { days, isLoading, error, reload: useCallback(() => setReloadKey((k) => k + 1), []) };
}

export function useAppointments({ search, status, doctor, from, to, page }) {
  const [data, setData] = useState(EMPTY_LIST);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const silent = useRef(false);
  useEffect(() => {
    const c = new AbortController();
    if (!silent.current) setIsLoading(true);
    silent.current = false;
    setError(null);
    api(API_ENDPOINTS.APPOINTMENTS, {
      params: {
        search: search || undefined,
        status: status === STATUS_FILTER_ALL ? undefined : status,
        doctor: doctor === DOCTOR_FILTER_ALL ? undefined : doctor,
        from: from || undefined,
        to: to || undefined,
        page,
        limit: APPOINTMENT_PAGE_SIZE,
        sort: "startsAt",
      },
      signal: c.signal,
    })
      .then(setData)
      .catch((e) => { if (e.name !== "AbortError") setError(e); })
      .finally(() => { if (!c.signal.aborted) setIsLoading(false); });
    return () => c.abort();
  }, [search, status, doctor, from, to, page, reloadKey]);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const refresh = useCallback(() => { silent.current = true; reload(); }, [reload]);
  const createAppointment = useCallback(async (values) => {
    const r = await api(API_ENDPOINTS.APPOINTMENTS, { method: HTTP_METHODS.POST, body: values });
    refresh();
    return r;
  }, [refresh]);
  const updateAppointment = useCallback(async (id, values) => {
    const r = await api(API_ENDPOINTS.appointment(id), { method: HTTP_METHODS.PATCH, body: values });
    refresh();
    return r;
  }, [refresh]);
  const removeAppointment = useCallback(async (id) => {
    await api(API_ENDPOINTS.appointment(id), { method: HTTP_METHODS.DELETE });
    refresh();
  }, [refresh]);
  const addNote = useCallback(async (id, text) => {
    const r = await api(API_ENDPOINTS.appointmentNotes(id), { method: HTTP_METHODS.POST, body: { text } });
    refresh();
    return r;
  }, [refresh]);
  return {
    appointments: data.appointments,
    pagination: data.pagination,
    isLoading,
    error,
    reload,
    refresh,
    createAppointment,
    updateAppointment,
    removeAppointment,
    addNote,
  };
}

export function useDayAppointments(dateKey) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    if (!dateKey) return undefined;
    const c = new AbortController();
    setIsLoading(true);
    setError(null);
    const from = `${dateKey}T00:00:00+06:00`;
    const toDate = new Date(`${dateKey}T00:00:00+06:00`);
    toDate.setDate(toDate.getDate() + 1);
    api(API_ENDPOINTS.APPOINTMENTS, {
      params: { from, to: toDate.toISOString(), limit: 50, sort: "startsAt" },
      signal: c.signal,
    })
      .then((d) => setItems(d.appointments || []))
      .catch((e) => { if (e.name !== "AbortError") setError(e); })
      .finally(() => { if (!c.signal.aborted) setIsLoading(false); });
    return () => c.abort();
  }, [dateKey, reloadKey]);
  return { items, isLoading, error, reload: useCallback(() => setReloadKey((k) => k + 1), []) };
}
