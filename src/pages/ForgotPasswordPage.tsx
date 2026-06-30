import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import whizuppLogo from "@/assets/whizupp-logo.png";

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [step, setStep] = useState<"request" | "sent" | "reset" | "done">("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      setStep("reset");
    }
  }, [token]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(email);
      setStep("sent");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to request password reset. Please verify your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.resetPassword({ token, newPassword, confirmPassword });
      setStep("done");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password. The link might be expired or invalid.");
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
            <img src={whizuppLogo} alt="Whiz Upp" className="w-12 h-12 object-contain" />
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-8 border shadow-xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-primary-to-secondary" />

          {error && (
            <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 font-medium">
              {error}
            </div>
          )}

          {step === "request" && (
            <form onSubmit={handleRequest} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-heading font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Forgot Password?</h2>
                <p className="text-sm text-muted-foreground mt-1.5 font-medium">Enter your email to receive a reset link</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">Email Address</Label>
                <Input
                  type="email"
                  placeholder="you@whizupp.co.ke"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="bg-background/50 border-muted focus:border-primary/50 transition-colors"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-primary-to-secondary hover:brightness-105 transition-all duration-300 text-white font-bold tracking-wide shadow-lg shadow-primary/10 rounded-lg py-2.5"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <p className="text-center text-sm font-semibold pt-2">
                <Link to="/login" className="text-primary hover:text-primary/80 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
                  Back to login
                </Link>
              </p>
            </form>
          )}

          {step === "sent" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 border border-primary/20">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Check Your Email</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">We sent a reset link to <strong className="text-foreground">{email}</strong></p>
              <button className="text-sm text-primary hover:text-primary/80 font-bold transition-colors block mx-auto mt-4" onClick={() => setStep("request")}>Didn't receive? Try again</button>
            </div>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="text-center">
                <h2 className="font-heading font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Set New Password</h2>
                <p className="text-sm text-muted-foreground mt-1.5 font-medium">Enter your new password below</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">New Password</Label>
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className="bg-background/50 border-muted focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background/50 border-muted focus:border-primary/50 transition-colors"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-primary-to-secondary hover:brightness-105 transition-all duration-300 text-white font-bold tracking-wide shadow-lg shadow-primary/10 rounded-lg py-2.5"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 border border-primary/20">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Password Updated</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">Your password has been successfully reset.</p>
              <Button asChild className="w-full bg-gradient-primary-to-secondary hover:brightness-105 transition-all duration-300 text-white font-bold tracking-wide mt-4">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

