export const SELECTABLE_ACCOUNT_ROLES = ["reader", "writer", "both"] as const;

export type SelectableAccountRole = (typeof SELECTABLE_ACCOUNT_ROLES)[number];
export type AccountRole = SelectableAccountRole | "admin";
export type RoleCapability = "read" | "write";

export function normalizeRole(role?: string | null): AccountRole {
  const value = role?.toLowerCase();

  if (value === "admin") return "admin";
  if (value === "both") return "both";
  if (value === "writer" || value === "author") return "writer";

  return "reader";
}

export function isSelectableAccountRole(role: string): role is SelectableAccountRole {
  return SELECTABLE_ACCOUNT_ROLES.includes(role as SelectableAccountRole);
}

export function canReadLibrary(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "reader" || normalizedRole === "both" || normalizedRole === "admin";
}

export function canUseStudio(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "writer" || normalizedRole === "both" || normalizedRole === "admin";
}

export function hasCapability(role: string | null | undefined, capability?: RoleCapability) {
  if (!capability) return true;
  if (capability === "read") return canReadLibrary(role);
  return canUseStudio(role);
}

export function getRoleLabel(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "both") return "Reader and Writer";
  if (normalizedRole === "writer") return "Writer";
  if (normalizedRole === "admin") return "Admin";

  return "Reader";
}

export function getDefaultPathForRole(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "writer" ? "/studio" : "/";
}
