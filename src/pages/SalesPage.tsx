import { useEffect, useState } from "react";
import { Plus, Search, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";
import Pagination from "@/components/Pagination";
import { customersApi, finishedProductsApi, ordersApi } from "@/lib/api";
import { printInvoice } from "@/lib/printUtils";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "status-badge-warning" },
  confirmed: { label: "Confirmed", cls: "status-badge-info" },
  shipped: { label: "Shipped", cls: "status-badge-info" },
  delivered: { label: "Delivered", cls: "status-badge-success" },
  cancelled: { label: "Cancelled", cls: "status-badge-danger" },
};

type LineItem = { name: string; qty: number; unitPrice: number; total: number };

type OrderRow = {
  id: string;
  orderNumber: string;
  customer: string;
  items: string;
  total: number;
  paymentMethod: string;
  date: string;
  status: string;
  products: LineItem[];
  notes: string;
};

function mapOrder(o: Record<string, unknown>): OrderRow {
  const st = String(o.status ?? "PENDING").toLowerCase().replace(/_/g, "");
  const products: LineItem[] = Array.isArray(o.lineItems)
    ? (o.lineItems as Record<string, unknown>[]).map((li) => ({
        name: String(li.productName ?? li.name ?? "—"),
        qty: Number(li.quantity ?? 0),
        unitPrice: Number(li.unitPrice ?? 0),
        total: Number(li.lineTotal ?? li.total ?? 0),
      }))
    : [{ name: "—", qty: 0, unitPrice: 0, total: 0 }];
  return {
    id: String(o.id ?? o.orderNumber ?? ""),
    orderNumber: String(o.orderNumber ?? o.id ?? ""),
    customer: String(o.customerName ?? o.customer ?? "—"),
    items: String(o.itemCount ?? products.length),
    total: Number(o.totalAmount ?? o.total ?? 0),
    paymentMethod: String(o.paymentMethod ?? "—"),
    date: String(o.orderDate ?? o.createdAt ?? "").slice(0, 10),
    status: st in statusMap ? st : "pending",
    products,
    notes: String(o.notes ?? ""),
  };
}

type CustomerRow = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  totalOrders: number;
  lastOrder: string;
};

function mapCustomer(c: Record<string, unknown>): CustomerRow {
  return {
    id: String(c.id ?? ""),
    name: String(c.name ?? ""),
    contact: String(c.contact ?? c.contactPerson ?? "—"),
    phone: String(c.phone ?? "—"),
    email: String(c.email ?? "—"),
    totalOrders: Number(c.totalOrders ?? 0),
    lastOrder: c.lastOrder != null ? String(c.lastOrder) : "—",
  };
}

type ProductPick = { id: string; name: string; stock: number; unitCost?: number; lotNumber?: string };

function mapFinished(p: Record<string, unknown>): ProductPick {
  return {
    id: String(p.id ?? ""),
    name: `${p.productName ?? p.name ?? "Product"} (Lot: ${p.lotNumber ?? "N/A"})`,
    stock: Number(p.quantity ?? p.quantityOnHand ?? p.stock ?? p.currentStock ?? 0),
    unitCost: Number(p.unitCost ?? 0),
    lotNumber: String(p.lotNumber ?? ""),
  };
}

