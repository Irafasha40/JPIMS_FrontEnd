export type UserRole =
  | "administrator"
  | "production_manager"
  | "inventory_manager"
  | "qc_officer"
  | "sales_staff";

export const roleLabels: Record<UserRole, string> = {
  administrator: "Administrator",
  production_manager: "Production Manager",
  inventory_manager: "Inventory Manager",
  qc_officer: "QC Officer",
  sales_staff: "Sales Staff",
};

export const roleMenuConfig: Record<UserRole, string[]> = {
  administrator: [
    "/",
    "/raw-materials",
    "/production",
    "/quality-control",
    "/finished-products",
    "/sales",
    "/recipes",
    "/suppliers",
    "/reports",
    "/notifications",
    "/users",
    "/security",
  ],
  production_manager: ["/", "/raw-materials", "/production", "/quality-control", "/recipes", "/reports"],
  inventory_manager: ["/", "/raw-materials", "/finished-products", "/suppliers", "/reports"],
  qc_officer: ["/", "/quality-control", "/production", "/reports"],
  sales_staff: ["/", "/sales", "/finished-products", "/notifications"],
};
