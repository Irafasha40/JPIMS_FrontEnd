import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { rawMaterialsApi, suppliersApi, batchesApi } from "@/lib/api";
import type { MaterialCatalogRow } from "@/lib/materialMappers";
import { mapApiRawMaterialToRow } from "@/lib/materialMappers";
import {
  MATERIAL_ADD_DRAFT_STORAGE_KEY,
  PO_DRAFT_STORAGE_KEY,
  type MaterialAddDraftV1,
  type PurchaseOrderDraftV1,
} from "@/lib/poDraft";
import { useRole } from "@/contexts/RoleContext";
import { Plus, Search, Download, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Eye, Package, Printer } from "lucide-react";
import { toast } from "sonner";
import { printPurchaseOrder } from "@/lib/printUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import Breadcrumb from "@/components/Breadcrumb";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";

type StockMovementRow = {
  id: string;
  date: string;
  type: "in" | "out";
  materialId: string;
  quantity: number;
  reference: string;
  recordedBy: string;
};

type PurchaseOrderRow = {
  entityId: string;
  poNumber: string;
  supplier: string;
  itemsSummary: string;
  total: number;
  expectedDate: string;
  status: string;
};

type ReceiveLine = {
  itemId: string;
  materialName: string;
  unitOfMeasure: string;
  ordered: number;
  received: number;
  deliverQty: string;
};

type SupplierOption = { id: string; name: string };

function mapMovement(sm: Record<string, unknown>, materialId: string): StockMovementRow {
  const typeStr = String(sm.type ?? "").toUpperCase();
  const type: "in" | "out" = typeStr.includes("IN") ? "in" : "out";
  const rec = sm.recordedBy as { email?: string; fullName?: string } | string | undefined;
  const recordedBy = typeof rec === "string" ? rec : rec?.fullName ?? rec?.email ?? "—";
  const dateRaw = sm.date ?? sm.createdAt;
  const dateStr =
    typeof dateRaw === "string" ? dateRaw.slice(0, 10) : dateRaw != null ? String(dateRaw).slice(0, 10) : "—";
  return {
    id: String(sm.id ?? ""),
    date: dateStr,
    type,
    materialId,
    quantity: Number(sm.quantity ?? 0),
    reference: String(sm.referenceNumber ?? ""),
    recordedBy: String(recordedBy),
  };
}

function mapPO(po: Record<string, unknown>): PurchaseOrderRow {
  const sup = po.supplier as { name?: string } | null | undefined;
  const supplierNameFlat = po.supplierName != null ? String(po.supplierName) : "";
  const supplier = supplierNameFlat.trim() !== "" ? supplierNameFlat : sup?.name ?? "—";
  const entityId = String(po.id ?? "");
  return {
    entityId,
    poNumber: String(po.poNumber ?? entityId),
    supplier,
    itemsSummary: "—",
    total: Number(po.totalCost ?? 0),
    expectedDate: po.expectedDeliveryDate != null ? String(po.expectedDeliveryDate) : "—",
    status: String(po.status ?? "").toLowerCase(),
  };
}

function poStatusLabel(status: string): string {
  if (status === "received") return "Received";
  if (status === "cancelled") return "Cancelled";
  if (status === "partial") return "Partial";
  return "Pending";
}

function poStatusClass(status: string): string {
  if (status === "received") return "status-badge-success";
  if (status === "cancelled") return "status-badge-danger";
  if (status === "partial") return "status-badge-warning";
  return "status-badge-info";
}

