import { useState } from "react";
import { recipes, rawMaterials } from "@/lib/mockData";
import { Plus, Search, Eye, Copy, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";

const statusCls: Record<string, string> = { active: "status-badge-success", draft: "status-badge-warning", archived: "status-badge-info" };

export default function RecipesPage() {
  const [selectedRecipe, setSelectedRecipe] = useState<typeof recipes[0] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div><h1 className="text-2xl font-heading font-bold">Recipes & Formulations</h1><p className="text-sm text-muted-foreground">Manage juice recipes, ingredients, and versioning</p></div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />New Recipe</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Recipe</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Recipe Name *</Label><Input placeholder="e.g. Orange Blast" /></div>
                <div className="space-y-2"><Label>Linked Product</Label><Input placeholder="Orange Blast 500ml" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Version</Label><Input value="1" readOnly className="bg-muted" /></div>
                <div className="space-y-2"><Label>Status</Label><Select defaultValue="draft"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Ingredients</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground uppercase"><div className="col-span-4">Ingredient</div><div className="col-span-2">Qty</div><div className="col-span-2">Unit</div><div className="col-span-2">%</div><div className="col-span-2">Cost</div></div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4"><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{rawMaterials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="col-span-2"><Input type="number" placeholder="0" /></div>
                    <div className="col-span-2"><Input placeholder="Kg" readOnly className="bg-muted" /></div>
                    <div className="col-span-2"><Input placeholder="%" readOnly className="bg-muted" /></div>
                    <div className="col-span-2"><Input placeholder="0" readOnly className="bg-muted" /></div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs"><Plus className="w-3 h-3 mr-1" />Add ingredient</Button>
                </div>
              </div>
              <div className="space-y-2"><Label>Nutritional Info (optional)</Label>
                <div className="grid grid-cols-3 gap-4"><Input placeholder="Calories" /><Input placeholder="Sugar" /><Input placeholder="Vitamin C" /></div>
              </div>
              <div className="space-y-2"><Label>Notes / Instructions</Label><textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px]" placeholder="Preparation notes..." /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => setCreateOpen(false)}>Save Recipe</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="data-table w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Recipe</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Version</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Cost/Batch</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>{recipes.map(r => (
            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{r.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.product}</td>
              <td className="px-4 py-3">v{r.version}</td>
              <td className="px-4 py-3 font-semibold">KES {r.costPerBatch.toLocaleString()}</td>
              <td className="px-4 py-3"><span className={statusCls[r.status]}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
              <td className="px-4 py-3"><div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setSelectedRecipe(r)}><Eye className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" title="Clone"><Copy className="w-4 h-4" /></Button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {selectedRecipe && (
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{selectedRecipe.name} v{selectedRecipe.version}</DialogTitle></DialogHeader>
            <Tabs defaultValue="details">
              <TabsList><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="ingredients">Ingredients</TabsTrigger><TabsTrigger value="nutrition">Nutrition</TabsTrigger></TabsList>
              <TabsContent value="details" className="mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground">Product</p><p className="font-medium">{selectedRecipe.product}</p></div>
                  <div><p className="text-muted-foreground">Status</p><span className={statusCls[selectedRecipe.status]}>{selectedRecipe.status}</span></div>
                  <div><p className="text-muted-foreground">Cost per Batch</p><p className="font-semibold">KES {selectedRecipe.costPerBatch.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Last Modified</p><p>{selectedRecipe.lastModified}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Notes</p><p className="text-sm">{selectedRecipe.notes}</p></div>
                </div>
              </TabsContent>
              <TabsContent value="ingredients" className="mt-4">
                <table className="w-full text-sm"><thead><tr className="border-b text-xs text-muted-foreground uppercase"><th className="text-left py-2">Ingredient</th><th className="text-left py-2">Quantity</th><th className="text-left py-2">%</th></tr></thead>
                <tbody>{selectedRecipe.ingredients.map(i => (
                  <tr key={i.materialId} className="border-b"><td className="py-2 font-medium">{i.name}</td><td className="py-2">{i.qty} {i.unit}</td><td className="py-2">{i.percentage}%</td></tr>
                ))}</tbody></table>
              </TabsContent>
              <TabsContent value="nutrition" className="mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground">Calories</p><p className="font-bold text-lg">{selectedRecipe.nutrition.calories}</p></div>
                  <div className="p-3 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground">Sugar</p><p className="font-bold text-lg">{selectedRecipe.nutrition.sugar}</p></div>
                  <div className="p-3 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground">Vitamin C</p><p className="font-bold text-lg">{selectedRecipe.nutrition.vitaminC}</p></div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
