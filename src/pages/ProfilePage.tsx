import { useEffect, useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { authApi } from "@/lib/api";
import { User, Shield, Monitor } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";

export default function ProfilePage() {
  const { roleLabel, sessionUser, sessionLoading, refreshSession } = useRole();
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!sessionUser) return;
    setFullName(sessionUser.fullName);
    setPhone(sessionUser.phone);
    setDepartment(sessionUser.department);
  }, [sessionUser]);

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !phone.trim() || !department.trim()) {
      toast.error("Name, phone, and department are required.");
      return;
    }
    setSavingProfile(true);
    try {
      await authApi.updateMe({
        fullName: fullName.trim(),
        phone: phone.trim(),
        department: department.trim(),
      });
      toast.success("Profile updated.");
      await refreshSession();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Fill in all password fields.");
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast.error(msg || "Could not change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-2xl font-heading font-bold">Profile Management</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">
            <User className="w-4 h-4 mr-1.5" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-1.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Monitor className="w-4 h-4 mr-1.5" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <div className="bg-card border rounded-lg p-6 max-w-2xl space-y-4">
            {sessionLoading && <p className="text-sm text-muted-foreground">Loading your profile…</p>}
            {!sessionLoading && !sessionUser && (
              <p className="text-sm text-destructive">Could not load profile. Try signing out and back in.</p>
            )}
            {sessionUser && (
              <>
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold">{sessionUser.fullName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {roleLabel}
                      {sessionUser.employeeId ? ` • ${sessionUser.employeeId}` : ""}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input value={sessionUser.employeeId || "—"} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={sessionUser.email} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Department</Label>
                    <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Role</Label>
                    <Input value={roleLabel} readOnly className="bg-muted" />
                  </div>
                </div>
                <Button size="sm" onClick={() => void handleSaveProfile()} disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <div className="bg-card border rounded-lg p-6 max-w-2xl space-y-6">
            <div className="space-y-4">
              <h3 className="font-heading font-semibold">Change Password</h3>
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 characters with at least one number and one special character.</p>
              <Button size="sm" onClick={() => void handleChangePassword()} disabled={savingPassword}>
                {savingPassword ? "Updating…" : "Update Password"}
              </Button>
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
                  <p className="text-sm text-muted-foreground">Use the MFA setup flow from the API when available.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden max-w-2xl">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Device</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">IP Address</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Started</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 text-muted-foreground text-sm" colSpan={4}>
                    Session listing is not available from the server yet. You are signed in on this browser.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
