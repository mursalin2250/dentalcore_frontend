import { Link } from "react-router-dom";
import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import PasswordField from "@/components/ui/PasswordField";
import TextField from "@/components/ui/TextField";
import { MIN_PASSWORD_LENGTH } from "@/constants/validation";
import { ROUTES } from "@/constants/routes";
import { useForm } from "@/hooks/useForm";
import { useAuth } from "./AuthContext";
import { validateSignup } from "./validators";

export default function SignupPage() {
  const { signup } = useAuth();
  const form = useForm({
    initialValues: { name: "", email: "", password: "", confirmPassword: "" },
    validate: validateSignup,
    onSubmit: signup, // GuestRoute redirects to /dashboard once signed in
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up DentalCore for your clinic."
      footer={
        <>
          Already have an account?{" "}
          <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit} className="space-y-4">
        <TextField label="Full name" autoComplete="name" {...form.getFieldProps("name")} />
        <TextField label="Email" type="email" autoComplete="email" {...form.getFieldProps("email")} />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          {...form.getFieldProps("password")}
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          {...form.getFieldProps("confirmPassword")}
        />

        {form.formError && <FormError>{form.formError}</FormError>}

        <Button type="submit" loading={form.isSubmitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
