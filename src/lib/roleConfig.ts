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
  production_manager: ["/", "/raw-materials", "/production", "/quality-control", "/recipes", "/reports", "/notifications"],
  inventory_manager: ["/", "/raw-materials", "/finished-products", "/suppliers", "/reports", "/notifications"],
  qc_officer: ["/", "/quality-control", "/production", "/reports", "/notifications"],
  sales_staff: ["/", "/sales", "/finished-products", "/notifications", "/reports"],
};
