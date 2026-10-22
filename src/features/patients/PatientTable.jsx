import { useEffect, useRef, useState } from "react";
import { CheckSquare, DotsThree, Eye, Trash } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import IconButton from "@/components/ui/IconButton";
import {
  GENDER_LABELS,
  PATIENT_STATUS_LABELS,
  PATIENT_STATUS_TONES,
  PATIENT_TEXT,
  SKELETON_ROW_COUNT,
} from "@/constants/patients";
import { ROUTES } from "@/constants/routes";
import { formatShortDate } from "@/lib/format";

const TH = "px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground";
const ROW_ACTION = "size-9! border-transparent! shadow-none!";

function SkeletonBar({ className }) {
  return <div className={`h-3.5 animate-pulse rounded bg-surface-muted ${className}`} />;
}

function SkeletonRow({ selectionMode }) {
  return (
    <tr className="border-t border-border">
      {selectionMode && (
        <td className="w-10 px-3 py-3">
          <SkeletonBar className="size-4" />
        </td>
      )}
      <td className="py-3 pl-4 pr-2 sm:pl-5">
        <div className="flex items-center gap-3">
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-surface-muted" />
          <SkeletonBar className="w-28" />
        </div>
      </td>
      <td className="hidden px-3 py-3 sm:table-cell">
        <SkeletonBar className="w-16" />
      </td>
      <td className="hidden px-3 py-3 md:table-cell">
        <SkeletonBar className="w-24" />
      </td>
      <td className="hidden px-3 py-3 lg:table-cell">
        <SkeletonBar className="w-20" />
      </td>
      <td className="px-3 py-3">
        <SkeletonBar className="w-16" />
      </td>
      <td className="py-3 pl-2 pr-3">
        <SkeletonBar className="ml-auto w-8" />
      </td>
    </tr>
  );
}

function RowMenu({ patient, onView, onDelete, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <IconButton
        label={`Actions for ${patient.name}`}
        className={ROW_ACTION}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <DotsThree weight="bold" />
      </IconButton>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-popover"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onView(patient);
            }}
          >
            <Eye className="size-4 text-muted-foreground" />
            {PATIENT_TEXT.VIEW_DETAILS}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onSelect(patient);
            }}
          >
            <CheckSquare className="size-4 text-muted-foreground" />
            {PATIENT_TEXT.SELECT}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-surface-muted"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete(patient);
            }}
          >
            <Trash className="size-4" />
            {PATIENT_TEXT.DELETE}
          </button>
        </div>
      )}
    </div>
  );
}

function ageGenderLabel(patient) {
  const parts = [];
  if (patient.age != null) parts.push(`${patient.age}y`);
  if (patient.gender) parts.push(GENDER_LABELS[patient.gender] || patient.gender);
  return parts.length ? parts.join(" · ") : "—";
}

export default function PatientTable({
  patients,
  isLoading,
  emptyState,
  selectionMode,
  selectedIds,
  onToggle,
  onToggleAll,
  onView,
  onDelete,
  onSelect,
}) {
  const navigate = useNavigate();
  const allSelected =
    !isLoading && patients.length > 0 && patients.every((p) => selectedIds.has(p.id));
  const someSelected = patients.some((p) => selectedIds.has(p.id));

  if (!isLoading && patients.length === 0) {
    return <div className="rounded-xl border border-border bg-surface shadow-card">{emptyState}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
      <table className="w-full text-left text-sm" aria-busy={isLoading}>
        <caption className="sr-only">{isLoading ? "Loading patients" : "Patients"}</caption>
        <thead>
          <tr>
            {selectionMode && (
              <th scope="col" className={`${TH} w-10 pl-4`}>
                <input
                  type="checkbox"
                  aria-label="Select all patients on this page"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={onToggleAll}
                  className="size-4 rounded border-border"
                />
              </th>
            )}
            <th scope="col" className={`${TH} pl-4 sm:pl-5`}>
              Patient
            </th>
            <th scope="col" className={`${TH} hidden sm:table-cell`}>
              Age / Gender
            </th>
            <th scope="col" className={`${TH} hidden md:table-cell`}>
              Phone
            </th>
            <th scope="col" className={`${TH} hidden lg:table-cell`}>
              Last visit
            </th>
            <th scope="col" className={TH}>
              Status
            </th>
            <th scope="col" className={`${TH} pr-3`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
                <SkeletonRow key={i} selectionMode={selectionMode} />
              ))
            : patients.map((patient) => {
                const selected = selectedIds.has(patient.id);
                return (
                  <tr
                    key={patient.id}
                    className={`cursor-pointer border-t border-border hover:bg-surface-muted/60 ${
                      selected ? "bg-primary-soft/40" : ""
                    }`}
                    onClick={() => navigate(ROUTES.PATIENT_DETAILS.replace(":id", patient.id))}
                  >
                    {selectionMode && (
                      <td className="w-10 px-3 py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${patient.name}`}
                          checked={selected}
                          onChange={() => onToggle(patient.id)}
                          className="size-4 rounded border-border"
                        />
                      </td>
                    )}
                    <td className="py-3 pl-4 pr-2 sm:pl-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={patient.name} src={patient.avatarUrl} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{patient.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {patient.patientCode || ageGenderLabel(patient)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">
                      {ageGenderLabel(patient)}
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                      {patient.phone || "—"}
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">
                      {patient.lastVisit ? formatShortDate(patient.lastVisit) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={PATIENT_STATUS_TONES[patient.status] || "neutral"}>
                        {PATIENT_STATUS_LABELS[patient.status] || patient.status}
                      </Badge>
                    </td>
                    <td className="py-3 pl-2 pr-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <RowMenu
                          patient={patient}
                          onView={onView}
                          onDelete={onDelete}
                          onSelect={onSelect}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
