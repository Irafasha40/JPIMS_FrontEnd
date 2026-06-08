export type MaterialCatalogRow = {
  id: string;
  name: string;
  category: string;
  supplier: string;
  stock: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  lastPurchase: string;
};

export function mapApiRawMaterialToRow(m: Record<string, unknown>): MaterialCatalogRow {
  const supplier = m.supplier as { name?: string } | null | undefined;
  const stock = Number(m.currentStock ?? 0);
  const minStock = Number(m.minimumThreshold ?? 0);
  const updatedAt = typeof m.updatedAt === "string" ? m.updatedAt.slice(0, 10) : "—";
  return {
    id: String(m.id ?? ""),
    name: String(m.name ?? ""),
    category: m.category != null ? String(m.category) : "—",
    supplier: supplier?.name ?? "—",
    stock,
    unit: m.unitOfMeasure != null ? String(m.unitOfMeasure) : "",
    minStock,
    costPerUnit: Number(m.costPerUnit ?? 0),
    lastPurchase: updatedAt,
  };
}
