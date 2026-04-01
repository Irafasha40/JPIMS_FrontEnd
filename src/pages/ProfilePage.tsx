import { useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { User, Shield, Key, Monitor, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";

export default function ProfilePage() {
  const { roleLabel } = useRole();
  const [mfaEnabled, setMfaEnabled] = useState(false);

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-2xl font-heading font-bold">Profile Management</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal"><User className="w-4 h-4 mr-1.5" />Personal Info</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1.5" />Security</TabsTrigger>
          <TabsTrigger value="sessions"><Monitor className="w-4 h-4 mr-1.5" />Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <div className="bg-card border rounded-lg p-6 max-w-2xl space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Admin User</h3>
                <p className="text-sm text-muted-foreground">{roleLabel} • EMP001</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input defaultValue="Admin User" /></div>
              <div className="space-y-2"><Label>Employee ID</Label><Input defaultValue="EMP001" readOnly className="bg-muted" /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue="admin@whizupp.co.ke" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input defaultValue="+254 700 000 001" /></div>
              <div className="space-y-2"><Label>Department</Label><Input defaultValue="Management" readOnly className="bg-muted" /></div>
              <div className="space-y-2"><Label>Role</Label><Input defaultValue={roleLabel} readOnly className="bg-muted" /></div>
            </div>
            <Button size="sm">Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <div className="bg-card border rounded-lg p-6 max-w-2xl space-y-6">
            <div className="space-y-4">
              <h3 className="font-heading font-semibold">Change Password</h3>
              <div className="space-y-2"><Label>Current Password</Label><Input type="password" /></div>
              <div className="space-y-2"><Label>New Password</Label><Input type="password" /></div>
              <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" /></div>
              <Button size="sm">Update Password</Button>
            </div>
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-heading font-semibold">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Enable 2FA for your account</p>
                  <p className="text-xs text-muted-foreground">Use an authenticator app for extra security</p>
                </div>
                <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
              </div>
              {mfaEnabled && (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="w-32 h-32 bg-foreground/10 rounded-lg mx-auto mb-3 flex items-center justify-center text-xs text-muted-foreground">QR Code Placeholder</div>
                  <p className="text-sm font-medium">Scan with your authenticator app</p>
                  <p className="text-xs text-muted-foreground mt-2">Backup codes: <code className="bg-card px-1 rounded">A8F2-K9D3-M4P7-R2T6</code></p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden max-w-2xl">
            <table className="data-table w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Device</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">IP Address</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Started</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>
                <tr className="border-b"><td className="px-4 py-3">Chrome / Windows</td><td className="px-4 py-3 font-mono text-xs">192.168.1.5</td><td className="px-4 py-3 text-muted-foreground">Today, 08:00</td><td className="px-4 py-3"><span className="status-badge-success">Current</span></td></tr>
                <tr className="border-b"><td className="px-4 py-3">Safari / iPhone</td><td className="px-4 py-3 font-mono text-xs">192.168.1.25</td><td className="px-4 py-3 text-muted-foreground">Yesterday, 14:30</td><td className="px-4 py-3"><Button variant="ghost" size="sm" className="text-destructive h-7"><LogOut className="w-3 h-3 mr-1" />End</Button></td></tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
