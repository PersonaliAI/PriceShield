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
 * no user after loading, render an in-page "please sign in" prompt that
 * also offers a "clear stuck session" escape hatch — which forcibly wipes
 * Supabase cookies + local storage so the user can break out of a broken
 * client/server auth-state mismatch without dropping into DevTools.
 */
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function clearSupabaseCookiesAndStorage(): void {
  // Best-effort cookie wipe across every plausible path/domain combination.
  // Required because Supabase writes `sb-<ref>-auth-token` (possibly chunked
  // as .0/.1/...) on both apex and www, sometimes with Domain attribute.
  const names = new Set<string>();
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name && name.startsWith("sb-")) names.add(name);
  }
  const host = location.hostname;
  const domains = [host, `.${host}`];
  // Strip "www." if present so the apex domain is also covered.
  const root = host.replace(/^www\./, "");
  if (root !== host) {
    domains.push(root, `.${root}`);
  }
  const paths = ["/", "/dashboard", "/shopper", ""];
  for (const name of names) {
    for (const domain of domains) {
      for (const path of paths) {
        document.cookie = `${name}=; Max-Age=0; path=${path || "/"}; domain=${domain}`;
        document.cookie = `${name}=; Max-Age=0; path=${path || "/"}`;
      }
    }
  }
  // Local storage + session storage too — Supabase falls back to localStorage
  // when the storage adapter can't write a cookie.
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-")) localStorage.removeItem(k);
    }
  } catch { /* ignore quota / private-mode */ }
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("sb-")) sessionStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

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

    async function clearAndRestart() {
      setClearing(true);
      // Tell Supabase to drop the global session (revokes refresh token server-
      // side too) before nuking client state. Best-effort: don't block on it.
      try {
        const client = createClient();
        await Promise.race([
          client.auth.signOut({ scope: "global" }),
          new Promise((r) => setTimeout(r, 2500)),
        ]);
      } catch { /* ignore — we're about to wipe locally anyway */ }
      clearSupabaseCookiesAndStorage();
      // Hard reload so the new request hits middleware without any cookies.
      window.location.href = loginHref;
    }

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

          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-[11px] text-muted-foreground">
              If the Sign in button just sends you in circles, your local
              session is stuck. Wipe it and start fresh:
            </p>
            <button
              onClick={clearAndRestart}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-60"
            >
              {clearing ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              Clear stuck session & start over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
