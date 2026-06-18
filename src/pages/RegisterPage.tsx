import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authApi } from "@/lib/api";
import whizuppLogo from "@/assets/whizupp-logo.png";

function PasswordStrength({ password }: { password: string }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const passed = checks.filter(Boolean).length;
  const label = passed <= 1 ? "Weak" : passed <= 2 ? "Fair" : passed <= 3 ? "Strong" : "Very Strong";
  const color = passed <= 1 ? "bg-destructive" : passed <= 2 ? "bg-secondary" : "bg-primary";
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < passed ? color : "bg-muted"}`} />
        ))}
      </div>
      <p className={`text-xs ${passed <= 1 ? "text-destructive" : passed <= 2 ? "text-secondary" : "text-primary"}`}>{label}</p>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.register({ fullName, employeeId, email, phone, department, role, password });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
        {/* Decorative gradient blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md text-center relative z-10 glass-card rounded-2xl p-8 border shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-primary-to-secondary" />
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Check Your Inbox</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">We've sent a verification link to your email address. Click the link to activate your account.</p>
          <Button variant="outline" className="mt-6 border-muted hover:bg-muted" onClick={() => setSubmitted(false)}>Resend Verification Email</Button>
          <p className="text-sm mt-5 font-semibold"><Link to="/login" className="text-primary hover:text-primary/80 transition-colors">&larr; Back to login</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Decorative gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-secondary/10 blur-[120px] pointer-events-none animate-pulse duration-[6000ms]" />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-white/80 dark:bg-card/80 rounded-2xl shadow-md border border-white/50 dark:border-white/10 mb-3 transition-transform hover:scale-105 duration-300">
            <img src={whizuppLogo} alt="Whiz Upp" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Create Account
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Register for the Whiz Upp system
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 border shadow-xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-primary-to-secondary" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">Full Name *</Label>
                <Input
                  placeholder="John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="bg-background/50 border-muted focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">Employee ID *</Label>
                <Input
                  placeholder="EMP008"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  required
                  className="bg-background/50 border-muted focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">Email Address *</Label>
                <Input
                  type="email"
                  placeholder="you@whizupp.co.ke"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="bg-background/50 border-muted focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">Phone Number *</Label>
                <Input
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="bg-background/50 border-muted focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="bg-background/50 border-muted focus:border-primary/50">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="quality">Quality Control</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">Role *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-background/50 border-muted focus:border-primary/50">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCTION_MANAGER">Production Manager</SelectItem>
                    <SelectItem value="INVENTORY_MANAGER">Inventory Manager</SelectItem>
                    <SelectItem value="QC_OFFICER">QC Officer</SelectItem>
                    <SelectItem value="SALES_STAFF">Sales Staff</SelectItem>
                    <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wide">Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-background/50 border-muted pr-10 focus:border-primary/50 transition-colors"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
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
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground font-medium pt-2">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
