"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword, sendVerification, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Where to redirect after sign-in. Defaults to the invoice product dashboard.
  // Set via ?next=/some/path (used by ProtectedRoute and the extension popup).
  const nextPath = (() => {
    const raw = searchParams.get("next");
    if (!raw) return "/dashboard";
    // Only allow internal paths to prevent open-redirect.
    return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  })();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, user, router]);

  if (!loading && user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      if (isReset) {
        await resetPassword(email);
        setSuccess("Password reset link sent! Check your inbox.");
        setIsReset(false);
      } else if (isSignUp) {
        await signUp(email, password);
        // Best effort: send verification right away
        try { await sendVerification(); } catch (e) { console.error("Auto-verification failed:", e); }
        router.push(nextPath);
      } else {
        await signIn(email, password);
        router.push(nextPath);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      if (message.includes("user-not-found") || message.includes("wrong-password")) {
        setError("Invalid email or password");
      } else if (message.includes("email-already-in-use")) {
        setError("An account with this email already exists");
      } else if (message.includes("weak-password")) {
        setError("Password should be at least 6 characters");
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.push(nextPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/3 h-72 w-72 rounded-full bg-emerald-500/8 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/3 h-64 w-64 rounded-full bg-emerald-400/6 blur-3xl animate-pulse-glow [animation-delay:1s]" />
      </div>

      <Card className="w-full max-w-md bg-card/80 backdrop-blur border-border/50">
        <CardHeader className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="PriceShield Logo" className="h-12 w-auto" />
          </Link>
          <CardTitle className="text-2xl">
            {isReset ? "Reset Password" : isSignUp ? "Create Account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isReset 
              ? "We'll send a reset link to your email"
              : isSignUp
                ? "Start protecting your margins today"
                : "Sign in to your PriceShield dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Success/Error displays */}
          {success && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!isReset && (
            <>
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleGoogleAuth}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
            </>
          )}

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {!isReset && (
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    className="pl-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {!isSignUp && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsReset(true)}
                      className="text-xs text-muted-foreground hover:text-emerald-400"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-background font-semibold"
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isReset ? "Send Reset Link" : isSignUp ? "Create Account" : "Sign In"}
              {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isReset ? (
              <button
                onClick={() => setIsReset(false)}
                className="text-emerald-400 hover:underline font-medium"
              >
                Back to sign in
              </button>
            ) : (
              <>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                  className="text-emerald-400 hover:underline font-medium"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
