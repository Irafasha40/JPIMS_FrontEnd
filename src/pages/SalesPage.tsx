import { salesOrders } from "@/lib/mockData";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "status-badge-warning" },
  confirmed: { label: "Confirmed", cls: "status-badge-info" },
  shipped: { label: "Shipped", cls: "status-badge-success" },
  delivered: { label: "Delivered", cls: "status-badge-success" },
};

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Sales & Orders</h1>
          <p className="text-sm text-muted-foreground">Process orders, manage customers, and track sales</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Order</Button>
      </div>

      <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search orders..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="data-table">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Order ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Items</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {salesOrders.map((o) => {
              const s = statusMap[o.status];
              return (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{o.id}</td>
                  <td className="px-4 py-3 font-medium">{o.customer}</td>
                  <td className="px-4 py-3">{o.items}</td>
                  <td className="px-4 py-3 font-semibold">KES {o.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                  <td className="px-4 py-3"><span className={s.cls}>{s.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
