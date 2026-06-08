import type { UserRole } from "./roleConfig";

/** Maps Spring Security / JWT role (e.g. ADMINISTRATOR) to frontend `UserRole`. */
export function backendRoleToUserRole(role: string | undefined | null): UserRole | null {
  if (!role) return null;
  const map: Record<string, UserRole> = {
    ADMINISTRATOR: "administrator",
    PRODUCTION_MANAGER: "production_manager",
    INVENTORY_MANAGER: "inventory_manager",
    QC_OFFICER: "qc_officer",
    SALES_STAFF: "sales_staff",
    ROLE_ADMINISTRATOR: "administrator",
    ROLE_PRODUCTION_MANAGER: "production_manager",
    ROLE_INVENTORY_MANAGER: "inventory_manager",
    ROLE_QC_OFFICER: "qc_officer",
    ROLE_SALES_STAFF: "sales_staff",
  };
  return map[role] ?? null;
}

/** Maps frontend `UserRole` to backend `Role` enum JSON string. */
export function userRoleToBackendEnum(role: UserRole): string {
  const map: Record<UserRole, string> = {
    administrator: "ADMINISTRATOR",
    production_manager: "PRODUCTION_MANAGER",
    inventory_manager: "INVENTORY_MANAGER",
    qc_officer: "QC_OFFICER",
    sales_staff: "SALES_STAFF",
  };
  return map[role];
}
