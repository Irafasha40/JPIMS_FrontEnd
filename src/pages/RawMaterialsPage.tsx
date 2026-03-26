import { rawMaterials } from "@/lib/mockData";
import { Plus, Search, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RawMaterialsPage() {
  return (
    <div className="space-y-6">
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Raw Materials</h1>
          <p className="text-sm text-muted-foreground">Manage raw material inventory and supplier records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Material</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search materials..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="data-table">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Stock</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Min Stock</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Cost/Unit</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {rawMaterials.map((m) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{m.id}</td>
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.supplier}</td>
                <td className="px-4 py-3 font-semibold">{m.stock.toLocaleString()} {m.unit}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.minStock} {m.unit}</td>
                <td className="px-4 py-3">KES {m.costPerUnit.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {m.stock < m.minStock ? (
                    <span className="status-badge-danger"><AlertTriangle className="w-3 h-3 mr-1" /> Low</span>
                  ) : m.stock < m.minStock * 1.5 ? (
                    <span className="status-badge-warning">Warning</span>
                  ) : (
                    <span className="status-badge-success">In Stock</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
