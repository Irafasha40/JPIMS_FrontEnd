import { useState } from "react";
import { notifications } from "@/lib/mockData";
import { Bell, AlertTriangle, CheckCircle, Clock, Info, Send, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Breadcrumb from "@/components/Breadcrumb";

const severityIcon: Record<string, any> = { critical: AlertTriangle, warning: AlertTriangle, success: CheckCircle, info: Info };
const severityCls: Record<string, string> = { critical: "text-destructive", warning: "text-secondary", success: "text-primary", info: "text-info" };

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(notifications);
  const markAllRead = () => setNotifs(notifs.map(n => ({ ...n, read: true })));
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="module-header">
        <div><h1 className="text-2xl font-heading font-bold">Notifications & Alerts</h1><p className="text-sm text-muted-foreground">{unread} unread notifications</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead}>Mark All Read</Button>
          <Dialog><DialogTrigger asChild><Button size="sm"><Send className="w-4 h-4 mr-1" />Broadcast</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Broadcast Message</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Recipients</Label><Select><SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem><SelectItem value="production">Production Staff</SelectItem><SelectItem value="sales">Sales Staff</SelectItem><SelectItem value="qc">QC Officers</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Subject</Label><Input placeholder="Message subject" /></div>
                <div className="space-y-2"><Label>Message</Label><textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px]" placeholder="Write your message..." /></div>
              </div>
              <DialogFooter><Button variant="outline">Schedule</Button><Button>Send Now</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList><TabsTrigger value="all">All ({notifs.length})</TabsTrigger><TabsTrigger value="unread">Unread ({unread})</TabsTrigger><TabsTrigger value="preferences"><Settings className="w-4 h-4 mr-1" />Preferences</TabsTrigger></TabsList>

        <TabsContent value="all" className="mt-4 space-y-2">
          {notifs.map(n => {
            const Icon = severityIcon[n.severity] || Info;
            return (
              <div key={n.id} className={`bg-card border rounded-lg p-4 flex items-start gap-3 ${!n.read ? "border-l-4 border-l-primary" : ""}`}>
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${severityCls[n.severity]}`} />
                <div className="flex-1">
                  <p className={`text-sm ${!n.read ? "font-semibold" : ""}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.date).toLocaleString()}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="unread" className="mt-4 space-y-2">
          {notifs.filter(n => !n.read).map(n => {
            const Icon = severityIcon[n.severity] || Info;
            return (
              <div key={n.id} className="bg-card border border-l-4 border-l-primary rounded-lg p-4 flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${severityCls[n.severity]}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </div>
              </div>
            );
          })}
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
            ].map(pref => (
              <div key={pref.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <div><p className="text-sm font-medium">{pref.label}</p><p className="text-xs text-muted-foreground">{pref.desc}</p></div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><Switch defaultChecked /><span className="text-xs">In-App</span></div>
                  <div className="flex items-center gap-1.5"><Switch /><span className="text-xs">Email</span></div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
