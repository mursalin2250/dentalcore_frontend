import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CaretDown } from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import { useDismiss } from "@/hooks/useDismiss";
import { useAuth } from "@/features/auth/AuthContext";
import { ROLE_LABELS } from "@/constants/roles";
import { USER_MENU_ACTIONS, USER_MENU_ITEMS } from "@/constants/navigation";

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-offset-0";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const { user, logout } = useAuth();

  const close = useCallback(({ restoreFocus = false } = {}) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useDismiss({ open, ref: rootRef, onDismiss: close });

  // Move focus into the menu when it opens.
  useEffect(() => {
    if (open) menuRef.current?.querySelector('[role="menuitem"]')?.focus();
  }, [open]);

  const handleAction = (action) => {
    close({ restoreFocus: true });
    // ProtectedRoute redirects to /login once the user is cleared.
    if (action === USER_MENU_ACTIONS.LOGOUT) logout();
  };

  const onMenuKeyDown = (e) => {
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    const moves = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (e.key in moves) {
      e.preventDefault();
      items[moves[e.key]].focus();
    } else if (e.key === "Tab") {
      close();
    }
  };

  const onTriggerKeyDown = (e) => {
    if (e.key === "ArrowDown" && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface p-1 pr-3 shadow-card transition-colors duration-150 hover:bg-surface-muted"
      >
        <Avatar name={user.name} src={user.avatarUrl} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium">{user.name}</span>
          <span className="block text-xs text-muted-foreground">
            {ROLE_LABELS[user.role]}
          </span>
        </span>
        <CaretDown
          size={16}
          className={`text-muted-foreground transition-transform duration-150 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="User menu"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-40 mt-2 w-56 origin-top-right rounded-xl border border-border bg-surface p-1.5 shadow-popover transition-[opacity,transform] duration-150 ease-out-strong starting:scale-95 starting:opacity-0 motion-reduce:transition-none"
        >
          {USER_MENU_ITEMS.map(({ label, path, action, icon: Icon, danger }) => {
            const tone = danger
              ? "text-danger hover:bg-danger/10"
              : "text-foreground hover:bg-surface-muted";
            return path ? (
              <Link
                key={label}
                to={path}
                role="menuitem"
                tabIndex={-1}
                onClick={() => close()}
                className={`${ITEM_CLASS} ${tone}`}
              >
                <Icon /> {label}
              </Link>
            ) : (
              <button
                key={label}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => handleAction(action)}
                className={`${ITEM_CLASS} ${tone}`}
              >
                <Icon /> {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
