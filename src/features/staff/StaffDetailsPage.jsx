import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { WarningCircle } from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import SelectField from "@/components/ui/SelectField";
import Skeleton from "@/components/ui/Skeleton";
import TextField, { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { CURRENCY } from "@/constants/locale";
import { ROUTES } from "@/constants/routes";
import {
  ATTENDANCE_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  STAFF_ROLE_LABELS,
  STAFF_STATUS_LABELS,
  STAFF_STATUS_TONES,
  TODAY_STATUS_LABELS,
  WEEKDAY_LABELS,
} from "@/constants/staff";
import StaffFormDialog from "@/features/staff/StaffFormDialog";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatMoney, formatShortDate } from "@/lib/format";

function monthKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit" }).format(d).slice(0, 7);
}

export default function StaffDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  usePageTitle("Staff details");
  const [tab, setTab] = useState("overview");
  const [staff, setStaff] = useState(null);
  const [month, setMonth] = useState(monthKey());
  const [attendance, setAttendance] = useState(null);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dayDialog, setDayDialog] = useState(null);
  const [dayForm, setDayForm] = useState({ status: "present", leaveType: "paid", checkIn: "", checkOut: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api(API_ENDPOINTS.staff(id), { signal: c.signal })
      .then((d) => setStaff(d.staff))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [id, reloadKey]);

  useEffect(() => {
    if (!id) return undefined;
    const c = new AbortController();
    Promise.all([
      api(API_ENDPOINTS.staffAttendance(id), { params: { month }, signal: c.signal }),
      api(API_ENDPOINTS.staffSalary(id), { params: { month }, signal: c.signal }),
    ])
      .then(([att, sal]) => {
        setAttendance(att);
        setSalary(sal.salary);
      })
      .catch(() => {});
    return () => c.abort();
  }, [id, month, reloadKey]);

  const daysInMonth = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const last = new Date(y, m, 0).getDate();
    const map = Object.fromEntries((attendance?.records || []).map((r) => [r.date, r]));
    const working = staff?.shift?.workingDays || [];
    const items = [];
    for (let d = 1; d <= last; d += 1) {
      const key = `${month}-${String(d).padStart(2, "0")}`;
      const wd = new Date(y, m - 1, d).getDay();
      const rec = map[key];
      let status = "unmarked";
      if (!working.includes(wd)) status = "weekly_off";
      else if (rec) status = rec.status;
      items.push({ date: key, day: d, weekday: wd, status, record: rec });
    }
    return items;
  }, [month, attendance, staff]);

  const saveDay = async () => {
    if (!dayDialog) return;
    setSaving(true);
    setFormError("");
    try {
      await api(API_ENDPOINTS.staffAttendanceDay(id, dayDialog), {
        method: "PUT",
        body: {
          status: dayForm.status,
          leaveType: dayForm.status === "on_leave" ? dayForm.leaveType : undefined,
          checkIn: dayForm.checkIn,
          checkOut: dayForm.checkOut,
          note: dayForm.note,
        },
      });
      setDayDialog(null);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setFormError(e.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-6" aria-busy="true">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="py-6">
        <EmptyState
          icon={WarningCircle}
          title="Could not load staff"
          description={error?.message || "Not found"}
          action={
            <Link to={ROUTES.STAFF} className="text-primary hover:underline">
              Back to staff
            </Link>
          }
        />
      </div>
    );
  }

  const statusColor = {
    present: "bg-success/20 text-success",
    late: "bg-warning/20 text-warning",
    half_day: "bg-warning/20 text-warning",
    absent: "bg-danger/20 text-danger",
    on_leave: "bg-info/20 text-info",
    weekly_off: "bg-surface-muted text-muted-foreground",
    unmarked: "bg-surface-muted text-muted-foreground",
  };

  return (
    <div className="py-4">
      <p className="text-sm text-muted-foreground">
        <Link to={ROUTES.STAFF} className="text-primary hover:underline">
          Staff
        </Link>
        <span> / </span>
        {staff.name}
      </p>

      <div className="mt-4 rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary-soft text-lg font-semibold text-primary">
              {(staff.name || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{staff.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {staff.employeeId}
                {staff.designation ? ` · ${staff.designation}` : ""}
                {staff.staffRole ? ` · ${STAFF_ROLE_LABELS[staff.staffRole] || staff.staffRole}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={STAFF_STATUS_TONES[staff.status] || "neutral"}>
                  {STAFF_STATUS_LABELS[staff.status] || staff.status}
                </Badge>
                {staff.todayStatus && (
                  <Badge tone="neutral">{TODAY_STATUS_LABELS[staff.todayStatus] || staff.todayStatus}</Badge>
                )}
              </div>
              <div className="mt-3 space-y-0.5 text-sm text-muted-foreground">
                <p>{staff.phone || "No phone"}{staff.email ? ` · ${staff.email}` : ""}</p>
                <p className="capitalize">
                  {(staff.shift?.name || "—")} shift
                  {staff.shift?.startTime ? ` · ${staff.shift.startTime}–${staff.shift.endTime}` : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-1 rounded-lg border border-border p-1">
        {["overview", "attendance", "salary"].map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
            <h2 className="font-semibold">Employment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Joined</dt><dd>{staff.dateOfJoining ? formatShortDate(staff.dateOfJoining) : "—"}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Type</dt><dd className="capitalize">{String(staff.employmentType || "").replace("_", " ")}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Department</dt><dd>{staff.department || "—"}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Base salary</dt><dd className="tabular-nums">{formatMoney(staff.baseSalary, CURRENCY)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Employee type</dt><dd className="capitalize">{staff.staffRole || "other"}</dd></div>
              {staff.status === "on_leave" && (
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Leave days</dt><dd className="tabular-nums">{staff.leaveDays ?? 0}</dd></div>
              )}
            </dl>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
            <h2 className="font-semibold">Contact</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Address</dt><dd className="text-right">{staff.address || "—"}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Emergency</dt><dd className="text-right">{staff.emergencyContact?.name || "—"} {staff.emergencyContact?.phone ? `· ${staff.emergencyContact.phone}` : ""}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Working days</dt><dd>{(staff.shift?.workingDays || []).map((d) => WEEKDAY_LABELS[d]).join(", ") || "—"}</dd></div>
            </dl>
            {staff.notes && <p className="mt-3 text-sm text-muted-foreground">{staff.notes}</p>}
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Month</label>
            <input type="month" className={`${INPUT_CLASS} border-border w-44`} value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAY_LABELS.map((l) => (
              <div key={l} className="text-center text-xs font-medium text-muted-foreground">
                {l}
              </div>
            ))}
            {Array.from({ length: daysInMonth[0]?.weekday || 0 }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {daysInMonth.map((d) => (
              <button
                key={d.date}
                type="button"
                disabled={d.status === "weekly_off"}
                onClick={() => {
                  if (d.status === "weekly_off") return;
                  setDayForm({
                    status: d.record?.status || "present",
                    leaveType: d.record?.leaveType || "paid",
                    checkIn: d.record?.checkIn || "",
                    checkOut: d.record?.checkOut || "",
                    note: d.record?.note || "",
                  });
                  setDayDialog(d.date);
                }}
                className={`rounded-lg p-2 text-center text-sm ${statusColor[d.status] || ""} ${d.status === "weekly_off" ? "cursor-default opacity-60" : "hover:ring-2 hover:ring-primary/40"}`}
              >
                <div className="font-medium tabular-nums">{d.day}</div>
                <div className="mt-0.5 text-[10px] leading-tight">{TODAY_STATUS_LABELS[d.status] || d.status}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "salary" && salary && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Month</label>
            <input type="month" className={`${INPUT_CLASS} border-border w-44`} value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Base salary", salary.baseSalary],
              ["Earned so far", salary.earnedToDate],
              ["Deductions", salary.deductions],
              ["Projected total", salary.projectedMonthTotal],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-surface p-4 shadow-card">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(value, CURRENCY)}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm shadow-card">
            <p>
              Daily rate: <span className="font-medium tabular-nums">{formatMoney(salary.dailyRate, CURRENCY)}</span>
            </p>
            <p className="mt-1">
              Payable days: <span className="font-medium tabular-nums">{salary.payableDays}</span> · Unmarked:{" "}
              <span className="font-medium tabular-nums">{salary.unmarkedDays}</span>
            </p>
            <p className="mt-2 text-muted-foreground">Unmarked days are not paid until attendance is recorded.</p>
          </div>
        </div>
      )}

      <Dialog open={Boolean(dayDialog)} onClose={() => setDayDialog(null)} title={`Attendance · ${dayDialog || ""}`} className="max-w-md">
        <div className="space-y-3">
          <SelectField
            label="Status"
            options={ATTENDANCE_STATUS_OPTIONS}
            value={dayForm.status}
            onChange={(e) => setDayForm((f) => ({ ...f, status: e.target.value }))}
          />
          {dayForm.status === "on_leave" && (
            <SelectField
              label="Leave type"
              options={LEAVE_TYPE_OPTIONS}
              value={dayForm.leaveType}
              onChange={(e) => setDayForm((f) => ({ ...f, leaveType: e.target.value }))}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Check in" value={dayForm.checkIn} onChange={(e) => setDayForm((f) => ({ ...f, checkIn: e.target.value }))} placeholder="09:00" />
            <TextField label="Check out" value={dayForm.checkOut} onChange={(e) => setDayForm((f) => ({ ...f, checkOut: e.target.value }))} placeholder="17:00" />
          </div>
          <TextField label="Note" value={dayForm.note} onChange={(e) => setDayForm((f) => ({ ...f, note: e.target.value }))} />
          {formError && <FormError>{formError}</FormError>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDayDialog(null)}>
              Cancel
            </Button>
            <Button type="button" loading={saving} onClick={saveDay}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>
      <StaffFormDialog
        open={editOpen}
        staff={staff}
        onClose={() => setEditOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Remove staff member?"
        description={`${staff.name} will be archived if they have attendance history, or removed completely.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await api(API_ENDPOINTS.staff(staff.id), { method: HTTP_METHODS.DELETE });
            navigate(ROUTES.STAFF);
          } catch (e) {
            setFormError(e.message || "Could not delete.");
            setDeleteOpen(false);
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}

