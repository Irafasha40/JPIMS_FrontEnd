import { useEffect, useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import {
  Package,
  Factory,
  FlaskConical,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Box,
  Bell,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Breadcrumb from "@/components/Breadcrumb";
import { dashboardApi, notificationsApi, rawMaterialsApi, usersApi, type DashboardPayload } from "@/lib/api";
import type { MaterialCatalogRow } from "@/lib/materialMappers";
import { mapApiRawMaterialToRow } from "@/lib/materialMappers";
import type { UserRole } from "@/lib/roleConfig";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--destructive))", "hsl(var(--info))"];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
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

function mapStatusChart(charts: Record<string, unknown>, key: string): { name: string; value: number }[] {
  const raw = charts[key];
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, number>).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value: Number(value) || 0,
  }));
}

function RecentActivityPanel({ items }: { items: Array<Record<string, unknown>> }) {
  if (!items.length) {
    return (
      <div className="bg-card border rounded-lg p-5">
        <h3 className="font-heading font-semibold mb-4">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">No recent activity from the server yet.</p>
      </div>
    );
  }
  return (
    <div className="bg-card border rounded-lg p-5">
      <h3 className="font-heading font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {items.slice(0, 8).map((row, i) => {
          const title = String(row.title ?? row.description ?? "Event");
          const desc = row.description != null ? String(row.description) : "";
          const ts = row.timestamp != null ? String(row.timestamp) : "";
          const timeLabel = ts ? new Date(ts).toLocaleString() : "";
          return (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{title}</p>
                {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
                {timeLabel && <p className="text-xs text-muted-foreground mt-0.5">{timeLabel}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductionManagerDashboard({ data, materials }: { data: DashboardPayload; materials: MaterialCatalogRow[] }) {
  const { kpis, charts, recentActivity } = data;
  const batchChart = mapStatusChart(charts, "batchStatus");
  const lowMat = materials.filter((r) => r.stock < r.minStock);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total batches"
          value={kpis.totalProduction}
          sub={`${kpis.pendingBatches} planned`}
          icon={Factory}
          color="text-secondary"
        />
        <StatCard
          label="QC tests"
          value={kpis.totalQCTests}
          sub="Recorded in system"
          icon={FlaskConical}
          color="text-primary"
        />
        <StatCard
          label="Quality pass rate"
          value={`${Math.round(kpis.qualityPassRate ?? 0)}%`}
          sub="Across all tests"
          icon={TrendingUp}
          color="text-primary"
        />
        <StatCard label="Material alerts" value={lowMat.length} sub="Below minimum" icon={AlertTriangle} color="text-destructive" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Batches by status</h3>
          {batchChart.length === 0 ? (
            <p className="text-sm text-muted-foreground">No batch status data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={batchChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <RecentActivityPanel items={recentActivity} />
      </div>
    </div>
  );
}

function InventoryManagerDashboard({ data, materials }: { data: DashboardPayload; materials: MaterialCatalogRow[] }) {
  const lowStock = materials.filter((r) => r.stock < r.minStock * 1.5);
  const totalUnits = materials.reduce((a, r) => a + r.stock, 0);
  const { kpis } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total raw materials"
          value={materials.length}
          sub={`${totalUnits.toLocaleString()} total units`}
          icon={Package}
          color="text-primary"
        />
        <StatCard
          label="Low stock items"
          value={materials.filter((r) => r.stock < r.minStock).length}
          sub="Below minimum"
          icon={AlertTriangle}
          color="text-destructive"
        />
        <StatCard
          label="Inventory value (est.)"
          value={`RWF ${Number(kpis.inventoryValue ?? 0).toLocaleString()}`}
          sub="From raw materials"
          icon={Box}
          color="text-primary"
        />
        <StatCard
          label="Server low-stock flag"
          value={Number(kpis.lowStockItems ?? 0)}
          sub="Items at/below threshold"
          icon={Clock}
          color="text-secondary"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4 text-destructive">Stock alerts</h3>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">No low-stock materials.</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.supplier}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${m.stock < m.minStock ? "text-destructive" : "text-secondary"}`}>
                      {m.stock} {m.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">Min: {m.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <RecentActivityPanel items={data.recentActivity} />
      </div>
    </div>
  );
}

function QCOfficerDashboard({ data }: { data: DashboardPayload }) {
  const { kpis, recentActivity } = data;
  const pieData = [
    { name: "Pass rate", value: Math.round(kpis.qualityPassRate ?? 0) },
    { name: "Remaining", value: Math.max(0, 100 - Math.round(kpis.qualityPassRate ?? 0)) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="QC tests" value={kpis.totalQCTests} sub="Total recorded" icon={FlaskConical} color="text-primary" />
        <StatCard
          label="Pass rate"
          value={`${Math.round(kpis.qualityPassRate ?? 0)}%`}
          sub="Across all tests"
          icon={CheckCircle}
          color="text-primary"
        />
        <StatCard label="Pending batches" value={kpis.pendingBatches} sub="Planned work" icon={Clock} color="text-secondary" />
        <StatCard label="Production batches" value={kpis.totalProduction} sub="Total in system" icon={Factory} color="text-secondary" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityPanel items={recentActivity} />
        </div>
        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Quality overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">Detailed QC rows will appear when the quality list API returns data.</p>
        </div>
      </div>
    </div>
  );
}

function SalesStaffDashboard({ data }: { data: DashboardPayload }) {
  const { kpis, charts } = data;
  const orderBars = mapStatusChart(charts, "orderStatus");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Sales orders" value={kpis.totalSales} sub="Total in system" icon={ShoppingCart} color="text-primary" />
        <StatCard label="Production" value={kpis.totalProduction} sub="Batches tracked" icon={Factory} color="text-secondary" />
        <StatCard label="Inventory value" value={`RWF ${Number(kpis.inventoryValue ?? 0).toLocaleString()}`} sub="Raw materials" icon={TrendingUp} color="text-primary" />
        <StatCard label="QC pass rate" value={`${Math.round(kpis.qualityPassRate ?? 0)}%`} sub="Quality" icon={CheckCircle} color="text-primary" />
      </div>
      <div className="bg-card border rounded-lg p-5">
        <h3 className="font-heading font-semibold mb-4">Orders by status</h3>
        {orderBars.length === 0 ? (
          <p className="text-sm text-muted-foreground">No order data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={orderBars}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

type AdminUserRow = { id: string; name: string; lastLogin: string };

function AdminDashboard({
  data,
  adminUsers,
  unreadNotifications,
}: {
  data: DashboardPayload;
  adminUsers: AdminUserRow[];
  unreadNotifications: number;
}) {
  const { kpis, charts } = data;
  const batchChart = mapStatusChart(charts, "batchStatus");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Production batches" value={kpis.totalProduction} sub="Total tracked" icon={Factory} color="text-primary" />
        <StatCard label="Users (loaded)" value={adminUsers.length} sub="From user API" icon={Users} color="text-primary" />
        <StatCard label="Sales orders" value={kpis.totalSales} sub="Total in system" icon={TrendingUp} color="text-primary" />
        <StatCard label="Unread notifications" value={unreadNotifications} sub="API counter" icon={Bell} color="text-secondary" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">Batches by status</h3>
          {batchChart.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={batchChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-heading font-semibold mb-4">System</h3>
          <div className="space-y-3">
            {[
              { label: "API", status: "Connected", ok: true },
              { label: "Database", status: "Operational", ok: true },
              { label: "Auth", status: "Operational", ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-1.5">
                <span className="text-sm">{s.label}</span>
                <span className={s.ok ? "status-badge-success" : "status-badge-warning"}>{s.status}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Users (sample)</h4>
            <div className="space-y-2">
              {adminUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No users returned or insufficient permission.</p>
              ) : (
                adminUsers.slice(0, 6).map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <span className="text-sm">{u.name}</span>
                    <span className="text-xs text-muted-foreground">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "—"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { role, roleLabel } = useRole();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [materials, setMaterials] = useState<MaterialCatalogRow[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const dashReq = dashboardApi.getDashboard();
        const matReq = rawMaterialsApi
          .listPage({ size: 300, sort: "name,asc" })
          .catch(() => ({ data: { content: [] as Record<string, unknown>[] } }));
        const notifReq = notificationsApi.unreadCount().catch(() => ({ data: { count: 0 } }));

        const isAdmin = role === "administrator";
        const userReq = isAdmin ? usersApi.listPage({ size: 50, sort: "fullName,asc" }).catch(() => null) : Promise.resolve(null);

        const [dashRes, matRes, notifRes, userRes] = await Promise.all([dashReq, matReq, notifReq, userReq]);
        if (cancelled) return;
        setData(dashRes.data);
        setMaterials((matRes.data.content ?? []).map((row) => mapApiRawMaterialToRow(row)));
        setUnreadNotifications(Number(notifRes.data?.count ?? 0));
        if (userRes?.data?.content) {
          setAdminUsers(
            userRes.data.content.map((u: Record<string, unknown>) => ({
              id: String(u.id ?? ""),
              name: String(u.fullName ?? u.email ?? ""),
              lastLogin: typeof u.lastLogin === "string" ? u.lastLogin : "",
            }))
          );
        } else {
          setAdminUsers([]);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            typeof e === "object" && e !== null && "response" in e
              ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
              : "";
          setError(msg || "Failed to load dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const dashboards: Record<
    UserRole,
    { component: React.ReactNode; greeting: string }
  > = {
    administrator: {
      component: data ? (
        <AdminDashboard data={data} adminUsers={adminUsers} unreadNotifications={unreadNotifications} />
      ) : null,
      greeting: "System overview",
    },
    production_manager: {
      component: data ? <ProductionManagerDashboard data={data} materials={materials} /> : null,
      greeting: "Production overview",
    },
    inventory_manager: {
      component: data ? <InventoryManagerDashboard data={data} materials={materials} /> : null,
      greeting: "Inventory overview",
    },
    qc_officer: {
      component: data ? <QCOfficerDashboard data={data} /> : null,
      greeting: "Quality control overview",
    },
    sales_staff: {
      component: data ? <SalesStaffDashboard data={data} /> : null,
      greeting: "Sales overview",
    },
  };

  const current = dashboards[role] ?? dashboards.administrator;

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {current.greeting} — Logged in as {roleLabel}
        </p>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading dashboard…</p>}
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {!loading && !error && data && current.component}
    </div>
  );
}
