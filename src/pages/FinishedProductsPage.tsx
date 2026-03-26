import { finishedProducts } from "@/lib/mockData";
import { Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function FinishedProductsPage() {
  return (
    <div className="space-y-6">
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Finished Products</h1>
          <p className="text-sm text-muted-foreground">Track finished goods inventory, expiry dates, and stock levels</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search products..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {finishedProducts.map((p) => (
          <div key={p.id} className="bg-card border rounded-lg p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{p.batch}</p>
              </div>
              {p.status === "available" && <CheckCircle className="w-5 h-5 text-success" />}
              {p.status === "near_expiry" && <AlertTriangle className="w-5 h-5 text-warning" />}
              {p.status === "expired" && <XCircle className="w-5 h-5 text-destructive" />}
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock</span>
                <span className="font-semibold">{p.stock.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiry</span>
                <span>{p.expiry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span>{p.location}</span>
              </div>
            </div>
            <div>
              {p.status === "available" && <span className="status-badge-success">Available</span>}
              {p.status === "near_expiry" && <span className="status-badge-warning">Near Expiry</span>}
              {p.status === "expired" && <span className="status-badge-danger">Expired</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
