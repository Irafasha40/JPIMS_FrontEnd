import { useEffect, useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle, RefreshCw } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { reportsApi, recipesApi, finishedProductsApi, customersApi, apiClient } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["hsl(142, 72%, 29%)", "hsl(32, 95%, 44%)", "hsl(354, 70%, 54%)", "hsl(199, 89%, 48%)", "hsl(271, 70%, 50%)"];

export default function ReportsPage() {
  const { role } = useRole();
  const [activeReport, setActiveReport] = useState("");
  
  // Lists for secondary filters
  const [recipes, setRecipes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Filter values
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [recipeId, setRecipeId] = useState("all");
  const [productId, setProductId] = useState("all");
  const [customer, setCustomer] = useState("all");

  // Report results
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Determine allowed report tabs for the user's role
  const reportsConfig = [
    { value: "production", label: "Production", roles: ["administrator", "production_manager"] },
    { value: "quality", label: "Quality Performance", roles: ["administrator", "production_manager", "qc_officer"] },
    { value: "inventory", label: "Inventory", roles: ["administrator", "production_manager", "inventory_manager"] },
    { value: "sales", label: "Sales & Fulfillment", roles: ["administrator", "production_manager", "sales_staff"] },
    { value: "wastage", label: "Wastage", roles: ["administrator", "production_manager", "inventory_manager"] },
  ];

  const allowedReports = reportsConfig.filter((rep) => rep.roles.includes(role || "administrator"));

  // Set initial active tab on mount
  useEffect(() => {
    if (allowedReports.length > 0) {
      setActiveReport(allowedReports[0].value);
    }
  }, [role]);

  // Fetch secondary filter metadata on mount
  useEffect(() => {
    recipesApi.getAll().then((res: any) => setRecipes(res.data.content ?? res.data ?? [])).catch(() => {});
    finishedProductsApi.listPage({ size: 200 }).then((res) => setProducts(res.data.content ?? [])).catch(() => {});
    customersApi.listPage({ size: 200 }).then((res) => setCustomers(res.data.content ?? [])).catch(() => {});
  }, []);

  // Fetch report data
  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    setCurrentPage(1);

    const params: Record<string, any> = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    try {
      let res;
      if (activeReport === "production") {
        if (recipeId !== "all") params.recipeId = recipeId;
        res = await reportsApi.production(params);
      } else if (activeReport === "quality") {
        if (productId !== "all") params.productId = productId;
        res = await reportsApi.quality(params);
      } else if (activeReport === "inventory") {
        res = await reportsApi.inventory(params);
      } else if (activeReport === "sales") {
        if (productId !== "all") params.productId = productId;
        if (customer !== "all") params.customer = customer;
        res = await reportsApi.sales(params);
      } else if (activeReport === "wastage") {
        res = await reportsApi.wastage(params);
      }

      if (res) {
        setReportData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  // Generate on tab change automatically or when active report switches
  useEffect(() => {
    if (activeReport) {
      generateReport();
    }
  }, [activeReport]);

  // Handle PDF and Excel downloads
  const handleExport = async (format: "pdf" | "excel") => {
    try {
      const params: Record<string, any> = { export: format };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      let url = "";
      if (activeReport === "production") {
        url = "/reports/production";
        if (recipeId !== "all") params.recipeId = recipeId;
      } else if (activeReport === "quality") {
        url = "/reports/quality";
        if (productId !== "all") params.productId = productId;
      } else if (activeReport === "inventory") {
        url = "/reports/inventory";
      } else if (activeReport === "sales") {
        url = "/reports/sales";
        if (productId !== "all") params.productId = productId;
        if (customer !== "all") params.customer = customer;
      } else if (activeReport === "wastage") {
        url = "/reports/wastage";
      }

      const response = await apiClient.get(url, { params, responseType: "blob" });
      const blob = new Blob([response.data], {
        type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${activeReport}_report_${new Date().toISOString().slice(0, 10)}.${format === "pdf" ? "pdf" : "xlsx"}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export download failed", err);
    }
  };

  // Data parsing for Recharts
  const getChartComponent = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) return null;

    if (activeReport === "production") {
      const chartData = reportData.data.slice(0, 15).map((d: any) => ({
        name: d.batchNumber || "Unknown",
        target: d.targetQuantity || 0,
        yield: d.actualYield || 0,
      }));
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="target" fill="hsl(var(--muted-foreground))" name="Target Volume (L)" />
            <Bar dataKey="yield" fill="hsl(var(--primary))" name="Actual Yield (L)" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (activeReport === "quality") {
      const passed = reportData.summary?.totalQcChecks - (reportData.summary?.failRate / 100 * reportData.summary?.totalQcChecks) || 0;
      const failed = reportData.summary?.totalQcChecks - passed || 0;
      const pieData = [
        { name: "Pass", value: passed },
        { name: "Fail", value: failed },
      ];
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(142, 72%, 29%)" : "hsl(354, 70%, 54%)"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (activeReport === "inventory") {
      const rawCount = reportData.data.filter((d: any) => d.type === "RAW_MATERIAL").length;
      const fgCount = reportData.data.filter((d: any) => d.type === "FINISHED_GOOD").length;
      const dataPie = [
        { name: "Raw Materials", value: rawCount },
        { name: "Finished Goods", value: fgCount },
      ];
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={dataPie} cx="50%" cy="50%" outerRadius={80} label dataKey="value">
              {dataPie.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (activeReport === "sales") {
      const chartData = reportData.data.slice(0, 10).map((d: any) => ({
        name: d.orderNumber || "Unknown",
        revenue: d.totalAmount || 0,
      }));
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue (RWF)" />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (activeReport === "wastage") {
      const chartData = reportData.data.slice(0, 10).map((d: any) => ({
        name: d.name || "Unknown",
        cost: d.costEstimate || 0,
      }));
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cost" fill="hsl(354, 70%, 54%)" name="Waste Cost (RWF)" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  // Helper to render summary key values
  const renderSummaryCards = () => {
    if (!reportData || !reportData.summary) return null;
    const summary = reportData.summary;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(summary).map(([key, val]: [string, any]) => {
          if (val instanceof Object) return null; // skip maps / sub-objects
          return (
            <div key={key} className="stat-card border bg-card/50 rounded-xl p-4 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {key.replace(/([A-Z])/g, " $1")}
              </span>
              <p className="text-2xl font-extrabold text-foreground mt-1.5">
                {typeof val === "number" && key.toLowerCase().includes("cost") || key.toLowerCase().includes("valuation") || key.toLowerCase().includes("revenue")
                  ? `RWF ${val.toLocaleString()}`
                  : val.toString()}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper to render table headers dynamically based on data rows
  const renderTableHeader = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) return null;
    const sample = reportData.data[0];
    return (
      <tr className="border-b bg-muted/40">
        {Object.keys(sample).map((key) => {
          if (key === "id") return null;
          return (
            <th key={key} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {key.replace(/([A-Z])/g, " $1")}
            </th>
          );
        })}
      </tr>
    );
  };

  // Helper to render table rows
  const renderTableRows = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) return null;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = reportData.data.slice(startIndex, startIndex + pageSize);

    return paginatedData.map((row: any, i: number) => (
      <tr key={row.id || i} className="border-b hover:bg-muted/10 transition-colors">
        {Object.entries(row).map(([key, val]: [string, any]) => {
          if (key === "id") return null;
          return (
            <td key={key} className="px-4 py-3.5 text-sm font-medium">
              {val === null || val === undefined
                ? "—"
                : typeof val === "number" && key.toLowerCase().includes("cost") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("value") || key.toLowerCase().includes("estimate")
                ? `RWF ${val.toLocaleString()}`
                : val.toString()}
            </td>
          );
        })}
      </tr>
    ));
  };

  const totalPages = reportData?.data ? Math.ceil(reportData.data.length / pageSize) : 0;

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      {/* Header */}
      <div className="module-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Detailed reports and metrics for juice production and inventory control</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={!reportData?.data?.length}>
            <Download className="w-4 h-4 mr-2" /> PDF Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("excel")} disabled={!reportData?.data?.length}>
            <Download className="w-4 h-4 mr-2" /> Excel Export
          </Button>
        </div>
      </div>

      {/* Tabs list (role restricted) */}
      <div className="flex border-b border-border gap-2 pb-px overflow-x-auto">
        {allowedReports.map((rep) => (
          <button
            key={rep.value}
            onClick={() => setActiveReport(rep.value)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeReport === rep.value
                ? "border-primary text-primary font-bold bg-primary/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            }`}
          >
            {rep.label}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Report Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-background border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-background border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Secondary filter mapping */}
          {activeReport === "production" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Recipe</label>
              <Select value={recipeId} onValueChange={setRecipeId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Recipes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recipes</SelectItem>
                  {recipes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} (v{r.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {activeReport === "quality" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Product</label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {activeReport === "sales" && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Product</label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Customer</label>
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button onClick={generateReport} className="w-full sm:col-span-2 md:col-span-1">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Generate Report
          </Button>
        </div>
      </div>

      {/* Report state notifications */}
      {loading && <p className="text-sm text-muted-foreground animate-pulse">Loading report data...</p>}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results panel (Summary cards + Chart) */}
      {!loading && !error && reportData && (
        <>
          {reportData.data && reportData.data.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Summary card metrics */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Summary Indicators</h3>
                  {renderSummaryCards()}
                </div>

                {/* Recharts chart */}
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Report Visualization</h3>
                  {getChartComponent()}
                </div>
              </div>

              {/* Paginated data table */}
              <div className="bg-card border rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
                <h3 className="text-base font-semibold text-foreground">Detailed Ledger Records</h3>
                <div className="overflow-x-auto">
                  <table className="data-table w-full text-sm">
                    <thead>{renderTableHeader()}</thead>
                    <tbody>{renderTableRows()}</tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Showing page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-muted bg-muted/10 p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-semibold text-foreground">No Data Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No ledger logs were returned matching the applied parameters. Try adjusting the date range pickers or filter choices.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
