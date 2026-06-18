import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import whizuppLogo from "@/assets/whizupp-logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.login({ email, password });
      if (data.requiresMfa) {
        setMfaToken(data.tempToken || "");
        setShowMfa(true);
      } else if (data.requiresPasswordChange && data.tempToken) {
        sessionStorage.setItem("whizupp_first_login_temp", data.tempToken);
        navigate("/first-login-password", { state: { tempToken: data.tempToken }, replace: true });
      } else {
        localStorage.setItem("access_token", data.accessToken);
        localStorage.setItem("refresh_token", data.refreshToken);
        setIsLoggedIn(true);
        navigate("/");
      }
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const msg = err.response?.data?.message || err.response?.data?.error;
      if (newAttempts >= 5) setError("Account locked. Too many failed attempts. Contact administrator.");
      else if (newAttempts >= 3) setError(msg || `Invalid credentials. ${5 - newAttempts} attempts remaining before lockout.`);
      else setError(msg || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.verifyMfa({ tempToken: mfaToken, mfaCode });
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      setIsLoggedIn(true);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid MFA code. Please try again.");
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
            <img src={whizuppLogo} alt="Whiz Upp" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Sign in to Whiz Upp Production System
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 border shadow-xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-primary-to-secondary" />

          {!showMfa ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold tracking-wide">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@whizupp.co.ke"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={attempts >= 5}
                  className="bg-background/50 border-muted focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold tracking-wide">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={attempts >= 5}
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
              
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 font-medium animate-shake">
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary-to-secondary hover:brightness-105 transition-all duration-300 text-white font-bold tracking-wide shadow-lg shadow-primary/10 rounded-lg py-2.5"
                disabled={loading || attempts >= 5}
              >
                {loading && <span className="animate-spin mr-2">⏳</span>}
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-center text-sm text-muted-foreground font-medium pt-2">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:text-primary/80 font-bold transition-colors">
                  Register
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleMfa} className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mt-1">Enter the code from your authenticator app</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfa" className="text-sm font-semibold">Authentication Code</Label>
                <Input
                  id="mfa"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-xl font-bold tracking-[0.4em] bg-background/50 border-muted focus:border-primary/50"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 font-medium">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-primary-to-secondary hover:brightness-105 transition-all duration-300 text-white font-bold tracking-wide shadow-lg"
                disabled={loading || mfaCode.length < 6}
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
              <button
                type="button"
                className="w-full text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors pt-2"
                onClick={() => { setShowMfa(false); setError(""); }}
              >
                &larr; Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
