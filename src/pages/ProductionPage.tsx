import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Eye, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";
import { batchesApi, recipesApi, rawMaterialsApi } from "@/lib/api";
import type { MaterialCatalogRow } from "@/lib/materialMappers";
import { mapApiRawMaterialToRow } from "@/lib/materialMappers";
import { useRole } from "@/contexts/RoleContext";

const statusConfig: Record<string, { label: string; cls: string; step: number }> = {
  planned: { label: "Planned", cls: "status-badge-info", step: 0 },
  issued: { label: "Issued", cls: "status-badge-warning", step: 1 },
  in_progress: { label: "In Production", cls: "status-badge-warning", step: 2 },
  qc_pending: { label: "QC Pending", cls: "status-badge-info", step: 3 },
  completed: { label: "Completed", cls: "status-badge-success", step: 4 },
  on_hold: { label: "On Hold", cls: "status-badge-info", step: 1 },
};

const steps = ["Planned", "Issued", "In Production", "QC Pending", "Completed"];

function mapApiStatus(raw: string): string {
  const u = raw.toUpperCase().replace(/-/g, "_");
  const table: Record<string, string> = {
    PLANNED: "planned",
    ISSUED: "issued",
    IN_PROGRESS: "in_progress",
    QC_PENDING: "qc_pending",
    COMPLETED: "completed",
    ON_HOLD: "on_hold",
  };
  return table[u] ?? "planned";
}

type IngredientLine = { materialId: string; name: string; required: number; issued: number; unit: string };

type BatchRow = {
  entityId: string;
  id: string;
  product: string;
  status: string;
  quantity: number;
  assignedTo: string;
  startDate: string;
  yield: number | null;
  actualYield: number | null;
  loss: number;
  lossReason: string;
  recipeId: string;
  finishedGoodsTransferred: boolean;
  ingredients: IngredientLine[];
};

function mapBatch(m: Record<string, unknown>): BatchRow {
  const st = mapApiStatus(String(m.status ?? "PLANNED"));
  const entityId = String(m.id ?? "");
  const target = Number(m.targetQuantity ?? m.quantity ?? 0);
  const actual = m.actualYield != null ? Number(m.actualYield) : null;
  const ingredientsRaw = (m.ingredients as Record<string, unknown>[]) ?? [];
  const ingredients: IngredientLine[] = ingredientsRaw.map((ing) => ({
    materialId: String(ing.materialId ?? ""),
    name: String(ing.materialName ?? ""),
    required: Number(ing.quantityRequired ?? 0),
    issued: Number(ing.quantityIssued ?? 0),
    unit: String(ing.unitOfMeasure ?? ""),
  }));
  return {
    entityId,
    id: String(m.batchNumber ?? entityId),
    product: String(m.productName ?? m.product ?? "—"),
    status: st,
    quantity: target,
    assignedTo: String(m.assignedTo ?? m.assignedStaff ?? m.createdBy ?? "—"),
    startDate: String(m.productionDate ?? m.startDate ?? m.createdAt ?? "").slice(0, 10),
    yield: actual != null && target > 0 ? Math.round((actual / target) * 100) : null,
    actualYield: actual,
    loss: Number(m.loss ?? 0),
    lossReason: m.lossReason != null && String(m.lossReason) !== "" ? String(m.lossReason) : "—",
    recipeId: String(m.recipeId ?? "—"),
    finishedGoodsTransferred: Boolean(m.finishedGoodsTransferred),
    ingredients,
  };
}

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
  ingredients: { materialId: string; name: string; qty: number; unit: string }[];
};

