import { useEffect, useState } from "react";
import { Plus, Eye, Copy, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";
import { recipesApi, rawMaterialsApi } from "@/lib/api";
import type { MaterialCatalogRow } from "@/lib/materialMappers";
import { mapApiRawMaterialToRow } from "@/lib/materialMappers";
import { useRole } from "@/contexts/RoleContext";

const statusCls: Record<string, string> = {
  active: "status-badge-success",
  draft: "status-badge-warning",
  archived: "status-badge-info",
  pending_approval: "status-badge-warning",
};

type IngredientUi = { materialId: string; name: string; qty: number; unit: string; percentage: number };

type RecipeUi = {
  id: string;
  name: string;
  product: string;
  baseQuantity: number;
  version: string;
  costPerBatch: number;
  status: string;
  lastModified: string;
  notes: string;
  ingredients: IngredientUi[];
  nutrition: { calories: string; sugar: string; vitaminC: string };
  shelfLifeDays: number | null;
};

function mapRecipe(r: Record<string, unknown>): RecipeUi {
  const ingredientsRaw = (r.ingredients as Record<string, unknown>[]) ?? [];
  const ingredients: IngredientUi[] = ingredientsRaw.map((ing) => ({
    materialId: String(ing.materialId ?? ""),
    name: String(ing.materialName ?? ""),
    qty: Number(ing.quantity ?? 0),
    unit: String(ing.unitOfMeasure ?? ""),
    percentage: 0,
  }));
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    product: String(r.productName ?? ""),
    baseQuantity: Number(r.baseQuantity ?? 1),
    version: "1",
    costPerBatch: 0,
    status: String(r.status ?? "DRAFT").toLowerCase(),
    lastModified: typeof r.updatedAt === "string" ? r.updatedAt.slice(0, 10) : "—",
    notes: String(r.notes ?? ""),
    ingredients,
    nutrition: { calories: "—", sugar: "—", vitaminC: "—" },
    shelfLifeDays: r.shelfLifeDays != null ? Number(r.shelfLifeDays) : null,
  };
}

