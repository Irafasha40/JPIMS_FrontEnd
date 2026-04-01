import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, XCircle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold">Check Your Inbox</h1>
          <p className="text-sm text-muted-foreground mt-2">We've sent a verification link to your email address. Click the link to activate your account.</p>
          <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>Resend Verification Email</Button>
          <p className="text-sm mt-4"><Link to="/login" className="text-primary hover:underline">← Back to login</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <img src={whizuppLogo} alt="Whiz Upp" className="w-12 h-12 mx-auto mb-3 object-contain" />
          <h1 className="text-2xl font-heading font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Register for the Whiz Upp system</p>
        </div>
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label>Employee ID *</Label>
                <Input placeholder="EMP008" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" placeholder="you@whizupp.co.ke" required />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input type="tel" placeholder="+254 7XX XXX XXX" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
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
                <Label>Role *</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production_manager">Production Manager</SelectItem>
                    <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                    <SelectItem value="qc_officer">QC Officer</SelectItem>
                    <SelectItem value="sales_staff">Sales Staff</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
