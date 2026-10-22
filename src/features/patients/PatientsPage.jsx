import { useEffect, useState } from "react";
import { MagnifyingGlass, Plus, Trash, Users, WarningCircle } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SelectField from "@/components/ui/SelectField";
import { INPUT_CLASS } from "@/components/ui/TextField";
import StatCard from "@/features/dashboard/StatCard";
import {
  PATIENT_DIALOGS,
  PATIENT_MESSAGES,
  PATIENT_STAT_CARDS,
  PATIENT_TEXT,
  SEARCH_DEBOUNCE_MS,
  STATUS_FILTER_ALL,
  STATUS_FILTER_OPTIONS,
} from "@/constants/patients";
import { ROUTES } from "@/constants/routes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatNumber } from "@/lib/format";
import PatientFormDialog from "./PatientFormDialog";
import PatientTable from "./PatientTable";
import { usePatients } from "./usePatients";

const NO_REMOVE = { loading: false, error: "" };

export default function PatientsPage() {
  usePageTitle(PATIENT_TEXT.LIST_TITLE);

  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();

  const {
    patients,
    pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    reload,
    addPatient,
    removePatient,
    bulkRemovePatients,
  } = usePatients({ search, status: statusFilter, page });

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [dialog, setDialog] = useState({ type: null, patient: null });
  const [remove, setRemove] = useState(NO_REMOVE);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!isLoading && page > pagination.totalPages) setPage(pagination.totalPages);
  }, [isLoading, page, pagination.totalPages]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, statusFilter, page]);

  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
  };
  const changeStatus = (value) => {
    setStatusFilter(value);
    setPage(1);
  };
  const clearFilters = () => {
    changeQuery("");
    changeStatus(STATUS_FILTER_ALL);
  };

  const toggleOne = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((current) => {
      const pageIds = patients.map((p) => p.id);
      const allOnPage = pageIds.every((id) => current.has(id));
      if (allOnPage) {
        const next = new Set(current);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...current, ...pageIds]);
    });
  };

  const enterSelectMode = (patient) => {
    setSelectionMode(true);
    setSelectedIds((current) => new Set(current).add(patient.id));
  };

  const exitSelectMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const openAdd = () => setDialog({ type: PATIENT_DIALOGS.ADD, patient: null });
  const openDelete = (patient) => setDialog({ type: PATIENT_DIALOGS.DELETE, patient });
  const openBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDialog({ type: PATIENT_DIALOGS.BULK_DELETE, patient: null });
  };
  const closeDialog = () => {
    setRemove(NO_REMOVE);
    setDialog({ type: null, patient: null });
  };

  const handleFormSubmit = async (values) => {
    await addPatient(values);
    setPage(1);
    setAnnouncement(PATIENT_MESSAGES.ADDED(values.name.trim()));
    closeDialog();
  };

  const handleDelete = async () => {
    setRemove({ loading: true, error: "" });
    try {
      if (dialog.type === PATIENT_DIALOGS.DELETE) {
        await removePatient(dialog.patient.id);
        setAnnouncement(PATIENT_MESSAGES.DELETED(dialog.patient.name));
      } else {
        const ids = [...selectedIds];
        await bulkRemovePatients(ids);
        setAnnouncement(PATIENT_MESSAGES.BULK_DELETED(ids.length));
        exitSelectMode();
      }
      closeDialog();
    } catch (err) {
      setRemove({ loading: false, error: err.message });
    }
  };

  const hasFilters = Boolean(search) || statusFilter !== STATUS_FILTER_ALL;
  const emptyState = hasFilters ? (
    <EmptyState
      icon={MagnifyingGlass}
      title={PATIENT_TEXT.EMPTY_FILTER_TITLE}
      description={PATIENT_TEXT.EMPTY_FILTER_DESCRIPTION}
      action={
        <Button variant="secondary" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={Users}
      title={PATIENT_TEXT.EMPTY_TITLE}
      description={PATIENT_TEXT.EMPTY_DESCRIPTION}
      action={
        <Button onClick={openAdd}>
          <Plus /> {PATIENT_TEXT.ADD}
        </Button>
      }
    />
  );

  const selectedCount = selectedIds.size;

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{PATIENT_TEXT.LIST_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{PATIENT_TEXT.LIST_DESCRIPTION}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectionMode ? (
            <>
              {selectedCount > 0 && (
                <Button variant="danger" onClick={openBulkDelete}>
                  <Trash /> {PATIENT_TEXT.BULK_DELETE} ({selectedCount})
                </Button>
              )}
              <Button variant="secondary" onClick={exitSelectMode}>
                {PATIENT_TEXT.DONE_SELECTING}
              </Button>
            </>
          ) : (
            <Button onClick={openAdd}>
              <Plus /> {PATIENT_TEXT.ADD}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PATIENT_STAT_CARDS.map((card, index) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={formatNumber(stats[card.key] ?? 0)}
            icon={card.icon}
            tone={card.tone}
            isLoading={statsLoading}
            index={index}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label={PATIENT_TEXT.SEARCH_LABEL}
            placeholder={PATIENT_TEXT.SEARCH_PLACEHOLDER}
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            className={`${INPUT_CLASS} border-border pl-10`}
          />
        </div>
        <SelectField
          label="Filter by status"
          hideLabel
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(e) => changeStatus(e.target.value)}
          className="sm:w-48"
        />
      </div>

      <div className="mt-4">
        {error && !isLoading ? (
          <EmptyState
            icon={WarningCircle}
            title="Could not load patients"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
            }
          />
        ) : (
          <>
            <PatientTable
              patients={patients}
              isLoading={isLoading}
              emptyState={emptyState}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggle={toggleOne}
              onToggleAll={toggleAll}
              onView={(patient) => navigate(ROUTES.PATIENT_DETAILS.replace(":id", patient.id))}
              onDelete={openDelete}
              onSelect={enterSelectMode}
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
              itemLabel="patients"
            />
          </>
        )}
      </div>

      <PatientFormDialog
        open={dialog.type === PATIENT_DIALOGS.ADD}
        patient={null}
        onSubmit={handleFormSubmit}
        onClose={closeDialog}
      />

      <ConfirmDialog
        open={dialog.type === PATIENT_DIALOGS.DELETE || dialog.type === PATIENT_DIALOGS.BULK_DELETE}
        onClose={closeDialog}
        onConfirm={handleDelete}
        title={dialog.type === PATIENT_DIALOGS.BULK_DELETE ? PATIENT_TEXT.BULK_DELETE : PATIENT_TEXT.DELETE}
        description={
          dialog.type === PATIENT_DIALOGS.BULK_DELETE
            ? PATIENT_MESSAGES.BULK_DELETE_DESCRIPTION(selectedCount)
            : PATIENT_MESSAGES.DELETE_DESCRIPTION
        }
        confirmLabel={PATIENT_TEXT.DELETE}
        loading={remove.loading}
        error={remove.error}
      />

      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
