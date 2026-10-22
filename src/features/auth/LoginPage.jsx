import { Link } from "react-router-dom";
import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import PasswordField from "@/components/ui/PasswordField";
import TextField from "@/components/ui/TextField";
import { ROUTES } from "@/constants/routes";
import { useForm } from "@/hooks/useForm";
import { useAuth } from "./AuthContext";
import { validateLogin } from "./validators";

export default function LoginPage() {
  const { login } = useAuth();
  const form = useForm({
    initialValues: { email: "", password: "", remember: true },
    validate: validateLogin,
    onSubmit: login, // GuestRoute redirects to /dashboard once signed in
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your clinic."
      footer={
        <>
          New to DentalCore?{" "}
          <Link to={ROUTES.SIGNUP} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit} className="space-y-4">
        <TextField label="Email" type="email" autoComplete="email" {...form.getFieldProps("email")} />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          {...form.getFieldProps("password")}
        />

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.values.remember}
            onChange={(e) => form.setValue("remember", e.target.checked)}
            className="size-4 cursor-pointer accent-primary"
          />
          Remember me
        </label>

        {form.formError && <FormError>{form.formError}</FormError>}

        <Button type="submit" loading={form.isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
