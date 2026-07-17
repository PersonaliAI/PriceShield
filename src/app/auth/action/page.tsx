"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Lock, Shield, XCircle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

function AuthActionHandler() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");        // "verify" | "reset"
  const code = searchParams.get("code");        // PKCE flow
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "reset-form">("loading");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      try {
        if (code) {
          // Supabase PKCE / OAuth code-exchange flow
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        } else if (tokenHash && type) {
          // Email OTP verification (e.g., signup, magiclink, recovery)
          const { error: vErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "signup" | "recovery" | "magiclink" | "invite" | "email_change",
          });
          if (vErr) throw vErr;
        }

        if (mode === "reset" || type === "recovery") {
          setStatus("reset-form");
        } else {
          setStatus("success");
        }
      } catch (err) {
        console.error("Auth action error:", err);
        setError(err instanceof Error ? err.message : "Failed to process auth action.");
        setStatus("error");
      }
    })();
  }, [mode, code, tokenHash, type]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return;
    setResetting(true);
    try {
      const supabase = createClient();
      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) throw upErr;
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
      setStatus("error");
    } finally {
      setResetting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mx-auto" />
          <p className="text-muted-foreground animate-pulse">Verifying security token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
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
            {mode === "reset" || type === "recovery" ? "Password Recovery" : "Account Security Verification"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          {status === "success" && (
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-muted-foreground">
                  {mode === "reset" || type === "recovery"
                    ? "Your password has been updated. You can now sign in with your new credentials."
                    : "Your email has been verified successfully. Your account is now fully protected."}
                </p>
              </div>
              <Link
                href="/login"
                className={buttonVariants({ className: "w-full bg-emerald-500 hover:bg-emerald-600 h-11" })}
              >
                Return to Login
              </Link>
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
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", className: "w-full h-11 border-border/40" })}
              >
                Back to Login
              </Link>
            </div>
          )}

          {status === "reset-form" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="pl-10 h-11 bg-muted/20 border-border/40 focus:border-emerald-500/50 transition-colors"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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
