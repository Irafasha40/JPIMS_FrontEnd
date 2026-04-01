import { auditLogs, loginActivity, users } from "@/lib/mockData";
import { Shield, Search, Download, AlertTriangle, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import Breadcrumb from "@/components/Breadcrumb";
import Pagination from "@/components/Pagination";

const actionCls: Record<string, string> = { create: "status-badge-success", update: "status-badge-warning", login: "status-badge-info", login_failed: "status-badge-danger" };
const loginCls: Record<string, string> = { success: "status-badge-success", failed: "status-badge-danger", blocked: "status-badge-danger" };

export default function SecurityAuditPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const mfaAdoption = Math.round((users.filter(u => u.mfaEnabled).length / users.length) * 100);

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div><h1 className="text-2xl font-heading font-bold">Security & Audit</h1><p className="text-sm text-muted-foreground">Monitor security, login activity, and audit trails</p></div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Export Audit Log</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Data Encryption</p><p className="text-lg font-heading font-bold mt-1 text-primary">✓ AES-256</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">2FA Adoption</p><p className="text-lg font-heading font-bold mt-1">{mfaAdoption}%</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Login Anomalies</p><p className="text-lg font-heading font-bold mt-1 text-destructive">{loginActivity.filter(l => l.status !== "success").length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Active Sessions</p><p className="text-lg font-heading font-bold mt-1">{users.filter(u => u.status === "active").length}</p></div>
      </div>

      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="login">Login Activity</TabsTrigger>
          <TabsTrigger value="2fa">2FA Settings</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search audit logs..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
            </div>
            <Select defaultValue="all"><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Modules</SelectItem><SelectItem value="production">Production</SelectItem><SelectItem value="quality">Quality Control</SelectItem><SelectItem value="sales">Sales</SelectItem></SelectContent></Select>
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Module</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Details</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">IP</th>
              </tr></thead>
              <tbody>{auditLogs.map(log => (
                <tr key={log.id} className={`border-b last:border-0 hover:bg-muted/30 ${log.action === "login_failed" ? "bg-destructive/5" : ""}`}>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{log.user}</td>
                  <td className="px-4 py-3"><span className={actionCls[log.action] || "status-badge-info"}>{log.action.replace("_", " ")}</span></td>
                  <td className="px-4 py-3">{log.module}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">{log.details}</td>
                  <td className="px-4 py-3 font-mono text-xs">{log.ip}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={1} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} totalItems={auditLogs.length} />
        </TabsContent>

        <TabsContent value="login" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">IP Address</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Device</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr></thead>
              <tbody>{loginActivity.map(la => (
                <tr key={la.id} className={`border-b last:border-0 hover:bg-muted/30 ${la.status !== "success" ? "bg-destructive/5" : ""}`}>
                  <td className="px-4 py-3 font-medium">{la.user}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(la.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs">{la.ip}</td>
                  <td className="px-4 py-3">{la.device}</td>
                  <td className="px-4 py-3"><span className={loginCls[la.status]}>{la.status.charAt(0).toUpperCase() + la.status.slice(1)}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="2fa" className="mt-4">
          <div className="bg-card border rounded-lg p-6 max-w-2xl space-y-4">
            <h3 className="font-heading font-semibold">Two-Factor Authentication Settings</h3>
            <p className="text-sm text-muted-foreground">Configure 2FA requirements per role</p>
            {Object.entries({ Administrator: true, "Production Manager": true, "Inventory Manager": false, "QC Officer": false, "Sales Staff": false }).map(([role, required]) => (
              <div key={role} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">{role}</span>
                <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Required</span><Switch defaultChecked={required} /></div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="mt-4">
          <div className="space-y-3">
            {loginActivity.filter(l => l.status !== "success").map(la => (
              <div key={la.id} className="bg-card border border-l-4 border-l-destructive rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{la.status === "blocked" ? "Account Blocked" : "Failed Login Attempt"}</p>
                  <p className="text-xs text-muted-foreground">User: {la.user} • IP: {la.ip} • Device: {la.device}</p>
                  <p className="text-xs text-muted-foreground">{new Date(la.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
