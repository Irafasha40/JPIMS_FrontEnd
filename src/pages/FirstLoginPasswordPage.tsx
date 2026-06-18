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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Decorative gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-secondary/10 blur-[120px] pointer-events-none animate-pulse duration-[6000ms]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white/80 dark:bg-card/80 rounded-2xl shadow-md border border-white/50 dark:border-white/10 mb-4 transition-transform hover:scale-105 duration-300">
            <img src={whizuppLogo} alt="Whiz Upp" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Set your password</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Your administrator created your account. Choose a new password before continuing.
          </p>
        </div>
        
        <div className="glass-card rounded-2xl p-8 border shadow-xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-primary-to-secondary" />

          <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4">
            <div className="flex items-start gap-2.5 text-xs text-primary bg-primary/10 border border-primary/20 rounded-xl p-3.5 font-medium leading-relaxed">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Use at least 8 characters with one number and one special character.</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs font-semibold tracking-wide">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-background/50 border-muted focus:border-primary/50 pr-10 transition-colors"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold tracking-wide">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="bg-background/50 border-muted focus:border-primary/50 transition-colors"
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 font-medium">
                {error}
              </p>
            )}
            
            <Button
              type="submit"
              className="w-full bg-gradient-primary-to-secondary hover:brightness-105 transition-all duration-300 text-white font-bold tracking-wide shadow-lg shadow-primary/10 rounded-lg py-2.5 mt-2"
              disabled={loading}
            >
              {loading ? "Saving…" : "Continue to dashboard"}
            </Button>
            
            <p className="text-center text-sm font-semibold pt-2">
              <Link to="/login" className="text-primary hover:text-primary/80 transition-colors">
                Cancel and return to sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
