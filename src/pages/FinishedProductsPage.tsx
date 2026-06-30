import { useEffect, useState } from "react";
import { Search, AlertTriangle, CheckCircle, XCircle, Eye, Download, ArrowRightCircle, Package, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import Breadcrumb from "@/components/Breadcrumb";
import { finishedProductsApi } from "@/lib/api";

type FPRow = {
  id: string;
  name: string;
  flavor: string;
  size: string;
  batch: string;
  lotNumber: string;
  stock: number;
  volumeLiters: number | null;
  bottlesUsed: number | null;
  boxesUsed: number | null;
  expiry: string;
  location: string;
  status: string;
  unitCost: number;
};

function mapFP(p: Record<string, unknown>): FPRow {
  const expiryRaw = p.expiryDate ?? p.bestBefore ?? p.expiry;
  const statusRaw = String(p.status ?? "AVAILABLE").toLowerCase();
  let status = "available";
  if (statusRaw.includes("near")) status = "near_expiry";
  if (statusRaw.includes("expir")) status = "expired";
  if (statusRaw.includes("out_of_stock") || statusRaw.includes("out of stock")) status = "out_of_stock";
  return {
    id: String(p.id ?? ""),
    name: String(p.name ?? p.productName ?? "—"),
    flavor: String(p.flavor ?? "—"),
    size: String(p.packagingSize ?? p.size ?? "—"),
    batch: String(p.batchNumber ?? p.batch ?? ""),
    lotNumber: String(p.lotNumber ?? ""),
    stock: Number(p.quantity ?? p.quantityOnHand ?? p.stock ?? 0),
    volumeLiters: p.volumeLiters != null ? Number(p.volumeLiters) : null,
    bottlesUsed: p.bottlesUsed != null ? Number(p.bottlesUsed) : null,
    boxesUsed: p.boxesUsed != null ? Number(p.boxesUsed) : null,
    expiry: expiryRaw != null ? String(expiryRaw).slice(0, 10) : "—",
    location: String(p.storageLocation ?? p.location ?? "—"),
    status,
    unitCost: Number(p.unitCost ?? p.costPerUnit ?? 0),
  };
}

export default function FinishedProductsPage() {
  const [finishedProducts, setFinishedProducts] = useState<FPRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FPRow | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const handleMarkExpired = async (productId: string) => {
    setStatusUpdating(productId);
    try {
      await finishedProductsApi.updateStatus(productId, "EXPIRED");
      setFinishedProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: "expired" } : p
      ));
      toast({ title: "Product marked as expired" });
    } catch (e) {
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setStatusUpdating(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await finishedProductsApi.listPage({ size: 200, sort: "productName,asc" });
        if (!cancelled) setFinishedProducts((data.content ?? []).map((row) => mapFP(row)));
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            typeof e === "object" && e !== null && "response" in e
              ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
              : "";
          setError(msg || "Could not load finished products.");
          setFinishedProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFP = finishedProducts.filter((p) => p.stock > 0);

  // Group by name + flavor + size
  const grouped: Record<string, FPRow[]> = {};
  activeFP.forEach((p) => {
    const key = `${p.name}|${p.flavor}|${p.size}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(p);
  });

  const groupedList = Object.entries(grouped).map(([key, items]) => {
    const [name, flavor, size] = key.split("|");
    return {
      key,
      name,
      flavor,
      size,
      items,
      totalStock: items.reduce((sum, item) => sum + item.stock, 0),
      totalValue: items.reduce((sum, item) => sum + item.stock * item.unitCost, 0),
      unitCost: items[0]?.unitCost ?? 0,
    };
  });

  const filteredGrouped = groupedList.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = activeFP.reduce((a, p) => a + p.stock * p.unitCost, 0);
  const nearExpiry = activeFP.filter((p) => p.status === "near_expiry");

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Finished Products</h1>
          <p className="text-sm text-muted-foreground">
            Completed production (QC pass) is packaged automatically: 2 bottles per 1L, 12 bottles per box.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowRightCircle className="w-4 h-4 mr-1" />
                Transfer from Production
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Batch to Finished Goods</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Completed & QC-Passed Batch *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder">Use Production module to complete batches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Lot Number</Label>
                    <Input placeholder="LOT-XXX" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Storage Location</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a">Warehouse A</SelectItem>
                        <SelectItem value="b">Warehouse B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTransferOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setTransferOpen(false)}>Confirm Transfer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Product Catalog</TabsTrigger>
          <TabsTrigger value="expiry">Expiry Alerts</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Batch / Lot</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Stock (bottles)</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Packaging</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Expiry</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredGrouped.map((g) => (
                  <tr key={g.key} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.flavor}</p>
                    </td>
                    <td className="px-4 py-3 align-top">{g.size}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-2">
                        {g.items.map((item) => (
                          <div key={item.id}>
                            <p className="font-mono text-xs">{item.batch || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{item.lotNumber || "—"}</p>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top font-semibold">
                      <div className="space-y-2">
                        {g.items.map((item) => (
                          <div key={item.id} className="py-0.5">
                            {item.stock.toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                      <div className="space-y-2">
                        {g.items.map((item) => (
                          <div key={item.id} className="py-0.5">
                            {item.volumeLiters != null && <span>{item.volumeLiters.toLocaleString()} L</span>}
                            {item.bottlesUsed != null && <span> • {item.bottlesUsed.toLocaleString()} btl</span>}
                            {item.boxesUsed != null && <span> • {item.boxesUsed.toLocaleString()} box</span>}
                            {item.volumeLiters == null && item.bottlesUsed == null && item.boxesUsed == null && "—"}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-2">
                        {g.items.map((item) => (
                          <div key={item.id} className="text-xs py-1">
                            {item.expiry}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      <div className="space-y-2">
                        {g.items.map((item) => (
                          <div key={item.id} className="text-xs py-1">
                            {item.location}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-2">
                        {g.items.map((item) => (
                          <div key={item.id} className="py-0.5">
                            {item.status === "available" && (
                              <span className="status-badge-success py-0.5 px-1.5 text-[10px]">
                                Available
                              </span>
                            )}
                            {item.status === "near_expiry" && (
                              <span className="status-badge-warning py-0.5 px-1.5 text-[10px]">
                                Near Expiry
                              </span>
                            )}
                            {item.status === "expired" && (
                              <span className="status-badge-danger py-0.5 px-1.5 text-[10px]">
                                Expired
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-2">
                        {g.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedProduct(item)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {item.status === "near_expiry" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => void handleMarkExpired(item.id)}
                                disabled={statusUpdating === item.id}
                                title="Mark as expired"
                              >
                                <CalendarDays className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredGrouped.length === 0 && (
              <p className="text-sm text-muted-foreground p-6 text-center">
                No finished products yet. Complete a batch (QC pass) to auto-receive packaged stock here.
              </p>
            )}
          </div>
        </TabsContent>

<TabsContent value="expiry" className="mt-4">
            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-heading font-semibold mb-4 text-secondary">Expiry Alerts</h3>
              {nearExpiry.length === 0 && finishedProducts.filter((p) => p.status === "expired").length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No products near expiry or expired.</p>
              ) : (
                <div className="space-y-3">
                  {[...nearExpiry, ...finishedProducts.filter((p) => p.status === "expired")].map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.lotNumber} • {p.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{p.expiry}</p>
                          <span className={p.status === "expired" ? "status-badge-danger" : "status-badge-warning"}>
                            {p.status === "expired" ? "Expired" : "Near Expiry"}
                          </span>
                        </div>
                        {p.status === "near_expiry" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkExpired(p.id)}
                            disabled={statusUpdating === p.id}
                            title="Mark as expired"
                          >
                            <CalendarDays className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

        <TabsContent value="valuation" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Quantity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Unit Cost</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrouped.map((g) => (
                  <tr key={g.key} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {g.name} <span className="text-xs text-muted-foreground font-normal">({g.flavor} • {g.size})</span>
                    </td>
                    <td className="px-4 py-3">{g.totalStock.toLocaleString()}</td>
                    <td className="px-4 py-3">RWF {g.unitCost}</td>
                    <td className="px-4 py-3 font-semibold">RWF {g.totalValue.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-bold">
                  <td className="px-4 py-3" colSpan={3}>
                    Grand Total
                  </td>
                  <td className="px-4 py-3">RWF {totalValue.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Flavor</p>
                <p className="font-medium">{selectedProduct.flavor}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Size</p>
                <p className="font-medium">{selectedProduct.size}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Batch</p>
                <p className="font-mono">{selectedProduct.batch}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lot #</p>
                <p className="font-mono">{selectedProduct.lotNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Stock (bottles)</p>
                <p className="font-semibold text-lg">{selectedProduct.stock.toLocaleString()}</p>
              </div>
              {selectedProduct.volumeLiters != null && (
                <div>
                  <p className="text-muted-foreground">Volume produced</p>
                  <p className="font-medium">{selectedProduct.volumeLiters.toLocaleString()} L</p>
                </div>
              )}
              {(selectedProduct.bottlesUsed != null || selectedProduct.boxesUsed != null) && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Packaging used</p>
                  <p className="font-medium">
                    {selectedProduct.bottlesUsed?.toLocaleString() ?? "—"} bottles,{" "}
                    {selectedProduct.boxesUsed?.toLocaleString() ?? "—"} boxes
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Expiry</p>
                <p className="font-medium">{selectedProduct.expiry}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{selectedProduct.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unit Cost</p>
                <p className="font-medium">RWF {selectedProduct.unitCost}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
