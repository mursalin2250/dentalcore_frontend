import { useEffect, useState } from "react";
import { MagnifyingGlass, Plus, Stethoscope, WarningCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SelectField from "@/components/ui/SelectField";
import { INPUT_CLASS } from "@/components/ui/TextField";
import StatCard from "@/features/dashboard/StatCard";
import {
  DOCTOR_DIALOGS,
  DOCTOR_MESSAGES,
  DOCTOR_STAT_CARDS,
  DOCTOR_TEXT,
  SEARCH_DEBOUNCE_MS,
  SPECIALTY_FILTER_ALL,
} from "@/constants/doctors";
import { ROUTES } from "@/constants/routes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatNumber } from "@/lib/format";
import DoctorFormDialog from "./DoctorFormDialog";
import { useDoctors } from "./useDoctors";

export default function DoctorsPage() {
  usePageTitle(DOCTOR_TEXT.LIST_TITLE);

  const [query, setQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState(SPECIALTY_FILTER_ALL);
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();

  const {
    doctors,
    specialties,
    pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    reload,
    addDoctor,
  } = useDoctors({ search, specialty: specialtyFilter, page });

  const [dialog, setDialog] = useState({ type: null });
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!isLoading && page > pagination.totalPages) setPage(pagination.totalPages);
  }, [isLoading, page, pagination.totalPages]);

  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
  };
  const changeSpecialty = (value) => {
    setSpecialtyFilter(value);
    setPage(1);
  };
  const clearFilters = () => {
    changeQuery("");
    changeSpecialty(SPECIALTY_FILTER_ALL);
  };

  const specialtyOptions = [
    { value: SPECIALTY_FILTER_ALL, label: DOCTOR_TEXT.SPECIALTY_FILTER },
    ...specialties.map((value) => ({ value, label: value })),
  ];

  const handleAdd = async (values) => {
    await addDoctor(values);
    setAnnouncement(DOCTOR_MESSAGES.ADDED(values.name.trim()));
    setDialog({ type: null });
  };

  const hasFilters = Boolean(search) || specialtyFilter !== SPECIALTY_FILTER_ALL;

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{DOCTOR_TEXT.LIST_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{DOCTOR_TEXT.LIST_DESCRIPTION}</p>
        </div>
        <Button onClick={() => setDialog({ type: DOCTOR_DIALOGS.ADD })}>
          <Plus /> {DOCTOR_TEXT.ADD}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DOCTOR_STAT_CARDS.map((card, i) => (
          <StatCard
            key={card.key}
            index={i + 1}
            label={card.label}
            icon={card.icon}
            tone={card.tone}
            isLoading={statsLoading}
            value={stats ? formatNumber(stats[card.key] ?? 0) : undefined}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor="doctor-search" className="sr-only">
            {DOCTOR_TEXT.SEARCH_LABEL}
          </label>
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="doctor-search"
            type="search"
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder={DOCTOR_TEXT.SEARCH_PLACEHOLDER}
            className={`${INPUT_CLASS} pl-9`}
          />
        </div>
        <SelectField
          label=""
          hideLabel
          options={specialtyOptions}
          value={specialtyFilter}
          onChange={(e) => changeSpecialty(e.target.value)}
          className="w-full sm:w-52"
        />
        {hasFilters && (
          <Button variant="secondary" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <EmptyState
            icon={WarningCircle}
            title="Could not load doctors"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
            }
          />
        </div>
      )}

      {!error && isLoading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl border border-border bg-surface-muted/40"
            />
          ))}
        </div>
      )}

      {!error && !isLoading && doctors.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Stethoscope}
            title={hasFilters ? DOCTOR_TEXT.EMPTY_FILTER_TITLE : DOCTOR_TEXT.EMPTY_TITLE}
            description={
              hasFilters ? DOCTOR_TEXT.EMPTY_FILTER_DESCRIPTION : DOCTOR_TEXT.EMPTY_DESCRIPTION
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setDialog({ type: DOCTOR_DIALOGS.ADD })}>
                  <Plus /> {DOCTOR_TEXT.ADD}
                </Button>
              )
            }
          />
        </div>
      )}

      {!error && !isLoading && doctors.length > 0 && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doctor) => (
              <article
                key={doctor.id}
                className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex flex-col items-center text-center">
                  <Avatar
                    name={doctor.name}
                    src={doctor.avatarUrl}
                    className="size-20 text-lg"
                  />
                  <h2 className="mt-3 text-base font-semibold tracking-tight">{doctor.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[doctor.title, doctor.specialty].filter(Boolean).join(" · ") || "Doctor"}
                  </p>
                  {doctor.phone && (
                    <p className="mt-2 text-sm tabular-nums text-muted-foreground">{doctor.phone}</p>
                  )}
                </div>
                <Link
                  to={ROUTES.DOCTOR_DETAILS.replace(":id", doctor.id)}
                  className="mt-5 block w-full"
                >
                  <Button variant="secondary" className="w-full">
                    {DOCTOR_TEXT.VIEW_PROFILE}
                  </Button>
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-6">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              itemLabel="doctors"
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <DoctorFormDialog
        open={dialog.type === DOCTOR_DIALOGS.ADD}
        onSubmit={handleAdd}
        onClose={() => setDialog({ type: null })}
      />

      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