function stockProgressPct(m: MaterialCatalogRow): number {
  if (m.minStock <= 0) return m.stock > 0 ? 100 : 0;
  return Math.min((m.stock / (m.minStock * 3)) * 100, 100);
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

const CREATE_SUPPLIER_SELECT_VALUE = "__whizupp_create_supplier__";

export default function RawMaterialsPage() {
  const { role } = useRole();
  const canMutateInventory = role === "administrator" || role === "inventory_manager";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [materials, setMaterials] = useState<MaterialCatalogRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mainTab, setMainTab] = useState("catalog");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialCatalogRow | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addUnit, setAddUnit] = useState("kg");
  const [addMin, setAddMin] = useState("");
  const [addCost, setAddCost] = useState("");
  const [addSupplierId, setAddSupplierId] = useState("");
  const [addStock, setAddStock] = useState("0");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [stockInOpen, setStockInOpen] = useState(false);
  const [inMaterialId, setInMaterialId] = useState("");
  const [inQty, setInQty] = useState("");
  const [inExpiry, setInExpiry] = useState("");
  const [inNotes, setInNotes] = useState("");
  const [inSubmitting, setInSubmitting] = useState(false);

  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [outMaterialId, setOutMaterialId] = useState("");
  const [outQty, setOutQty] = useState("");
  const [outNotes, setOutNotes] = useState("");
  const [outSubmitting, setOutSubmitting] = useState(false);

  const [poOpen, setPoOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poExpected, setPoExpected] = useState(todayISODate());
  const [poMaterialId, setPoMaterialId] = useState("");
  const [poQty, setPoQty] = useState("");
  const [poUnitCost, setPoUnitCost] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poSubmitting, setPoSubmitting] = useState(false);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receivePoId, setReceivePoId] = useState<string | null>(null);
  const [receivePoLabel, setReceivePoLabel] = useState("");
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiveLines, setReceiveLines] = useState<ReceiveLine[]>([]);
  const [receiveNotes, setReceiveNotes] = useState("");

  const [stockRequests, setStockRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [approveSubmitting, setApproveSubmitting] = useState<Record<string, boolean>>({});

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const { data } = await rawMaterialsApi.listPage({ size: 500, sort: "name,asc" });
      setMaterials((data.content ?? []).map((row) => mapApiRawMaterialToRow(row)));
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message ?? "")
          : "";
      const status = (e as { response?: { status?: number } })?.response?.status;
      setCatalogError(
        msg ||
          (status === 403 ? "You do not have access to view raw materials." : "Could not load materials. Check API and login.")
      );
      setMaterials([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const { data } = await suppliersApi.listPage({ size: 200, sort: "name,asc" });
      const rows = (data.content ?? []) as Record<string, unknown>[];
      setSuppliers(
        rows.map((s) => ({
          id: String(s.id ?? ""),
          name: String(s.name ?? "Supplier"),
        }))
      );
    } catch {
      setSuppliers([]);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const { data } = await rawMaterialsApi.purchaseOrdersPage({ size: 100, sort: "createdAt,desc" });
      setOrders((data.content ?? []).map((row) => mapPO(row as Record<string, unknown>)));
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message ?? "")
          : "";
      const status = (e as { response?: { status?: number } })?.response?.status;
      setOrdersError(
        msg || (status === 403 ? "You do not have access to purchase orders." : "Could not load purchase orders.")
      );
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadStockRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const { data } = await batchesApi.listPage({ size: 100, status: "PLANNED" });
      const content = data.content ?? [];
      setStockRequests(content.filter((b: any) => !b.stockApproved));
    } catch (e) {
      console.error("Could not load stock requests", e);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const handleApproveStock = async (batchId: string) => {
    setApproveSubmitting(prev => ({ ...prev, [batchId]: true }));
    try {
      await batchesApi.approveStock(batchId);
      toast.success("Stock request approved successfully.");
      await loadStockRequests();
      await loadCatalog();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not approve stock.");
    } finally {
      setApproveSubmitting(prev => ({ ...prev, [batchId]: false }));
    }
  };

  useEffect(() => {
    void loadCatalog();
    void loadSuppliers();
    void loadOrders();
    void loadStockRequests();
  }, [loadCatalog, loadSuppliers, loadOrders, loadStockRequests]);

  useEffect(() => {
    if (searchParams.get("resumePo") !== "1") return;
    try {
      const raw = sessionStorage.getItem(PO_DRAFT_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Partial<PurchaseOrderDraftV1>;
        if (typeof d.poExpected === "string") setPoExpected(d.poExpected);
        if (typeof d.poMaterialId === "string") setPoMaterialId(d.poMaterialId);
        if (typeof d.poQty === "string") setPoQty(d.poQty);
        if (typeof d.poUnitCost === "string") setPoUnitCost(d.poUnitCost);
        if (typeof d.poNotes === "string") setPoNotes(d.poNotes);
        if (typeof d.poSupplierId === "string") setPoSupplierId(d.poSupplierId);
        setPoOpen(true);
        setMainTab("orders");
        toast.success("Continue your purchase order.");
        sessionStorage.removeItem(PO_DRAFT_STORAGE_KEY);
      } else {
        setMainTab("orders");
        toast.info("Open New Purchase Order to continue.");
      }
    } catch {
      setMainTab("orders");
    }
    void loadSuppliers();
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("resumePo");
        return n;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams, loadSuppliers]);

  useEffect(() => {
    if (searchParams.get("resumeAddMaterial") !== "1") return;
    try {
      const raw = sessionStorage.getItem(MATERIAL_ADD_DRAFT_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Partial<MaterialAddDraftV1>;
        if (typeof d.addName === "string") setAddName(d.addName);
        if (typeof d.addCategory === "string") setAddCategory(d.addCategory);
        if (typeof d.addUnit === "string") setAddUnit(d.addUnit);
        if (typeof d.addMin === "string") setAddMin(d.addMin);
        if (typeof d.addCost === "string") setAddCost(d.addCost);
        if (typeof d.addStock === "string") setAddStock(d.addStock);
        if (typeof d.addSupplierId === "string") setAddSupplierId(d.addSupplierId);
        setAddOpen(true);
        setMainTab("catalog");
        toast.success("Continue adding your material.");
        sessionStorage.removeItem(MATERIAL_ADD_DRAFT_STORAGE_KEY);
      } else {
        setMainTab("catalog");
        toast.info("Open Add Material to continue.");
      }
    } catch {
      setMainTab("catalog");
    }
    void loadSuppliers();
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("resumeAddMaterial");
        return n;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams, loadSuppliers]);

  const savePoDraftAndGoToNewSupplier = () => {
    const draft: PurchaseOrderDraftV1 = {
      v: 1,
      poOpen: true,
      mainTab: "orders",
      poSupplierId,
      poExpected,
      poMaterialId,
      poQty,
      poUnitCost,
      poNotes,
    };
    sessionStorage.setItem(PO_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    navigate(`/suppliers?from=po&openAdd=1&returnTo=${encodeURIComponent("/raw-materials")}`);
  };

  const saveMaterialDraftAndGoToNewSupplier = () => {
    const draft: MaterialAddDraftV1 = {
      v: 1,
      addOpen: true,
      mainTab: "catalog",
      addName,
      addCategory,
      addUnit,
      addMin,
      addCost,
      addSupplierId,
      addStock,
    };
    sessionStorage.setItem(MATERIAL_ADD_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    navigate(`/suppliers?from=material&openAdd=1&returnTo=${encodeURIComponent("/raw-materials")}`);
  };

  useEffect(() => {
    if (!materials.length) {
      setMovements([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setMovementsLoading(true);
      try {
        const slice = materials.slice(0, 25);
        const results = await Promise.all(
          slice.map(async (m) => {
            try {
              const { data } = await rawMaterialsApi.movementsPage(m.id, { size: 40, sort: "createdAt,desc" });
              return (data.content ?? []).map((sm) => mapMovement(sm as Record<string, unknown>, m.id));
            } catch {
              return [];
            }
          })
        );
        if (cancelled) return;
        const merged = results.flat().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
        setMovements(merged.slice(0, 250));
      } finally {
        if (!cancelled) setMovementsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [materials]);

  const resetAddForm = () => {
    setAddName("");
    setAddCategory("");
    setAddUnit("kg");
    setAddMin("");
    setAddCost("");
    setAddSupplierId("");
    setAddStock("0");
  };

  const handleAddMaterial = async () => {
    if (!addName.trim() || !addMin || !addCost) {
      toast.error("Name, minimum threshold, and cost per unit are required.");
      return;
    }
    const minN = Number(addMin);
    const costN = Number(addCost);
    const stockN = Number(addStock || "0");
    if (Number.isNaN(minN) || Number.isNaN(costN) || minN < 0 || costN < 0 || stockN < 0) {
      toast.error("Enter valid numbers for stock, threshold, and cost.");
      return;
    }
    setAddSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: addName.trim(),
        category: addCategory.trim() || null,
        unitOfMeasure: addUnit,
        currentStock: stockN,
        minimumThreshold: minN,
        costPerUnit: costN,
        isActive: true,
      };
      if (addSupplierId) {
        body.supplier = { id: addSupplierId };
      }
      await rawMaterialsApi.create(body);
      toast.success("Material created.");
      setAddOpen(false);
      resetAddForm();
      await loadCatalog();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not create material (Inventory Manager or Administrator required).");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleStockIn = async () => {
    if (!inMaterialId || !inQty) {
      toast.error("Select a material and quantity.");
      return;
    }
    const q = Number(inQty);
    if (Number.isNaN(q) || q <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }
    setInSubmitting(true);
    try {
      const body: Record<string, unknown> = { quantity: q, notes: inNotes.trim() || "Manual stock-in" };
      if (inExpiry) body.expiryDate = inExpiry;
      await rawMaterialsApi.stockIn(inMaterialId, body);
      toast.success("Stock-in recorded.");
      setStockInOpen(false);
      setInMaterialId("");
      setInQty("");
      setInExpiry("");
      setInNotes("");
      await loadCatalog();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Stock-in failed.");
    } finally {
      setInSubmitting(false);
    }
  };

  const handleStockOut = async () => {
    if (!outMaterialId || !outQty) {
      toast.error("Select a material and quantity.");
      return;
    }
    const q = Number(outQty);
    if (Number.isNaN(q) || q <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }
    setOutSubmitting(true);
    try {
      await rawMaterialsApi.stockOut(outMaterialId, { quantity: q, notes: outNotes.trim() || "Manual stock-out" });
      toast.success("Stock-out recorded.");
      setStockOutOpen(false);
      setOutMaterialId("");
      setOutQty("");
      setOutNotes("");
      await loadCatalog();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Stock-out failed.");
    } finally {
      setOutSubmitting(false);
    }
  };

  const handleCreatePO = async () => {
    if (!poSupplierId || !poMaterialId || !poQty || !poUnitCost || !poExpected) {
      toast.error("Supplier, material, quantities, costs, and expected date are required.");
      return;
    }
    const qty = Number(poQty);
    const uc = Number(poUnitCost);
    if (Number.isNaN(qty) || Number.isNaN(uc) || qty <= 0 || uc <= 0) {
      toast.error("Quantity and unit cost must be positive numbers.");
      return;
    }
    setPoSubmitting(true);
    try {
      await rawMaterialsApi.createPurchaseOrder({
        supplierId: poSupplierId,
        expectedDeliveryDate: poExpected,
        notes: poNotes.trim() || null,
        items: [{ materialId: poMaterialId, quantity: qty, unitCost: uc }],
      });
      toast.success("Purchase order created.");
      setPoOpen(false);
      setPoSupplierId("");
      setPoMaterialId("");
      setPoQty("");
      setPoUnitCost("");
      setPoNotes("");
      setPoExpected(todayISODate());
      await loadOrders();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not create purchase order.");
    } finally {
      setPoSubmitting(false);
    }
  };

  const resetReceiveDialog = () => {
    setReceivePoId(null);
    setReceivePoLabel("");
    setReceiveLines([]);
    setReceiveNotes("");
    setReceiveLoading(false);
  };

  const openReceiveForPo = async (po: PurchaseOrderRow) => {
    if (!po.entityId) {
      toast.error("Purchase order is missing an id; refresh the list.");
      return;
    }
    setReceivePoId(po.entityId);
    setReceivePoLabel(po.poNumber);
    setReceiveOpen(true);
    setReceiveNotes("");
    setReceiveLoading(true);
    setReceiveLines([]);
    try {
      const { data } = await rawMaterialsApi.getPurchaseOrder(po.entityId);
      const items = (data.items as unknown[]) ?? [];
      setReceiveLines(
        items.map((row) => {
          const it = row as Record<string, unknown>;
          const ordered = Number(it.quantity ?? 0);
          const received = Number(it.receivedQuantity ?? 0);
          const remaining = Math.max(0, ordered - received);
          return {
            itemId: String(it.id ?? ""),
            materialName: String(it.materialName ?? "Material"),
            unitOfMeasure: String(it.unitOfMeasure ?? ""),
            ordered,
            received,
            deliverQty: remaining > 0 ? String(remaining) : "0",
          };
        })
      );
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not load purchase order lines.");
      setReceiveOpen(false);
      resetReceiveDialog();
    } finally {
      setReceiveLoading(false);
    }
  };

  const fillReceiveFullRemaining = () => {
    setReceiveLines((lines) =>
      lines.map((l) => ({
        ...l,
        deliverQty: String(Math.max(0, l.ordered - l.received)),
      }))
    );
  };

  const submitReceive = async () => {
    if (!receivePoId) return;
    for (const l of receiveLines) {
      const q = Number(l.deliverQty);
      if (Number.isNaN(q) || q < 0) {
        toast.error("Enter valid quantities for this receipt.");
        return;
      }
      const remaining = Math.max(0, l.ordered - l.received);
      if (q > remaining) {
        toast.error(`Quantity for "${l.materialName}" cannot exceed what is still expected (${remaining}).`);
        return;
      }
    }
    const hasAny = receiveLines.some((l) => Number(l.deliverQty) > 0);
    if (!hasAny) {
      toast.error("Enter at least one quantity to receive.");
      return;
    }
    const implicitFull = receiveLines.every((l) => Number(l.deliverQty) === Math.max(0, l.ordered - l.received));
    const note = receiveNotes.trim();

    setReceiveSubmitting(true);
    try {
      let body: Record<string, unknown>;
      if (implicitFull) {
        body = note ? { notes: note } : {};
      } else {
        body = {
          items: receiveLines
            .filter((l) => Number(l.deliverQty) > 0)
            .map((l) => ({ itemId: l.itemId, receivedQuantity: Number(l.deliverQty) })),
        };
        if (note) body.notes = note;
      }
      await rawMaterialsApi.receivePurchaseOrder(receivePoId, body);
      toast.success("Receipt recorded.");
      setReceiveOpen(false);
      resetReceiveDialog();
      await loadOrders();
      await loadCatalog();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not record receipt.");
    } finally {
      setReceiveSubmitting(false);
    }
  };

  const handlePrintPO = async (po: PurchaseOrderRow) => {
    try {
      const { data } = await rawMaterialsApi.getPurchaseOrder(po.entityId);
      const items = (data.items as unknown[] ?? []).map((row) => {
        const it = row as Record<string, unknown>;
        const qty = Number(it.quantity ?? 0);
        const uc = Number(it.unitCost ?? 0);
        return {
          materialName: String(it.materialName ?? "Material"),
          unitOfMeasure: String(it.unitOfMeasure ?? ""),
          quantity: qty,
          unitCost: uc,
          lineTotal: Number(it.lineTotal ?? qty * uc),
        };
      });
      printPurchaseOrder({
        poNumber: po.poNumber,
        supplier: po.supplier,
        expectedDate: po.expectedDate,
        status: po.status,
        total: po.total,
        notes: data.notes ? String(data.notes) : undefined,
        items,
      });
    } catch {
      toast.error("Could not load purchase order details for printing.");
    }
  };

  const filtered = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.supplier.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
<div>
            <h1 className="text-2xl font-heading font-bold">Raw Materials</h1>
            <p className="text-sm text-muted-foreground">Manage raw material inventory, stock movements, and purchase orders</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog
              open={stockInOpen}
              onOpenChange={(o) => {
                setStockInOpen(o);
                if (!o) {
                  setInMaterialId("");
                  setInQty("");
                  setInExpiry("");
                  setInNotes("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!canMutateInventory}>
                  <ArrowDownCircle className="w-4 h-4 mr-1" />
                  Stock In
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Stock-In</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Material *</Label>
                    <Select value={inMaterialId || undefined} onValueChange={setInMaterialId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
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
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input type="number" min={0.0001} step="any" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={inNotes} onChange={(e) => setInNotes(e.target.value)} placeholder="Optional notes" />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date (optional)</Label>
                    <Input type="date" value={inExpiry} onChange={(e) => setInExpiry(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                <Button variant="outline" onClick={() => setStockInOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={inSubmitting} onClick={() => void handleStockIn()}>
                  {inSubmitting ? "Saving…" : "Record Stock-In"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog
            open={stockOutOpen}
            onOpenChange={(o) => {
              setStockOutOpen(o);
              if (!o) {
                setOutMaterialId("");
                setOutQty("");
                setOutNotes("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={!canMutateInventory}>
                <ArrowUpCircle className="w-4 h-4 mr-1" />
                Stock Out
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Stock-Out</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Material *</Label>
                  <Select value={outMaterialId || undefined} onValueChange={setOutMaterialId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
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
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input type="number" min={0.0001} step="any" value={outQty} onChange={(e) => setOutQty(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={outNotes} onChange={(e) => setOutNotes(e.target.value)} placeholder="Optional notes" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStockOutOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={outSubmitting} onClick={() => void handleStockOut()}>
                  {outSubmitting ? "Saving…" : "Record Stock-Out"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" type="button" onClick={() => toast.message("Export is not wired to the API yet.")}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Dialog
            open={addOpen}
            onOpenChange={(o) => {
              setAddOpen(o);
              if (!o) resetAddForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" disabled={!canMutateInventory}>
                <Plus className="w-4 h-4 mr-1" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Material name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={addCategory || undefined} onValueChange={setAddCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Concentrate">Concentrate</SelectItem>
                        <SelectItem value="Pulp">Pulp</SelectItem>
                        <SelectItem value="Additive">Additive</SelectItem>
                        <SelectItem value="Sweetener">Sweetener</SelectItem>
                        <SelectItem value="Packaging">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit of Measure</Label>
                    <Select value={addUnit} onValueChange={setAddUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="L">Liters</SelectItem>
                        <SelectItem value="pcs">Pieces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Initial stock</Label>
                    <Input type="number" min={0} step="any" value={addStock} onChange={(e) => setAddStock(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Min stock threshold *</Label>
                    <Input type="number" min={0} step="any" value={addMin} onChange={(e) => setAddMin(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cost per unit *</Label>
                  <Input type="number" min={0} step="any" value={addCost} onChange={(e) => setAddCost(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Linked supplier</Label>
                  <Select
                    value={addSupplierId || undefined}
                    onValueChange={(v) => {
                      if (v === CREATE_SUPPLIER_SELECT_VALUE) {
                        saveMaterialDraftAndGoToNewSupplier();
                        return;
                      }
                      setAddSupplierId(v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={suppliers.length ? "Select supplier (optional)" : "No suppliers loaded"} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                      {canMutateInventory && (
                        <>
                          <SelectSeparator />
                          <SelectItem value={CREATE_SUPPLIER_SELECT_VALUE} className="text-primary font-medium">
                            <span className="flex items-center gap-2">
                              <Plus className="h-4 w-4 shrink-0" />
                              Create new supplier…
                            </span>
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {canMutateInventory && suppliers.length === 0 && (
                    <p className="text-xs text-muted-foreground">No suppliers yet — use Create new supplier in the list above.</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={addSubmitting} onClick={() => void handleAddMaterial()}>
                  {addSubmitting ? "Creating…" : "Add Material"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!canMutateInventory && (
        <p className="text-sm text-muted-foreground border rounded-lg px-4 py-2 bg-muted/30">
          Stock changes, new materials, and new purchase orders require an <strong>Inventory Manager</strong> or <strong>Administrator</strong> account.
        </p>
      )}

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="catalog">Material Catalog</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          {canMutateInventory && (
            <TabsTrigger value="requests" className="relative">
              Stock Requests
              {stockRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">
                  {stockRequests.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="catalog" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search materials..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {catalogLoading ? (
            <p className="text-sm text-muted-foreground">Loading materials…</p>
          ) : catalogError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{catalogError}</div>
          ) : paginated.length === 0 ? (
            <EmptyState title="No materials found" description="Try a different search or add your first material." actionLabel="Add Material" onAction={() => canMutateInventory && setAddOpen(true)} />
          ) : (
            <>
              <div className="bg-card border rounded-lg overflow-hidden">
                <table className="data-table w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Stock Level</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Cost/Unit</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((m) => {
                      const pct = stockProgressPct(m);
                      return (
                        <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium">{m.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{m.id}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{m.category}</td>
                          <td className="px-4 py-3 text-muted-foreground">{m.supplier}</td>
                          <td className="px-4 py-3 min-w-[160px]">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm w-20">
                                {m.stock.toLocaleString()} {m.unit}
                              </span>
                              <Progress value={Number.isFinite(pct) ? pct : 0} className="h-2 flex-1" />
                            </div>
                            <p className="text-xs text-muted-foreground">Min: {m.minStock}</p>
                          </td>
                          <td className="px-4 py-3">RWF {m.costPerUnit.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            {m.stock < m.minStock ? (
                              <span className="status-badge-danger">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Critical
                              </span>
                            ) : m.minStock > 0 && m.stock < m.minStock * 1.5 ? (
                              <span className="status-badge-warning">Low</span>
                            ) : (
                              <span className="status-badge-success">OK</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedMaterial(m)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
                totalItems={filtered.length}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          {movementsLoading && <p className="text-sm text-muted-foreground mb-2">Loading movements…</p>}
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Material</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Quantity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 && !movementsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No stock movements yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((sm) => {
                    const mat = materials.find((r) => r.id === sm.materialId);
                    return (
                      <tr key={`${sm.materialId}-${sm.id}`} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">{sm.date}</td>
                        <td className="px-4 py-3">
                          <span className={sm.type === "in" ? "status-badge-success" : "status-badge-warning"}>
                            {sm.type === "in" ? "▼ IN" : "▲ OUT"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{mat?.name ?? sm.materialId}</td>
                        <td className="px-4 py-3 font-semibold">
                          {sm.quantity} {mat?.unit ?? ""}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{sm.reference}</td>
                        <td className="px-4 py-3 text-muted-foreground">{sm.recordedBy}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4 space-y-4">
          {ordersError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{ordersError}</div>
          )}
          {ordersLoading && <p className="text-sm text-muted-foreground">Loading purchase orders…</p>}
          <div className="flex justify-end gap-2 flex-wrap">
            <Dialog
              open={receiveOpen}
              onOpenChange={(o) => {
                setReceiveOpen(o);
                if (!o) resetReceiveDialog();
              }}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Receive purchase order {receivePoLabel}</DialogTitle>
                </DialogHeader>
                {receiveLoading ? (
                  <p className="text-sm text-muted-foreground py-4">Loading lines…</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Enter what arrived in this delivery. Use full remaining for a complete shipment, or lower amounts if something is short — add a note (e.g. balance expected next week).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={fillReceiveFullRemaining}>
                        Fill full remaining (all lines)
                      </Button>
                    </div>
                    <div className="border rounded-md overflow-hidden">
                      <table className="data-table w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-3 py-2">Material</th>
                            <th className="text-right px-3 py-2">Ordered</th>
                            <th className="text-right px-3 py-2">Already in</th>
                            <th className="text-right px-3 py-2">Remaining</th>
                            <th className="text-right px-3 py-2">This receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receiveLines.map((l) => {
                            const rem = Math.max(0, l.ordered - l.received);
                            return (
                              <tr key={l.itemId} className="border-b last:border-0">
                                <td className="px-3 py-2">
                                  <span className="font-medium">{l.materialName}</span>
                                  <span className="text-muted-foreground text-xs ml-1">({l.unitOfMeasure || "—"})</span>
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">{l.ordered}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{l.received}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{rem}</td>
                                <td className="px-3 py-2 text-right">
                                  <Input
                                    className="h-8 w-24 text-right inline-block"
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={l.deliverQty}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setReceiveLines((prev) => prev.map((x) => (x.itemId === l.itemId ? { ...x, deliverQty: v } : x)));
                                    }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="space-y-2">
                      <Label>Receipt note (optional)</Label>
                      <Textarea
                        placeholder="e.g. 200 kg short — supplier to deliver remainder 15 May."
                        value={receiveNotes}
                        onChange={(e) => setReceiveNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setReceiveOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" disabled={receiveSubmitting || receiveLoading} onClick={() => void submitReceive()}>
                    {receiveSubmitting ? "Saving…" : "Confirm receipt"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={poOpen} onOpenChange={setPoOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!canMutateInventory}>
                  <Plus className="w-4 h-4 mr-1" />
                  New Purchase Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Purchase Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Supplier *</Label>
                    <Select
                      value={poSupplierId || undefined}
                      onValueChange={(v) => {
                        if (v === CREATE_SUPPLIER_SELECT_VALUE) {
                          savePoDraftAndGoToNewSupplier();
                          return;
                        }
                        setPoSupplierId(v);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                        {canMutateInventory && (
                          <>
                            <SelectSeparator />
                            <SelectItem value={CREATE_SUPPLIER_SELECT_VALUE} className="text-primary font-medium">
                              <span className="flex items-center gap-2">
                                <Plus className="h-4 w-4 shrink-0" />
                                Create new supplier…
                              </span>
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {canMutateInventory && suppliers.length === 0 && (
                      <p className="text-xs text-muted-foreground">No suppliers yet — use Create new supplier in the list above.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Material *</Label>
                    <Select value={poMaterialId || undefined} onValueChange={setPoMaterialId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Material" />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input type="number" min={0.0001} step="any" value={poQty} onChange={(e) => setPoQty(e.target.value)} placeholder="Qty" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit cost *</Label>
                      <Input type="number" min={0.0001} step="any" value={poUnitCost} onChange={(e) => setPoUnitCost(e.target.value)} placeholder="Unit cost" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Expected delivery *</Label>
                    <Input type="date" value={poExpected} onChange={(e) => setPoExpected(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={poNotes} onChange={(e) => setPoNotes(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPoOpen(false)}>
                    Cancel
                  </Button>
                  <Button disabled={poSubmitting} onClick={() => void handleCreatePO()}>
                    {poSubmitting ? "Creating…" : "Create PO"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">PO Number</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Lines</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Expected</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && !ordersLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {ordersError ? "Fix the error above or refresh." : "No purchase orders yet."}
                    </td>
                  </tr>
                ) : (
                  orders.map((po) => (
                    <tr key={po.entityId} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{po.poNumber}</td>
                      <td className="px-4 py-3 font-medium">{po.supplier}</td>
                      <td className="px-4 py-3 text-muted-foreground">{po.itemsSummary}</td>
                      <td className="px-4 py-3 font-semibold">RWF {po.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{po.expectedDate}</td>
                      <td className="px-4 py-3">
                        <span className={poStatusClass(po.status)}>{poStatusLabel(po.status)}</span>
                      </td>
                       <td className="px-4 py-3 text-right">
                         <div className="flex items-center justify-end gap-1">
                           {(po.status === "pending" || po.status === "partial") && canMutateInventory && (
                             <Button type="button" variant="outline" size="sm" onClick={() => void openReceiveForPo(po)}>
                               <Package className="w-4 h-4 mr-1" />
                               Receive
                             </Button>
                           )}
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             title="Print Purchase Order"
                             onClick={() => void handlePrintPO(po)}
                           >
                             <Printer className="w-4 h-4" />
                           </Button>
                         </div>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-1">Production Stock Requests</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Review and approve stock issuance requests for planned production batches.
            </p>

            {requestsLoading && <p className="text-sm text-muted-foreground">Loading requests…</p>}

            {!requestsLoading && stockRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">No pending stock requests</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All planned production batches have been approved for stock.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stockRequests.map((b) => (
                  <div key={b.id} className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-3 mb-3">
                      <div>
                        <span className="text-xs font-mono text-muted-foreground">Batch: {b.batchNumber}</span>
                        <h4 className="font-semibold text-sm mt-0.5">{b.productName}</h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          Target: <span className="font-semibold text-foreground">{b.targetQuantity} units</span>
                        </span>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={approveSubmitting[b.id]}
                          onClick={() => void handleApproveStock(b.id)}
                        >
                          {approveSubmitting[b.id] ? "Approving…" : "Approve & Issue Stock"}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Required Ingredients
                      </h5>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {(b.ingredients || []).map((ing: any) => {
                          const mat = materials.find((r) => r.id === ing.materialId);
                          const currentStock = mat ? mat.stock : 0;
                          const hasStock = currentStock >= ing.quantityRequired;
                          return (
                            <div key={ing.materialId} className="flex items-center justify-between border rounded p-2 bg-background text-xs">
                              <div>
                                <p className="font-medium text-foreground">{ing.materialName}</p>
                                <p className="text-muted-foreground">Required: {ing.quantityRequired} {ing.unitOfMeasure}</p>
                              </div>
                              <div className="text-right">
                                <span className={hasStock ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>
                                  {currentStock} {ing.unitOfMeasure} available
                                </span>
                                {!hasStock && (
                                  <p className="text-[10px] text-destructive font-medium flex items-center gap-0.5 mt-0.5">
                                    <AlertTriangle className="w-3 h-3 inline shrink-0" /> Shortfall
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedMaterial && (
        <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedMaterial.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedMaterial.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedMaterial.supplier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Stock</p>
                  <p className="font-semibold text-lg">
                    {selectedMaterial.stock} {selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Min Threshold</p>
                  <p className="font-medium">
                    {selectedMaterial.minStock} {selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cost per Unit</p>
                  <p className="font-medium">RWF {selectedMaterial.costPerUnit.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last updated</p>
                  <p className="font-medium">{selectedMaterial.lastPurchase}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Stock level</p>
                <Progress value={stockProgressPct(selectedMaterial)} className="h-3" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Recent movements</h4>
                <div className="space-y-2">
                  {movements
                    .filter((sm) => sm.materialId === selectedMaterial.id)
                    .slice(0, 4)
                    .map((sm) => (
                      <div key={sm.id} className="flex items-center justify-between text-sm border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className={sm.type === "in" ? "status-badge-success" : "status-badge-warning"}>{sm.type === "in" ? "IN" : "OUT"}</span>
                          <span>
                            {sm.quantity} {selectedMaterial.unit}
                          </span>
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
