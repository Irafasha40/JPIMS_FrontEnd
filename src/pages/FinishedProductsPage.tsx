import { useState } from "react";
import { finishedProducts } from "@/lib/mockData";
import { Search, AlertTriangle, CheckCircle, XCircle, Eye, Download, ArrowRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";

export default function FinishedProductsPage() {
  const [search, setSearch] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof finishedProducts[0] | null>(null);

  const filtered = finishedProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalValue = finishedProducts.reduce((a, p) => a + p.stock * p.unitCost, 0);
  const nearExpiry = finishedProducts.filter(p => p.status === "near_expiry");

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Finished Products</h1>
          <p className="text-sm text-muted-foreground">Track finished goods inventory, expiry dates, and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><ArrowRightCircle className="w-4 h-4 mr-1" />Transfer from Production</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Transfer Batch to Finished Goods</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Completed & QC-Passed Batch *</Label><Select><SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger><SelectContent><SelectItem value="B-20260325-001">B-20260325-001 — Orange Blast 500ml</SelectItem><SelectItem value="B-20260324-001">B-20260324-001 — Passion Punch 1L</SelectItem></SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" placeholder="0" /></div>
                  <div className="space-y-2"><Label>Lot Number</Label><Input placeholder="LOT-XXX" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Expiry Date (auto from shelf life)</Label><Input type="date" defaultValue="2026-09-28" /></div>
                  <div className="space-y-2"><Label>Storage Location</Label><Select><SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger><SelectContent><SelectItem value="a">Warehouse A</SelectItem><SelectItem value="b">Warehouse B</SelectItem></SelectContent></Select></div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button><Button onClick={() => setTransferOpen(false)}>Confirm Transfer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Export</Button>
        </div>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Product Catalog</TabsTrigger>
          <TabsTrigger value="expiry">Expiry Alerts</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search products..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Size</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Batch / Lot</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Expiry</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Location</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>{filtered.map(p => (
                <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/30 ${p.status === "expired" ? "bg-destructive/5" : p.status === "near_expiry" ? "bg-secondary/5" : ""}`}>
                  <td className="px-4 py-3"><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.flavor}</p></td>
                  <td className="px-4 py-3">{p.size}</td>
                  <td className="px-4 py-3"><p className="font-mono text-xs">{p.batch}</p><p className="text-xs text-muted-foreground">{p.lotNumber}</p></td>
                  <td className="px-4 py-3 font-semibold">{p.stock.toLocaleString()}</td>
                  <td className="px-4 py-3">{p.expiry}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.location}</td>
                  <td className="px-4 py-3">
                    {p.status === "available" && <span className="status-badge-success"><CheckCircle className="w-3 h-3 mr-1" />Available</span>}
                    {p.status === "near_expiry" && <span className="status-badge-warning"><AlertTriangle className="w-3 h-3 mr-1" />Near Expiry</span>}
                    {p.status === "expired" && <span className="status-badge-danger"><XCircle className="w-3 h-3 mr-1" />Expired</span>}
                  </td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => setSelectedProduct(p)}><Eye className="w-4 h-4" /></Button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="expiry" className="mt-4">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-heading font-semibold mb-4 text-secondary">⚠ Expiry Alerts (within 30 days)</h3>
            {nearExpiry.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No products near expiry.</p>
            ) : (
              <div className="space-y-3">
                {[...nearExpiry, ...finishedProducts.filter(p => p.status === "expired")].map(p => (
                  <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.lotNumber} • {p.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{p.expiry}</p>
                      <span className={p.status === "expired" ? "status-badge-danger" : "status-badge-warning"}>{p.status === "expired" ? "Expired" : "Near Expiry"}</span>
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
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Quantity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Unit Cost</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Total Value</th>
              </tr></thead>
              <tbody>
                {finishedProducts.map(p => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.stock.toLocaleString()}</td>
                    <td className="px-4 py-3">KES {p.unitCost}</td>
                    <td className="px-4 py-3 font-semibold">KES {(p.stock * p.unitCost).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-bold">
                  <td className="px-4 py-3" colSpan={3}>Grand Total</td>
                  <td className="px-4 py-3">KES {totalValue.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedProduct.name}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground">Flavor</p><p className="font-medium">{selectedProduct.flavor}</p></div>
              <div><p className="text-muted-foreground">Size</p><p className="font-medium">{selectedProduct.size}</p></div>
              <div><p className="text-muted-foreground">Batch</p><p className="font-mono">{selectedProduct.batch}</p></div>
              <div><p className="text-muted-foreground">Lot #</p><p className="font-mono">{selectedProduct.lotNumber}</p></div>
              <div><p className="text-muted-foreground">Stock</p><p className="font-semibold text-lg">{selectedProduct.stock.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Expiry</p><p className="font-medium">{selectedProduct.expiry}</p></div>
              <div><p className="text-muted-foreground">Location</p><p className="font-medium">{selectedProduct.location}</p></div>
              <div><p className="text-muted-foreground">Unit Cost</p><p className="font-medium">KES {selectedProduct.unitCost}</p></div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