function mapRecipe(r: Record<string, unknown>): RecipeUi {
  const ingredientsRaw = (r.ingredients as Record<string, unknown>[]) ?? [];
  const ingredients = ingredientsRaw.map((ing) => ({
    materialId: String(ing.materialId ?? ""),
    name: String(ing.materialName ?? ""),
    qty: Number(ing.quantity ?? 0),
    unit: String(ing.unitOfMeasure ?? ""),
  }));
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    product: String(r.productName ?? ""),
    baseQuantity: Number(r.baseQuantity ?? 1),
    version: "1",
    costPerBatch: 0,
    status: String(r.status ?? "DRAFT").toLowerCase(),
    lastModified: String(r.updatedAt ?? "").slice(0, 10),
    notes: String(r.notes ?? ""),
    ingredients,
  };
}

function StatusStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1 my-4 flex-wrap">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                i <= currentStep ? "bg-primary-foreground text-primary" : "bg-muted-foreground/30"
              }`}
            >
              {i < currentStep ? "✓" : i + 1}
            </span>
            {s}
          </div>
          {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground mx-0.5" />}
        </div>
      ))}
    </div>
  );
}

export default function ProductionPage() {
  const { role } = useRole();
  const canMutateProduction = role === "administrator" || role === "production_manager";
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [recipes, setRecipes] = useState<RecipeUi[]>([]);
  const [materials, setMaterials] = useState<MaterialCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState("");
  const [targetQty, setTargetQty] = useState("");
  const [yieldOpen, setYieldOpen] = useState(false);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [startSubmitting, setStartSubmitting] = useState(false);
  const [yieldSubmitting, setYieldSubmitting] = useState(false);
  const [sendQcSubmitting, setSendQcSubmitting] = useState(false);
  const [actualYieldInput, setActualYieldInput] = useState("");
  const [lossQtyInput, setLossQtyInput] = useState("");
  const [lossReasonInput, setLossReasonInput] = useState("");

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const issues: string[] = [];

    try {
      await batchesApi.syncFinishedGoods().catch(() => undefined);
      const { data } = await batchesApi.listPage({ size: 100, sort: "createdAt,desc" });
      setBatches((data.content ?? []).map((row) => mapBatch(row)));
    } catch (e: unknown) {
      setBatches([]);
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      issues.push(msg || "Could not load production batches.");
    }

    try {
      const { data } = await recipesApi.listPage({ size: 100, sort: "name,asc" });
      setRecipes((data.content ?? []).map((row) => mapRecipe(row)));
    } catch {
      setRecipes([]);
      issues.push("Could not load recipes for batch creation.");
    }

    try {
      const { data } = await rawMaterialsApi.listPage({ size: 300, sort: "name,asc" });
      setMaterials((data.content ?? []).map((row) => mapApiRawMaterialToRow(row)));
    } catch {
      setMaterials([]);
    }

    if (issues.length > 0) {
      setError(issues.join(" "));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const resetYieldForm = (batch: BatchRow) => {
    setActualYieldInput(batch.actualYield != null ? String(batch.actualYield) : "");
    setLossQtyInput(batch.loss > 0 ? String(batch.loss) : "");
    setLossReasonInput(batch.lossReason !== "—" ? batch.lossReason : "");
  };

  const openBatchDetail = async (batch: BatchRow) => {
    setSelectedBatch(batch);
    resetYieldForm(batch);
    if (!batch.entityId) return;
    try {
      const { data } = await batchesApi.getById(batch.entityId);
      const mapped = mapBatch(data);
      setSelectedBatch(mapped);
      resetYieldForm(mapped);
    } catch {
      toast.error("Could not load batch details.");
    }
  };

  const handleConfirmIngredients = async () => {
    if (!selectedBatch?.entityId || !canMutateProduction) return;
    setConfirmSubmitting(true);
    try {
      const { data } = await batchesApi.confirmIngredients(selectedBatch.entityId);
      setSelectedBatch(mapBatch(data));
      toast.success("Ingredients issued — batch status updated to Issued.");
      await loadPageData();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not confirm ingredients.");
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const handleRecordYield = async () => {
    if (!selectedBatch?.entityId || !canMutateProduction) return;
    const actual = Number(actualYieldInput);
    if (Number.isNaN(actual) || actual <= 0) {
      toast.error("Actual yield must be greater than zero.");
      return;
    }
    setYieldSubmitting(true);
    try {
      const body: Record<string, unknown> = { actualYield: actual };
      if (lossQtyInput) {
        const loss = Number(lossQtyInput);
        if (!Number.isNaN(loss) && loss >= 0) body.loss = loss;
      }
      if (lossReasonInput.trim()) body.lossReason = lossReasonInput.trim();
      const { data } = await batchesApi.recordYield(selectedBatch.entityId, body);
      const mapped = mapBatch(data);
      setSelectedBatch(mapped);
      resetYieldForm(mapped);
      setYieldOpen(false);
      toast.success("Yield recorded. Send the batch to QC when production is finished.");
      await loadPageData();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not record yield.");
    } finally {
      setYieldSubmitting(false);
    }
  };

  const handleSendToQc = async () => {
    if (!selectedBatch?.entityId || !canMutateProduction) return;
    if (selectedBatch.actualYield == null) {
      toast.error("Record actual yield before sending to quality control.");
      return;
    }
    setSendQcSubmitting(true);
    try {
      const { data } = await batchesApi.sendToQc(selectedBatch.entityId);
      setSelectedBatch(mapBatch(data));
      toast.success("Batch sent to Quality Control. QC officers can run tests now.");
      await loadPageData();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not send batch to QC.");
    } finally {
      setSendQcSubmitting(false);
    }
  };

  const handleStartProduction = async () => {
    if (!selectedBatch?.entityId || !canMutateProduction) return;
    setStartSubmitting(true);
    try {
      const { data } = await batchesApi.start(selectedBatch.entityId);
      setSelectedBatch(mapBatch(data));
      toast.success("Production started — batch is now In Production.");
      await loadPageData();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not start production.");
    } finally {
      setStartSubmitting(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!canMutateProduction) {
      toast.error("Only Production Manager or Administrator can create batches.");
      return;
    }
    if (!selectedRecipe || !targetQty) {
      toast.error("Recipe and target quantity are required.");
      return;
    }
    const qty = Number(targetQty);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Target quantity must be greater than zero.");
      return;
    }
    setCreateSubmitting(true);
    try {
      const { data } = await batchesApi.create({ recipeId: selectedRecipe, targetQuantity: qty });
      const shortfalls = (data.shortfalls as unknown[]) ?? [];
      if (shortfalls.length > 0) {
        toast.warning("Batch created with ingredient shortfalls. Review stock before confirming ingredients.");
      } else {
        toast.success("Production batch created.");
      }
      setCreateOpen(false);
      setSelectedRecipe("");
      setTargetQty("");
      await loadPageData();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not create production batch.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const filtered = batches.filter((b) => {
    const matchSearch =
      b.product.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const recipeForDialog = recipes.find((r) => r.id === selectedRecipe);
  const targetQtyNum = Number(targetQty);
  const scaleFactor =
    recipeForDialog && !Number.isNaN(targetQtyNum) && targetQtyNum > 0 && recipeForDialog.baseQuantity > 0
      ? targetQtyNum / recipeForDialog.baseQuantity
      : 1;
  const usableRecipes = recipes.filter(
    (r) => r.status !== "archived" && r.ingredients.length > 0,
  );

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Production Batches</h1>
          <p className="text-sm text-muted-foreground">
            Pick a recipe and how much to make — the system calculates raw materials from the formula (scaled to batch
            size).
          </p>
        </div>
        <Dialog
          open={createOpen}
            onOpenChange={(open) => {
            setCreateOpen(open);
            if (open && usableRecipes.length === 1) {
              setSelectedRecipe(usableRecipes[0].id);
              setTargetQty(String(usableRecipes[0].baseQuantity));
            }
            if (!open) {
              setSelectedRecipe("");
              setTargetQty("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" disabled={!canMutateProduction}>
              <Plus className="w-4 h-4 mr-1" />
              New Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Production Batch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                <span className="text-muted-foreground">Batch Number: </span>
                <span className="font-mono font-semibold">(assigned by server)</span>
              </div>
              <div className="space-y-2">
                <Label>Recipe *</Label>
                <Select
                  value={selectedRecipe || undefined}
                  onValueChange={(id) => {
                    setSelectedRecipe(id);
                    const r = recipes.find((x) => x.id === id);
                    if (r && !targetQty) {
                      setTargetQty(String(r.baseQuantity));
                    }
                  }}
                >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {usableRecipes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} — {r.product || "No product"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                {usableRecipes.length === 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    No usable recipes. In <strong>Recipes</strong>, create a formula, add at least one raw material, then return
                    here. (Recipes with 0 ingredients cannot be used.)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>How much to produce *</Label>
                <Input
                  type="number"
                  min={0.0001}
                  step="any"
                  placeholder={recipeForDialog ? String(recipeForDialog.baseQuantity) : "0"}
                  value={targetQty}
                  onChange={(e) => setTargetQty(e.target.value)}
                />
                {recipeForDialog && (
                  <p className="text-xs text-muted-foreground">
                    Recipe is defined for <strong>{recipeForDialog.baseQuantity.toLocaleString()}</strong> of{" "}
                    <strong>{recipeForDialog.product || recipeForDialog.name}</strong>. Enter your batch size in the
                    same unit — e.g. 100 L squash uses{" "}
                    {scaleFactor !== 1 ? `${scaleFactor.toLocaleString(undefined, { maximumFractionDigits: 4 })}×` : "the"}{" "}
                    formula amounts below.
                  </p>
                )}
              </div>

              {selectedRecipe && recipeForDialog && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="text-sm font-semibold mb-1">
                    Raw materials needed
                    {targetQtyNum > 0
                      ? ` for ${targetQtyNum.toLocaleString()} of ${recipeForDialog.product || recipeForDialog.name}`
                      : ""}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Scaled from recipe ({recipeForDialog.baseQuantity.toLocaleString()} output): each ingredient × (
                    {targetQtyNum > 0 ? targetQtyNum : "?"}{" "}
                    ÷ {recipeForDialog.baseQuantity})
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground uppercase">
                        <th className="text-left py-1">Ingredient</th>
                        <th className="text-left py-1">Required</th>
                        <th className="text-left py-1">In stock</th>
                        <th className="text-left py-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipeForDialog.ingredients.map((ing) => {
                        const requiredQty = ing.qty * scaleFactor;
                        const mat = materials.find((r) => r.id === ing.materialId);
                        const sufficient = mat ? mat.stock >= requiredQty : false;
                        return (
                          <tr key={ing.materialId} className="border-t">
                            <td className="py-2">{ing.name || ing.materialId}</td>
                            <td className="py-2">
                              {requiredQty.toLocaleString(undefined, { maximumFractionDigits: 4 })} {ing.unit}
                            </td>
                            <td className="py-2 font-semibold">
                              {mat?.stock ?? 0} {ing.unit}
                            </td>
                            <td className="py-2">
                              {sufficient ? <span className="status-badge-success">✓ OK</span> : <span className="status-badge-danger">Shortfall</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void handleCreateBatch()} disabled={createSubmitting}>
                {createSubmitting ? "Creating…" : "Create Batch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search batches..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
            <SelectItem value="in_progress">In Production</SelectItem>
            <SelectItem value="qc_pending">QC Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-6">No batches returned from the API yet.</p>
      )}

      <div className="grid gap-4">
        {filtered.map((b) => {
          const s = statusConfig[b.status] ?? statusConfig.planned;
          return (
            <div key={b.entityId || b.id} className="bg-card border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">{b.id}</p>
                    <p className="font-medium mt-0.5">{b.product}</p>
                  </div>
                  <div className="text-sm text-muted-foreground hidden md:block">
                    Qty: <span className="text-foreground font-medium">{b.quantity.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-muted-foreground hidden lg:block">
                    Assigned: <span className="text-foreground">{b.assignedTo}</span>
                  </div>
                  <div className="text-sm text-muted-foreground hidden lg:block">{b.startDate}</div>
                </div>
                <div className="flex items-center gap-3">
                  {b.yield !== null && <span className="text-sm font-medium">Yield: {b.yield}%</span>}
                  <span className={s.cls}>{s.label}</span>
                  <Button variant="ghost" size="sm" onClick={() => void openBatchDetail(b)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <StatusStepper currentStep={s.step} />
            </div>
          );
        })}
      </div>

      {selectedBatch && (
        <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Batch {selectedBatch.id}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="yield">Yield & Loss</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Product</p>
                    <p className="font-medium">{selectedBatch.product}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-medium">{selectedBatch.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p>
                      <span className={(statusConfig[selectedBatch.status] ?? statusConfig.planned).cls}>
                        {(statusConfig[selectedBatch.status] ?? statusConfig.planned).label}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{selectedBatch.startDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Assigned To</p>
                    <p className="font-medium">{selectedBatch.assignedTo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Recipe</p>
                    <p className="font-medium">{selectedBatch.recipeId}</p>
                  </div>
                </div>
                <StatusStepper currentStep={(statusConfig[selectedBatch.status] ?? statusConfig.planned).step} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedBatch.status === "planned" && canMutateProduction && (
                    <Button size="sm" disabled={confirmSubmitting} onClick={() => void handleConfirmIngredients()}>
                      {confirmSubmitting ? "Confirming…" : "Confirm ingredients & issue stock"}
                    </Button>
                  )}
                  {selectedBatch.status === "issued" && canMutateProduction && (
                    <Button size="sm" disabled={startSubmitting} onClick={() => void handleStartProduction()}>
                      {startSubmitting ? "Starting…" : "Start production"}
                    </Button>
                  )}
                  {selectedBatch.status === "in_progress" && canMutateProduction && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setYieldOpen(true)}>
                        Record yield
                      </Button>
                      <Button
                        size="sm"
                        disabled={sendQcSubmitting || selectedBatch.actualYield == null}
                        onClick={() => void handleSendToQc()}
                      >
                        {sendQcSubmitting ? "Sending…" : "Send to Quality Control"}
                      </Button>
                    </>
                  )}
                  {selectedBatch.status === "qc_pending" && (
                    <p className="text-xs text-muted-foreground w-full">
                      This batch is waiting for QC. Open <strong>Quality Control</strong> to record test results. A passing
                      test completes the batch and auto-transfers packaged stock to <strong>Finished Products</strong>.
                    </p>
                  )}
                  {selectedBatch.status === "completed" && (
                    <p className="text-xs text-muted-foreground w-full">
                      {selectedBatch.finishedGoodsTransferred ? (
                        <>
                          Batch completed. Stock was packaged (bottles/boxes) and received in{" "}
                          <strong>Finished Products</strong>.
                        </>
                      ) : (
                        <>
                          Batch completed — syncing to Finished Products… Refresh the page or check packaging stock
                          (bottles/boxes) under Raw Materials.
                        </>
                      )}
                    </p>
                  )}
                  {selectedBatch.status === "planned" &&
                    selectedBatch.ingredients.length > 0 &&
                    selectedBatch.ingredients.every((i) => i.issued >= i.required) &&
                    canMutateProduction && (
                      <p className="text-xs text-muted-foreground w-full">
                        Stock is already issued. Click &quot;Confirm ingredients&quot; once to move status to Issued, then Start
                        production.
                      </p>
                    )}
                </div>
              </TabsContent>
              <TabsContent value="ingredients" className="mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase border-b">
                      <th className="text-left py-2">Material</th>
                      <th className="text-left py-2">Required</th>
                      <th className="text-left py-2">Issued</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBatch.ingredients.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-muted-foreground text-sm">
                          No ingredient lines on this batch payload.
                        </td>
                      </tr>
                    ) : (
                      selectedBatch.ingredients.map((ing) => {
                        const mat = materials.find((r) => r.id === ing.materialId);
                        return (
                          <tr key={ing.materialId} className="border-b">
                            <td className="py-2 font-medium">{mat?.name ?? ing.name}</td>
                            <td className="py-2">{ing.required}</td>
                            <td className="py-2">{ing.issued}</td>
                            <td className="py-2">
                              {ing.issued >= ing.required ? (
                                <span className="status-badge-success">✓ Issued</span>
                              ) : (
                                <span className="status-badge-warning">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </TabsContent>
              <TabsContent value="yield" className="mt-4">
                {selectedBatch.actualYield != null && (
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div>
                      <p className="text-muted-foreground">Target output</p>
                      <p className="font-medium">{selectedBatch.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Actual yield</p>
                      <p className="font-semibold text-lg">{selectedBatch.actualYield.toLocaleString()}</p>
                    </div>
                    {selectedBatch.yield !== null && (
                      <div>
                        <p className="text-muted-foreground">Yield %</p>
                        <p className="font-semibold text-primary">{selectedBatch.yield}%</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Loss</p>
                      <p className="font-medium text-destructive">{selectedBatch.loss.toLocaleString()} units</p>
                    </div>
                    {selectedBatch.lossReason !== "—" && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Loss reason</p>
                        <p className="font-medium">{selectedBatch.lossReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedBatch.status === "in_progress" && canMutateProduction ? (
                  <div className="space-y-4">
                    {selectedBatch.actualYield == null && (
                      <p className="text-sm text-muted-foreground">
                        When production is finished, record how much you made, then send the batch to Quality Control.
                      </p>
                    )}
                    {selectedBatch.actualYield != null && (
                      <p className="text-sm text-muted-foreground">
                        Yield is recorded. Send this batch to QC so officers can run tests.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setYieldOpen(true)}>
                        {selectedBatch.actualYield != null ? "Update yield" : "Record yield"}
                      </Button>
                      <Button
                        size="sm"
                        disabled={sendQcSubmitting || selectedBatch.actualYield == null}
                        onClick={() => void handleSendToQc()}
                      >
                        {sendQcSubmitting ? "Sending…" : "Send to Quality Control"}
                      </Button>
                    </div>
                  </div>
                ) : selectedBatch.status === "qc_pending" ? (
                  <p className="text-sm text-muted-foreground py-4">
                    Batch is in Quality Control. Record test results under the Quality Control module.
                  </p>
                ) : selectedBatch.actualYield == null ? (
                  <p className="text-sm text-muted-foreground py-4">
                    Yield can be recorded once the batch is In Production.
                  </p>
                ) : null}
              </TabsContent>

              <Dialog open={yieldOpen} onOpenChange={setYieldOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Yield & Loss</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Target output</Label>
                        <Input value={selectedBatch.quantity} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Actual yield *</Label>
                        <Input
                          type="number"
                          min={0.0001}
                          step="any"
                          placeholder="0"
                          value={actualYieldInput}
                          onChange={(e) => setActualYieldInput(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Loss quantity</Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="0"
                          value={lossQtyInput}
                          onChange={(e) => setLossQtyInput(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Loss reason</Label>
                        <Select value={lossReasonInput || undefined} onValueChange={setLossReasonInput}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spillage">Spillage</SelectItem>
                            <SelectItem value="evaporation">Evaporation</SelectItem>
                            <SelectItem value="contamination">Contamination</SelectItem>
                            <SelectItem value="equipment">Equipment failure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setYieldOpen(false)}>
                      Cancel
                    </Button>
                    <Button disabled={yieldSubmitting} onClick={() => void handleRecordYield()}>
                      {yieldSubmitting ? "Saving…" : "Save yield"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
