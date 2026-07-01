import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, Search, Tag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import Breadcrumb from "@/components/Breadcrumb";
import { productCatalogApi } from "@/lib/api";

type CatalogItem = {
  id: string;
  productName: string;
  unitCost: number;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function mapItem(raw: Record<string, unknown>): CatalogItem {
  return {
    id: String(raw.id ?? ""),
    productName: String(raw.productName ?? ""),
    unitCost: Number(raw.unitCost ?? 0),
    description: raw.description != null ? String(raw.description) : null,
    createdAt: raw.createdAt != null ? String(raw.createdAt) : null,
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : null,
  };
}

const EMPTY_FORM = { productName: "", unitCost: "", description: "" };

export default function ProductCatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await productCatalogApi.listPage({ size: 200 });
      setItems((data.content ?? []).map(mapItem));
    } catch {
      toast({ title: "Failed to load product catalog", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPrices = async () => {
    setSyncing(true);
    try {
      const { data } = await productCatalogApi.syncPrices();
      const msg = String(data.message ?? `${data.updated} product(s) updated.`);
      toast({ title: "Prices synced", description: msg });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Sync failed";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditItem(item);
    setForm({
      productName: item.productName,
      unitCost: String(item.unitCost),
      description: item.description ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.productName.trim()) {
      toast({ title: "Product name is required", variant: "destructive" });
      return;
    }
    const cost = parseFloat(form.unitCost);
    if (isNaN(cost) || cost < 0) {
      toast({ title: "Unit cost must be a valid positive number", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        productName: form.productName.trim(),
        unitCost: cost,
        description: form.description.trim() || null,
      };
      if (editItem) {
        const { data } = await productCatalogApi.update(editItem.id, body);
        setItems((prev) =>
          prev.map((i) => (i.id === editItem.id ? mapItem(data) : i))
        );
        toast({ title: "Catalog entry updated successfully" });
      } else {
        const { data } = await productCatalogApi.create(body);
        setItems((prev) => [...prev, mapItem(data)]);
        toast({ title: "Product added to catalog" });
      }
      setDialogOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to save catalog entry";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (item: CatalogItem) => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productCatalogApi.remove(deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast({ title: `"${deleteTarget.productName}" removed from catalog` });
      setDeleteOpen(false);
    } catch {
      toast({ title: "Failed to delete catalog entry", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = items.filter((i) =>
    i.productName.toLowerCase().includes(search.toLowerCase()) ||
    (i.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="module-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Product Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Register finished products and their unit costs. Costs are automatically applied when batches complete.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncPrices}
            disabled={syncing || items.length === 0}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Prices to Products"}
          </Button>
          <Button onClick={openAdd} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-start gap-3">
        <Tag className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">How it works</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            When a production batch completes, the unit cost is automatically applied from this catalog.
            For <strong>existing products</strong> that don't have a price yet, click
            <span className="font-semibold text-foreground"> "Sync Prices to Products" </span>
            to apply current catalog prices — they will then appear in inventory reports.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground animate-pulse">
            Loading catalog...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-foreground">No products in catalog</p>
            <p className="text-xs text-muted-foreground">
              {search ? "No results for your search." : "Add your first product to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Unit Cost (RWF)
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {item.productName}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        RWF {item.unitCost.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">
                      {item.description ?? <span className="italic text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">
                      {item.updatedAt ?? item.createdAt ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(item)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Catalog Entry" : "Add Product to Catalog"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-productName">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-productName"
                placeholder="e.g. Mango Nectar 1L"
                value={form.productName}
                onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Must match the product name used in production batches exactly (case-insensitive).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-unitCost">
                Unit Cost (RWF per bottle) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-unitCost"
                type="number"
                min={0}
                step={1}
                placeholder="e.g. 1500"
                value={form.unitCost}
                onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-description">Description (optional)</Label>
              <Input
                id="cat-description"
                placeholder="e.g. 1 litre mango flavoured juice"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editItem ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove from Catalog</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">
              "{deleteTarget?.productName}"
            </span>{" "}
            from the catalog? Future batches of this product will not have a unit cost auto-applied.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
