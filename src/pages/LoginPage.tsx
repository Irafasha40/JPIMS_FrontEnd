import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import whizuppLogo from "@/assets/whizupp-logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      if (email === "admin@whizupp.co.ke" && password === "password") {
        setShowMfa(true);
      } else if (email && password === "password") {
        setIsLoggedIn(true);
        navigate("/");
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 5) setError("Account locked. Too many failed attempts. Contact administrator.");
        else if (newAttempts >= 3) setError(`Invalid credentials. ${5 - newAttempts} attempts remaining before lockout.`);
        else setError("Invalid email or password.");
      }
    }, 800);
  };

  const handleMfa = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsLoggedIn(true);
      navigate("/");
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={whizuppLogo} alt="Whiz Upp" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-heading font-bold">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to Whiz Upp Production System</p>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          {!showMfa ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@whizupp.co.ke" value={email} onChange={e => setEmail(e.target.value)} required disabled={attempts >= 5} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required disabled={attempts >= 5} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>}
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading || attempts >= 5}>
                {loading ? <span className="animate-spin mr-2">⏳</span> : null}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleMfa} className="space-y-4">
              <div className="text-center">
                <Shield className="w-10 h-10 mx-auto text-primary mb-2" />
                <h3 className="font-heading font-semibold">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mt-1">Enter the code from your authenticator app</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfa">Authentication Code</Label>
                <Input id="mfa" type="text" placeholder="000000" maxLength={6} value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, ""))} className="text-center text-lg tracking-[0.5em]" />
              </div>
              <Button type="submit" className="w-full" disabled={loading || mfaCode.length < 6}>
                {loading ? "Verifying..." : "Verify"}
              </Button>
              <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setShowMfa(false)}>
                ← Back to login
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Hint: use any email with password "password" to log in. Use admin@whizupp.co.ke for MFA flow.
        </p>
      </div>
    </div>
  );
}
