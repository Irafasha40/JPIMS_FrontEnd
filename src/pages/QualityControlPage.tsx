import { useCallback, useEffect, useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { Navigate } from "react-router-dom";

import { Plus, CheckCircle, XCircle, Clock, Printer, TrendingUp } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import Breadcrumb from "@/components/Breadcrumb";

import { qualityApi } from "@/lib/api";



function LiveIndicator({ value, min, max }: { value: number | null; min: number; max: number }) {

  if (value === null) return null;

  const pass = value >= min && value <= max;

  return <span className={pass ? "status-badge-success ml-2" : "status-badge-danger ml-2"}>{pass ? "✓ Pass" : "✗ Fail"}</span>;

}



type QCTestRow = {

  id: string;

  batchId: string;

  product: string;

  ph: number | null;

  brix: number | null;

  appearance?: string;

  color?: string;

  taste?: string;

  result: string;

  testedBy?: string;

  date?: string;

  notes?: string;

};



function mapQcRow(q: Record<string, unknown>, i: number): QCTestRow {

  const resultRaw = String(q.result ?? "PENDING").toLowerCase();

  const result = resultRaw.includes("pass") ? "pass" : resultRaw.includes("fail") ? "fail" : "pending";

  return {

    id: String(q.id ?? `qc-${i}`),

    batchId: String(q.batchNumber ?? q.batchId ?? "—"),

    product: String(q.productName ?? q.product ?? "—"),

    ph: q.phLevel != null ? Number(q.phLevel) : null,

    brix: q.brixLevel != null ? Number(q.brixLevel) : null,

    appearance: q.appearance != null ? String(q.appearance).replace(/_/g, " ").toLowerCase() : undefined,

    result,

    testedBy: q.testedBy != null ? String(q.testedBy) : undefined,

    date: q.testDate != null ? String(q.testDate).slice(0, 10) : q.createdAt != null ? String(q.createdAt).slice(0, 10) : undefined,

    notes: q.notes != null ? String(q.notes) : undefined,

  };

}



type BatchPick = { entityId: string; label: string; product: string };



function mapPendingBatch(b: Record<string, unknown>): BatchPick {

  const entityId = String(b.id ?? "");

  const batchNumber = String(b.batchNumber ?? entityId);

  return {

    entityId,

    label: batchNumber,

    product: String(b.productName ?? "—"),

  };

}



export default function QualityControlPage() {
  const { role } = useRole();

  if (role !== "administrator" && role !== "qc_officer") {
    return <Navigate to="/" replace />;
  }

  const [qualityTests, setQualityTests] = useState<QCTestRow[]>([]);

  const [pendingBatches, setPendingBatches] = useState<BatchPick[]>([]);

  const [qcTrendData, setQcTrendData] = useState<{ week: string; passRate: number }[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const [detailTest, setDetailTest] = useState<QCTestRow | null>(null);

  const [certOpen, setCertOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);



  const [selectedBatchId, setSelectedBatchId] = useState("");

  const [phValue, setPhValue] = useState<number | null>(null);

  const [brixValue, setBrixValue] = useState<number | null>(null);

  const [appearance, setAppearance] = useState("clear");

  const [color, setColor] = useState("normal");

  const [taste, setTaste] = useState("normal");

  const [notes, setNotes] = useState("");



  const resetForm = () => {

    setSelectedBatchId("");

    setPhValue(null);

    setBrixValue(null);

    setAppearance("clear");

    setColor("normal");

    setTaste("normal");

    setNotes("");

  };



  const loadData = useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      const [qRes, pRes, tRes] = await Promise.all([

        qualityApi.listPage({ size: 200, sort: "createdAt,desc" }),

        qualityApi.pending({ size: 100 }),

        qualityApi.trends().catch(() => ({ data: {} })),

      ]);

      setQualityTests((qRes.data.content ?? []).map((row, i) => mapQcRow(row, i)));

      setPendingBatches((pRes.data.content ?? []).map((row) => mapPendingBatch(row)));

      const msg = (tRes.data as { message?: string })?.message;

      setQcTrendData(msg ? [{ week: "API", passRate: 0 }] : [{ week: "W1", passRate: 0 }]);

    } catch (e: unknown) {

      const msg =

        typeof e === "object" && e !== null && "response" in e

          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")

          : "";

      setError(msg || "Could not load QC data.");

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void loadData();

  }, [loadData]);



  const handleSubmit = async () => {

    if (!selectedBatchId) {

      toast.error("Select a batch awaiting QC.");

      return;

    }

    if (phValue == null || brixValue == null) {

      toast.error("Enter pH and Brix levels.");

      return;

    }

    setSubmitting(true);

    try {

      const { data } = await qualityApi.create({

        batchId: selectedBatchId,

        phLevel: phValue,

        brixLevel: brixValue,

        appearance: appearance.toUpperCase(),

        color: color.toUpperCase(),

        taste: taste.toUpperCase(),

        notes: notes.trim() || undefined,

      });

      const row = mapQcRow(data as Record<string, unknown>, 0);

      const passed = row.result === "pass";

      toast.success(

        passed

          ? `QC PASS — batch ${row.batchId} completed. Packaged and added to Finished Products.`

          : `QC FAIL recorded for batch ${row.batchId}. Batch stays in QC until re-tested.`,

      );

      setCreateOpen(false);

      resetForm();

      await loadData();

    } catch (e: unknown) {

      const msg =

        typeof e === "object" && e !== null && "response" in e

          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Could not save QC test.")

          : "Could not save QC test.";

      toast.error(msg);

    } finally {

      setSubmitting(false);

    }

  };



  const passCount = qualityTests.filter((q) => q.result === "pass").length;

  const tested = qualityTests.filter((q) => q.result !== "pending").length;



  return (

    <div className="space-y-6">

      <Breadcrumb />

      <div className="module-header">

        <div>

          <h1 className="text-2xl font-heading font-bold">Quality Control</h1>

          <p className="text-sm text-muted-foreground">Record and review pH, Brix, and quality test results</p>

        </div>

        <Dialog

          open={createOpen}

          onOpenChange={(open) => {

            setCreateOpen(open);

            if (!open) resetForm();

          }}

        >

          <DialogTrigger asChild>

            <Button size="sm" disabled={pendingBatches.length === 0 && !loading}>

              <Plus className="w-4 h-4 mr-1" />

              New QC Test

            </Button>

          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

            <DialogHeader>

              <DialogTitle>Record QC Test</DialogTitle>

            </DialogHeader>

            <div className="space-y-4">

              <div className="space-y-2">

                <Label>Batch * (QC Pending only)</Label>

                <Select value={selectedBatchId || undefined} onValueChange={setSelectedBatchId}>

                  <SelectTrigger>

                    <SelectValue placeholder={pendingBatches.length ? "Select batch" : "No batches awaiting QC"} />

                  </SelectTrigger>

                  <SelectContent>

                    {pendingBatches.map((b) => (

                      <SelectItem key={b.entityId} value={b.entityId}>

                        {b.label} — {b.product}

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">

                <h4 className="text-sm font-semibold">Test Parameters</h4>

                <div className="grid grid-cols-2 gap-4">

                  <div className="space-y-2">

                    <Label className="flex items-center gap-2">

                      pH Level <span className="text-xs text-muted-foreground">(Range: 3.0 – 4.5)</span>

                    </Label>

                    <div className="flex items-center">

                      <Input

                        type="number"

                        step="0.1"

                        placeholder="e.g. 3.8"

                        value={phValue ?? ""}

                        onChange={(e) => setPhValue(e.target.value ? parseFloat(e.target.value) : null)}

                      />

                      <LiveIndicator value={phValue} min={3.0} max={4.5} />

                    </div>

                  </div>

                  <div className="space-y-2">

                    <Label className="flex items-center gap-2">

                      Brix Level <span className="text-xs text-muted-foreground">(Range: 10.0 – 14.0 °Bx)</span>

                    </Label>

                    <div className="flex items-center">

                      <Input

                        type="number"

                        step="0.1"

                        placeholder="e.g. 11.5"

                        value={brixValue ?? ""}

                        onChange={(e) => setBrixValue(e.target.value ? parseFloat(e.target.value) : null)}

                      />

                      <LiveIndicator value={brixValue} min={10.0} max={14.0} />

                    </div>

                  </div>

                </div>

                <div className="grid grid-cols-3 gap-4">

                  <div className="space-y-2">

                    <Label>Appearance</Label>

                    <Select value={appearance} onValueChange={setAppearance}>

                      <SelectTrigger>

                        <SelectValue placeholder="Select" />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="clear">Clear</SelectItem>

                        <SelectItem value="slight_haze">Slight Haze</SelectItem>

                        <SelectItem value="cloudy">Cloudy</SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                  <div className="space-y-2">

                    <Label>Color</Label>

                    <Select value={color} onValueChange={setColor}>

                      <SelectTrigger>

                        <SelectValue placeholder="Select" />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="normal">Normal</SelectItem>

                        <SelectItem value="off_color">Off-color</SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                  <div className="space-y-2">

                    <Label>Taste</Label>

                    <Select value={taste} onValueChange={setTaste}>

                      <SelectTrigger>

                        <SelectValue placeholder="Select" />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="normal">Normal</SelectItem>

                        <SelectItem value="off_taste">Off-taste</SelectItem>

                        <SelectItem value="acceptable">Acceptable</SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                </div>

                {phValue !== null && brixValue !== null && (

                  <div

                    className={`rounded-lg p-3 text-center font-semibold ${

                      phValue >= 3.0 &&

                      phValue <= 4.5 &&

                      brixValue >= 10.0 &&

                      brixValue <= 14.0 &&

                      appearance !== "cloudy" &&

                      color === "normal" &&

                      (taste === "normal" || taste === "acceptable")

                        ? "bg-primary/10 text-primary"

                        : "bg-destructive/10 text-destructive"

                    }`}

                  >

                    Predicted result:{" "}

                    {phValue >= 3.0 &&

                    phValue <= 4.5 &&

                    brixValue >= 10.0 &&

                    brixValue <= 14.0 &&

                    appearance !== "cloudy" &&

                    color === "normal" &&

                    (taste === "normal" || taste === "acceptable")

                      ? "PASS ✓"

                      : "FAIL ✗"}

                  </div>

                )}

              </div>

              <div className="space-y-2">

                <Label>Notes / Observations</Label>

                <textarea

                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px]"

                  placeholder="Test notes..."

                  value={notes}

                  onChange={(e) => setNotes(e.target.value)}

                />

              </div>

            </div>

            <DialogFooter>

              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>

                Cancel

              </Button>

              <Button disabled={submitting || !selectedBatchId} onClick={() => void handleSubmit()}>

                {submitting ? "Saving…" : "Submit Test"}

              </Button>

            </DialogFooter>

          </DialogContent>

        </Dialog>

      </div>



      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}



      {!loading && pendingBatches.length > 0 && (

        <div className="rounded-lg border bg-card p-4">

          <h3 className="text-sm font-semibold mb-2">Awaiting QC ({pendingBatches.length})</h3>

          <ul className="text-sm space-y-1">

            {pendingBatches.map((b) => (

              <li key={b.entityId} className="text-muted-foreground">

                <span className="font-mono text-foreground">{b.label}</span> — {b.product}

              </li>

            ))}

          </ul>

        </div>

      )}



      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="stat-card">

          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Tests</p>

          <p className="text-2xl font-heading font-bold mt-1">{qualityTests.length}</p>

        </div>

        <div className="stat-card">

          <p className="text-xs text-muted-foreground uppercase tracking-wider">Pass Rate</p>

          <p className="text-2xl font-heading font-bold mt-1 text-primary">{tested > 0 ? Math.round((passCount / tested) * 100) : 0}%</p>

        </div>

        <div className="stat-card">

          <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending batches</p>

          <p className="text-2xl font-heading font-bold mt-1 text-secondary">{pendingBatches.length}</p>

        </div>

      </div>



      <Tabs defaultValue="tests">

        <TabsList>

          <TabsTrigger value="tests">QC Tests</TabsTrigger>

          <TabsTrigger value="trends">

            <TrendingUp className="w-4 h-4 mr-1" />

            Trends

          </TabsTrigger>

        </TabsList>



        <TabsContent value="tests" className="mt-4">

          <div className="bg-card border rounded-lg overflow-hidden">

            <table className="data-table w-full text-sm">

              <thead>

                <tr className="border-b bg-muted/50">

                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Test ID</th>

                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Batch</th>

                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>

                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">pH</th>

                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Brix</th>

                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Appearance</th>

                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Result</th>

                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Tested By</th>

                  <th className="px-4 py-3"></th>

                </tr>

              </thead>

              <tbody>

                {qualityTests.map((q) => (

                  <tr

                    key={q.id}

                    className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${q.result === "fail" ? "bg-destructive/5" : ""}`}

                  >

                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{q.id.slice(0, 8)}…</td>

                    <td className="px-4 py-3 text-xs font-mono">{q.batchId}</td>

                    <td className="px-4 py-3 font-medium">{q.product}</td>

                    <td className="px-4 py-3">{q.ph ?? "—"}</td>

                    <td className="px-4 py-3">{q.brix ?? "—"}</td>

                    <td className="px-4 py-3 text-muted-foreground">{q.appearance ?? "—"}</td>

                    <td className="px-4 py-3">

                      {q.result === "pass" && (

                        <span className="status-badge-success">

                          <CheckCircle className="w-3 h-3 mr-1" />

                          Pass

                        </span>

                      )}

                      {q.result === "fail" && (

                        <span className="status-badge-danger">

                          <XCircle className="w-3 h-3 mr-1" />

                          Fail

                        </span>

                      )}

                      {q.result === "pending" && (

                        <span className="status-badge-warning">

                          <Clock className="w-3 h-3 mr-1" />

                          Pending

                        </span>

                      )}

                    </td>

                    <td className="px-4 py-3 text-muted-foreground">{q.testedBy ?? "—"}</td>

                    <td className="px-4 py-3">

                      <div className="flex gap-1">

                        <Button variant="ghost" size="sm" onClick={() => setDetailTest(q)} title="View">

                          <CheckCircle className="w-4 h-4" />

                        </Button>

                        {q.result === "pass" && (

                          <Button

                            variant="ghost"

                            size="sm"

                            onClick={() => {

                              setDetailTest(q);

                              setCertOpen(true);

                            }}

                            title="Certificate"

                          >

                            <Printer className="w-4 h-4" />

                          </Button>

                        )}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

            {!loading && qualityTests.length === 0 && (

              <p className="text-sm text-muted-foreground p-6 text-center">

                No QC tests yet. Send a batch to QC from Production, then record a test here.

              </p>

            )}

          </div>

          {qualityTests.some((q) => q.result === "fail") && (

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2 mt-4">

              <XCircle className="w-5 h-5 text-destructive shrink-0" />

              <p className="text-sm text-destructive font-medium">

                Failed batches stay in QC Pending until a passing re-test is recorded.

              </p>

            </div>

          )}

        </TabsContent>



        <TabsContent value="trends" className="mt-4">

          <div className="bg-card border rounded-lg p-5">

            <h3 className="font-heading font-semibold mb-4">Pass Rate Trend</h3>

            <ResponsiveContainer width="100%" height={300}>

              <LineChart data={qcTrendData}>

                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />

                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />

                <Tooltip

                  contentStyle={{

                    backgroundColor: "hsl(var(--card))",

                    border: "1px solid hsl(var(--border))",

                    borderRadius: 8,

                    fontSize: 12,

                  }}

                />

                <Line type="monotone" dataKey="passRate" stroke="hsl(var(--primary))" strokeWidth={2} name="Pass Rate %" dot={{ r: 4 }} />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </TabsContent>

      </Tabs>



      <div className="bg-card border rounded-lg p-5">

        <h3 className="font-heading font-semibold mb-3">Acceptable Ranges</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

          <div className="p-3 bg-muted rounded-lg">

            <p className="text-xs text-muted-foreground uppercase">pH Range</p>

            <p className="font-semibold mt-1">3.0 – 4.5</p>

          </div>

          <div className="p-3 bg-muted rounded-lg">

            <p className="text-xs text-muted-foreground uppercase">Brix Range</p>

            <p className="font-semibold mt-1">10.0 – 14.0 °Bx</p>

          </div>

          <div className="p-3 bg-muted rounded-lg">

            <p className="text-xs text-muted-foreground uppercase">Appearance</p>

            <p className="font-semibold mt-1">Clear / Slight Haze</p>

          </div>

          <div className="p-3 bg-muted rounded-lg">

            <p className="text-xs text-muted-foreground uppercase">Shelf Life</p>

            <p className="font-semibold mt-1">6 months</p>

          </div>

        </div>

      </div>



      {detailTest && (

        <Dialog

          open={!!detailTest}

          onOpenChange={() => {

            setDetailTest(null);

            setCertOpen(false);

          }}

        >

          <DialogContent className="max-w-lg">

            <DialogHeader>

              <DialogTitle>

                {certOpen && detailTest.result === "pass" ? "Quality Certificate" : `QC Test`}

              </DialogTitle>

            </DialogHeader>

            {certOpen && detailTest.result === "pass" ? (

              <div className="border-2 border-primary/20 rounded-lg p-6 space-y-4">

                <div className="text-center border-b pb-4">

                  <h2 className="font-heading font-bold text-xl text-primary">QUALITY CERTIFICATE</h2>

                  <p className="text-sm text-muted-foreground">Whizupp Ltd — Juice Production</p>

                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">

                  <div>

                    <p className="text-muted-foreground">Batch #</p>

                    <p className="font-mono font-semibold">{detailTest.batchId}</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">Product</p>

                    <p className="font-semibold">{detailTest.product}</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">pH Level</p>

                    <p className="font-semibold">{detailTest.ph}</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">Brix Level</p>

                    <p className="font-semibold">{detailTest.brix} °Bx</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">Appearance</p>

                    <p className="font-semibold">{detailTest.appearance}</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">Overall Result</p>

                    <p className="font-bold text-primary">PASS ✓</p>

                  </div>

                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-3 text-sm">

                  <div>

                    <p className="text-muted-foreground">QC Officer</p>

                    <p className="font-semibold">{detailTest.testedBy}</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">Test Date</p>

                    <p className="font-semibold">{detailTest.date}</p>

                  </div>

                </div>

                <Button size="sm" className="w-full">

                  <Printer className="w-4 h-4 mr-1" />

                  Print Certificate

                </Button>

              </div>

            ) : (

              <div className="space-y-4">

                <div className="grid grid-cols-2 gap-3 text-sm">

                  <div>

                    <p className="text-muted-foreground">Batch</p>

                    <p className="font-mono">{detailTest.batchId}</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">Product</p>

                    <p className="font-medium">{detailTest.product}</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">pH</p>

                    <p className="font-semibold">{detailTest.ph ?? "—"}</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">Brix</p>

                    <p className="font-semibold">{detailTest.brix ?? "—"} °Bx</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">Result</p>

                    <p>

                      <span

                        className={

                          detailTest.result === "pass"

                            ? "status-badge-success"

                            : detailTest.result === "fail"

                              ? "status-badge-danger"

                              : "status-badge-warning"

                        }

                      >

                        {detailTest.result.toUpperCase()}

                      </span>

                    </p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">Tested By</p>

                    <p>{detailTest.testedBy ?? "—"}</p>

                  </div>

                  <div>

                    <p className="text-muted-foreground">Date</p>

                    <p>{detailTest.date ?? "—"}</p>

                  </div>

                </div>

                {detailTest.notes && (

                  <div className="bg-muted rounded-lg p-3">

                    <p className="text-xs text-muted-foreground">Notes</p>

                    <p className="text-sm">{detailTest.notes}</p>

                  </div>

                )}

              </div>

            )}

          </DialogContent>

        </Dialog>

      )}

    </div>

  );

}

