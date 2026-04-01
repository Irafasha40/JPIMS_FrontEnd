import { useState } from "react";
import { rawMaterials, stockMovements, purchaseOrders } from "@/lib/mockData";
import { Plus, Search, Download, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Eye, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import Breadcrumb from "@/components/Breadcrumb";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";

export default function RawMaterialsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedMaterial, setSelectedMaterial] = useState<typeof rawMaterials[0] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);

  const filtered = rawMaterials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.supplier.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Raw Materials</h1>
          <p className="text-sm text-muted-foreground">Manage raw material inventory, stock movements, and purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={stockInOpen} onOpenChange={setStockInOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><ArrowDownCircle className="w-4 h-4 mr-1" />Stock In</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Stock-In</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Material *</Label><Select><SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger><SelectContent>{rawMaterials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Supplier</Label><Input placeholder="Supplier name" /></div>
                  <div className="space-y-2"><Label>Batch/Lot #</Label><Input placeholder="LOT-XXX" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Quantity *</Label><Input type="number" placeholder="0" /></div>
                  <div className="space-y-2"><Label>Unit Cost</Label><Input type="number" placeholder="0.00" /></div>
                </div>
                <div className="space-y-2"><Label>Date Received</Label><Input type="date" defaultValue="2026-03-26" /></div>
                <div className="space-y-2"><Label>Notes</Label><Input placeholder="Optional notes" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setStockInOpen(false)}>Cancel</Button><Button onClick={() => setStockInOpen(false)}>Record Stock-In</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={stockOutOpen} onOpenChange={setStockOutOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><ArrowUpCircle className="w-4 h-4 mr-1" />Stock Out</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Stock-Out</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Material *</Label><Select><SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger><SelectContent>{rawMaterials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Issued to Batch #</Label><Input placeholder="B-XXXXXXXX-XXX" /></div>
                  <div className="space-y-2"><Label>Quantity *</Label><Input type="number" placeholder="0" /></div>
                </div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" defaultValue="2026-03-26" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setStockOutOpen(false)}>Cancel</Button><Button onClick={() => setStockOutOpen(false)}>Record Stock-Out</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Export</Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Material</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Material</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Name *</Label><Input placeholder="Material name" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Category</Label><Select><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="concentrate">Concentrate</SelectItem><SelectItem value="pulp">Pulp</SelectItem><SelectItem value="additive">Additive</SelectItem><SelectItem value="sweetener">Sweetener</SelectItem><SelectItem value="packaging">Packaging</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Unit of Measure</Label><Select><SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger><SelectContent><SelectItem value="kg">Kg</SelectItem><SelectItem value="liters">Liters</SelectItem><SelectItem value="pieces">Pieces</SelectItem></SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Min Stock Threshold *</Label><Input type="number" placeholder="0" /></div>
                  <div className="space-y-2"><Label>Cost per Unit *</Label><Input type="number" placeholder="0.00" /></div>
                </div>
                <div className="space-y-2"><Label>Linked Supplier</Label><Select><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger><SelectContent><SelectItem value="freshfruit">FreshFruit Co.</SelectItem><SelectItem value="tropical">Tropical Imports</SelectItem><SelectItem value="sweetsource">SweetSource Ltd.</SelectItem><SelectItem value="chemsupply">ChemSupply Inc.</SelectItem><SelectItem value="packright">PackRight Ltd.</SelectItem></SelectContent></Select></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={() => setAddOpen(false)}>Add Material</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Material Catalog</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search materials..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          {paginated.length === 0 ? (
            <EmptyState title="No materials found" description="Try a different search or add your first material." actionLabel="Add Material" onAction={() => setAddOpen(true)} />
          ) : (
            <>
              <div className="bg-card border rounded-lg overflow-hidden">
                <table className="data-table w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Stock Level</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Cost/Unit</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr></thead>
                  <tbody>{paginated.map(m => {
                    const pct = Math.min((m.stock / (m.minStock * 3)) * 100, 100);
                    return (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3"><p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground font-mono">{m.id}</p></td>
                        <td className="px-4 py-3 text-muted-foreground">{m.category}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.supplier}</td>
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm w-20">{m.stock.toLocaleString()} {m.unit}</span>
                            <Progress value={pct} className="h-2 flex-1" />
                          </div>
                          <p className="text-xs text-muted-foreground">Min: {m.minStock}</p>
                        </td>
                        <td className="px-4 py-3">KES {m.costPerUnit.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {m.stock < m.minStock ? <span className="status-badge-danger"><AlertTriangle className="w-3 h-3 mr-1" />Critical</span>
                          : m.stock < m.minStock * 1.5 ? <span className="status-badge-warning">Low</span>
                          : <span className="status-badge-success">OK</span>}
                        </td>
                        <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => setSelectedMaterial(m)}><Eye className="w-4 h-4" /></Button></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={s => { setPageSize(s); setPage(1); }} totalItems={filtered.length} />
            </>
          )}
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Material</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Quantity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Recorded By</th>
              </tr></thead>
              <tbody>{stockMovements.map(sm => {
                const mat = rawMaterials.find(r => r.id === sm.materialId);
                return (
                  <tr key={sm.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{sm.date}</td>
                    <td className="px-4 py-3"><span className={sm.type === "in" ? "status-badge-success" : "status-badge-warning"}>{sm.type === "in" ? "▼ IN" : "▲ OUT"}</span></td>
                    <td className="px-4 py-3 font-medium">{mat?.name ?? sm.materialId}</td>
                    <td className="px-4 py-3 font-semibold">{sm.quantity} {mat?.unit}</td>
                    <td className="px-4 py-3 font-mono text-xs">{sm.reference}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sm.recordedBy}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />New Purchase Order</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Supplier *</Label><Select><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger><SelectContent><SelectItem value="freshfruit">FreshFruit Co.</SelectItem><SelectItem value="tropical">Tropical Imports</SelectItem><SelectItem value="sweetsource">SweetSource Ltd.</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Materials</Label>
                    <div className="border rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Select><SelectTrigger><SelectValue placeholder="Material" /></SelectTrigger><SelectContent>{rawMaterials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>
                        <Input type="number" placeholder="Qty" />
                        <Input type="number" placeholder="Unit cost" />
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs"><Plus className="w-3 h-3 mr-1" />Add item</Button>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Expected Delivery Date</Label><Input type="date" /></div>
                  <div className="space-y-2"><Label>Notes</Label><Input placeholder="Optional" /></div>
                </div>
                <DialogFooter><Button variant="outline">Cancel</Button><Button>Create PO</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">PO Number</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Items</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Expected</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr></thead>
              <tbody>{purchaseOrders.map(po => (
                <tr key={po.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{po.id}</td>
                  <td className="px-4 py-3 font-medium">{po.supplier}</td>
                  <td className="px-4 py-3">{po.items}</td>
                  <td className="px-4 py-3 font-semibold">KES {po.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{po.expectedDate}</td>
                  <td className="px-4 py-3"><span className={po.status === "received" ? "status-badge-success" : "status-badge-warning"}>{po.status === "received" ? "Received" : "Pending"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Material Detail Slide-Over */}
      {selectedMaterial && (
        <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{selectedMaterial.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Category</p><p className="font-medium">{selectedMaterial.category}</p></div>
                <div><p className="text-muted-foreground">Supplier</p><p className="font-medium">{selectedMaterial.supplier}</p></div>
                <div><p className="text-muted-foreground">Current Stock</p><p className="font-semibold text-lg">{selectedMaterial.stock} {selectedMaterial.unit}</p></div>
                <div><p className="text-muted-foreground">Min Threshold</p><p className="font-medium">{selectedMaterial.minStock} {selectedMaterial.unit}</p></div>
                <div><p className="text-muted-foreground">Cost per Unit</p><p className="font-medium">KES {selectedMaterial.costPerUnit.toFixed(2)}</p></div>
                <div><p className="text-muted-foreground">Last Purchase</p><p className="font-medium">{selectedMaterial.lastPurchase}</p></div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Stock Level</p>
                <Progress value={Math.min((selectedMaterial.stock / (selectedMaterial.minStock * 3)) * 100, 100)} className="h-3" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Recent Movements</h4>
                <div className="space-y-2">
                  {stockMovements.filter(sm => sm.materialId === selectedMaterial.id).slice(0, 4).map(sm => (
                    <div key={sm.id} className="flex items-center justify-between text-sm border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className={sm.type === "in" ? "status-badge-success" : "status-badge-warning"}>{sm.type === "in" ? "IN" : "OUT"}</span>
                        <span>{sm.quantity} {selectedMaterial.unit}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{sm.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
