import { useCallback, useEffect, useState } from "react";
import { Plus, Edit, Shield, Search, UserX, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import Breadcrumb from "@/components/Breadcrumb";
import { usersApi, apiClient } from "@/lib/api";
import { roleLabels, type UserRole } from "@/lib/roleConfig";
import { backendRoleToUserRole, userRoleToBackendEnum } from "@/lib/roleUtils";

const modules = [
  "Dashboard",
  "Raw Materials",
  "Production",
  "Quality Control",
  "Finished Products",
  "Sales",
  "Recipes",
  "Suppliers",
  "Reports",
  "Notifications",
  "Users",
  "Security",
];

type UserRow = {
  id: string;
  name: string;
  email: string;
  roleKey: UserRole;
  department: string;
  mfaEnabled: boolean;
  status: "active" | "inactive";
  lastLogin: string;
};

function mapUser(u: Record<string, unknown>): UserRow {
  const roleStr = String(u.role ?? "");
  const roleKey = backendRoleToUserRole(roleStr) ?? "administrator";
  const active = u.isActive !== false;
  return {
    id: String(u.id ?? ""),
    name: String(u.fullName ?? ""),
    email: String(u.email ?? ""),
    roleKey,
    department: String(u.department ?? "—"),
    mfaEnabled: Boolean(u.mfaEnabled),
    status: active ? "active" : "inactive",
    lastLogin: typeof u.lastLogin === "string" ? u.lastLogin : "",
  };
}

const emptyAddForm = () => ({
  fullName: "",
  employeeId: "",
  email: "",
  phone: "",
  department: "",
  roleKey: "production_manager" as UserRole,
  password: "",
});

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Add user
  const [addOpen, setAddOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);

  // Edit user
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", department: "", roleKey: "production_manager" as UserRole });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Reset password
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Deactivate
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<UserRow | null>(null);
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await usersApi.listPage({ size: 200, sort: "fullName,asc" });
      setUsers((data.content ?? []).map((row) => mapUser(row)));
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message ?? "")
          : "";
      const status = (e as { response?: { status?: number } })?.response?.status;
      setError(
        msg ||
          (status === 403
            ? "Access denied. User management requires an Administrator account."
            : "Could not load users.")
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const matrixRoles = Object.keys(roleLabels) as UserRole[];

  // ── Add User ──────────────────────────────────────────────────────────────
  const handleCreateUser = async () => {
    const { fullName, employeeId, email, phone, department, roleKey, password } = addForm;
    if (!fullName.trim() || !employeeId.trim() || !email.trim() || !department || !password.trim()) {
      toast.error("Please fill in name, employee ID, email, department, and password.");
      return;
    }
    setAddSubmitting(true);
    try {
      await usersApi.create({
        fullName: fullName.trim(),
        employeeId: employeeId.trim(),
        email: email.trim(),
        phone: phone.trim() || "—",
        department,
        role: userRoleToBackendEnum(roleKey),
        password: password.trim(),
      });
      toast.success("User created.");
      setAddOpen(false);
      setAddForm(emptyAddForm());
      await loadUsers();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not create user.");
    } finally {
      setAddSubmitting(false);
    }
  };

  // ── Edit User ──────────────────────────────────────────────────────────────
  const openEditDialog = (u: UserRow) => {
    setEditUser(u);
    setEditForm({
      fullName: u.name,
      department: u.department === "—" ? "" : u.department,
      roleKey: u.roleKey,
    });
    setEditOpen(true);
  };

  const handleEditUser = async () => {
    if (!editUser) return;
    if (!editForm.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    setEditSubmitting(true);
    try {
      await usersApi.update(editUser.id, {
        fullName: editForm.fullName.trim(),
        department: editForm.department || undefined,
        role: userRoleToBackendEnum(editForm.roleKey),
      });
      toast.success("User updated successfully.");
      setEditOpen(false);
      setEditUser(null);
      await loadUsers();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not update user.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Reset Password ─────────────────────────────────────────────────────────
  const openResetDialog = (u: UserRow) => {
    setResetUser(u);
    setTempPassword(null);
    setResetOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    setResetSubmitting(true);
    try {
      const { data } = await apiClient.put<{ tempPassword: string }>(`/users/${resetUser.id}/reset-password`);
      setTempPassword(data.tempPassword ?? null);
      toast.success("Password reset successfully.");
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not reset password.");
      setResetOpen(false);
    } finally {
      setResetSubmitting(false);
    }
  };

  // ── Deactivate User ────────────────────────────────────────────────────────
  const openDeactivateDialog = (u: UserRow) => {
    setDeactivateUser(u);
    setDeactivateOpen(true);
  };

  const handleDeactivate = async () => {
    if (!deactivateUser) return;
    setDeactivateSubmitting(true);
    try {
      await usersApi.delete(deactivateUser.id);
      toast.success(`${deactivateUser.name} has been deactivated.`);
      setDeactivateOpen(false);
      setDeactivateUser(null);
      await loadUsers();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not deactivate user.");
    } finally {
      setDeactivateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage users, roles, and access permissions</p>
        </div>

        {/* Add User Dialog */}
        <Dialog
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open);
            if (!open) setAddForm(emptyAddForm());
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={addForm.fullName}
                    onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID *</Label>
                  <Input
                    value={addForm.employeeId}
                    onChange={(e) => setAddForm((f) => ({ ...f, employeeId: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={addForm.phone}
                    onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={addForm.department || undefined}
                    onValueChange={(v) => setAddForm((f) => ({ ...f, department: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="Inventory">Inventory</SelectItem>
                      <SelectItem value="Quality Control">Quality Control</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={addForm.roleKey}
                    onValueChange={(v) => setAddForm((f) => ({ ...f, roleKey: v as UserRole }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {matrixRoles.map((k) => (
                        <SelectItem key={k} value={k}>{roleLabels[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Initial password *</Label>
                <Input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">User can change this after first login from their profile.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="button" disabled={addSubmitting} onClick={() => void handleCreateUser()}>
                {addSubmitting ? "Creating…" : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading users…</p>}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User — {editUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={editForm.fullName}
                onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={editForm.department || undefined}
                onValueChange={(v) => setEditForm((f) => ({ ...f, department: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Inventory">Inventory</SelectItem>
                  <SelectItem value="Quality Control">Quality Control</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.roleKey}
                onValueChange={(v) => setEditForm((f) => ({ ...f, roleKey: v as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {matrixRoles.map((k) => (
                    <SelectItem key={k} value={k}>{roleLabels[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="button" disabled={editSubmitting} onClick={() => void handleEditUser()}>
              {editSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetOpen}
        onOpenChange={(o) => {
          setResetOpen(o);
          if (!o) {
            setResetUser(null);
            setTempPassword(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password — {resetUser?.name}</DialogTitle>
          </DialogHeader>
          {tempPassword ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                A temporary password has been generated. Share it securely with the user — they should change it immediately after logging in.
              </p>
              <div className="rounded-lg bg-muted px-4 py-3 font-mono text-sm font-semibold tracking-wider select-all break-all">
                {tempPassword}
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => { setResetOpen(false); setTempPassword(null); }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This will generate a new temporary password for <strong>{resetUser?.name}</strong>.
                The user will need to log in with it and can change it from their profile.
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
                <Button type="button" disabled={resetSubmitting} onClick={() => void handleResetPassword()}>
                  {resetSubmitting ? "Resetting…" : "Reset Password"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog
        open={deactivateOpen}
        onOpenChange={(o) => {
          setDeactivateOpen(o);
          if (!o) setDeactivateUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to deactivate <strong>{deactivateUser?.name}</strong>?
            They will no longer be able to log in. This action can be reversed by an administrator.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deactivateSubmitting}
              onClick={() => void handleDeactivate()}
            >
              {deactivateSubmitting ? "Deactivating…" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="w-4 h-4 mr-1" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">2FA</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Last Login</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">{roleLabels[u.roleKey]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.department}</td>
                    <td className="px-4 py-3">
                      {u.mfaEnabled ? (
                        <span className="status-badge-success">On</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Off</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={u.status === "active" ? "status-badge-success" : "status-badge-info"}>
                        {u.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit"
                          onClick={() => openEditDialog(u)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Reset Password"
                          onClick={() => openResetDialog(u)}
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        {u.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Deactivate"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeactivateDialog(u)}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <div className="bg-card border rounded-lg overflow-auto p-4">
            <h3 className="font-heading font-semibold mb-4">Role-Module Permission Matrix</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Module</th>
                  {matrixRoles.map((r) => (
                    <th key={r} className="p-2 font-medium text-center">
                      {roleLabels[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod} className="border-b">
                    <td className="p-2 font-medium">{mod}</td>
                    {matrixRoles.map((role) => (
                      <td key={role} className="p-2 text-center">
                        <Checkbox defaultChecked={role === "administrator" || mod === "Dashboard"} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
