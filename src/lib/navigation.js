import { NAV_GROUPS, USER_MENU_ITEMS } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";

// Returns { group, title } for a pathname, or null for unknown routes.
export function getPageMeta(pathname) {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.path === pathname);
    if (item) return { group: group.label, title: item.label };
  }

  // Patient details: Care / Patients / Details (desktop header breadcrumb)
  if (pathname.startsWith(`${ROUTES.PATIENTS}/`) && pathname !== ROUTES.PATIENTS) {
    return { group: "Care / Patients", title: "Details" };
  }

  if (pathname.startsWith(`${ROUTES.DOCTORS}/`) && pathname !== ROUTES.DOCTORS) {
    return { group: "Care / Doctors", title: "Details" };
  }

  if (pathname === "/invoice/new") {
    return { group: "Operation / Invoice", title: "Create invoice" };
  }
  if (pathname.startsWith("/invoice/") && pathname.endsWith("/edit")) {
    return { group: "Operation / Invoice", title: "Edit invoice" };
  }

  const menuItem = USER_MENU_ITEMS.find((i) => i.path === pathname);
  return menuItem ? { group: null, title: menuItem.label } : null;
}
