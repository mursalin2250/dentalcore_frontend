import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormError from "@/components/ui/FormError";
import PasswordField from "@/components/ui/PasswordField";
import SelectField from "@/components/ui/SelectField";
import TextField from "@/components/ui/TextField";
import { ROLES } from "@/constants/roles";
import { ROLE_OPTIONS, STATUS_OPTIONS } from "@/constants/team";
import { useForm } from "@/hooks/useForm";
import { validateNewMember } from "./validateMember";

// Add mode when `member` is null; edit mode (role + status only) otherwise.
function MemberForm({ member, onSubmit, onCancel }) {
  const isEdit = Boolean(member);
  const form = useForm({
    initialValues: isEdit
      ? { role: member.role, status: member.status }
      : { name: "", email: "", role: ROLES.RECEPTIONIST, password: "" },
    validate: (values) => (isEdit ? {} : validateNewMember(values)),
    onSubmit,
  });

  return (
    <form noValidate onSubmit={form.handleSubmit} className="space-y-4">
      {isEdit ? (
        <div className="flex items-center gap-3 rounded-lg bg-surface-muted p-3">
          <Avatar name={member.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{member.name}</p>
            <p className="truncate text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>
      ) : (
        <>
          <TextField label="Full name" autoComplete="off" {...form.getFieldProps("name")} />
          <TextField label="Email" type="email" autoComplete="off" {...form.getFieldProps("email")} />
        </>
      )}

      <SelectField label="Role" options={ROLE_OPTIONS} {...form.getFieldProps("role")} />
      {isEdit && <SelectField label="Status" options={STATUS_OPTIONS} {...form.getFieldProps("status")} />}
      {!isEdit && (
        <PasswordField
          label="Temporary password"
          autoComplete="new-password"
          hint="Share it with them so they can sign in."
          {...form.getFieldProps("password")}
        />
      )}

      {form.formError && <FormError>{form.formError}</FormError>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={form.isSubmitting}>
          {isEdit ? "Save changes" : "Add member"}
        </Button>
      </div>
    </form>
  );
}

export default function MemberFormDialog({ open, member, onSubmit, onClose }) {
  const isEdit = Boolean(member);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit member" : "Add team member"}
      description={isEdit ? "Change their role or access status." : "They will be able to sign in to DentalCore."}
    >
      <MemberForm member={member} onSubmit={onSubmit} onCancel={onClose} />
    </Dialog>
  );
}
