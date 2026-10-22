import { Link } from "react-router-dom";
import { Tooth } from "@phosphor-icons/react";
import { getButtonClasses } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("Page not found");

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16 text-center">
      <div className="flex max-w-sm flex-col items-center">
        <span className="grid size-20 place-items-center rounded-3xl bg-primary-soft text-primary">
          <Tooth weight="duotone" size={40} />
        </span>
        <p className="mt-6 text-sm font-medium text-primary">404</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to={ROUTES.DASHBOARD} className={`${getButtonClasses("primary")} mt-8`}>
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
