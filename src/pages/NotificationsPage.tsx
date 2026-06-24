import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Info, Send, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Breadcrumb from "@/components/Breadcrumb";
import { notificationsApi } from "@/lib/api";
import { useRole } from "@/contexts/RoleContext";

const severityIcon: Record<string, React.ElementType> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};
const severityCls: Record<string, string> = {
  critical: "text-destructive",
  warning: "text-secondary",
  success: "text-primary",
  info: "text-info",
};

function severityFor(type: unknown, fallback: string): string {
  const value = String(type ?? fallback).toLowerCase();
  if (value.includes("low_stock") || value.includes("near_expiry") || value.includes("qc")) return "warning";
  if (value.includes("complete") || value.includes("order") || value.includes("new_order")) return "success";
  return fallback;
}

type NotifRow = {
  id: string;
  title: string;
  message: string;
  date: string;
  severity: string;
  read: boolean;
};

function mapNotif(n: Record<string, unknown>, index: number): NotifRow {
  return {
    id: String(n.id ?? `n-${index}`),
    title: String(n.title ?? n.subject ?? "Notification"),
    message: String(n.message ?? n.body ?? ""),
    date: String(n.createdAt ?? n.date ?? new Date().toISOString()),
    severity: severityFor(n.type, String(n.severity ?? "info").toLowerCase()),
    read: Boolean(n.read ?? n.isRead ?? false),
  };
}

export default function NotificationsPage() {
  const { role } = useRole();
  const canBroadcast = role === "administrator";
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [broadcastRecipient, setBroadcastRecipient] = useState("all");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await notificationsApi.listPage({ size: 100, sort: "createdAt,desc" });
      setNotifs((data.content ?? []).map((row, i) => mapNotif(row, i)));
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      setError(msg || "Could not load notifications.");
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      toast.error("Could not mark notification as read.");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifs((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Could not delete notification.");
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    setBroadcastSubmitting(true);
    try {
      await notificationsApi.broadcast({ title: broadcastTitle.trim(), message: broadcastMessage.trim(), recipient: broadcastRecipient });
      toast.success("Broadcast sent.");
      setBroadcastTitle("");
      setBroadcastMessage("");
      await load();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not send broadcast.");
    } finally {
      setBroadcastSubmitting(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-heading font-bold">Notifications & Alerts</h1>
          <p className="text-sm text-muted-foreground">{unread} unread notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark All Read
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!canBroadcast}>
                <Send className="w-4 h-4 mr-1" />
                Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Broadcast Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select value={broadcastRecipient} onValueChange={setBroadcastRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="production_manager">Production Staff</SelectItem>
                      <SelectItem value="inventory_manager">Inventory Staff</SelectItem>
                      <SelectItem value="sales_staff">Sales Staff</SelectItem>
                      <SelectItem value="qc_officer">QC Officers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="Message subject" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <textarea
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px]"
                    placeholder="Write your message..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" disabled={broadcastSubmitting}>Schedule</Button>
                <Button disabled={broadcastSubmitting || !canBroadcast} onClick={() => void handleBroadcast()}>
                  {broadcastSubmitting ? "Sending..." : "Send Now"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All ({notifs.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unread})
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="w-4 h-4 mr-1" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-2">
          {!loading && notifs.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No notifications from the server yet.</p>
          )}
          {notifs.map((n) => {
            const Icon = severityIcon[n.severity] || Info;
            return (
              <div
                key={n.id}
                className={`bg-card border rounded-lg p-4 flex items-start gap-3 ${!n.read ? "border-l-4 border-l-primary" : ""}`}
              >
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${severityCls[n.severity] || "text-info"}`} />
                <div className="flex-1">
                  <p className={`text-sm ${!n.read ? "font-semibold" : ""}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.date).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && <Button variant="ghost" size="sm" onClick={() => void markRead(n.id)}>Mark read</Button>}
                  <Button variant="ghost" size="sm" onClick={() => void deleteNotification(n.id)}>Delete</Button>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="unread" className="mt-4 space-y-2">
          {notifs
            .filter((n) => !n.read)
            .map((n) => {
              const Icon = severityIcon[n.severity] || Info;
              return (
                <div key={n.id} className="bg-card border border-l-4 border-l-primary rounded-lg p-4 flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${severityCls[n.severity] || "text-info"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  </div>
                </div>
              );
            })}
          {!loading && unread === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No unread items.</p>}
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <div className="bg-card border rounded-lg p-6 max-w-2xl space-y-4">
            <h3 className="font-heading font-semibold">Notification Preferences</h3>
            {[
              { label: "Low Stock Alerts", desc: "When material falls below threshold" },
              { label: "Near-Expiry Alerts", desc: "Products approaching expiry date" },
              { label: "Batch Completion", desc: "When production batch completes" },
              { label: "QC Test Reminders", desc: "Batches awaiting QC testing" },
              { label: "Order Notifications", desc: "New and confirmed orders" },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Switch defaultChecked />
                    <span className="text-xs">In-App</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Switch />
                    <span className="text-xs">Email</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
