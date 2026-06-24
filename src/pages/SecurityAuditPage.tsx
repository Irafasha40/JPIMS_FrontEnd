import { Shield, Search, Download, AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import Breadcrumb from "@/components/Breadcrumb";
import Pagination from "@/components/Pagination";
import { auditApi, usersApi } from "@/lib/api";
import { toast } from "sonner";

const actionCls: Record<string, string> = {
  create: "status-badge-success",
  update: "status-badge-warning",
  login: "status-badge-info",
  login_failed: "status-badge-danger",
};
const loginCls: Record<string, string> = {
  success: "status-badge-success",
  failed: "status-badge-danger",
  blocked: "status-badge-danger",
};

type AuditRow = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  ip: string;
  isAnomaly?: boolean;
};

function mapAuditRecord(row: Record<string, unknown>, fallbackKey: string): AuditRow {
  const id = String(row.id ?? row.recordId ?? fallbackKey);
  const ts =
    (row.timestamp as string) ??
    (row.createdAt as string) ??
    (row.occurredAt as string) ??
    new Date().toISOString();
  const user =
    String(row.userName ?? row.username ?? row.user ?? row.userEmail ?? row.email ?? "—");
  const action = String(row.action ?? row.eventType ?? "unknown").toLowerCase().replace(/\s+/g, "_");
  const module = String(row.module ?? row.entity ?? row.resource ?? "—");
  const details = String(row.details ?? row.newValue ?? row.message ?? row.oldValue ?? "—");
  const ip = String(row.ipAddress ?? row.ip ?? row.clientIp ?? "—");
  const isAnomaly = Boolean(row.isAnomaly);
  return { id, timestamp: ts, user, action, module, details, ip, isAnomaly };
}

function isLoginRelated(action: string): boolean {
  const a = action.toLowerCase();
  return a.includes("login") || a.includes("auth") || a.includes("logout") || a.includes("session");
}

function loginStatusFromAction(action: string): "success" | "failed" | "blocked" {
  const a = action.toLowerCase();
  if (a.includes("fail") || a.includes("denied") || a.includes("invalid")) return "failed";
  if (a.includes("block") || a.includes("lock")) return "blocked";
  return "success";
}