export default function SalesPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<ProductPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");
  
  type FormLineItem = {
    finishedProductId: string;
    quantity: number;
    unitPrice: number;
  };
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    { finishedProductId: "", quantity: 1, unitPrice: 0 }
  ]);

  // Inline customer creation state
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [transitionLoading, setTransitionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [oRes, cRes, fRes] = await Promise.all([
          ordersApi.listPage({ size: 200, sort: "createdAt,desc" }),
          customersApi.listPage({ size: 200, sort: "name,asc" }),
          finishedProductsApi.listPage({ size: 200 }).catch(() => ({ data: { content: [] as Record<string, unknown>[] } })),
        ]);
        if (cancelled) return;
        setOrders((oRes.data.content ?? []).map((row) => mapOrder(row)));
        setCustomers((cRes.data.content ?? []).map((row) => mapCustomer(row)));
        setFinishedProducts((fRes.data.content ?? []).map((row) => mapFinished(row)));
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            typeof e === "object" && e !== null && "response" in e
              ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
              : "";
          setError(msg || "Could not load sales data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addLineItem = () => {
    setLineItems([...lineItems, { finishedProductId: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    } else {
      setLineItems([{ finishedProductId: "", quantity: 1, unitPrice: 0 }]);
    }
  };

  const updateLineItem = (index: number, field: keyof FormLineItem, value: string | number) => {
    const next = [...lineItems];
    if (field === "finishedProductId") {
      next[index].finishedProductId = String(value);
      const prod = finishedProducts.find((p) => p.id === value);
      if (prod) {
        next[index].unitPrice = prod.unitCost ?? 0;
      }
    } else if (field === "quantity") {
      next[index].quantity = Number(value);
    } else if (field === "unitPrice") {
      next[index].unitPrice = Number(value);
    }
    setLineItems(next);
  };

  const grandTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      setCustomerError("Customer name is required");
      return;
    }
    if (!newCustomerContact.trim()) {
      setCustomerError("Contact person is required");
      return;
    }
    setCustomerSaving(true);
    setCustomerError(null);
    try {
      const res = await customersApi.create({
        name: newCustomerName,
        contact: newCustomerContact,
        phone: newCustomerPhone || undefined,
        email: newCustomerEmail || undefined,
        address: newCustomerAddress || undefined,
      });
      const newCust = mapCustomer(res.data as Record<string, unknown>);
      setCustomers((prev) => [...prev, newCust]);
      setSelectedCustomerId(newCust.id);
      setIsCreatingCustomer(false);
      setNewCustomerName("");
      setNewCustomerContact("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");
      setNewCustomerAddress("");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to create customer.";
      setCustomerError(msg);
    } finally {
      setCustomerSaving(false);
    }
  };

  const handleCreateOrder = async (confirmImmediately: boolean) => {
    if (!selectedCustomerId) {
      setFormError("Please select a customer.");
      return;
    }
    const invalidLines = lineItems.some((li) => !li.finishedProductId || li.quantity <= 0);
    if (invalidLines) {
      setFormError("All line items must have a product selected and quantity > 0.");
      return;
    }
    setOrderSubmitting(true);
    setFormError(null);
    try {
      const res = await ordersApi.create({
        customerId: selectedCustomerId,
        paymentMethod: paymentMethod,
        notes: notes || undefined,
        lineItems: lineItems.map((li) => ({
          finishedProductId: li.finishedProductId,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })),
      });

      const orderData = res.data as Record<string, unknown>;
      const createdOrderId = String(orderData.id ?? "");

      if (confirmImmediately && createdOrderId) {
        await ordersApi.confirm(createdOrderId);
      }

      const [oRes, cRes] = await Promise.all([
        ordersApi.listPage({ size: 200, sort: "createdAt,desc" }),
        customersApi.listPage({ size: 200, sort: "name,asc" }),
      ]);
      setOrders((oRes.data.content ?? []).map((row) => mapOrder(row)));
      setCustomers((cRes.data.content ?? []).map((row) => mapCustomer(row)));

      setCreateOpen(false);
      setSelectedCustomerId("");
      setPaymentMethod("CASH");
      setNotes("");
      setLineItems([{ finishedProductId: "", quantity: 1, unitPrice: 0 }]);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to create order.";
      setFormError(msg);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleStatusTransition = async (action: "confirm" | "ship" | "deliver" | "cancel") => {
    if (!selectedOrder) return;
    setTransitionLoading(true);
    try {
      if (action === "confirm") {
        await ordersApi.confirm(selectedOrder.id);
      } else if (action === "ship") {
        await ordersApi.ship(selectedOrder.id);
      } else if (action === "deliver") {
        await ordersApi.deliver(selectedOrder.id);
      } else if (action === "cancel") {
        await ordersApi.cancel(selectedOrder.id);
      }
      
      const oRes = await ordersApi.listPage({ size: 200, sort: "createdAt,desc" });
      const updatedOrders = (oRes.data.content ?? []).map((row) => mapOrder(row));
      setOrders(updatedOrders);

      const updatedOrder = updatedOrders.find((o) => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      } else {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || `Failed to ${action} order.`;
      alert(msg);
    } finally {
      setTransitionLoading(false);
    }
  };

  const filtered = orders.filter(
    (o) =>
      o.customer.toLowerCase().includes(search.toLowerCase()) || 
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Sales & Orders</h1>
          <p className="text-sm text-muted-foreground">Process orders, manage customers, and track sales</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setIsCreatingCustomer(false);
            setFormError(null);
            setCustomerError(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sales Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Customer *</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs text-primary"
                      onClick={() => {
                        setIsCreatingCustomer(!isCreatingCustomer);
                        setCustomerError(null);
                      }}
                    >
                      {isCreatingCustomer ? "Select Existing" : "+ New Customer"}
                    </Button>
                  </div>
                  {!isCreatingCustomer ? (
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="border rounded-md p-3 bg-muted/40 space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Create New Customer</div>
                      {customerError && <div className="text-xs text-destructive">{customerError}</div>}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Customer Name *</Label>
                          <Input
                            placeholder="e.g. Acme Corp"
                            className="h-8 text-xs"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Contact Person *</Label>
                          <Input
                            placeholder="e.g. John Doe"
                            className="h-8 text-xs"
                            value={newCustomerContact}
                            onChange={(e) => setNewCustomerContact(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Phone</Label>
                          <Input
                            placeholder="Phone number"
                            className="h-8 text-xs"
                            value={newCustomerPhone}
                            onChange={(e) => setNewCustomerPhone(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Email</Label>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            className="h-8 text-xs"
                            value={newCustomerEmail}
                            onChange={(e) => setNewCustomerEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Address</Label>
                        <Input
                          placeholder="Optional address"
                          className="h-8 text-xs"
                          value={newCustomerAddress}
                          onChange={(e) => setNewCustomerAddress(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-2"
                          onClick={() => setIsCreatingCustomer(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="text-xs h-7 px-2"
                          disabled={customerSaving}
                          onClick={handleCreateCustomer}
                        >
                          {customerSaving ? "Saving..." : "Save Customer"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <Input 
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Line Items</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground uppercase font-medium">
                    <div className="col-span-5">Product (Lot)</div>
                    <div className="col-span-2">Stock</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-1 text-right">Total</div>
                  </div>

                  {lineItems.map((item, index) => {
                    const prod = finishedProducts.find((p) => p.id === item.finishedProductId);
                    const availableStock = prod ? prod.stock : 0;
                    return (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5 flex gap-1 items-center">
                          {lineItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => removeLineItem(index)}
                            >
                              &times;
                            </Button>
                          )}
                          <Select
                            value={item.finishedProductId}
                            onValueChange={(val) => updateLineItem(index, "finishedProductId", val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Product" />
                            </SelectTrigger>
                            <SelectContent>
                              {finishedProducts
                                .filter((p) => p.stock > 0 || p.id === item.finishedProductId)
                                .map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground font-mono">
                          {availableStock}
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-8 text-xs font-mono"
                            min="1"
                            max={availableStock}
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-8 text-xs font-mono"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                          />
                        </div>
                        <div className="col-span-1 text-xs font-semibold font-mono text-right">
                          {(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}

                  <Button variant="ghost" size="sm" className="text-xs" onClick={addLineItem}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add line item
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-muted rounded-lg p-3">
                <span className="text-sm text-muted-foreground">Grand Total</span>
                <span className="font-heading font-bold text-lg">RWF {grandTotal.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CREDIT">Credit</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input 
                    placeholder="Optional" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {formError && (
                <div className="text-sm font-medium text-destructive mt-2">{formError}</div>
              )}
            </div>
            <DialogFooter className="mt-4 gap-2">
              <Button 
                variant="outline" 
                disabled={orderSubmitting}
                onClick={() => handleCreateOrder(false)}
              >
                {orderSubmitting ? "Saving..." : "Save as Draft"}
              </Button>
              <Button 
                disabled={orderSubmitting}
                onClick={() => handleCreateOrder(true)}
              >
                {orderSubmitting ? "Confirming..." : "Confirm Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Order ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((o) => {
                  const s = statusMap[o.status] ?? statusMap.pending;
                  return (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{o.orderNumber}</td>
                      <td className="px-4 py-3 font-medium">{o.customer}</td>
                      <td className="px-4 py-3">{o.items}</td>
                      <td className="px-4 py-3 font-semibold">RWF {o.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{o.paymentMethod}</td>
                      <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                      <td className="px-4 py-3">
                        <span className={s.cls}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(o)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(o);
                              setInvoiceOpen(true);
                            }}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground p-6 text-center">No orders from API.</p>
            )}
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
        </TabsContent>

        <TabsContent value="customers" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Orders</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.contact}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 font-semibold">{c.totalOrders}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.lastOrder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && customers.length === 0 && (
              <p className="text-sm text-muted-foreground p-6 text-center">No customers from API.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedOrder && (
        <Dialog
          open={!!selectedOrder}
          onOpenChange={() => {
            setSelectedOrder(null);
            setInvoiceOpen(false);
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{invoiceOpen ? `Invoice — ${selectedOrder.orderNumber}` : `Order ${selectedOrder.orderNumber}`}</DialogTitle>
            </DialogHeader>
            {invoiceOpen ? (
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex justify-between border-b pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-primary">WHIZUPP LTD</h3>
                    <p className="text-xs text-muted-foreground">Juice Production & Distribution</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold">{selectedOrder.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder.date}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bill To:</p>
                  <p className="font-semibold">{selectedOrder.customer}</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground uppercase">
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.products.map((p, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 text-right">{p.qty}</td>
                        <td className="py-2 text-right">RWF {p.unitPrice}</td>
                        <td className="py-2 text-right font-semibold">RWF {p.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between border-t pt-2 font-heading font-bold">
                  <span>Grand Total</span>
                  <span>RWF {selectedOrder.total.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Payment: {selectedOrder.paymentMethod}</p>
                  <p>Terms: Net 30 days</p>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    void printInvoice({
                      orderNumber: selectedOrder.orderNumber,
                      date: selectedOrder.date,
                      customer: selectedOrder.customer,
                      paymentMethod: selectedOrder.paymentMethod,
                      status: selectedOrder.status,
                      products: selectedOrder.products,
                      total: selectedOrder.total,
                      notes: selectedOrder.notes || undefined,
                    })
                  }
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Print Invoice
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedOrder.customer}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p>{selectedOrder.date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <span className={(statusMap[selectedOrder.status] ?? statusMap.pending).cls}>
                      {(statusMap[selectedOrder.status] ?? statusMap.pending).label}
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment</p>
                    <p>{selectedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-heading font-bold text-lg">RWF {selectedOrder.total.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Line Items</h4>
                  {selectedOrder.products.map((p, i) => (
                    <div key={i} className="flex justify-between py-2 border-b text-sm">
                      <span>
                        {p.name} × {p.qty}
                      </span>
                      <span className="font-semibold">RWF {p.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {selectedOrder.notes && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}
                <div className="flex gap-2 justify-between w-full">
                  <div className="flex gap-2">
                    {selectedOrder.status === "pending" && (
                      <Button size="sm" onClick={() => handleStatusTransition("confirm")} disabled={transitionLoading}>
                        {transitionLoading ? "Confirming..." : "Confirm Order"}
                      </Button>
                    )}
                    {selectedOrder.status === "confirmed" && (
                      <Button size="sm" onClick={() => handleStatusTransition("ship")} disabled={transitionLoading}>
                        {transitionLoading ? "Shipping..." : "Mark as Shipped"}
                      </Button>
                    )}
                    {selectedOrder.status === "shipped" && (
                      <Button size="sm" onClick={() => handleStatusTransition("deliver")} disabled={transitionLoading}>
                        {transitionLoading ? "Delivering..." : "Mark as Delivered"}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setInvoiceOpen(true)}>
                      <Printer className="w-4 h-4 mr-1" />
                      View Invoice
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void printInvoice({
                          orderNumber: selectedOrder.orderNumber,
                          date: selectedOrder.date,
                          customer: selectedOrder.customer,
                          paymentMethod: selectedOrder.paymentMethod,
                          status: selectedOrder.status,
                          products: selectedOrder.products,
                          total: selectedOrder.total,
                          notes: selectedOrder.notes || undefined,
                        })
                      }
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Print Invoice
                    </Button>
                  </div>
                  {(selectedOrder.status === "pending" || selectedOrder.status === "confirmed") && (
                    <Button variant="destructive" size="sm" onClick={() => handleStatusTransition("cancel")} disabled={transitionLoading}>
                      {transitionLoading ? "Cancelling..." : "Cancel Order"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
