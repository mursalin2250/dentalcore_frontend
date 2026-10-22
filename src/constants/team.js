import { ROLE_LABELS, TEAM_ROLES } from "./roles";

export const MEMBER_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
});

export const STATUS_LABELS = Object.freeze({
  [MEMBER_STATUSES.ACTIVE]: "Active",
  [MEMBER_STATUSES.INACTIVE]: "Inactive",
});

export const MEMBER_DIALOGS = Object.freeze({
  ADD: "add",
  EDIT: "edit",
  REMOVE: "remove",
});

export const ROLE_FILTER_ALL = "all";
export const TEAM_PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 300;
export const SKELETON_ROW_COUNT = 5;

const toOptions = (values, labels) => values.map((value) => ({ value, label: labels[value] }));

export const ROLE_OPTIONS = toOptions(TEAM_ROLES, ROLE_LABELS);
export const STATUS_OPTIONS = toOptions(Object.values(MEMBER_STATUSES), STATUS_LABELS);
export const ROLE_FILTER_OPTIONS = [{ value: ROLE_FILTER_ALL, label: "All roles" }, ...ROLE_OPTIONS];

export const TEAM_MESSAGES = Object.freeze({
  TEMP_PASSWORD_REQUIRED: "Enter a temporary password.",
  REMOVE_DESCRIPTION: "They will lose access to DentalCore. This cannot be undone.",
  ADDED: (name) => `${name} was added to the team.`,
  UPDATED: (name) => `${name} was updated.`,
  REMOVED: (name) => `${name} was removed from the team.`,
});
