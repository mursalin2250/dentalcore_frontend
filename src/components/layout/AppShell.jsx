import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useDismiss } from "@/hooks/useDismiss";
import { getPageMeta } from "@/lib/navigation";
import { BRAND_NAME, MAIN_CONTENT_ID } from "@/constants/ui";

export default function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  const closeNav = useCallback(() => setNavOpen(false), []);

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

      <Sidebar open={navOpen} onClose={closeNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenNav={() => setNavOpen(true)} />
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
