import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS } from "@/constants/api";
import {
  DOCTOR_DIALOGS,
  DOCTOR_MESSAGES,
  DOCTOR_PATIENTS_PAGE_SIZE,
  DOCTOR_TEXT,
  SEARCH_DEBOUNCE_MS,
} from "@/constants/doctors";
import {
  PATIENT_STATUS_LABELS,
  PATIENT_STATUS_TONES,
} from "@/constants/patients";
import { ROUTES } from "@/constants/routes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import DoctorFormDialog from "./DoctorFormDialog";
import { useDoctor } from "./useDoctors";

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="w-36 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function OverviewStat({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-lg bg-surface-muted/60 px-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-semibold tabular-nums">{formatNumber(value ?? 0)}</span>
    </div>
  );
}

function formatAddress(address) {
  if (!address) return "";
  return [address.street, address.city, address.district, address.postalCode]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(", ");
}

function useDoctorPatients(doctorId) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();
  const [data, setData] = useState({
    patients: [],
    pagination: { page: 1, limit: DOCTOR_PATIENTS_PAGE_SIZE, total: 0, totalPages: 1 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (!doctorId) return undefined;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(DOCTOR_PATIENTS_PAGE_SIZE),
    });
    if (search) params.set("search", search);

    api(`${API_ENDPOINTS.doctorPatients(doctorId)}?${params}`, { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [doctorId, page, search, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    query,
    setQuery,
    page,
    setPage,
    patients: data.patients || [],
    pagination: data.pagination || {
      page: 1,
      limit: DOCTOR_PATIENTS_PAGE_SIZE,
      total: 0,
      totalPages: 1,
    },
    isLoading,
    error,
    reload,
  };
}

export default function DoctorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, reload, updateDoctor, removeDoctor } = useDoctor(id);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const patientsState = useDoctorPatients(id);
  const [dialog, setDialog] = useState({ type: null });
  const [announcement, setAnnouncement] = useState("");

  const doctor = data?.doctor;
  usePageTitle(doctor?.name || DOCTOR_TEXT.DETAILS_TITLE);

  const handleEdit = async (values) => {
    await updateDoctor(values);
    setAnnouncement(DOCTOR_MESSAGES.UPDATED(values.name.trim()));
    setDialog({ type: null });
  };

  const handleDelete = async () => {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      await removeDoctor();
      setAnnouncement(DOCTOR_MESSAGES.DELETED(doctor?.name || "Doctor"));
      navigate(ROUTES.DOCTORS);
    } catch (err) {
      setDeleteError(err.message || "Could not delete doctor.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading) return <PageLoader />;

  if (error || !doctor) {
    return (
      <div className="py-4">
        <EmptyState
          icon={WarningCircle}
          title="Could not load doctor"
          description={error?.message || "Doctor not found."}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
              <Link to={ROUTES.DOCTORS}>
                <Button variant="secondary">Back to list</Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const overview = data.overview || {
    patientsTreated: 0,
    inTreatment: 0,
    appointmentsToday: 0,
    patientsAssigned: 0,
  };

  const addressLine = formatAddress(doctor.address);
  const education = Array.isArray(doctor.education) ? doctor.education : [];
  const certifications = Array.isArray(doctor.certifications) ? doctor.certifications : [];

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            to={ROUTES.DOCTORS}
            className="mt-1 grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Back to doctors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={doctor.name} src={doctor.avatarUrl} className="size-14 text-lg" />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{doctor.name}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {[doctor.title, doctor.specialty].filter(Boolean).join(" · ") || "Doctor"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialog({ type: DOCTOR_DIALOGS.EDIT })}>{DOCTOR_TEXT.EDIT}</Button>
          <Button
            variant="danger"
            onClick={() => {
              setDeleteError("");
              setDialog({ type: DOCTOR_DIALOGS.DELETE });
            }}
          >
            {DOCTOR_TEXT.DELETE}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">Profile</h2>
          <dl className="mt-4 space-y-3">
            <InfoRow label={DOCTOR_TEXT.DESIGNATION} value={doctor.title} />
            <InfoRow label={DOCTOR_TEXT.SPECIALTY} value={doctor.specialty} />
            <InfoRow label={DOCTOR_TEXT.PHONE} value={doctor.phone} />
            <InfoRow label={DOCTOR_TEXT.EMAIL} value={doctor.email} />
            <InfoRow label={DOCTOR_TEXT.ADDRESS} value={addressLine || DOCTOR_TEXT.NO_ADDRESS} />
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold tracking-tight">{DOCTOR_TEXT.OVERVIEW}</h2>
          <div className="mt-4 grid gap-3">
            <OverviewStat label={DOCTOR_TEXT.PATIENTS_TREATED} value={overview.patientsTreated} />
            <OverviewStat label={DOCTOR_TEXT.IN_TREATMENT} value={overview.inTreatment} />
            <OverviewStat label={DOCTOR_TEXT.APPOINTMENTS_TODAY} value={overview.appointmentsToday} />
            <OverviewStat label={DOCTOR_TEXT.PATIENTS_ASSIGNED} value={overview.patientsAssigned} />
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold tracking-tight">{DOCTOR_TEXT.EDUCATION}</h2>
          {education.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{DOCTOR_TEXT.NO_EDUCATION}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {education.map((item, i) => (
                <li key={i} className="rounded-lg bg-surface-muted/50 px-3 py-2.5">
                  <p className="text-sm font-medium">
                    {[item.degree, item.fieldOfStudy].filter(Boolean).join(" · ") || "Education"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[item.institution, item.completionYear].filter(Boolean).join(" · ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold tracking-tight">{DOCTOR_TEXT.CERTIFICATIONS}</h2>
          {certifications.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{DOCTOR_TEXT.NO_CERTIFICATIONS}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {certifications.map((item, i) => (
                <li key={i} className="rounded-lg bg-surface-muted/50 px-3 py-2.5">
                  <p className="text-sm font-medium">{item.title || "Certification"}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[
                      item.issuingBody,
                      item.issueYear,
                      item.expiryYear ? `expires ${item.expiryYear}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{DOCTOR_TEXT.CURRENT_PATIENTS}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatNumber(overview.patientsAssigned)} assigned
            </p>
          </div>
          <div className="relative min-w-0 w-full sm:max-w-xs">
            <label htmlFor="doctor-patient-search" className="sr-only">
              {DOCTOR_TEXT.PATIENTS_SEARCH}
            </label>
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="doctor-patient-search"
              type="search"
              value={patientsState.query}
              onChange={(e) => patientsState.setQuery(e.target.value)}
              placeholder={DOCTOR_TEXT.PATIENTS_SEARCH_PLACEHOLDER}
              className={`${INPUT_CLASS} border-border pl-9`}
            />
          </div>
        </div>

        {patientsState.error && (
          <div className="mt-4">
            <EmptyState
              icon={WarningCircle}
              title="Could not load patients"
              description={patientsState.error.message}
              action={
                <Button variant="secondary" onClick={patientsState.reload}>
                  Try again
                </Button>
              }
            />
          </div>
        )}

        {!patientsState.error && patientsState.isLoading && (
          <div className="mt-4 space-y-3" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 border-t border-border pt-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!patientsState.error && !patientsState.isLoading && patientsState.patients.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">{DOCTOR_TEXT.NO_PATIENTS}</p>
        )}

        {!patientsState.error && !patientsState.isLoading && patientsState.patients.length > 0 && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">{DOCTOR_TEXT.PROBLEM}</th>
                    <th className="py-2 pr-3 font-medium">{DOCTOR_TEXT.TREATMENT}</th>
                    <th className="py-2 pr-3 font-medium tabular-nums">{DOCTOR_TEXT.COMPLETED_VISITS}</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patientsState.patients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="py-2.5 pr-3">
                        <Link
                          to={ROUTES.PATIENT_DETAILS.replace(":id", patient.id)}
                          className="font-medium text-primary hover:underline"
                        >
                          {patient.name}
                        </Link>
                      </td>
                      <td className="max-w-[10rem] truncate py-2.5 pr-3 text-muted-foreground">
                        {patient.problem || "—"}
                      </td>
                      <td className="max-w-[10rem] truncate py-2.5 pr-3 text-muted-foreground">
                        {patient.treatment || "—"}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {formatNumber(patient.completedVisits ?? 0)}
                      </td>
                      <td className="py-2.5">
                        <Badge tone={PATIENT_STATUS_TONES[patient.status] || "neutral"}>
                          {PATIENT_STATUS_LABELS[patient.status] || patient.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {patientsState.pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  page={patientsState.page}
                  totalPages={patientsState.pagination.totalPages}
                  onChange={patientsState.setPage}
                />
              </div>
            )}
          </>
        )}
      </section>

      <DoctorFormDialog
        open={dialog.type === DOCTOR_DIALOGS.EDIT}
        doctor={doctor}
        onSubmit={handleEdit}
        onClose={() => setDialog({ type: null })}
      />

      <ConfirmDialog
        open={dialog.type === DOCTOR_DIALOGS.DELETE}
        onClose={() => setDialog({ type: null })}
        onConfirm={handleDelete}
        title={DOCTOR_TEXT.DELETE}
        description={DOCTOR_MESSAGES.DELETE_DESCRIPTION}
        confirmLabel={DOCTOR_TEXT.DELETE}
        loading={deleteLoading}
        error={deleteError}
      />

      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
