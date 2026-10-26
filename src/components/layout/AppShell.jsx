import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { List } from "@phosphor-icons/react";
import IconButton from "@/components/ui/IconButton";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { useDismiss } from "@/hooks/useDismiss";
import { getPageMeta } from "@/lib/navigation";
import { ROUTES } from "@/constants/routes";
import { BRAND_NAME, MAIN_CONTENT_ID } from "@/constants/ui";

function isInvoiceFocusPath(pathname) {
  if (pathname === "/invoice/new") return true;
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "invoice" && parts.length === 3 && parts[2] === "edit";
}

export default function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  const closeNav = useCallback(() => setNavOpen(false), []);
  const focusMode = isInvoiceFocusPath(pathname);

  useDismiss({ open: navOpen, onDismiss: closeNav });

  useEffect(() => {
    const meta = getPageMeta(pathname);
    document.title = meta ? `${meta.title} | ${BRAND_NAME}` : BRAND_NAME;
  }, [pathname]);

  return (
    <div className="min-h-dvh lg:flex">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Sidebar always mounted so hamburger can open it; visually forced closed on desktop in focus mode until opened */}
      <Sidebar open={navOpen} onClose={closeNav} forceOverlay={focusMode} />

      <div className="flex min-w-0 flex-1 flex-col">
        {focusMode ? (
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
            <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">
                DC
              </span>
              <span className="hidden sm:inline">{BRAND_NAME}</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserMenu />
              <IconButton label="Open navigation" onClick={() => setNavOpen(true)}>
                <List />
              </IconButton>
            </div>
          </header>
        ) : (
          <Header onOpenNav={() => setNavOpen(true)} />
        )}
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="flex-1 px-4 pb-10 outline-none sm:px-6 lg:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
