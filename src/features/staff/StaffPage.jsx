import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Plus, UsersThree, WarningCircle } from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DateField from "@/components/ui/DateField";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import Pagination from "@/components/ui/Pagination";
import SelectField from "@/components/ui/SelectField";
import Skeleton from "@/components/ui/Skeleton";
import { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { CURRENCY } from "@/constants/locale";
import { ROUTES } from "@/constants/routes";
import {
  ATTENDANCE_STATUS_OPTIONS,
  SHIFT_OPTIONS,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_OPTIONS,
  STAFF_STATUS_LABELS,
  STAFF_STATUS_TONES,
  TODAY_STATUS_LABELS,
  TODAY_STATUS_TONES,
} from "@/constants/staff";
import StatCard from "@/features/dashboard/StatCard";
import StaffFormDialog from "@/features/staff/StaffFormDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

const STATUS_FILTER = [{ value: "", label: "All statuses" }, ...Object.entries(STAFF_STATUS_LABELS).map(([value, label]) => ({ value, label }))];
const ROLE_FILTER = [{ value: "", label: "All types" }, ...STAFF_ROLE_OPTIONS];
const SHIFT_FILTER = [{ value: "", label: "All shifts" }, ...SHIFT_OPTIONS];
const ATTENDANCE_MARK_OPTIONS = ATTENDANCE_STATUS_OPTIONS.filter((o) => o.value !== "on_leave");
const LEAVE_TYPE_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];


function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
}

