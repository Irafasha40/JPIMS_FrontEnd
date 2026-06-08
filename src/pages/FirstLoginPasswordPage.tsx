import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import whizuppLogo from "@/assets/whizupp-logo.png";

const STORAGE_KEY = "whizupp_first_login_temp";

export default function FirstLoginPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn } = useRole();
  const stateToken = (location.state as { tempToken?: string } | null)?.tempToken;
  const [tempToken] = useState(() => stateToken || sessionStorage.getItem(STORAGE_KEY) || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!tempToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <p className="text-sm text-muted-foreground">This link is invalid or expired. Please sign in again.</p>
          <Button asChild>
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.completeFirstLogin({
        tempToken,
        newPassword,
        confirmPassword,
      });
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      setIsLoggedIn(true);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      setError(msg || "Could not update password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={whizuppLogo} alt="Whiz Upp" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-heading font-bold">Set your password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your administrator created your account. Choose a new password before continuing.
          </p>
        </div>
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Use at least 8 characters with one number and one special character.</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving…" : "Continue to dashboard"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">
                Cancel and return to sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