export default function RecipesPage() {
  const { role } = useRole();
  const canMutateRecipes = role === "administrator" || role === "production_manager";
  const [recipes, setRecipes] = useState<RecipeUi[]>([]);
  const [materials, setMaterials] = useState<MaterialCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeUi | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeUi | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editName, setEditName] = useState("");
  const [editProductName, setEditProductName] = useState("");
  const [editBaseQty, setEditBaseQty] = useState("");
  const [editShelfLife, setEditShelfLife] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editIngredients, setEditIngredients] = useState<Array<{ materialId: string; quantity: number }>>([]);
  const [editIngredientMaterialId, setEditIngredientMaterialId] = useState("");
  const [editIngredientQty, setEditIngredientQty] = useState("");
  const [newName, setNewName] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newBaseQty, setNewBaseQty] = useState("");
  const [newShelfLife, setNewShelfLife] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newIngredientMaterialId, setNewIngredientMaterialId] = useState("");
  const [newIngredientQty, setNewIngredientQty] = useState("");
  const [newIngredients, setNewIngredients] = useState<Array<{ materialId: string; quantity: number }>>([]);

  const resetCreateForm = () => {
    setNewName("");
    setNewProductName("");
    setNewBaseQty("");
    setNewNotes("");
    setNewShelfLife("");
    setNewIngredientMaterialId("");
    setNewIngredientQty("");
    setNewIngredients([]);
  };

  const addIngredientDraft = () => {
    if (!newIngredientMaterialId || !newIngredientQty) {
      toast.error("Select a material and quantity.");
      return;
    }
    const qty = Number(newIngredientQty);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Ingredient quantity must be greater than zero.");
      return;
    }
    setNewIngredients((prev) => [...prev, { materialId: newIngredientMaterialId, quantity: qty }]);
    setNewIngredientMaterialId("");
    setNewIngredientQty("");
  };

  const removeIngredientDraft = (index: number) => {
    setNewIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const loadPageData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, mRes] = await Promise.all([
        recipesApi.listPage({ size: 200, sort: "name,asc" }),
        rawMaterialsApi.listPage({ size: 300, sort: "name,asc" }).catch(() => ({ data: { content: [] as Record<string, unknown>[] } })),
      ]);
      setRecipes((rRes.data.content ?? []).map((row) => mapRecipe(row)));
      setMaterials((mRes.data.content ?? []).map((row) => mapApiRawMaterialToRow(row)));
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      setError(msg || "Could not load recipes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rRes, mRes] = await Promise.all([
          recipesApi.listPage({ size: 200, sort: "name,asc" }),
          rawMaterialsApi.listPage({ size: 300, sort: "name,asc" }).catch(() => ({ data: { content: [] as Record<string, unknown>[] } })),
        ]);
        if (cancelled) return;
        setRecipes((rRes.data.content ?? []).map((row) => mapRecipe(row)));
        setMaterials((mRes.data.content ?? []).map((row) => mapApiRawMaterialToRow(row)));
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            typeof e === "object" && e !== null && "response" in e
              ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
              : "";
          setError(msg || "Could not load recipes.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openRecipeDetail = async (recipe: RecipeUi) => {
    setSelectedRecipe(recipe);
    if (!recipe.id) return;
    try {
      const { data } = await recipesApi.getById(recipe.id);
      setSelectedRecipe(mapRecipe(data));
    } catch {
      toast.error("Could not load recipe details.");
    }
  };

  const handleCreateRecipe = async () => {
    if (!canMutateRecipes) {
      toast.error("Only Production Manager or Administrator can create recipes.");
      return;
    }
    if (!newName.trim() || !newProductName.trim() || !newBaseQty) {
      toast.error("Recipe name, product name, and base quantity are required.");
      return;
    }
    const bq = Number(newBaseQty);
    if (Number.isNaN(bq) || bq <= 0) {
      toast.error("Base quantity must be greater than zero.");
      return;
    }
    if (newIngredients.length === 0) {
      toast.error("Add at least one ingredient.");
      return;
    }

    setCreateSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: newName.trim(),
        productName: newProductName.trim(),
        baseQuantity: bq,
        notes: newNotes.trim() || undefined,
        ingredients: newIngredients.map((i) => ({ materialId: i.materialId, quantity: i.quantity })),
      };
      if (newShelfLife) body.shelfLifeDays = Number(newShelfLife);
      await recipesApi.create(body);
      toast.success("Recipe created.");
      setCreateOpen(false);
      resetCreateForm();
      await loadPageData();
    } catch (e: unknown) {
      const res = typeof e === "object" && e !== null && "response" in e ? (e as { response?: { data?: { message?: string; fieldErrors?: Record<string, string> } } }).response?.data : undefined;
      const fieldMsg = res?.fieldErrors ? Object.values(res.fieldErrors).join(" ") : "";
      const msg = fieldMsg || res?.message || "";
      toast.error(msg || "Could not create recipe.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditRecipe = (recipe: RecipeUi) => {
    if (!canMutateRecipes) {
      toast.error("Only Production Manager or Administrator can edit recipes.");
      return;
    }
    setEditingRecipe(recipe);
    setEditName(recipe.name);
    setEditProductName(recipe.product);
    setEditBaseQty(String(recipe.baseQuantity));
    setEditShelfLife(recipe.shelfLifeDays != null ? String(recipe.shelfLifeDays) : "");
    setEditNotes(recipe.notes ?? "");
    setEditIngredients(recipe.ingredients.map((i) => ({ materialId: i.materialId, quantity: i.qty })));
  };

  const addEditIngredient = () => {
    if (!editIngredientMaterialId || !editIngredientQty) {
      toast.error("Select a material and quantity.");
      return;
    }
    const qty = Number(editIngredientQty);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Ingredient quantity must be greater than zero.");
      return;
    }
    setEditIngredients((prev) => [...prev, { materialId: editIngredientMaterialId, quantity: qty }]);
    setEditIngredientMaterialId("");
    setEditIngredientQty("");
  };

  const removeEditIngredient = (index: number) => {
    setEditIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRecipe = async () => {
    if (!editingRecipe || !canMutateRecipes) return;
    if (!editName.trim() || !editProductName.trim() || !editBaseQty) {
      toast.error("Recipe name, product name, and base quantity are required.");
      return;
    }
    const bq = Number(editBaseQty);
    if (Number.isNaN(bq) || bq <= 0) {
      toast.error("Base quantity must be greater than zero.");
      return;
    }
    if (editIngredients.length === 0) {
      toast.error("Add at least one ingredient.");
      return;
    }

    setEditSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: editName.trim(),
        productName: editProductName.trim(),
        baseQuantity: bq,
        notes: editNotes.trim() || undefined,
        ingredients: editIngredients.map((i) => ({ materialId: i.materialId, quantity: i.quantity })),
      };
      if (editShelfLife) body.shelfLifeDays = Number(editShelfLife);
      await recipesApi.update(editingRecipe.id, body);
      toast.success("Recipe updated.");
      setEditingRecipe(null);
      await loadPageData();
    } catch (e: unknown) {
      const res = typeof e === "object" && e !== null && "response" in e ? (e as { response?: { data?: { message?: string } } }).response?.data : undefined;
      toast.error(res?.message || "Could not update recipe.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteRecipe = async (recipe: RecipeUi) => {
    if (!canMutateRecipes) {
      toast.error("Only Production Manager or Administrator can delete recipes.");
      return;
    }
    if (!window.confirm(`Delete recipe "${recipe.name}"? This cannot be undone.`)) return;

    setDeleteSubmitting(true);
    try {
      await recipesApi.delete(recipe.id);
      toast.success("Recipe deleted.");
      if (selectedRecipe?.id === recipe.id) setSelectedRecipe(null);
      if (editingRecipe?.id === recipe.id) setEditingRecipe(null);
      await loadPageData();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not delete recipe.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Recipes & Formulations</h1>
          <p className="text-sm text-muted-foreground">
            Define how much finished product one formula makes and which raw materials it consumes. Production scales
            ingredients when batch size changes.
          </p>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" disabled={!canMutateRecipes}>
              <Plus className="w-4 h-4 mr-1" />
              New Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
            <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
              <DialogTitle>Create Recipe</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                Example: to make <strong>100 L mango squash</strong>, enter output size <strong>100</strong>, then list
                what that batch needs — e.g. <strong>80 L mango extract</strong>, <strong>4 kg sugar</strong>,{" "}
                <strong>600 g mint</strong>. Semi-finished items like extract are raw materials in inventory (produce
                extract in its own recipe/batch first, then use it here).
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipe Name *</Label>
                  <Input placeholder="e.g. Mango Squash" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Finished product *</Label>
                  <Input placeholder="Mango Squash" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Output size (per formula) *</Label>
                  <Input
                    type="number"
                    min={0.0001}
                    step="any"
                    placeholder="e.g. 100"
                    value={newBaseQty}
                    onChange={(e) => setNewBaseQty(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    e.g. 100 = liters of finished product this formula makes.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select defaultValue="draft">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Raw materials for this output</Label>
                <p className="text-xs text-muted-foreground">
                  Quantities below are for the output size above (not per liter unless output size is 1).
                </p>
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground uppercase">
                    <div className="col-span-4">Ingredient</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-2">%</div>
                    <div className="col-span-2">Cost</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Select value={newIngredientMaterialId || undefined} onValueChange={setNewIngredientMaterialId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="0" min={0.0001} step="any" value={newIngredientQty} onChange={(e) => setNewIngredientQty(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Unit"
                        readOnly
                        className="bg-muted"
                        value={materials.find((m) => m.id === newIngredientMaterialId)?.unit ?? ""}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input placeholder="%" readOnly className="bg-muted" value="—" />
                    </div>
                    <div className="col-span-2">
                      <Input placeholder="0" readOnly className="bg-muted" value="—" />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs" type="button" onClick={addIngredientDraft}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add ingredient
                  </Button>
                  {newIngredients.length > 0 && (
                    <div className="pt-2 space-y-1">
                      {newIngredients.map((ing, idx) => {
                        const mat = materials.find((m) => m.id === ing.materialId);
                        return (
                          <div key={`${ing.materialId}-${idx}`} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                            <span>
                              {mat?.name ?? ing.materialId} - {ing.quantity} {mat?.unit ?? ""}
                            </span>
                            <Button variant="ghost" size="sm" type="button" onClick={() => removeIngredientDraft(idx)}>
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nutritional Info (optional)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input placeholder="Calories" />
                  <Input placeholder="Sugar" />
                  <Input placeholder="Vitamin C" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes / Instructions</Label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px]"
                  placeholder="Preparation notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
            </div>
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button disabled={createSubmitting || !canMutateRecipes} onClick={() => void handleCreateRecipe()}>
                {createSubmitting ? "Saving..." : "Save Recipe"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading recipes…</p>}
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="data-table w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Recipe</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Output size</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Ingredients</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Version</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Cost/Batch</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.product}</td>
                <td className="px-4 py-3 font-mono">{r.baseQuantity.toLocaleString()}</td>
                <td className="px-4 py-3">{r.ingredients.length}</td>
                <td className="px-4 py-3">v{r.version}</td>
<td className="px-4 py-3 font-semibold">RWF {r.costPerBatch.toLocaleString()}</td>
                     <td className="px-4 py-3">
                       <span className={statusCls[r.status] ?? "status-badge-info"}>{r.status.replace(/_/g, " ")}</span>
                     </td>
                     <td className="px-4 py-3">
                       <div className="flex gap-1">
                         <Button variant="ghost" size="sm" onClick={() => void openRecipeDetail(r)}>
                           <Eye className="w-4 h-4" />
                         </Button>
                         <Button variant="ghost" size="sm" title="Edit" disabled={!canMutateRecipes} onClick={() => openEditRecipe(r)}>
                           <Edit className="w-4 h-4" />
                         </Button>
                          <Button variant="ghost" size="sm" title="Clone">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Delete" disabled={!canMutateRecipes || deleteSubmitting} onClick={() => void handleDeleteRecipe(r)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                     </td>
                   </tr>
            ))}
          </tbody>
        </table>
        {!loading && recipes.length === 0 && (
          <p className="text-sm text-muted-foreground p-6 text-center">No recipes from API.</p>
        )}
      </div>

      {selectedRecipe && (
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
            <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
              <DialogTitle>
                {selectedRecipe.name} v{selectedRecipe.version}
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Product</p>
                    <p className="font-medium">{selectedRecipe.product}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Output per formula</p>
                    <p className="font-medium font-mono">{selectedRecipe.baseQuantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <span className={statusCls[selectedRecipe.status] ?? "status-badge-info"}>{selectedRecipe.status}</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost per Batch</p>
                    <p className="font-semibold">RWF {selectedRecipe.costPerBatch.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Modified</p>
                    <p>{selectedRecipe.lastModified}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedRecipe.notes}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="ingredients" className="mt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Amounts to produce <strong>{selectedRecipe.baseQuantity.toLocaleString()}</strong> of{" "}
                  <strong>{selectedRecipe.product}</strong>. Production scales these when batch size differs.
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground uppercase">
                      <th className="text-left py-2">Ingredient</th>
                      <th className="text-left py-2">Quantity</th>
                      <th className="text-left py-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecipe.ingredients.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-muted-foreground text-sm">
                          No ingredients on this recipe. Edit or recreate it and add raw materials.
                        </td>
                      </tr>
                    ) : (
                      selectedRecipe.ingredients.map((i) => (
                        <tr key={i.materialId} className="border-b">
                          <td className="py-2 font-medium">{i.name}</td>
                          <td className="py-2">
                            {i.qty} {i.unit}
                          </td>
                          <td className="py-2">{i.percentage}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TabsContent>
              <TabsContent value="nutrition" className="mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="font-bold text-lg">{selectedRecipe.nutrition.calories}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Sugar</p>
                    <p className="font-bold text-lg">{selectedRecipe.nutrition.sugar}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Vitamin C</p>
                    <p className="font-bold text-lg">{selectedRecipe.nutrition.vitaminC}</p>
                  </div>
                </div>
</TabsContent>
              </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {editingRecipe && (
          <Dialog open={!!editingRecipe} onOpenChange={() => setEditingRecipe(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
              <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
                <DialogTitle>Edit Recipe</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                    Example: to make <strong>100 L mango squash</strong>, enter output size <strong>100</strong>, then list
                    what that batch needs — e.g. <strong>80 L mango extract</strong>, <strong>4 kg sugar</strong>,{" "}
                    <strong>600 g mint</strong>.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Recipe Name *</Label>
                      <Input placeholder="e.g. Mango Squash" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Finished product *</Label>
                      <Input placeholder="Mango Squash" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Output size (per formula) *</Label>
                      <Input
                        type="number"
                        min={0.0001}
                        step="any"
                        placeholder="e.g. 100"
                        value={editBaseQty}
                        onChange={(e) => setEditBaseQty(e.target.value)}
                      />
<p className="text-xs text-muted-foreground">
                    e.g. 100 = liters of finished product this formula makes.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Shelf Life (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    step="1"
                    placeholder="e.g. 180"
                    value={editShelfLife}
                    onChange={(e) => setEditShelfLife(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days before finished product expires.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                    <Label>Raw materials for this output</Label>
                    <p className="text-xs text-muted-foreground">
                      Quantities below are for the output size above.
                    </p>
                    <div className="border rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground uppercase">
                        <div className="col-span-4">Ingredient</div>
                        <div className="col-span-2">Qty</div>
                        <div className="col-span-2">Unit</div>
                        <div className="col-span-2">%</div>
                        <div className="col-span-2">Cost</div>
                      </div>
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <Select value={editIngredientMaterialId || undefined} onValueChange={setEditIngredientMaterialId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input type="number" placeholder="0" min={0.0001} step="any" value={editIngredientQty} onChange={(e) => setEditIngredientQty(e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Unit"
                            readOnly
                            className="bg-muted"
                            value={materials.find((m) => m.id === editIngredientMaterialId)?.unit ?? ""}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input placeholder="%" readOnly className="bg-muted" value="—" />
                        </div>
                        <div className="col-span-2">
                          <Input placeholder="0" readOnly className="bg-muted" value="—" />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs" type="button" onClick={addEditIngredient}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add ingredient
                      </Button>
                      {editIngredients.length > 0 && (
                        <div className="pt-2 space-y-1">
                          {editIngredients.map((ing, idx) => {
                            const mat = materials.find((m) => m.id === ing.materialId);
                            return (
                              <div key={`${ing.materialId}-${idx}`} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                                <span>
                                  {mat?.name ?? ing.materialId} - {ing.quantity} {mat?.unit ?? ""}
                                </span>
                                <Button variant="ghost" size="sm" type="button" onClick={() => removeEditIngredient(idx)}>
                                  Remove
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes / Instructions</Label>
                    <textarea
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px]"
                      placeholder="Preparation notes..."
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
                <Button variant="outline" onClick={() => setEditingRecipe(null)}>
                  Cancel
                </Button>
                <Button disabled={editSubmitting} onClick={() => void handleUpdateRecipe()}>
                  {editSubmitting ? "Saving..." : "Update Recipe"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
  );
}