function MarkAttendanceDialog({ open, onClose, onSaved }) {
  const [date, setDate] = useState(todayKey);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(todayKey());
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open || !date) return undefined;
    const c = new AbortController();
    setLoading(true);
    setError("");
    api(API_ENDPOINTS.STAFF, {
      params: { limit: 100, page: 1, date, status: "active" },
      signal: c.signal,
    })
      .then((data) => {
        const list = data.staff || [];
        setRows(
          list
            .filter((s) => s.todayStatus !== "weekly_off" && s.todayStatus !== "on_leave")
            .map((s) => ({
              staffId: s.id,
              name: s.name,
              status: ["present", "late", "half_day", "absent"].includes(s.todayStatus)
                ? s.todayStatus
                : "present",
            })),
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message || "Could not load staff.");
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [open, date]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api(API_ENDPOINTS.STAFF_ATTENDANCE_BULK, {
        method: HTTP_METHODS.POST,
        body: {
          date,
          records: rows.map((r) => ({
            staffId: r.staffId,
            status: r.status,
          })),
        },
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <Dialog open={open} onClose={onClose} title="Mark today's attendance" className="max-w-lg">
      <div className="space-y-3">
        <DateField label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="max-h-[60vh] space-y-1 overflow-y-auto rounded-lg border border-border">
          {loading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {!loading && rows.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Everyone is already marked or off for this date.</p>
          )}
          {!loading &&
            rows.map((r, i) => (
              <div
                key={r.staffId}
                className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
              >
                <span className="min-w-[8rem] flex-1 text-sm font-medium">{r.name}</span>
                <select
                  className={`${INPUT_CLASS} border-border w-40 appearance-none`}
                  value={r.status}
                  onChange={(e) =>
                    setRows((prev) => prev.map((x, j) => (j === i ? { ...x, status: e.target.value } : x)))
                  }
                >
                  {ATTENDANCE_MARK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
        </div>
        {error && <FormError>{error}</FormError>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" loading={saving} disabled={!rows.length || loading} onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function RecordLeaveDialog({ open, onClose, onSaved }) {
  const [staffOptions, setStaffOptions] = useState([{ value: "", label: "Select staff" }]);
  const [staffId, setStaffId] = useState("");
  const [from, setFrom] = useState(todayKey());
  const [to, setTo] = useState(todayKey());
  const [leaveType, setLeaveType] = useState("paid");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    setStaffId("");
    setFrom(todayKey());
    setTo(todayKey());
    setLeaveType("paid");
    setError("");
    const c = new AbortController();
    api(API_ENDPOINTS.STAFF, { params: { limit: 100, status: "active" }, signal: c.signal })
      .then((data) => {
        setStaffOptions([
          { value: "", label: "Select staff" },
          ...(data.staff || []).map((s) => ({ value: s.id, label: s.name })),
        ]);
      })
      .catch(() => {});
    return () => c.abort();
  }, [open]);

  const save = async () => {
    setError("");
    if (!staffId) {
      setError("Select a staff member.");
      return;
    }
    if (!from || !to) {
      setError("Choose leave from and to dates.");
      return;
    }
    if (to < from) {
      setError("Leave end must be on or after the start date.");
      return;
    }
    setSaving(true);
    try {
      await api(API_ENDPOINTS.STAFF_LEAVE, {
        method: HTTP_METHODS.POST,
        body: { staffId, from, to, leaveType },
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || "Could not record leave.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <Dialog open={open} onClose={onClose} title="Record leave" className="max-w-md">
      <div className="space-y-3">
        <SelectField
          label="Staff"
          options={staffOptions}
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <DateField label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
          <DateField label="To" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <SelectField
          label="Leave type"
          options={LEAVE_TYPE_OPTIONS}
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
        />
        {error && <FormError>{error}</FormError>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" loading={saving} onClick={save}>
            Record leave
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default function StaffPage() {
  usePageTitle("Staff");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [shift, setShift] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const search = useDebouncedValue(query, 300).trim();

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      api(API_ENDPOINTS.STAFF, {
        params: {
          search: search || undefined,
          status: status || undefined,
          staffRole: staffRole || undefined,
          shift: shift || undefined,
          page,
          limit: 12,
        },
        signal: c.signal,
      }),
      api(API_ENDPOINTS.STAFF_STATS, { signal: c.signal }),
    ])
      .then(([list, st]) => {
        setRows(list.staff || []);
        setPagination(list.pagination || { page: 1, pages: 1, total: 0 });
        setStats(st);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [search, status, staffRole, shift, page, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">Clinic employees, attendance and salary.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setMarkOpen(true)}>
            Mark today&apos;s attendance
          </Button>
          <Button variant="secondary" onClick={() => setLeaveOpen(true)}>
            Record leave
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" /> Add staff
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={1} label="Total staff" icon={UsersThree} isLoading={!stats} value={stats ? String(stats.totalStaff) : undefined} />
        <StatCard index={2} label="Present today" icon={UsersThree} tone="success" isLoading={!stats} value={stats ? String(stats.presentToday) : undefined} />
        <StatCard index={3} label="On leave today" icon={UsersThree} tone="warning" isLoading={!stats} value={stats ? String(stats.onLeaveToday) : undefined} />
        <StatCard index={4} label="Absent today" icon={UsersThree} tone="danger" isLoading={!stats} value={stats ? String(stats.absentToday) : undefined} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-md">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${INPUT_CLASS} border-border pl-9`}
            placeholder="Search name, ID, designation…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <SelectField
          label="Status"
          hideLabel
          className="w-full sm:w-40"
          options={STATUS_FILTER}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        />
        <SelectField
          label="Type"
          hideLabel
          className="w-full sm:w-40"
          options={ROLE_FILTER}
          value={staffRole}
          onChange={(e) => {
            setStaffRole(e.target.value);
            setPage(1);
          }}
        />
        <SelectField
          label="Shift"
          hideLabel
          className="w-full sm:w-40"
          options={SHIFT_FILTER}
          value={shift}
          onChange={(e) => {
            setShift(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error && (
        <div className="mt-6">
          <EmptyState icon={WarningCircle} title="Could not load staff" description={error.message} action={<Button variant="secondary" onClick={reload}>Try again</Button>} />
        </div>
      )}

      {!error && loading && (
        <div className="mt-6 space-y-2" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!error && !loading && rows.length === 0 && (
        <div className="mt-10">
          <EmptyState title="No staff yet" description="Add receptionists, assistants and other clinic staff." action={<Button onClick={() => setFormOpen(true)}><Plus className="size-4" /> Add staff</Button>} />
        </div>
      )}

      {!error && !loading && rows.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Shift</th>
                  <th className="px-4 py-3 font-medium">Today</th>
                  <th className="px-4 py-3 font-medium">Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-surface-muted/60"
                    onClick={() => navigate(ROUTES.STAFF_DETAILS.replace(":id", row.id))}
                  >
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.employeeId}</td>
                    <td className="px-4 py-3">{STAFF_ROLE_LABELS[row.staffRole] || row.staffRole || "—"}</td>
                    <td className="px-4 py-3">{row.designation || "—"}</td>
                    <td className="px-4 py-3 capitalize">{row.shift?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={TODAY_STATUS_TONES[row.todayStatus] || "neutral"}>
                        {TODAY_STATUS_LABELS[row.todayStatus] || row.todayStatus || "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatMoney(row.baseSalary, CURRENCY)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} totalPages={pagination.pages} total={pagination.total} onPageChange={setPage} itemLabel="staff" />
        </>
      )}

      <StaffFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={reload} />
      <MarkAttendanceDialog open={markOpen} onClose={() => setMarkOpen(false)} onSaved={reload} />
      <RecordLeaveDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} onSaved={reload} />
    </div>
  );
}
