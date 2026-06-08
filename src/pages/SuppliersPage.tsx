import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Star, Eye, Phone, Mail, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Breadcrumb from "@/components/Breadcrumb";
import { suppliersApi } from "@/lib/api";
import { PO_DRAFT_STORAGE_KEY, MATERIAL_ADD_DRAFT_STORAGE_KEY, type PurchaseOrderDraftV1, type MaterialAddDraftV1 } from "@/lib/poDraft";
import { useRole } from "@/contexts/RoleContext";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "fill-secondary text-secondary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

type SupplierRow = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  onTimeDelivery: number;
  status: string;
  paymentTerms: string;
  totalOrders: number;
  products: string[];
};

function mapSupplier(s: Record<string, unknown>): SupplierRow {
  return {
    id: String(s.id ?? ""),
    name: String(s.name ?? ""),
    contact: String(s.contact ?? "—"),
    phone: String(s.phone ?? "—"),
    email: String(s.email ?? "—"),
    address: String(s.address ?? "—"),
    rating: Number(s.rating ?? 0),
    onTimeDelivery: 0,
    status: String(s.status ?? "ACTIVE").toLowerCase() === "active" ? "active" : "inactive",
    paymentTerms: String(s.paymentTerms ?? "—"),
    totalOrders: 0,
    products: [],
  };
}

type CommRow = { id: string; supplierId: string; type: string; date: string; notes: string };

function safeReturnTo(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/raw-materials";
  return raw;
}

