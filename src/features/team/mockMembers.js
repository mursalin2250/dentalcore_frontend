import { ROLES } from "@/constants/roles";
import { MEMBER_STATUSES } from "@/constants/team";

export const MOCK_MEMBERS = [
  { id: "m-1", name: "Tahmina Akter", email: "tahmina.akter@dentalcore.example", role: ROLES.ADMIN, status: MEMBER_STATUSES.ACTIVE },
  { id: "m-2", name: "Dr. Imran Hossain", email: "imran.hossain@dentalcore.example", role: ROLES.DOCTOR, status: MEMBER_STATUSES.ACTIVE },
  { id: "m-3", name: "Dr. Farzana Rahman", email: "farzana.rahman@dentalcore.example", role: ROLES.DOCTOR, status: MEMBER_STATUSES.ACTIVE },
  { id: "m-4", name: "Dr. Sabbir Ahmed", email: "sabbir.ahmed@dentalcore.example", role: ROLES.DOCTOR, status: MEMBER_STATUSES.INACTIVE },
  { id: "m-5", name: "Nusrat Jahan", email: "nusrat.jahan@dentalcore.example", role: ROLES.RECEPTIONIST, status: MEMBER_STATUSES.ACTIVE },
  { id: "m-6", name: "Rafiq Uddin", email: "rafiq.uddin@dentalcore.example", role: ROLES.RECEPTIONIST, status: MEMBER_STATUSES.ACTIVE },
  { id: "m-7", name: "Dr. Sumaiya Khan", email: "sumaiya.khan@dentalcore.example", role: ROLES.DOCTOR, status: MEMBER_STATUSES.ACTIVE },
  { id: "m-8", name: "Mehedi Hasan", email: "mehedi.hasan@dentalcore.example", role: ROLES.ADMIN, status: MEMBER_STATUSES.ACTIVE },
  { id: "m-9", name: "Shirin Sultana", email: "shirin.sultana@dentalcore.example", role: ROLES.RECEPTIONIST, status: MEMBER_STATUSES.INACTIVE },
];
