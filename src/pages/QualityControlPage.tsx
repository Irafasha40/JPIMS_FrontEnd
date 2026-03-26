import { qualityTests } from "@/lib/mockData";
import { Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QualityControlPage() {
  return (
    <div className="space-y-6">
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Quality Control</h1>
          <p className="text-sm text-muted-foreground">Record and review pH, Brix, and quality test results</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Test</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Tests</p>
          <p className="text-2xl font-heading font-bold mt-1">{qualityTests.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Pass Rate</p>
          <p className="text-2xl font-heading font-bold mt-1 text-success">
            {Math.round((qualityTests.filter(q => q.result === "pass").length / qualityTests.filter(q => q.result !== "pending").length) * 100)}%
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-heading font-bold mt-1 text-warning">
            {qualityTests.filter(q => q.result === "pending").length}
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="data-table">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Test ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Batch</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">pH</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Brix</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Appearance</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Result</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Tested By</th>
            </tr>
          </thead>
          <tbody>
            {qualityTests.map((q) => (
              <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{q.id}</td>
                <td className="px-4 py-3 text-xs font-mono">{q.batchId}</td>
                <td className="px-4 py-3 font-medium">{q.product}</td>
                <td className="px-4 py-3">{q.ph ?? "—"}</td>
                <td className="px-4 py-3">{q.brix ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{q.appearance ?? "—"}</td>
                <td className="px-4 py-3">
                  {q.result === "pass" && <span className="status-badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Pass</span>}
                  {q.result === "fail" && <span className="status-badge-danger"><XCircle className="w-3 h-3 mr-1" /> Fail</span>}
                  {q.result === "pending" && <span className="status-badge-warning"><Clock className="w-3 h-3 mr-1" /> Pending</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{q.testedBy ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-card border rounded-lg p-5">
        <h3 className="font-heading font-semibold mb-3">Acceptable Ranges</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground uppercase">pH Range</p>
            <p className="font-semibold mt-1">3.0 – 4.5</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground uppercase">Brix Range</p>
            <p className="font-semibold mt-1">10.0 – 14.0 °Bx</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground uppercase">Appearance</p>
            <p className="font-semibold mt-1">Clear / Slightly cloudy</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground uppercase">Shelf Life</p>
            <p className="font-semibold mt-1">6 months</p>
          </div>
        </div>
      </div>
    </div>
  );
}
