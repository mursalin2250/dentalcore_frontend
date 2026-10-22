import { PencilSimple, Trash } from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import IconButton from "@/components/ui/IconButton";
import { ROLE_LABELS } from "@/constants/roles";
import { MEMBER_STATUSES, SKELETON_ROW_COUNT, STATUS_LABELS } from "@/constants/team";

const STATUS_TONES = {
  [MEMBER_STATUSES.ACTIVE]: "success",
  [MEMBER_STATUSES.INACTIVE]: "neutral",
};

const TH = "px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground";
const ROW_ACTION = "size-9! border-transparent! shadow-none!";

function SkeletonBar({ className }) {
  return <div className={`h-3.5 animate-pulse rounded bg-surface-muted ${className}`} />;
}

function SkeletonRow() {
  return (
    <tr className="border-t border-border">
      <td className="py-3 pl-4 pr-2 sm:pl-5">
        <div className="flex items-center gap-3">
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-surface-muted" />
          <SkeletonBar className="w-28" />
        </div>
      </td>
      <td className="hidden px-3 py-3 md:table-cell"><SkeletonBar className="w-44" /></td>
      <td className="hidden px-3 py-3 sm:table-cell"><SkeletonBar className="w-20" /></td>
      <td className="px-3 py-3"><SkeletonBar className="w-16" /></td>
      <td className="py-3 pl-2 pr-3 sm:pr-4"><SkeletonBar className="ml-auto w-16" /></td>
    </tr>
  );
}

export default function MemberTable({ members, isLoading, emptyState, onEdit, onRemove }) {
  if (!isLoading && members.length === 0) {
    return <div className="rounded-xl border border-border bg-surface shadow-card">{emptyState}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
      <table className="w-full text-left text-sm" aria-busy={isLoading}>
        <caption className="sr-only">{isLoading ? "Loading team members" : "Team members"}</caption>
        <thead>
          <tr>
            <th scope="col" className={`${TH} pl-4 sm:pl-5`}>Member</th>
            <th scope="col" className={`${TH} hidden md:table-cell`}>Email</th>
            <th scope="col" className={`${TH} hidden sm:table-cell`}>Role</th>
            <th scope="col" className={TH}>Status</th>
            <th scope="col" className={`${TH} pr-3 sm:pr-4`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => <SkeletonRow key={i} />)
            : members.map((member) => (
                <tr key={member.id} className="border-t border-border">
                  <td className="py-3 pl-4 pr-2 sm:pl-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={member.name} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="truncate text-muted-foreground md:hidden">{member.email}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{ROLE_LABELS[member.role]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">{member.email}</td>
                  <td className="hidden px-3 py-3 sm:table-cell">{ROLE_LABELS[member.role]}</td>
                  <td className="px-3 py-3">
                    <Badge tone={STATUS_TONES[member.status]}>{STATUS_LABELS[member.status]}</Badge>
                  </td>
                  <td className="py-3 pl-2 pr-3 sm:pr-4">
                    <div className="flex justify-end gap-1">
                      <IconButton label={`Edit ${member.name}`} className={ROW_ACTION} onClick={() => onEdit(member)}>
                        <PencilSimple />
                      </IconButton>
                      <IconButton label={`Remove ${member.name}`} className={ROW_ACTION} onClick={() => onRemove(member)}>
                        <Trash />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
