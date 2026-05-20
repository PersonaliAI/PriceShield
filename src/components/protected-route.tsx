"use client";

/**
 * Auth guard that wraps any page that needs a signed-in user.
 *
 * Why this is more careful than the obvious implementation:
 *   - Server middleware ALSO checks auth and redirects unauthed users to
 *     /login. If middleware lets you through, the cookie is valid.
 *   - But the client-side Supabase `getSession()` can sometimes hang or
 *     transiently return null (corrupted storage, refresh-token blip).
 *     If we eagerly `router.replace("/login")` on a client-side null,
 *     middleware bounces us BACK because the server sees the cookie —
 *     creating an infinite redirect loop.
 *
 * Solution: don't redirect at all from this component. If we end up with
 * no user after loading, render an in-page "please sign in" prompt. The
 * user explicitly clicks to /login, which avoids the loop. Genuine
 * unauthed visits never reach this component because middleware
 * intercepted at the edge.
 */
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    const next = pathname && !pathname.startsWith("/login") ? pathname : "";
    const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-card/80 p-8 text-center space-y-4">
          <div className="grid size-12 mx-auto place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
            <LogIn className="size-5" />
          </div>
          <h1 className="text-lg font-semibold">Sign in to continue</h1>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t confirm your session in this browser tab. Sign in
            again to access your dashboard. (Your data is safe — this is just
            a session refresh.)
          </p>
          <Button render={<Link href={loginHref}>Sign in</Link>} className="w-full" />
          <p className="text-[11px] text-muted-foreground">
            If this keeps happening, clear cookies for this site
            (DevTools → Application → Clear site data) and sign in fresh.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
