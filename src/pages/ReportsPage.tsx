import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { dashboardApi, finishedProductsApi, rawMaterialsApi, reportsApi, type DashboardPayload } from "@/lib/api";
import { mapApiRawMaterialToRow } from "@/lib/materialMappers";

const COLORS = ["hsl(145, 55%, 36%)", "hsl(30, 85%, 55%)", "hsl(0, 72%, 51%)", "hsl(210, 80%, 52%)"];

function mapStatusChart(charts: Record<string, unknown>, key: string): { name: string; value: number }[] {
  const raw = charts[key];
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, number>).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value: Number(value) || 0,
  }));
}

export default function ReportsPage() {
  const [dash, setDash] = useState<DashboardPayload | null>(null);
  const [rawCount, setRawCount] = useState(0);
  const [rawValue, setRawValue] = useState(0);
  const [finishedCount, setFinishedCount] = useState(0);
  const [finishedValue, setFinishedValue] = useState(0);
  const [productionReport, setProductionReport] = useState<Record<string, unknown>>({});
  const [qualityReport, setQualityReport] = useState<Record<string, unknown>>({});
  const [rawInvReport, setRawInvReport] = useState<Record<string, unknown>>({});
  const [salesReport, setSalesReport] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [dRes, rPage, fPage, prod, qual, rInv, sal] = await Promise.all([
          dashboardApi.getDashboard(),
          rawMaterialsApi.listPage({ size: 500 }),
          finishedProductsApi.listPage({ size: 500 }).catch(() => ({ data: { content: [] as Record<string, unknown>[] } })),
          reportsApi.production().catch(() => ({ data: {} })),
          reportsApi.quality().catch(() => ({ data: {} })),
          reportsApi.rawInventory().catch(() => ({ data: {} })),
          reportsApi.sales().catch(() => ({ data: {} })),
        ]);
        if (cancelled) return;
        setDash(dRes.data);
        const mats = (rPage.data.content ?? []).map((row) => mapApiRawMaterialToRow(row));
        setRawCount(mats.length);
        setRawValue(mats.reduce((a, m) => a + m.stock * m.costPerUnit, 0));
        const fins = fPage.data.content ?? [];
        setFinishedCount(fins.length);
        setFinishedValue(
          fins.reduce((a, p) => {
            const stock = Number((p as Record<string, unknown>).quantityOnHand ?? (p as Record<string, unknown>).stock ?? 0);
            const cost = Number((p as Record<string, unknown>).unitCost ?? 0);
            return a + stock * cost;
          }, 0)
        );
        setProductionReport(prod.data as Record<string, unknown>);
        setQualityReport(qual.data as Record<string, unknown>);
        setRawInvReport(rInv.data as Record<string, unknown>);
        setSalesReport(sal.data as Record<string, unknown>);
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            typeof e === "object" && e !== null && "response" in e
              ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
              : "";
          setError(msg || "Could not load reports.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = dash?.kpis;
  const charts = dash?.charts ?? {};
  const batchChart = mapStatusChart(charts, "batchStatus");
  const passCount = kpis ? Math.round(((kpis.qualityPassRate ?? 0) / 100) * (kpis.totalQCTests || 0)) : 0;
  const failCount = kpis ? Math.max(0, (kpis.totalQCTests || 0) - passCount) : 0;
  const pieData = [
    { name: "Pass", value: passCount || 0 },
    { name: "Fail", value: failCount || 0 },
  ];
  const qcTrendData = [{ week: "Current", passRate: Math.round(kpis?.qualityPassRate ?? 0) }];
  const productionChartData = batchChart.length ? batchChart.map((b) => ({ day: b.name, volume: b.value, batches: b.value })) : [{ day: "—", volume: 0, batches: 0 }];
  const materialUsageData =
    dash && rawCount
      ? [{ name: "Raw materials", cost: rawValue }]
      : [{ name: "—", cost: 0 }];
  const salesChartData = [{ month: "Current", revenue: Number(salesReport.totalRevenue ?? 0) || 0 }];

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Comprehensive production, quality, inventory, and sales reports</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-1" />
          Export All
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading report data…</p>}
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase">Production</p>
          <p className="text-xl font-heading font-bold mt-1">{kpis?.totalProduction ?? 0} batches</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase">Material value (est.)</p>
          <p className="text-xl font-heading font-bold mt-1">RWF {rawValue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase">QC Pass Rate</p>
          <p className="text-xl font-heading font-bold mt-1 text-primary">{Math.round(kpis?.qualityPassRate ?? 0)}%</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase">Inventory Value</p>
          <p className="text-xl font-heading font-bold mt-1">RWF {(rawValue + finishedValue).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase">Sales (system)</p>
          <p className="text-xl font-heading font-bold mt-1">{kpis?.totalSales ?? 0} orders</p>
        </div>
      </div>

      <Tabs defaultValue="production">
        <TabsList className="flex-wrap">
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="api">API payloads</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="mt-4">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-heading font-semibold mb-4">Batches by status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-heading font-semibold mb-4">Raw material value (catalog)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={materialUsageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={140} />
                <Tooltip />
                <Bar dataKey="cost" fill="hsl(var(--primary))" name="Cost (RWF)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-heading font-semibold mb-4">Pass/Fail (estimated from KPIs)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-heading font-semibold mb-4">Pass rate</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={qcTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="passRate" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Total Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium">Raw Materials</td>
                  <td className="px-4 py-3">{rawCount}</td>
                  <td className="px-4 py-3 font-semibold">RWF {rawValue.toLocaleString()}</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium">Finished Goods</td>
                  <td className="px-4 py-3">{finishedCount}</td>
                  <td className="px-4 py-3 font-semibold">RWF {finishedValue.toLocaleString()}</td>
                </tr>
                <tr className="bg-muted/50 font-bold">
                  <td className="px-4 py-3" colSpan={2}>
                    Combined Total
                  </td>
                  <td className="px-4 py-3">RWF {(rawValue + finishedValue).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-heading font-semibold mb-4">Sales report endpoint</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (RWF)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="api" className="mt-4 space-y-4">
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">GET /api/reports/production</h3>
            <pre className="text-xs overflow-auto max-h-48 bg-muted p-3 rounded-md">{JSON.stringify(productionReport, null, 2)}</pre>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">GET /api/reports/quality</h3>
            <pre className="text-xs overflow-auto max-h-48 bg-muted p-3 rounded-md">{JSON.stringify(qualityReport, null, 2)}</pre>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">GET /api/reports/inventory/raw-materials</h3>
            <pre className="text-xs overflow-auto max-h-48 bg-muted p-3 rounded-md">{JSON.stringify(rawInvReport, null, 2)}</pre>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">GET /api/reports/sales</h3>
            <pre className="text-xs overflow-auto max-h-48 bg-muted p-3 rounded-md">{JSON.stringify(salesReport, null, 2)}</pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
