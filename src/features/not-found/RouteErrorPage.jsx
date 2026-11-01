import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import Button from "@/components/ui/Button";

export default function RouteErrorPage() {
  const error = useRouteError();
  let message = "An unexpected error occurred.";
  if (isRouteErrorResponse(error)) {
    message = error.data?.message || error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="grid min-h-dvh place-items-center px-6 py-16 text-center" role="alert">
      <div className="max-w-md">
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Link
            to={ROUTES.DASHBOARD}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