export default function SecurityAuditPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [anomalyRows, setAnomalyRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await auditApi.exportLogs();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Audit log exported successfully.");
    } catch (e: unknown) {
      toast.error("Could not export audit logs.");
    } finally {
      setExporting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auditReq =
        moduleFilter === "all"
          ? auditApi.listPage({ page: page - 1, size: pageSize })
          : auditApi.modulePage(moduleFilter, { page: page - 1, size: pageSize });
      const [auditRes, usersRes, anomRes] = await Promise.all([
        auditReq,
        usersApi.listPage({ size: 500 }).catch(() => ({ data: { content: [] as Record<string, unknown>[] } })),
        auditApi.anomaliesPage({ page: 0, size: 50 }).catch(() => ({ data: { content: [] as Record<string, unknown>[] } })),
      ]);
      const content = (auditRes.data.content ?? []).map((r, i) => mapAuditRecord(r, `row-${i}`));
      setAuditRows(content);
      setTotalItems(auditRes.data.totalElements ?? content.length);
      setTotalPages(Math.max(1, auditRes.data.totalPages ?? 1));
      setUsers(usersRes.data.content ?? []);
      setAnomalyRows((anomRes.data.content ?? []).map((r, i) => mapAuditRecord(r, `anom-${i}`)));
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      setError(msg || "Could not load audit data.");
      setAuditRows([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, moduleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const mfaAdoption = useMemo(() => {
    if (!users.length) return 0;
    const withMfa = users.filter((u) => Boolean((u as Record<string, unknown>).mfaEnabled)).length;
    return Math.round((withMfa / users.length) * 100);
  }, [users]);

  const activeUsers = useMemo(
    () => users.filter((u) => (u as Record<string, unknown>).isActive !== false).length,
    [users]
  );

  const loginFromAudit = useMemo(() => {
    return auditRows.filter((r) => isLoginRelated(r.action));
  }, [auditRows]);

  const failedLogins = useMemo(() => {
    const fromAudit = loginFromAudit.filter((r) => loginStatusFromAction(r.action) !== "success");
    return [...fromAudit, ...anomalyRows.filter((r) => loginStatusFromAction(r.action) !== "success")];
  }, [loginFromAudit, anomalyRows]);

  const filteredAudit = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return auditRows;
    return auditRows.filter(
      (r) =>
        r.user.toLowerCase().includes(q) ||
        r.action.includes(q) ||
        r.module.toLowerCase().includes(q) ||
        r.details.toLowerCase().includes(q) ||
        r.ip.toLowerCase().includes(q)
    );
  }, [auditRows, search]);

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Security & Audit</h1>
          <p className="text-sm text-muted-foreground">Monitor security, login activity, and audit trails</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleExport()} disabled={exporting}>
          <Download className="w-4 h-4 mr-1" />
          {exporting ? "Exporting..." : "Export Audit Log"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
            <Shield className="w-3 h-3" /> Data encryption
          </p>
          <p className="text-lg font-heading font-bold mt-1 text-primary">TLS + server-side</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase">2FA adoption (users)</p>
          <p className="text-lg font-heading font-bold mt-1">{mfaAdoption}%</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase">Login anomalies</p>
          <p className="text-lg font-heading font-bold mt-1 text-destructive">{failedLogins.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase">Active users</p>
          <p className="text-lg font-heading font-bold mt-1">{activeUsers}</p>
        </div>
      </div>

      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="login">Login Activity</TabsTrigger>
          <TabsTrigger value="2fa">2FA Settings</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              />
            </div>
            <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="quality">Quality Control</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Module</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">IP</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredAudit.map((log) => (
                    <tr
                      key={log.id}
                      className={`border-b last:border-0 hover:bg-muted/30 ${
                        log.action.includes("fail") ? "bg-destructive/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium">{log.user}</td>
                      <td className="px-4 py-3">
                        <span className={actionCls[log.action] ?? "status-badge-info"}>{log.action.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3">{log.module}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">{log.details}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.ip}</td>
                    </tr>
                  ))}
                {!loading && filteredAudit.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No audit entries yet. The backend audit list is connected; data appears when events are persisted.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            totalItems={totalItems}
          />
        </TabsContent>

        <TabsContent value="login" className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">
            Derived from audit log actions that look like authentication events when the API returns them.
          </p>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">IP Address</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Device</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {loginFromAudit.map((la) => {
                  const st = loginStatusFromAction(la.action);
                  return (
                    <tr key={la.id} className={`border-b last:border-0 hover:bg-muted/30 ${st !== "success" ? "bg-destructive/5" : ""}`}>
                      <td className="px-4 py-3 font-medium">{la.user}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(la.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-xs">{la.ip}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">—</td>
                      <td className="px-4 py-3">
                        <span className={loginCls[st]}>{st.charAt(0).toUpperCase() + st.slice(1)}</span>
                      </td>
                    </tr>
                  );
                })}
                {loginFromAudit.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No login-related audit rows on this page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="2fa" className="mt-4">
          <div className="bg-card border rounded-lg p-6 max-w-2xl space-y-4">
            <h3 className="font-heading font-semibold">Two-Factor Authentication Settings</h3>
            <p className="text-sm text-muted-foreground">
              Policy toggles are UI placeholders until a retention / policy API is wired. User MFA flags come from the user list (
              {mfaAdoption}% enabled).
            </p>
            {Object.entries({ Administrator: true, "Production Manager": true, "Inventory Manager": false, "QC Officer": false, "Sales Staff": false }).map(
              ([role, required]) => (
                <div key={role} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-medium">{role}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Required</span>
                    <Switch defaultChecked={required} />
                  </div>
                </div>
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="mt-4">
          <div className="space-y-3">
            {(anomalyRows.length ? anomalyRows : failedLogins).map((la) => {
              const isLoginAnomaly = isLoginRelated(la.action);
              const label = isLoginAnomaly
                ? loginStatusFromAction(la.action) === "blocked"
                  ? "Account blocked"
                  : "Failed login attempt"
                : `Flagged: ${la.action.replace(/_/g, " ")} — ${la.module}`;
              return (
                <div key={la.id} className="bg-card border border-l-4 border-l-destructive rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      User: {la.user} • IP: {la.ip} • {la.module}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(la.timestamp).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{la.details}</p>
                  </div>
                </div>
              );
            })}
            {!anomalyRows.length && !failedLogins.length && (
              <p className="text-sm text-muted-foreground">No anomalies detected. Flagged audit events will appear here.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
