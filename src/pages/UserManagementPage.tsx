import { useState } from "react";
import { users } from "@/lib/mockData";
import { Plus, Edit, Shield, Search, UserX, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import Breadcrumb from "@/components/Breadcrumb";

const roleLabels: Record<string, string> = { administrator: "Administrator", production_manager: "Production Manager", inventory_manager: "Inventory Manager", qc_officer: "QC Officer", sales_staff: "Sales Staff" };
const modules = ["Dashboard", "Raw Materials", "Production", "Quality Control", "Finished Products", "Sales", "Recipes", "Suppliers", "Reports", "Notifications", "Users", "Security"];
const actions = ["View", "Create", "Edit", "Delete", "Export"];

export default function UserManagementPage() {
  const [search, setSearch] = useState("");
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div><h1 className="text-2xl font-heading font-bold">User Management</h1><p className="text-sm text-muted-foreground">Manage users, roles, and access permissions</p></div>
        <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add User</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Full Name *</Label><Input /></div><div className="space-y-2"><Label>Employee ID *</Label><Input /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Email *</Label><Input type="email" /></div><div className="space-y-2"><Label>Phone</Label><Input /></div></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Department</Label><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="production">Production</SelectItem><SelectItem value="inventory">Inventory</SelectItem><SelectItem value="quality">Quality Control</SelectItem><SelectItem value="sales">Sales</SelectItem><SelectItem value="management">Management</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Role *</Label><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline">Cancel</Button><Button>Create User</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users">
        <TabsList><TabsTrigger value="users">Users</TabsTrigger><TabsTrigger value="permissions"><Shield className="w-4 h-4 mr-1" />Permission Matrix</TabsTrigger></TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search users..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Department</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">2FA</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Last Login</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>{filtered.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">{roleLabels[u.role]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.department}</td>
                  <td className="px-4 py-3">{u.mfaEnabled ? <span className="status-badge-success">On</span> : <span className="text-muted-foreground text-xs">Off</span>}</td>
                  <td className="px-4 py-3"><span className={u.status === "active" ? "status-badge-success" : "status-badge-info"}>{u.status === "active" ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.lastLogin).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <Button variant="ghost" size="sm" title="Edit"><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" title="Reset Password"><KeyRound className="w-4 h-4" /></Button>
                    {u.status === "active" && <Button variant="ghost" size="sm" title="Deactivate" className="text-destructive"><UserX className="w-4 h-4" /></Button>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <div className="bg-card border rounded-lg overflow-auto p-4">
            <h3 className="font-heading font-semibold mb-4">Role-Module Permission Matrix</h3>
            <table className="w-full text-xs">
              <thead><tr className="border-b">
                <th className="text-left p-2 font-medium">Module</th>
                {Object.values(roleLabels).map(r => <th key={r} className="p-2 font-medium text-center">{r}</th>)}
              </tr></thead>
              <tbody>{modules.map(mod => (
                <tr key={mod} className="border-b">
                  <td className="p-2 font-medium">{mod}</td>
                  {Object.keys(roleLabels).map(role => (
                    <td key={role} className="p-2 text-center">
                      <Checkbox defaultChecked={role === "administrator" || (mod === "Dashboard")} />
                    </td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
