import { rawMaterials, finishedProducts, productionBatches, salesOrders, qualityTests, productionChartData, materialUsageData, salesChartData, qcTrendData } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

const COLORS = ["hsl(145, 55%, 36%)", "hsl(30, 85%, 55%)", "hsl(0, 72%, 51%)", "hsl(210, 80%, 52%)"];

export default function ReportsPage() {
  const totalRawValue = rawMaterials.reduce((a, r) => a + r.stock * r.costPerUnit, 0);
  const totalFinishedValue = finishedProducts.reduce((a, p) => a + p.stock * p.unitCost, 0);
  const passCount = qualityTests.filter(q => q.result === "pass").length;
  const failCount = qualityTests.filter(q => q.result === "fail").length;
  const pieData = [{ name: "Pass", value: passCount }, { name: "Fail", value: failCount }];

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div><h1 className="text-2xl font-heading font-bold">Reports & Analytics</h1><p className="text-sm text-muted-foreground">Comprehensive production, quality, inventory, and sales reports</p></div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Export All</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Production (Month)</p><p className="text-xl font-heading font-bold mt-1">{productionBatches.length} batches</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Material Usage</p><p className="text-xl font-heading font-bold mt-1">KES {materialUsageData.reduce((a, m) => a + m.cost, 0).toLocaleString()}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">QC Pass Rate</p><p className="text-xl font-heading font-bold mt-1 text-primary">{Math.round((passCount / (passCount + failCount)) * 100)}%</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Inventory Value</p><p className="text-xl font-heading font-bold mt-1">KES {(totalRawValue + totalFinishedValue).toLocaleString()}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Sales Revenue</p><p className="text-xl font-heading font-bold mt-1">KES {salesOrders.reduce((a, o) => a + o.total, 0).toLocaleString()}</p></div>
      </div>

      <Tabs defaultValue="production">
        <TabsList className="flex-wrap">
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="mt-4">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-heading font-semibold mb-4">Daily Production Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productionChartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><Tooltip /><Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="Volume" /><Bar dataKey="batches" fill="hsl(var(--secondary))" radius={[4,4,0,0]} name="Batches" /></BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-heading font-semibold mb-4">Raw Material Usage & Cost</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={materialUsageData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" /><YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={140} /><Tooltip /><Bar dataKey="cost" fill="hsl(var(--primary))" name="Cost (KES)" radius={[0,4,4,0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-heading font-semibold mb-4">Pass/Fail Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-heading font-semibold mb-4">Pass Rate Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={qcTrendData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><YAxis domain={[0,100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><Tooltip /><Line type="monotone" dataKey="passRate" stroke="hsl(var(--primary))" strokeWidth={2} /></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50"><th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Category</th><th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Items</th><th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Total Value</th></tr></thead>
              <tbody>
                <tr className="border-b"><td className="px-4 py-3 font-medium">Raw Materials</td><td className="px-4 py-3">{rawMaterials.length}</td><td className="px-4 py-3 font-semibold">KES {totalRawValue.toLocaleString()}</td></tr>
                <tr className="border-b"><td className="px-4 py-3 font-medium">Finished Goods</td><td className="px-4 py-3">{finishedProducts.length}</td><td className="px-4 py-3 font-semibold">KES {totalFinishedValue.toLocaleString()}</td></tr>
                <tr className="bg-muted/50 font-bold"><td className="px-4 py-3" colSpan={2}>Combined Total</td><td className="px-4 py-3">KES {(totalRawValue + totalFinishedValue).toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-heading font-semibold mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><Tooltip /><Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (KES)" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