export default function SuppliersPage() {
  const { role } = useRole();
  const canCreateSupplier = role === "administrator" || role === "inventory_manager";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fromPoFlow = searchParams.get("from") === "po";
  const fromMaterialFlow = searchParams.get("from") === "material";
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const resumeRawMaterialsHref = fromPoFlow
    ? `${returnTo}?resumePo=1`
    : fromMaterialFlow
      ? `${returnTo}?resumeAddMaterial=1`
      : returnTo;

  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SupplierRow | null>(null);
  const [comms, setComms] = useState<CommRow[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPaymentTerms, setNewPaymentTerms] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPaymentTerms, setEditPaymentTerms] = useState("");

  const resetAddForm = useCallback(() => {
    setNewName("");
    setNewContact("");
    setNewPhone("");
    setNewEmail("");
    setNewAddress("");
    setNewPaymentTerms("");
  }, []);

  const openEditForm = (supplier: SupplierRow) => {
    setEditId(supplier.id);
    setEditName(supplier.name);
    setEditContact(supplier.contact === "—" ? "" : supplier.contact);
    setEditPhone(supplier.phone === "—" ? "" : supplier.phone);
    setEditEmail(supplier.email === "—" ? "" : supplier.email);
    setEditAddress(supplier.address === "—" ? "" : supplier.address);
    setEditPaymentTerms(supplier.paymentTerms === "—" ? "" : supplier.paymentTerms);
    setEditOpen(true);
  };

  const resetEditForm = () => {
    setEditId("");
    setEditName("");
    setEditContact("");
    setEditPhone("");
    setEditEmail("");
    setEditAddress("");
    setEditPaymentTerms("");
  };

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await suppliersApi.listPage({ size: 200, sort: "name,asc" });
      setSuppliers((data.content ?? []).map((row) => mapSupplier(row)));
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      setError(msg || "Could not load suppliers.");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    if (searchParams.get("openAdd") === "1") {
      setAddOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selected) {
      setComms([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await suppliersApi.communicationsPage(selected.id, { size: 50 });
        if (cancelled) return;
        setComms(
          (data.content ?? []).map((c: Record<string, unknown>, i: number) => ({
            id: String(c.id ?? `c-${i}`),
            supplierId: selected.id,
            type: String(c.type ?? "NOTE"),
            date: String(c.date ?? c.createdAt ?? ""),
            notes: String(c.notes ?? c.message ?? ""),
          }))
        );
      } catch {
        if (!cancelled) setComms([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const clearFlowQuery = () => {
    navigate("/suppliers", { replace: true });
  };

  const onAddOpenChange = (open: boolean) => {
    setAddOpen(open);
    if (!open) {
      resetAddForm();
      if (searchParams.get("from") === "po" || searchParams.get("from") === "material" || searchParams.get("openAdd") === "1") {
        clearFlowQuery();
      }
    }
  };

  const handleCreateSupplier = async () => {
    if (!canCreateSupplier) {
      toast.error("Only an Inventory Manager or Administrator can add suppliers.");
      return;
    }
    if (!newName.trim() || !newContact.trim()) {
      toast.error("Company name and contact person are required.");
      return;
    }
    const emailTrim = newEmail.trim();
    const body: Record<string, unknown> = {
      name: newName.trim(),
      contact: newContact.trim(),
      phone: newPhone.trim() || undefined,
      address: newAddress.trim() || undefined,
      paymentTerms: newPaymentTerms.trim() || undefined,
    };
    if (emailTrim) body.email = emailTrim;

    setAddSubmitting(true);
    try {
      const { data } = await suppliersApi.create(body);
      const newId = String((data as Record<string, unknown>).id ?? "");
      toast.success("Supplier created.");

      if (fromPoFlow) {
        let draft: Partial<PurchaseOrderDraftV1> = {};
        try {
          const raw = sessionStorage.getItem(PO_DRAFT_STORAGE_KEY);
          if (raw) draft = JSON.parse(raw) as Partial<PurchaseOrderDraftV1>;
        } catch {
          draft = {};
        }
        const today = new Date().toISOString().slice(0, 10);
        const merged: PurchaseOrderDraftV1 = {
          v: 1,
          poOpen: true,
          mainTab: "orders",
          poSupplierId: newId,
          poExpected: typeof draft.poExpected === "string" && draft.poExpected.trim() ? draft.poExpected : today,
          poMaterialId: typeof draft.poMaterialId === "string" ? draft.poMaterialId : "",
          poQty: typeof draft.poQty === "string" ? draft.poQty : "",
          poUnitCost: typeof draft.poUnitCost === "string" ? draft.poUnitCost : "",
          poNotes: typeof draft.poNotes === "string" ? draft.poNotes : "",
        };
        sessionStorage.setItem(PO_DRAFT_STORAGE_KEY, JSON.stringify(merged));
        resetAddForm();
        setAddOpen(false);
        navigate(`${returnTo}?resumePo=1`, { replace: true });
        return;
      }

      if (fromMaterialFlow) {
        let draft: Partial<MaterialAddDraftV1> = {};
        try {
          const raw = sessionStorage.getItem(MATERIAL_ADD_DRAFT_STORAGE_KEY);
          if (raw) draft = JSON.parse(raw) as Partial<MaterialAddDraftV1>;
        } catch {
          draft = {};
        }
        const merged: MaterialAddDraftV1 = {
          v: 1,
          addOpen: true,
          mainTab: "catalog",
          addName: typeof draft.addName === "string" ? draft.addName : "",
          addCategory: typeof draft.addCategory === "string" ? draft.addCategory : "",
          addUnit: typeof draft.addUnit === "string" && draft.addUnit.trim() ? draft.addUnit : "kg",
          addMin: typeof draft.addMin === "string" ? draft.addMin : "",
          addCost: typeof draft.addCost === "string" ? draft.addCost : "",
          addSupplierId: newId,
          addStock: typeof draft.addStock === "string" ? draft.addStock : "0",
        };
        sessionStorage.setItem(MATERIAL_ADD_DRAFT_STORAGE_KEY, JSON.stringify(merged));
        resetAddForm();
        setAddOpen(false);
        navigate(`${returnTo}?resumeAddMaterial=1`, { replace: true });
        return;
      }

      resetAddForm();
      setAddOpen(false);
      clearFlowQuery();
      await loadSuppliers();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not create supplier.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleUpdateSupplier = async () => {
    if (!canCreateSupplier) {
      toast.error("Only an Inventory Manager or Administrator can update suppliers.");
      return;
    }
    if (!editId || !editName.trim() || !editContact.trim()) {
      toast.error("Company name and contact person are required.");
      return;
    }

    const body: Record<string, unknown> = {
      name: editName.trim(),
      contact: editContact.trim(),
      phone: editPhone.trim() || undefined,
      address: editAddress.trim() || undefined,
      paymentTerms: editPaymentTerms.trim() || undefined,
    };
    const emailTrim = editEmail.trim();
    if (emailTrim) body.email = emailTrim;

    setEditSubmitting(true);
    try {
      const idToUpdate = editId;
      const nextName = editName.trim();
      const nextContact = editContact.trim();
      const nextPhone = editPhone.trim() || "—";
      const nextEmail = editEmail.trim() || "—";
      const nextAddress = editAddress.trim() || "—";
      const nextPaymentTerms = editPaymentTerms.trim() || "—";
      await suppliersApi.update(editId, body);
      toast.success("Supplier updated.");
      setEditOpen(false);
      resetEditForm();
      await loadSuppliers();
      setSelected((prev) =>
        prev && prev.id === idToUpdate
          ? {
              ...prev,
              name: nextName,
              contact: nextContact,
              phone: nextPhone,
              email: nextEmail,
              address: nextAddress,
              paymentTerms: nextPaymentTerms,
            }
          : prev
      );
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not update supplier.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const perfData = suppliers
    .filter((s) => s.status === "active")
    .map((s) => ({
      name: s.name.split(" ")[0] || s.name,
      delivery: s.onTimeDelivery,
      quality: s.rating * 20,
    }));

  return (
    <div className="space-y-6">
      <Breadcrumb />
      {fromPoFlow && (
        <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground/90">You are adding a supplier so you can finish your purchase order.</p>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link to={resumeRawMaterialsHref}>Back to purchase order</Link>
          </Button>
        </div>
      )}
      {fromMaterialFlow && (
        <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground/90">You are adding a supplier so you can finish adding your material.</p>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link to={resumeRawMaterialsHref}>Back to add material</Link>
          </Button>
        </div>
      )}
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Supplier Management</h1>
          <p className="text-sm text-muted-foreground">Manage suppliers, track performance, and maintain relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setAddOpen(true)} disabled={!canCreateSupplier}>
            <Plus className="w-4 h-4 mr-1" />
            Add Supplier
          </Button>
          <Dialog open={addOpen} onOpenChange={onAddOpenChange}>
            <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!canCreateSupplier && (
                <p className="text-sm text-muted-foreground">Sign in as Inventory Manager or Administrator to add suppliers.</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} disabled={!canCreateSupplier} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input value={newContact} onChange={(e) => setNewContact(e.target.value)} disabled={!canCreateSupplier} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} disabled={!canCreateSupplier} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={!canCreateSupplier} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} disabled={!canCreateSupplier} />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input placeholder="e.g. Net 30" value={newPaymentTerms} onChange={(e) => setNewPaymentTerms(e.target.value)} disabled={!canCreateSupplier} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onAddOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={addSubmitting || !canCreateSupplier} onClick={() => void handleCreateSupplier()}>
                {addSubmitting ? "Saving…" : "Add Supplier"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) resetEditForm();
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!canCreateSupplier && (
                <p className="text-sm text-muted-foreground">Sign in as Inventory Manager or Administrator to edit suppliers.</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={!canCreateSupplier} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input value={editContact} onChange={(e) => setEditContact(e.target.value)} disabled={!canCreateSupplier} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} disabled={!canCreateSupplier} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} disabled={!canCreateSupplier} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} disabled={!canCreateSupplier} />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input placeholder="e.g. Net 30" value={editPaymentTerms} onChange={(e) => setEditPaymentTerms(e.target.value)} disabled={!canCreateSupplier} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={editSubmitting || !canCreateSupplier} onClick={() => void handleUpdateSupplier()}>
                {editSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading suppliers…</p>}
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="directory" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">On-Time %</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.contact}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.phone}</td>
                    <td className="px-4 py-3">
                      <Stars rating={s.rating} />
                    </td>
                    <td className="px-4 py-3 font-semibold">{s.onTimeDelivery}%</td>
                    <td className="px-4 py-3">
                      <span className={s.status === "active" ? "status-badge-success" : "status-badge-info"}>
                        {s.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled={!canCreateSupplier} onClick={() => openEditForm(s)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && suppliers.length === 0 && (
              <p className="text-sm text-muted-foreground p-6 text-center">No suppliers from API.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-heading font-semibold mb-4">Supplier Performance Comparison</h3>
            {perfData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not enough supplier data for charts.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={perfData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="delivery" fill="hsl(var(--primary))" name="On-Time %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quality" fill="hsl(var(--secondary))" name="Quality %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected.name}</DialogTitle>
            </DialogHeader>
            {canCreateSupplier && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    openEditForm(selected);
                    setSelected(null);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit Supplier
                </Button>
              </div>
            )}
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="comms">Communications</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {selected.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {selected.email}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {selected.address}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-muted-foreground">Rating</p>
                    <Stars rating={selected.rating} />
                  </div>
                  <div>
                    <p className="text-muted-foreground">On-Time Delivery</p>
                    <p className="font-semibold">{selected.onTimeDelivery}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Terms</p>
                    <p>{selected.paymentTerms}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Orders</p>
                    <p className="font-semibold">{selected.totalOrders}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="products" className="mt-4">
                {selected.products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No linked products from API.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.products.map((p) => (
                      <div key={p} className="bg-muted rounded-lg px-3 py-2 text-sm">
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="comms" className="mt-4">
                {comms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No communications returned.</p>
                ) : (
                  comms.map((c) => (
                    <div key={c.id} className="border-b pb-3 mb-3 last:border-0">
                      <div className="flex justify-between">
                        <span className="text-xs font-medium">{c.type}</span>
                        <span className="text-xs text-muted-foreground">{c.date}</span>
                      </div>
                      <p className="text-sm mt-1">{c.notes}</p>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
