import { useState } from "react";
import { productionBatches, rawMaterials, recipes } from "@/lib/mockData";
import { Plus, Search, Eye, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";

const statusConfig: Record<string, { label: string; cls: string; step: number }> = {
  planned: { label: "Planned", cls: "status-badge-info", step: 0 },
  in_progress: { label: "In Progress", cls: "status-badge-warning", step: 2 },
  qc_pending: { label: "QC Pending", cls: "status-badge-info", step: 3 },
  completed: { label: "Completed", cls: "status-badge-success", step: 4 },
};

const steps = ["Planned", "Issued", "In Production", "QC Pending", "Completed"];

function StatusStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1 my-4">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${i <= currentStep ? "bg-primary-foreground text-primary" : "bg-muted-foreground/30"}`}>{i < currentStep ? "✓" : i + 1}</span>
            {s}
          </div>
          {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground mx-0.5" />}
        </div>
      ))}
    </div>
  );
}

export default function ProductionPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState<typeof productionBatches[0] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState("");
  const [yieldOpen, setYieldOpen] = useState(false);

  const filtered = productionBatches.filter(b => {
    const matchSearch = b.product.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Production Batches</h1>
          <p className="text-sm text-muted-foreground">Manage and track juice production batches</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />New Batch</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Production Batch</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                <span className="text-muted-foreground">Batch Number: </span>
                <span className="font-mono font-semibold">B-20260328-001</span> (auto-generated)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Juice Product *</Label><Select><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger><SelectContent><SelectItem value="orange500">Orange Blast 500ml</SelectItem><SelectItem value="mango500">Mango Tango 500ml</SelectItem><SelectItem value="passion1l">Passion Punch 1L</SelectItem><SelectItem value="tropical500">Tropical Mix 500ml</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Recipe *</Label><Select value={selectedRecipe} onValueChange={setSelectedRecipe}><SelectTrigger><SelectValue placeholder="Select recipe" /></SelectTrigger><SelectContent>{recipes.filter(r => r.status === "active").map(r => <SelectItem key={r.id} value={r.id}>{r.name} v{r.version}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Target Quantity *</Label><Input type="number" placeholder="0" /></div>
                <div className="space-y-2"><Label>Production Date</Label><Input type="date" defaultValue="2026-03-28" /></div>
                <div className="space-y-2"><Label>Start Time</Label><Input type="time" defaultValue="08:00" /></div>
              </div>
              <div className="space-y-2"><Label>Assigned Staff *</Label><Input placeholder="Select staff members" /></div>

              {selectedRecipe && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="text-sm font-semibold mb-2">Ingredient Requirements (from recipe)</h4>
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-muted-foreground uppercase"><th className="text-left py-1">Ingredient</th><th className="text-left py-1">Required</th><th className="text-left py-1">In Stock</th><th className="text-left py-1">Status</th></tr></thead>
                    <tbody>{recipes.find(r => r.id === selectedRecipe)?.ingredients.map(ing => {
                      const mat = rawMaterials.find(r => r.id === ing.materialId);
                      const sufficient = mat ? mat.stock >= ing.qty : false;
                      return (
                        <tr key={ing.materialId} className="border-t">
                          <td className="py-2">{ing.name}</td>
                          <td className="py-2">{ing.qty} {ing.unit}</td>
                          <td className="py-2 font-semibold">{mat?.stock ?? 0} {ing.unit}</td>
                          <td className="py-2">{sufficient ? <span className="status-badge-success">✓ OK</span> : <span className="status-badge-danger">Shortfall</span>}</td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              )}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => setCreateOpen(false)}>Create Batch</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search batches..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="qc_pending">QC Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filtered.map(b => {
          const s = statusConfig[b.status];
          return (
            <div key={b.id} className="bg-card border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">{b.id}</p>
                    <p className="font-medium mt-0.5">{b.product}</p>
                  </div>
                  <div className="text-sm text-muted-foreground hidden md:block">Qty: <span className="text-foreground font-medium">{b.quantity.toLocaleString()}</span></div>
                  <div className="text-sm text-muted-foreground hidden lg:block">Assigned: <span className="text-foreground">{b.assignedTo}</span></div>
                  <div className="text-sm text-muted-foreground hidden lg:block">{b.startDate}</div>
                </div>
                <div className="flex items-center gap-3">
                  {b.yield !== null && <span className="text-sm font-medium">Yield: {b.yield}%</span>}
                  <span className={s.cls}>{s.label}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedBatch(b)}><Eye className="w-4 h-4" /></Button>
                </div>
              </div>
              <StatusStepper currentStep={s.step} />
            </div>
          );
        })}
      </div>

      {/* Batch Detail Dialog */}
      {selectedBatch && (
        <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Batch {selectedBatch.id}</DialogTitle></DialogHeader>
            <Tabs defaultValue="details">
              <TabsList><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="ingredients">Ingredients</TabsTrigger><TabsTrigger value="yield">Yield & Loss</TabsTrigger></TabsList>
              <TabsContent value="details" className="mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Product</p><p className="font-medium">{selectedBatch.product}</p></div>
                  <div><p className="text-muted-foreground">Quantity</p><p className="font-medium">{selectedBatch.quantity.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Status</p><p><span className={statusConfig[selectedBatch.status].cls}>{statusConfig[selectedBatch.status].label}</span></p></div>
                  <div><p className="text-muted-foreground">Start Date</p><p className="font-medium">{selectedBatch.startDate}</p></div>
                  <div><p className="text-muted-foreground">Assigned To</p><p className="font-medium">{selectedBatch.assignedTo}</p></div>
                  <div><p className="text-muted-foreground">Recipe</p><p className="font-medium">{selectedBatch.recipeId}</p></div>
                </div>
                <StatusStepper currentStep={statusConfig[selectedBatch.status].step} />
              </TabsContent>
              <TabsContent value="ingredients" className="mt-4">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-muted-foreground uppercase border-b"><th className="text-left py-2">Material</th><th className="text-left py-2">Required</th><th className="text-left py-2">Issued</th><th className="text-left py-2">Status</th></tr></thead>
                  <tbody>{selectedBatch.ingredients.map(ing => {
                    const mat = rawMaterials.find(r => r.id === ing.materialId);
                    return (
                      <tr key={ing.materialId} className="border-b">
                        <td className="py-2 font-medium">{mat?.name ?? ing.materialId}</td>
                        <td className="py-2">{ing.required}</td>
                        <td className="py-2">{ing.issued}</td>
                        <td className="py-2">{ing.issued >= ing.required ? <span className="status-badge-success">✓ Issued</span> : <span className="status-badge-warning">Pending</span>}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </TabsContent>
              <TabsContent value="yield" className="mt-4">
                {selectedBatch.yield !== null ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Expected Yield</p><p className="font-medium">{selectedBatch.quantity}</p></div>
                    <div><p className="text-muted-foreground">Actual Yield</p><p className="font-semibold text-lg">{Math.round(selectedBatch.quantity * selectedBatch.yield / 100)}</p></div>
                    <div><p className="text-muted-foreground">Yield %</p><p className="font-semibold text-primary">{selectedBatch.yield}%</p></div>
                    <div><p className="text-muted-foreground">Loss</p><p className="font-medium text-destructive">{selectedBatch.loss} units</p></div>
                    <div className="col-span-2"><p className="text-muted-foreground">Loss Reason</p><p className="font-medium">{selectedBatch.lossReason}</p></div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm mb-3">No yield data recorded yet.</p>
                    <Dialog open={yieldOpen} onOpenChange={setYieldOpen}>
                      <DialogTrigger asChild><Button size="sm">Record Yield</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Record Yield & Loss</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Expected Yield</Label><Input value={selectedBatch.quantity} readOnly className="bg-muted" /></div>
                            <div className="space-y-2"><Label>Actual Yield *</Label><Input type="number" placeholder="0" /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Loss Quantity</Label><Input type="number" placeholder="0" /></div>
                            <div className="space-y-2"><Label>Loss Reason</Label><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="spillage">Spillage</SelectItem><SelectItem value="evaporation">Evaporation</SelectItem><SelectItem value="contamination">Contamination</SelectItem><SelectItem value="equipment">Equipment failure</SelectItem></SelectContent></Select></div>
                          </div>
                          <div className="space-y-2"><Label>Notes</Label><Input placeholder="Optional notes" /></div>
                        </div>
                        <DialogFooter><Button variant="outline" onClick={() => setYieldOpen(false)}>Cancel</Button><Button onClick={() => setYieldOpen(false)}>Save</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
