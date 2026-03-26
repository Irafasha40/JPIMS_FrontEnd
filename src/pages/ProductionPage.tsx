import { productionBatches } from "@/lib/mockData";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusMap: Record<string, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "status-badge-success" },
  in_progress: { label: "In Progress", cls: "status-badge-warning" },
  planned: { label: "Planned", cls: "status-badge-info" },
};

export default function ProductionPage() {
  return (
    <div className="space-y-6">
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Production Batches</h1>
          <p className="text-sm text-muted-foreground">Manage and track juice production batches</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Batch</Button>
      </div>

      <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search batches..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
      </div>

      <div className="grid gap-4">
        {productionBatches.map((b) => {
          const s = statusMap[b.status];
          return (
            <div key={b.id} className="bg-card border rounded-lg p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{b.id}</p>
                  <p className="font-medium mt-0.5">{b.product}</p>
                </div>
                <div className="text-sm text-muted-foreground hidden md:block">
                  <p>Qty: <span className="text-foreground font-medium">{b.quantity.toLocaleString()}</span></p>
                </div>
                <div className="text-sm text-muted-foreground hidden lg:block">
                  <p>Assigned: <span className="text-foreground">{b.assignedTo}</span></p>
                </div>
                <div className="text-sm text-muted-foreground hidden lg:block">
                  <p>Date: <span className="text-foreground">{b.startDate}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {b.yield !== null && (
                  <span className="text-sm font-medium">Yield: {b.yield}%</span>
                )}
                <span className={s.cls}>{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
