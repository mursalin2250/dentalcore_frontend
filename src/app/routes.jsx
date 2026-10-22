import { Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { ROUTES } from "@/constants/routes";
import { GuestRoute, ProtectedRoute } from "@/features/auth/RouteGuards";
import LoginPage from "@/features/auth/LoginPage";
import SignupPage from "@/features/auth/SignupPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import PatientsPage from "@/features/patients/PatientsPage";
import PatientDetailsPage from "@/features/patients/PatientDetailsPage";
import DoctorsPage from "@/features/doctors/DoctorsPage";
import DoctorDetailsPage from "@/features/doctors/DoctorDetailsPage";
import AppointmentsPage from "@/features/appointments/AppointmentsPage";
import MedicationsPage from "@/features/medications/MedicationsPage";
import StockMovementPage from "@/features/stock-movement/StockMovementPage";
import BillingPage from "@/features/billing/BillingPage";
import InvoicePage from "@/features/invoice/InvoicePage";
import AnalyticsPage from "@/features/analytics/AnalyticsPage";
import StaffPage from "@/features/staff/StaffPage";
import TeamPage from "@/features/team/TeamPage";
import SettingsPage from "@/features/settings/SettingsPage";
import ProfilePage from "@/features/account/ProfilePage";
import AccountSettingsPage from "@/features/account/AccountSettingsPage";
import NotFoundPage from "@/features/not-found/NotFoundPage";

export const routes = [
  {
    element: <GuestRoute />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.SIGNUP, element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: ROUTES.ROOT,
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
          { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
          { path: ROUTES.PATIENTS, element: <PatientsPage /> },
          { path: ROUTES.PATIENT_DETAILS, element: <PatientDetailsPage /> },
          { path: ROUTES.DOCTORS, element: <DoctorsPage /> },
          { path: ROUTES.DOCTOR_DETAILS, element: <DoctorDetailsPage /> },
          { path: ROUTES.APPOINTMENTS, element: <AppointmentsPage /> },
          { path: ROUTES.MEDICATIONS, element: <MedicationsPage /> },
          { path: ROUTES.STOCK_MOVEMENT, element: <StockMovementPage /> },
          { path: ROUTES.BILLING, element: <BillingPage /> },
          { path: ROUTES.INVOICE, element: <InvoicePage /> },
          { path: ROUTES.ANALYTICS, element: <AnalyticsPage /> },
          { path: ROUTES.STAFF, element: <StaffPage /> },
          { path: ROUTES.TEAM, element: <TeamPage /> },
          { path: ROUTES.SETTINGS, element: <SettingsPage /> },
          { path: ROUTES.PROFILE, element: <ProfilePage /> },
          { path: ROUTES.ACCOUNT_SETTINGS, element: <AccountSettingsPage /> },
        ],
      },
    ],
  },
  { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
];
