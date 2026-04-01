import { useState } from "react";
import { suppliers, supplierComms } from "@/lib/mockData";
import { Plus, Star, Eye, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Breadcrumb from "@/components/Breadcrumb";

function Stars({ rating }: { rating: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "fill-secondary text-secondary" : "text-muted-foreground/30"}`} />)}</div>;
}

export default function SuppliersPage() {
  const [selected, setSelected] = useState<typeof suppliers[0] | null>(null);
  const perfData = suppliers.filter(s => s.status === "active").map(s => ({ name: s.name.split(" ")[0], delivery: s.onTimeDelivery, quality: s.qualityRating * 20 }));

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div><h1 className="text-2xl font-heading font-bold">Supplier Management</h1><p className="text-sm text-muted-foreground">Manage suppliers, track performance, and maintain relationships</p></div>
        <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Supplier</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Company Name *</Label><Input /></div><div className="space-y-2"><Label>Contact Person *</Label><Input /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Phone *</Label><Input /></div><div className="space-y-2"><Label>Email *</Label><Input type="email" /></div></div>
              <div className="space-y-2"><Label>Address</Label><Input /></div>
              <div className="space-y-2"><Label>Payment Terms</Label><Input placeholder="e.g. Net 30" /></div>
            </div>
            <DialogFooter><Button variant="outline">Cancel</Button><Button>Add Supplier</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="directory">
        <TabsList><TabsTrigger value="directory">Directory</TabsTrigger><TabsTrigger value="performance">Performance</TabsTrigger></TabsList>
        <TabsContent value="directory" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">On-Time %</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>{suppliers.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.contact}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone}</td>
                  <td className="px-4 py-3"><Stars rating={s.rating} /></td>
                  <td className="px-4 py-3 font-semibold">{s.onTimeDelivery}%</td>
                  <td className="px-4 py-3"><span className={s.status === "active" ? "status-badge-success" : "status-badge-info"}>{s.status === "active" ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => setSelected(s)}><Eye className="w-4 h-4" /></Button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-heading font-semibold mb-4">Supplier Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={perfData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} /><Bar dataKey="delivery" fill="hsl(var(--primary))" name="On-Time %" radius={[4, 4, 0, 0]} /><Bar dataKey="quality" fill="hsl(var(--secondary))" name="Quality %" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{selected.name}</DialogTitle></DialogHeader>
            <Tabs defaultValue="info">
              <TabsList><TabsTrigger value="info">Info</TabsTrigger><TabsTrigger value="products">Products</TabsTrigger><TabsTrigger value="comms">Communications</TabsTrigger></TabsList>
              <TabsContent value="info" className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{selected.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{selected.email}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{selected.address}</div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div><p className="text-muted-foreground">Rating</p><Stars rating={selected.rating} /></div>
                  <div><p className="text-muted-foreground">On-Time Delivery</p><p className="font-semibold">{selected.onTimeDelivery}%</p></div>
                  <div><p className="text-muted-foreground">Payment Terms</p><p>{selected.paymentTerms}</p></div>
                  <div><p className="text-muted-foreground">Total Orders</p><p className="font-semibold">{selected.totalOrders}</p></div>
                </div>
              </TabsContent>
              <TabsContent value="products" className="mt-4">
                <div className="space-y-2">{selected.products.map(p => <div key={p} className="bg-muted rounded-lg px-3 py-2 text-sm">{p}</div>)}</div>
              </TabsContent>
              <TabsContent value="comms" className="mt-4">
                {supplierComms.filter(c => c.supplierId === selected.id).map(c => (
                  <div key={c.id} className="border-b pb-3 mb-3 last:border-0">
                    <div className="flex justify-between"><span className="text-xs font-medium">{c.type}</span><span className="text-xs text-muted-foreground">{c.date}</span></div>
                    <p className="text-sm mt-1">{c.notes}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
