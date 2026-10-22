import Logo from "@/components/ui/Logo";
import ThemeToggle from "./ThemeToggle";
import { usePageTitle } from "@/hooks/usePageTitle";

// Centered card for login / sign up. No sidebar or header.
export default function AuthLayout({ title, subtitle, footer, children }) {
  usePageTitle(title);

  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-16">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <main className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </main>
    </div>
  );
}
