import { useLocation } from "react-router-dom";
import { List } from "@phosphor-icons/react";
import IconButton from "@/components/ui/IconButton";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { getPageMeta } from "@/lib/navigation";

export default function Header({ onOpenNav }) {
  const meta = getPageMeta(useLocation().pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton label="Open navigation" onClick={onOpenNav} className="lg:hidden">
          <List />
        </IconButton>
        {meta && (
          <p className="truncate text-sm text-muted-foreground">
            {meta.group && (
              <>
                {meta.group}
                <span aria-hidden="true" className="mx-2">/</span>
              </>
            )}
            <span className="font-medium text-foreground">{meta.title}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
