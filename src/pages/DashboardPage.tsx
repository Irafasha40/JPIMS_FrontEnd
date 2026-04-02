import { useRole } from "@/contexts/RoleContext";
import { Package, Factory, FlaskConical, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, Shield, Box, Bell } from "lucide-react";
import { rawMaterials, productionBatches, finishedProducts, salesOrders, qualityTests, productionChartData, qcTrendData, salesChartData, users, notifications } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import Breadcrumb from "@/components/Breadcrumb";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--destructive))", "hsl(var(--info))"];

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub: string; icon: any; color: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-heading font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function RecentActivity() {
  const items = [
    { icon: CheckCircle, text: "Batch B-20260325-001 completed", time: "2h ago", iconColor: "text-primary" },
    { icon: FlaskConical, text: "QC passed for Orange Blast", time: "3h ago", iconColor: "text-primary" },
    { icon: AlertTriangle, text: "Sugar stock below minimum", time: "5h ago", iconColor: "text-secondary" },
    { icon: TrendingUp, text: "Order SO-003 confirmed", time: "6h ago", iconColor: "text-info" },
    { icon: Clock, text: "Mango Tango batch started", time: "8h ago", iconColor: "text-secondary" },
  ];
  return (
    <div className="bg-card border rounded-lg p-5">
      <h3 className="font-heading font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <item.icon className={`w-4 h-4 mt-0.5 ${item.iconColor}`} />
            <div className="flex-1"><p className="text-sm">{item.text}</p><p className="text-xs text-muted-foreground">{item.time}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductionManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Batches" value={productionBatches.filter(b => b.status === "in_progress").length} sub={`${productionBatches.filter(b => b.status === "planned").length} planned`} icon={Factory} color="text-secondary" />
        <StatCard label="QC Pending" value={qualityTests.filter(q => q.result === "pending").length} sub="Awaiting testing" icon={FlaskConical} color="text-primary" />
        <StatCard label="Today's Volume" value="14,500" sub="Units produced" icon={TrendingUp} color="text-primary" />
        <StatCard label="Material Alerts" value={rawMaterials.filter(r => r.stock < r.minStock).length} sub="Below threshold" icon={AlertTriangle} color="text-destructive" />
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
        <RecentActivity />
      </div>
      <div className="bg-card border rounded-lg p-5">
        <h3 className="font-heading font-semibold mb-4">Active Batches</h3>
        <table className="data-table w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Batch #</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Product</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Status</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Start</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Assigned</th>
          </tr></thead>
          <tbody>{productionBatches.filter(b => b.status !== "completed").map(b => (
            <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-2 font-mono text-xs">{b.id}</td>
              <td className="px-4 py-2 font-medium">{b.product}</td>
              <td className="px-4 py-2"><span className={b.status === "in_progress" ? "status-badge-warning" : b.status === "qc_pending" ? "status-badge-info" : "status-badge-info"}>{b.status === "in_progress" ? "In Progress" : b.status === "qc_pending" ? "QC Pending" : "Planned"}</span></td>
              <td className="px-4 py-2 text-muted-foreground">{b.startDate}</td>
              <td className="px-4 py-2">{b.assignedTo}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryManagerDashboard() {
  const lowStock = rawMaterials.filter(r => r.stock < r.minStock * 1.5);
  const nearExpiry = finishedProducts.filter(p => p.status === "near_expiry" || p.status === "expired");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Raw Materials" value={rawMaterials.length} sub={`${rawMaterials.reduce((a, r) => a + r.stock, 0).toLocaleString()} total units`} icon={Package} color="text-primary" />
        <StatCard label="Low Stock Items" value={rawMaterials.filter(r => r.stock < r.minStock).length} sub="Below minimum" icon={AlertTriangle} color="text-destructive" />
        <StatCard label="Finished Goods" value={finishedProducts.reduce((a, p) => a + p.stock, 0).toLocaleString()} sub={`${finishedProducts.length} products`} icon={Box} color="text-primary" />
        <StatCard label="Near-Expiry Items" value={nearExpiry.length} sub="Action required" icon={Clock} color="text-secondary" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4 text-destructive">⚠ Stock Alerts</h3>
          <div className="space-y-3">
            {lowStock.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.supplier}</p></div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${m.stock < m.minStock ? "text-destructive" : "text-secondary"}`}>{m.stock} {m.unit}</p>
                  <p className="text-xs text-muted-foreground">Min: {m.minStock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Finished Goods by Product</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={finishedProducts.filter(p => p.stock > 0)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={130} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="stock" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function QCOfficerDashboard() {
  const passCount = qualityTests.filter(q => q.result === "pass").length;
  const failCount = qualityTests.filter(q => q.result === "fail").length;
  const pendingCount = qualityTests.filter(q => q.result === "pending").length;
  const tested = qualityTests.filter(q => q.result !== "pending").length;
  const pieData = [{ name: "Pass", value: passCount }, { name: "Fail", value: failCount }];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tests Today" value={qualityTests.length} sub="Total recorded" icon={FlaskConical} color="text-primary" />
        <StatCard label="Pass Rate" value={tested > 0 ? `${Math.round((passCount / tested) * 100)}%` : "—"} sub={`${passCount} of ${tested} passed`} icon={CheckCircle} color="text-primary" />
        <StatCard label="Pending Tests" value={pendingCount} sub="Awaiting QC" icon={Clock} color="text-secondary" />
        <StatCard label="Failed Batches" value={failCount} sub="Requires action" icon={AlertTriangle} color="text-destructive" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Recent QC Results</h3>
          <table className="data-table w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Batch</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Product</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">pH</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Brix</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Result</th>
            </tr></thead>
            <tbody>{qualityTests.map(q => (
              <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2 font-mono text-xs">{q.batchId}</td>
                <td className="px-4 py-2 font-medium">{q.product}</td>
                <td className="px-4 py-2">{q.ph ?? "—"}</td>
                <td className="px-4 py-2">{q.brix ?? "—"}</td>
                <td className="px-4 py-2">
                  <span className={q.result === "pass" ? "status-badge-success" : q.result === "fail" ? "status-badge-danger" : "status-badge-warning"}>
                    {q.result === "pass" ? "✓ Pass" : q.result === "fail" ? "✗ Fail" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Quality Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={qcTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="passRate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SalesStaffDashboard() {
  const pending = salesOrders.filter(o => o.status === "pending").length;
  const confirmed = salesOrders.filter(o => o.status === "confirmed").length;
  const shipped = salesOrders.filter(o => o.status === "shipped").length;
  const delivered = salesOrders.filter(o => o.status === "delivered").length;
  const totalRevenue = salesOrders.reduce((a, o) => a + o.total, 0);
  const kanbanStatuses = [
    { label: "Pending", items: salesOrders.filter(o => o.status === "pending"), color: "border-secondary" },
    { label: "Confirmed", items: salesOrders.filter(o => o.status === "confirmed"), color: "border-info" },
    { label: "Shipped", items: salesOrders.filter(o => o.status === "shipped"), color: "border-primary" },
    { label: "Delivered", items: salesOrders.filter(o => o.status === "delivered"), color: "border-primary" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Orders Today" value={salesOrders.length} sub="Total orders" icon={ShoppingCart} color="text-primary" />
        <StatCard label="Pending" value={pending} sub="Awaiting confirmation" icon={Clock} color="text-secondary" />
        <StatCard label="Delivered" value={delivered} sub="Completed" icon={CheckCircle} color="text-primary" />
        <StatCard label="Total Revenue" value={`RWF ${totalRevenue.toLocaleString()}`} sub="All orders" icon={TrendingUp} color="text-primary" />
      </div>
      <div>
        <h3 className="font-heading font-semibold mb-4">Order Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kanbanStatuses.map(col => (
            <div key={col.label} className={`bg-card border-t-4 ${col.color} border rounded-lg p-4`}>
              <h4 className="text-sm font-semibold mb-3">{col.label} ({col.items.length})</h4>
              <div className="space-y-2">
                {col.items.map(o => (
                  <div key={o.id} className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-mono text-muted-foreground">{o.id}</p>
                    <p className="text-sm font-medium mt-0.5">{o.customer}</p>
                    <p className="text-xs text-muted-foreground mt-1">RWF {o.total.toLocaleString()}</p>
                  </div>
                ))}
                {col.items.length === 0 && <p className="text-xs text-muted-foreground italic">No orders</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const activeUsers = users.filter(u => u.status === "active").length;
  const totalRevenue = salesOrders.reduce((a, o) => a + o.total, 0);
  const unreadNotifs = notifications.filter(n => !n.read).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Production" value={productionBatches.length} sub={`${productionBatches.filter(b => b.status === "completed").length} completed`} icon={Factory} color="text-primary" />
        <StatCard label="Active Users" value={activeUsers} sub={`of ${users.length} total`} icon={Users} color="text-primary" />
        <StatCard label="Revenue (Month)" value={`RWF ${totalRevenue.toLocaleString()}`} sub={`${salesOrders.length} orders`} icon={TrendingUp} color="text-primary" />
        <StatCard label="Alerts" value={unreadNotifs} sub="Unread notifications" icon={Bell} color="text-secondary" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Sales Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">System Health</h3>
          <div className="space-y-3">
            {[
              { label: "Database", status: "Operational", ok: true },
              { label: "Auth Service", status: "Operational", ok: true },
              { label: "File Storage", status: "Operational", ok: true },
              { label: "Email Service", status: "Degraded", ok: false },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5">
                <span className="text-sm">{s.label}</span>
                <span className={s.ok ? "status-badge-success" : "status-badge-warning"}>{s.status}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Recent Logins</h4>
            <div className="space-y-2">
              {users.filter(u => u.status === "active").slice(0, 4).map(u => (
                <div key={u.id} className="flex items-center justify-between">
                  <span className="text-sm">{u.name}</span>
                  <span className="text-xs text-muted-foreground">{u.lastLogin.split("T")[1].substring(0, 5)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { role, roleLabel } = useRole();

  const dashboards: Record<string, { component: JSX.Element; greeting: string }> = {
    administrator: { component: <AdminDashboard />, greeting: "System Overview" },
    production_manager: { component: <ProductionManagerDashboard />, greeting: "Production Overview" },
    inventory_manager: { component: <InventoryManagerDashboard />, greeting: "Inventory Overview" },
    qc_officer: { component: <QCOfficerDashboard />, greeting: "Quality Control Overview" },
    sales_staff: { component: <SalesStaffDashboard />, greeting: "Sales Overview" },
  };

  const current = dashboards[role] || dashboards.administrator;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">{current.greeting} — Logged in as {roleLabel}</p>
      </div>
      {current.component}
    </div>
  );
}
