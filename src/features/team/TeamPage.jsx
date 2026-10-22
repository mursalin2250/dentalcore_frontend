import { useEffect, useState } from "react";
import { MagnifyingGlass, Plus, UsersThree, WarningCircle } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SelectField from "@/components/ui/SelectField";
import { INPUT_CLASS } from "@/components/ui/TextField";
import {
  MEMBER_DIALOGS,
  ROLE_FILTER_ALL,
  ROLE_FILTER_OPTIONS,
  SEARCH_DEBOUNCE_MS,
  TEAM_MESSAGES,
} from "@/constants/team";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import MemberFormDialog from "./MemberFormDialog";
import MemberTable from "./MemberTable";
import { useMembers } from "./useMembers";

const NO_REMOVE_ERROR = { loading: false, error: "" };

export default function TeamPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(ROLE_FILTER_ALL);
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();

  const { members, pagination, isLoading, error, reload, addMember, updateMember, removeMember } =
    useMembers({ search, role: roleFilter, page });

  const [dialog, setDialog] = useState({ type: null, member: null });
  const [remove, setRemove] = useState(NO_REMOVE_ERROR);
  const [announcement, setAnnouncement] = useState(""); // read out by screen readers

  // After removing the last row of the last page, step back a page.
  useEffect(() => {
    if (!isLoading && page > pagination.totalPages) setPage(pagination.totalPages);
  }, [isLoading, page, pagination.totalPages]);

  const openDialog = (type, member = null) => {
    setRemove(NO_REMOVE_ERROR);
    setDialog({ type, member });
  };
  const closeDialog = () => setDialog((current) => ({ ...current, type: null }));

  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
  };
  const changeRole = (value) => {
    setRoleFilter(value);
    setPage(1);
  };
  const clearFilters = () => {
    changeQuery("");
    changeRole(ROLE_FILTER_ALL);
  };

  // Errors are left to throw: the form shows them and the dialog stays open.
  const handleFormSubmit = async (values) => {
    if (dialog.type === MEMBER_DIALOGS.ADD) {
      await addMember(values);
      setPage(1); // newest members are listed first
      setAnnouncement(TEAM_MESSAGES.ADDED(values.name.trim()));
    } else {
      await updateMember(dialog.member.id, { role: values.role, status: values.status });
      setAnnouncement(TEAM_MESSAGES.UPDATED(dialog.member.name));
    }
    closeDialog();
  };

  const handleRemove = async () => {
    setRemove({ loading: true, error: "" });
    try {
      await removeMember(dialog.member.id);
      setAnnouncement(TEAM_MESSAGES.REMOVED(dialog.member.name));
      setRemove(NO_REMOVE_ERROR);
      closeDialog();
    } catch (err) {
      setRemove({ loading: false, error: err.message });
    }
  };

  const hasFilters = Boolean(search) || roleFilter !== ROLE_FILTER_ALL;
  const emptyState = hasFilters ? (
    <EmptyState
      icon={MagnifyingGlass}
      title="No members found"
      description="Nothing matches your search or role filter."
      action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
    />
  ) : (
    <EmptyState
      icon={UsersThree}
      title="No team members yet"
      description="Add the people who need access to DentalCore."
      action={<Button onClick={() => openDialog(MEMBER_DIALOGS.ADD)}><Plus /> Add member</Button>}
    />
  );

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who can sign in to DentalCore and what they can do.
          </p>
        </div>
        <Button onClick={() => openDialog(MEMBER_DIALOGS.ADD)}>
          <Plus /> Add member
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search team members"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            className={`${INPUT_CLASS} border-border pl-10`}
          />
        </div>
        <SelectField
          label="Filter by role"
          hideLabel
          options={ROLE_FILTER_OPTIONS}
          value={roleFilter}
          onChange={(e) => changeRole(e.target.value)}
          className="sm:w-48"
        />
      </div>

      <div className="mt-4">
        {error && !isLoading ? (
          <div className="rounded-xl border border-border bg-surface shadow-card">
            <EmptyState
              icon={WarningCircle}
              title="Could not load the team"
              description={error.message}
              action={<Button variant="secondary" onClick={reload}>Try again</Button>}
            />
          </div>
        ) : (
          <>
            <MemberTable
              members={members}
              isLoading={isLoading}
              emptyState={emptyState}
              onEdit={(member) => openDialog(MEMBER_DIALOGS.EDIT, member)}
              onRemove={(member) => openDialog(MEMBER_DIALOGS.REMOVE, member)}
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
             itemLabel="members" />
          </>
        )}
      </div>

      <p role="status" className="sr-only">{announcement}</p>

      <MemberFormDialog
        open={dialog.type === MEMBER_DIALOGS.ADD || dialog.type === MEMBER_DIALOGS.EDIT}
        member={dialog.type === MEMBER_DIALOGS.EDIT ? dialog.member : null}
        onSubmit={handleFormSubmit}
        onClose={closeDialog}
      />

      <ConfirmDialog
        open={dialog.type === MEMBER_DIALOGS.REMOVE}
        title={`Remove ${dialog.member?.name ?? "member"}?`}
        description={TEAM_MESSAGES.REMOVE_DESCRIPTION}
        confirmLabel="Remove member"
        loading={remove.loading}
        error={remove.error}
        onConfirm={handleRemove}
        onClose={closeDialog}
      />
    </div>
  );
}
