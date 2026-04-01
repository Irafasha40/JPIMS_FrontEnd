import { useState } from "react";
import { salesOrders, customers, finishedProducts } from "@/lib/mockData";
import { Plus, Search, Eye, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";
import Pagination from "@/components/Pagination";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "status-badge-warning" },
  confirmed: { label: "Confirmed", cls: "status-badge-info" },
  shipped: { label: "Shipped", cls: "status-badge-info" },
  delivered: { label: "Delivered", cls: "status-badge-success" },
  cancelled: { label: "Cancelled", cls: "status-badge-danger" },
};

export default function SalesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof salesOrders[0] | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const filtered = salesOrders.filter(o => o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Sales & Orders</h1>
          <p className="text-sm text-muted-foreground">Process orders, manage customers, and track sales</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />New Order</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Sales Order</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Customer *</Label><Select><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Order Date</Label><Input type="date" defaultValue="2026-03-28" /></div>
              </div>
              <div className="space-y-2">
                <Label>Line Items</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground uppercase font-medium">
                    <div className="col-span-4">Product</div><div className="col-span-2">Batch</div><div className="col-span-2">Qty</div><div className="col-span-2">Price</div><div className="col-span-2">Total</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4"><Select><SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger><SelectContent>{finishedProducts.filter(p => p.stock > 0).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="col-span-2"><Input placeholder="Lot" className="text-xs" /></div>
                    <div className="col-span-2"><Input type="number" placeholder="0" /></div>
                    <div className="col-span-2"><Input type="number" placeholder="0" /></div>
                    <div className="col-span-2 text-sm font-semibold">KES 0</div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs"><Plus className="w-3 h-3 mr-1" />Add line item</Button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-muted rounded-lg p-3">
                <span className="text-sm text-muted-foreground">Grand Total</span>
                <span className="font-heading font-bold text-lg">KES 0</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Payment Method</Label><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank Transfer</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Notes</Label><Input placeholder="Optional" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Save as Draft</Button>
              <Button onClick={() => setCreateOpen(false)}>Confirm Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search orders..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Items</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>{filtered.map(o => {
                const s = statusMap[o.status];
                return (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{o.id}</td>
                    <td className="px-4 py-3 font-medium">{o.customer}</td>
                    <td className="px-4 py-3">{o.items}</td>
                    <td className="px-4 py-3 font-semibold">KES {o.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.paymentMethod}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                    <td className="px-4 py-3"><span className={s.cls}>{s.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(o)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(o); setInvoiceOpen(true); }}><Printer className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={s => { setPageSize(s); setPage(1); }} totalItems={filtered.length} />
        </TabsContent>

        <TabsContent value="customers" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Last Order</th>
              </tr></thead>
              <tbody>{customers.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.contact}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 font-semibold">{c.totalOrders}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.lastOrder}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Detail / Invoice Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => { setSelectedOrder(null); setInvoiceOpen(false); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{invoiceOpen ? `Invoice — ${selectedOrder.id}` : `Order ${selectedOrder.id}`}</DialogTitle></DialogHeader>
            {invoiceOpen ? (
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex justify-between border-b pb-3">
                  <div><h3 className="font-heading font-bold text-primary">WHIZUPP LTD</h3><p className="text-xs text-muted-foreground">Juice Production & Distribution</p></div>
                  <div className="text-right"><p className="text-sm font-mono font-semibold">{selectedOrder.id}</p><p className="text-xs text-muted-foreground">{selectedOrder.date}</p></div>
                </div>
                <div><p className="text-xs text-muted-foreground">Bill To:</p><p className="font-semibold">{selectedOrder.customer}</p></div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-xs text-muted-foreground uppercase"><th className="text-left py-2">Product</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Price</th><th className="text-right py-2">Total</th></tr></thead>
                  <tbody>{selectedOrder.products.map((p, i) => (
                    <tr key={i} className="border-b"><td className="py-2">{p.name}</td><td className="py-2 text-right">{p.qty}</td><td className="py-2 text-right">KES {p.unitPrice}</td><td className="py-2 text-right font-semibold">KES {p.total.toLocaleString()}</td></tr>
                  ))}</tbody>
                </table>
                <div className="flex justify-between border-t pt-2 font-heading font-bold"><span>Grand Total</span><span>KES {selectedOrder.total.toLocaleString()}</span></div>
                <div className="text-xs text-muted-foreground"><p>Payment: {selectedOrder.paymentMethod}</p><p>Terms: Net 30 days</p></div>
                <Button size="sm" className="w-full"><Printer className="w-4 h-4 mr-1" />Print Invoice</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{selectedOrder.customer}</p></div>
                  <div><p className="text-muted-foreground">Date</p><p>{selectedOrder.date}</p></div>
                  <div><p className="text-muted-foreground">Status</p><span className={statusMap[selectedOrder.status].cls}>{statusMap[selectedOrder.status].label}</span></div>
                  <div><p className="text-muted-foreground">Payment</p><p>{selectedOrder.paymentMethod}</p></div>
                  <div><p className="text-muted-foreground">Total</p><p className="font-heading font-bold text-lg">KES {selectedOrder.total.toLocaleString()}</p></div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Line Items</h4>
                  {selectedOrder.products.map((p, i) => (
                    <div key={i} className="flex justify-between py-2 border-b text-sm">
                      <span>{p.name} × {p.qty}</span>
                      <span className="font-semibold">KES {p.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {selectedOrder.notes && <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground">Notes</p><p className="text-sm">{selectedOrder.notes}</p></div>}
                <div className="flex gap-2">
                  {selectedOrder.status === "pending" && <Button size="sm">Confirm Order</Button>}
                  {selectedOrder.status === "confirmed" && <Button size="sm">Mark as Shipped</Button>}
                  {selectedOrder.status === "shipped" && <Button size="sm">Mark as Delivered</Button>}
                  <Button variant="outline" size="sm" onClick={() => setInvoiceOpen(true)}><Printer className="w-4 h-4 mr-1" />Invoice</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
