import { NavLink } from "react-router-dom";
import { X } from "@phosphor-icons/react";
import IconButton from "@/components/ui/IconButton";
import Logo from "@/components/ui/Logo";
import { NAV_GROUPS } from "@/constants/navigation";

const LINK_BASE =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150";
const LINK_ACTIVE = "bg-primary-soft text-primary";
const LINK_IDLE = "text-muted-foreground hover:bg-surface-muted hover:text-foreground";

// Desktop: floating panel. Below lg: slide-in drawer controlled by `open`.
export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-foreground/30 transition-opacity duration-200 ease-out motion-reduce:transition-none lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <aside
        className={`fixed inset-y-3 left-3 z-50 flex w-64 flex-col rounded-2xl border border-border bg-surface shadow-sidebar transition-[transform,visibility] duration-250 ease-drawer motion-reduce:transition-none lg:sticky lg:inset-y-auto lg:top-3 lg:left-auto lg:my-3 lg:ml-3 lg:h-[calc(100dvh-1.5rem)] lg:shrink-0 lg:self-start lg:visible lg:translate-x-0 ${open ? "visible translate-x-0" : "invisible -translate-x-[calc(100%+1rem)]"}`}
      >
        <div className="flex items-center justify-between px-5 pb-5 pt-6">
          <Logo onClick={onClose} />
          <IconButton label="Close navigation" onClick={onClose} className="lg:hidden">
            <X />
          </IconButton>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              <p
                aria-hidden="true"
                className="mb-1.5 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ label, path, icon: Icon }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `${LINK_BASE} ${isActive ? LINK_ACTIVE : LINK_IDLE}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon weight={isActive ? "fill" : "regular"} />
                          {label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
