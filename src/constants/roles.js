export const ROLES = Object.freeze({
  ADMIN: "admin",
  DOCTOR: "doctor",
  RECEPTIONIST: "receptionist",
  ASSISTANT: "assistant",
  ACCOUNTANT: "accountant",
});

// Roles that can be assigned on the Team page.
export const TEAM_ROLES = Object.freeze([ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST]);

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: "Admin",
  [ROLES.DOCTOR]: "Doctor",
  [ROLES.RECEPTIONIST]: "Receptionist",
  [ROLES.ASSISTANT]: "Dental Assistant",
  [ROLES.ACCOUNTANT]: "Accountant",
});
