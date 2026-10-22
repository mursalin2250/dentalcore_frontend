import {
  ArrowsLeftRight,
  CalendarCheck,
  ChartLineUp,
  CreditCard,
  GearSix,
  IdentificationBadge,
  Pill,
  Receipt,
  SignOut,
  SlidersHorizontal,
  SquaresFour,
  Stethoscope,
  UserCircle,
  Users,
  UsersThree,
} from "@phosphor-icons/react";
import { ROUTES } from "./routes";

// One array renders the whole sidebar. Add a page here and it shows up.
export const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", path: ROUTES.DASHBOARD, icon: SquaresFour }],
  },
  {
    label: "Care",
    items: [
      { label: "Patients", path: ROUTES.PATIENTS, icon: Users },
      { label: "Doctors", path: ROUTES.DOCTORS, icon: Stethoscope },
      { label: "Appointments", path: ROUTES.APPOINTMENTS, icon: CalendarCheck },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Medications", path: ROUTES.MEDICATIONS, icon: Pill },
      { label: "Stock Movement", path: ROUTES.STOCK_MOVEMENT, icon: ArrowsLeftRight },
    ],
  },
  {
    label: "Operation",
    items: [
      { label: "Billing", path: ROUTES.BILLING, icon: CreditCard },
      { label: "Invoice", path: ROUTES.INVOICE, icon: Receipt },
      { label: "Analytics", path: ROUTES.ANALYTICS, icon: ChartLineUp },
      { label: "Staff", path: ROUTES.STAFF, icon: IdentificationBadge },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Team", path: ROUTES.TEAM, icon: UsersThree },
      { label: "Settings", path: ROUTES.SETTINGS, icon: GearSix },
    ],
  },
];

export const USER_MENU_ACTIONS = Object.freeze({
  LOGOUT: "logout",
});

// Items with `path` navigate; items with `action` run a handler.
export const USER_MENU_ITEMS = [
  { label: "Profile", path: ROUTES.PROFILE, icon: UserCircle },
  { label: "Account Settings", path: ROUTES.ACCOUNT_SETTINGS, icon: SlidersHorizontal },
  { label: "Logout", action: USER_MENU_ACTIONS.LOGOUT, icon: SignOut, danger: true },
];
