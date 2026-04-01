import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import whizuppLogo from "@/assets/whizupp-logo.png";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "sent" | "reset" | "done">("request");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("sent"); }, 800);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("done"); }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={whizuppLogo} alt="Whiz Upp" className="w-12 h-12 mx-auto mb-3 object-contain" />
        </div>
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          {step === "request" && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="text-center">
                <KeyRound className="w-10 h-10 mx-auto text-primary mb-2" />
                <h2 className="font-heading font-bold text-xl">Forgot Password?</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="you@whizupp.co.ke" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <p className="text-center text-sm"><Link to="/login" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-3 h-3 inline mr-1" />Back to login</Link></p>
            </form>
          )}
          {step === "sent" && (
            <div className="text-center space-y-4">
              <Mail className="w-12 h-12 mx-auto text-primary" />
              <h2 className="font-heading font-bold text-xl">Check Your Email</h2>
              <p className="text-sm text-muted-foreground">We sent a reset link to <strong>{email}</strong></p>
              <Button variant="outline" onClick={() => setStep("reset")} className="w-full">I have the link (simulate)</Button>
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setStep("request")}>Didn't receive? Try again</button>
            </div>
          )}
          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="text-center">
                <h2 className="font-heading font-bold text-xl">Set New Password</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="New password" required />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" placeholder="Confirm new password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Updating..." : "Update Password"}</Button>
            </form>
          )}
          {step === "done" && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 mx-auto text-primary" />
              <h2 className="font-heading font-bold text-xl">Password Updated</h2>
              <p className="text-sm text-muted-foreground">Your password has been successfully reset.</p>
              <Button asChild className="w-full"><Link to="/login">Sign In</Link></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
