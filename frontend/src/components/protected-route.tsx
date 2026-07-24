"use client";

/**
 * Auth guard for any page that needs a signed-in user.
 *
 * Flow:
 *   - loading        -> spinner
 *   - signed in      -> render children
 *   - signed out     -> wipe any stuck session state, then redirect to /login
 *
 * Why we wipe cookies before redirecting:
 *
 * The middleware in src/lib/supabase/middleware.ts runs server-side on every
 * request and reads the sb-*-auth-token cookies. If the client's Supabase
 * client sees "no session" but the server's cookie is still present (this
 * happens when the cookie + local storage drift out of sync, e.g. after the
 * extension's chrome.cookies operations or a refresh-token failure), then
 * a naive router.replace("/login") triggers an infinite loop: middleware
 * sees the cookie -> bounces back to /dashboard -> ProtectedRoute fires
 * again -> ...
 *
 * By synchronously wiping every sb-* cookie before the redirect, we ensure
 * middleware sees a clean request and lets us land on /login. The user
 * sees ONE sign-in screen (the real /login page), not two.
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function clearSupabaseCookiesAndStorage(): void {
  // Wipe sb-* cookies across every plausible path/domain permutation.
  // Required because Supabase writes the cookie on both the apex and www
  // hostnames, sometimes with a Domain attribute, sometimes path-scoped.
  const names = new Set<string>();
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name && name.startsWith("sb-")) names.add(name);
  }
  const host = location.hostname;
  const root = host.replace(/^www\./, "");
  const domains = new Set([host, `.${host}`, root, `.${root}`]);
  const paths = ["/", "/dashboard"];
  for (const name of names) {
    for (const domain of domains) {
      for (const path of paths) {
        document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${domain}`;
        document.cookie = `${name}=; Max-Age=0; path=${path}`;
      }
    }
  }
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-")) localStorage.removeItem(k);
    }
  } catch { /* private mode quota errors etc. — ignore */ }
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  // Guard against the redirect firing twice (StrictMode dev, or fast re-renders).
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (loading || user || redirectingRef.current) return;
    redirectingRef.current = true;

    // Clear stale sb- cookies to prevent infinite redirect loops between /dashboard and /login
    for (const part of document.cookie.split(";")) {
      const name = part.split("=")[0]?.trim();
      if (name && name.startsWith("sb-")) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
    }

    const next = pathname && !pathname.startsWith("/login") ? pathname : "";
    const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

    window.location.replace(loginHref);
  }, [loading, user, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
