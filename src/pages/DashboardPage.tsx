import { Package, Factory, FlaskConical, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { rawMaterials, productionBatches, finishedProducts, salesOrders, productionChartData } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const statCards = [
  { label: "Raw Materials", value: rawMaterials.length, sub: `${rawMaterials.filter(r => r.stock < r.minStock).length} low stock`, icon: Package, color: "text-primary" },
  { label: "Active Batches", value: productionBatches.filter(b => b.status === "in_progress").length, sub: `${productionBatches.filter(b => b.status === "planned").length} planned`, icon: Factory, color: "text-secondary" },
  { label: "QC Pass Rate", value: "75%", sub: "Last 7 days", icon: FlaskConical, color: "text-success" },
  { label: "Pending Orders", value: salesOrders.filter(o => o.status === "pending" || o.status === "confirmed").length, sub: `KES ${salesOrders.reduce((a, o) => a + o.total, 0).toLocaleString()}`, icon: ShoppingCart, color: "text-info" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back. Here's your production overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-heading font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Weekly Production Volume</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={productionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { icon: CheckCircle, text: "Batch B-20260325-001 completed", time: "2h ago", iconColor: "text-success" },
              { icon: FlaskConical, text: "QC passed for Orange Blast", time: "3h ago", iconColor: "text-primary" },
              { icon: AlertTriangle, text: "Sugar stock below minimum", time: "5h ago", iconColor: "text-warning" },
              { icon: TrendingUp, text: "Order SO-003 confirmed", time: "6h ago", iconColor: "text-info" },
              { icon: Clock, text: "Mango Tango batch started", time: "8h ago", iconColor: "text-secondary" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <item.icon className={`w-4 h-4 mt-0.5 ${item.iconColor}`} />
                <div className="flex-1">
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Low Stock Alerts</h3>
          <div className="space-y-3">
            {rawMaterials.filter(r => r.stock < r.minStock * 1.5).map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.supplier}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${m.stock < m.minStock ? "text-destructive" : "text-warning"}`}>
                    {m.stock} {m.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">Min: {m.minStock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Active Production</h3>
          <div className="space-y-3">
            {productionBatches.filter(b => b.status !== "completed").map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{b.product}</p>
                  <p className="text-xs text-muted-foreground">{b.id}</p>
                </div>
                <span className={b.status === "in_progress" ? "status-badge-warning" : "status-badge-info"}>
                  {b.status === "in_progress" ? "In Progress" : "Planned"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
