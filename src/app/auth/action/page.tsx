"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle, Shield, Lock } from "lucide-react";
import Link from "next/link";

function AuthActionHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "reset-form">("loading");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus("error");
      setError("Invalid or missing action code.");
      return;
    }

    const handleAction = async () => {
      try {
        if (mode === "verifyEmail") {
          await applyActionCode(auth, oobCode);
          setStatus("success");
        } else if (mode === "resetPassword") {
          const userEmail = await verifyPasswordResetCode(auth, oobCode);
          setEmail(userEmail);
          setStatus("reset-form");
        } else {
          setStatus("error");
          setError("Unsupported action mode.");
        }
      } catch (err: any) {
        console.error("Auth action error:", err);
        setStatus("error");
        setError(err.message || "Failed to process auth action.");
      }
    };

    handleAction();
  }, [mode, oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || password.length < 6) return;
    setResetting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("success");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
      setStatus("error");
    } finally {
      setResetting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-6">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mx-auto" />
          <p className="text-muted-foreground animate-pulse">Verifying security token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]" />
      
      <Card className="w-full max-w-md bg-card/30 border-border/40 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
        
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {status === "success" ? "All Set!" : status === "reset-form" ? "New Password" : "Oops!"}
          </CardTitle>
          <CardDescription>
            {mode === "verifyEmail" 
              ? "Account Security Verification" 
              : "Password Recovery"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          {status === "success" && (
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-muted-foreground">
                  {mode === "verifyEmail" 
                    ? "Your email has been verified successfully. Your account is now fully protected."
                    : "Your password has been updated. You can now sign in with your new credentials."}
                </p>
              </div>
              <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 h-11">
                <Link href="/login">Return to Login</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center gap-3">
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-lg border border-destructive/20 w-full">
                  {error}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  The link may be expired or already used. Please try requesting a new one.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full h-11 border-border/40">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          )}

          {status === "reset-form" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">Account</p>
                  <p className="text-sm font-medium truncate">{email}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="pl-10 h-11 bg-black/20 border-border/40 focus:border-emerald-500/50 transition-colors"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={resetting || password.length < 6}
                className="w-full bg-emerald-500 hover:bg-emerald-600 h-11 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                {resetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={null}>
      <AuthActionHandler />
    </Suspense>
  );
}
