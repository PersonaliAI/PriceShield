"use client";

/**
 * Shopper web dashboard — signed-in view that mirrors what the extension does
 * on-page but for the user's full wishlist + alert history. Sits OUTSIDE the
 * /dashboard tree because that one is the B2B invoice product's UI; this is
 * the consumer surface so we keep the simpler chrome (Navbar+Footer).
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShoppingBag, Bell, TrendingDown, ExternalLink, Trash2, Building2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/protected-route";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Product {
  id: string;
  canonical_title: string;
  brand?: string | null;
  image_url?: string | null;
  observation_count: number;
  last_seen_at?: string | null;
}
interface WishlistItem {
  id: string;
  added_at: string;
  notes?: string | null;
  product: Product;
}
interface AlertRow {
  id: string;
  product_id: string;
  alert_kind: string;
  target_price: number | null;
  currency: string;
  status: string;
  triggered_at: string | null;
  triggered_price: number | null;
  created_at: string;
}
interface Entitlements {
  tier: string;
  alerts: number;
  b2b_items: number;
  predictions_per_day: number;
}

export default function ShopperDashboardPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <DashboardBody />
      </main>
      <Footer />
    </ProtectedRoute>
  );
}

function DashboardBody() {
  const { getToken, user } = useAuth();

  const authed = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const token = await getToken();
      const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail || `${res.status}`);
      }
      if (res.status === 204) return undefined as T;
      return res.json();
    },
    [getToken],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [ent, setEnt] = useState<Entitlements | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [w, a, e] = await Promise.all([
          authed<WishlistItem[]>("/shopper/wishlist"),
          authed<AlertRow[]>("/shopper/alerts"),
          authed<Entitlements>("/shopper/me/entitlements"),
        ]);
        setWishlist(w);
        setAlerts(a);
        setEnt(e);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [authed]);

  async function removeWishlist(productId: string) {
    await authed(`/shopper/wishlist/${productId}`, { method: "DELETE" });
    setWishlist((cur) => cur.filter((w) => w.product.id !== productId));
  }
  async function cancelAlert(id: string) {
    await authed(`/shopper/alerts/${id}`, { method: "DELETE" });
    setAlerts((cur) => cur.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="size-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const triggered = alerts.filter((a) => a.status === "triggered");

  return (
    <div className="mx-auto max-w-5xl px-6 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PriceShield Shopper</h1>
          <p className="text-sm text-muted-foreground">
            {user?.email} · Plan: <span className="font-medium capitalize">{ent?.tier?.replace("_", " ")}</span>
            {ent && (
              <>  · Alerts {activeAlerts.length}/{ent.alerts}</>
            )}
          </p>
        </div>
        {ent?.tier === "shopper_free" || ent?.tier === "free" ? (
          <Button render={<Link href="/shopper#pricing">Upgrade to Shopper Pro</Link>} />
        ) : null}
      </header>

      {error && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-500">
          {error}
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Wishlist" value={String(wishlist.length)} icon={ShoppingBag} />
        <Stat label="Active alerts" value={String(activeAlerts.length)} icon={Bell} />
        <Stat label="Drops caught" value={String(triggered.length)} icon={TrendingDown} highlight />
      </div>

      {/* B2B Competitor Watchlists — entry card. Shown to everyone, but the
          actual feature requires a Pro plan (gated server-side on insert). */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-card">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <div className="size-10 grid place-items-center rounded-lg bg-violet-500/10 text-violet-400 shrink-0">
              <Building2 className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Competitor Watchlists
                <span className="text-[10px] uppercase tracking-wider font-semibold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                  B2B
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                For brands and sellers: monitor competitor prices across all stores in one
                dashboard. Daily move tracking with your-price comparison.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            render={
              <Link href="/shopper/competitors" className="inline-flex items-center gap-1.5">
                Open <ArrowRight className="size-3.5" />
              </Link>
            }
          />
        </CardContent>
      </Card>

      {/* Wishlist */}
      <Card>
        <CardHeader>
          <CardTitle>Wishlist</CardTitle>
          <CardDescription>
            Every product you've bookmarked from the extension panel. Click to revisit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wishlist.length === 0 ? (
            <EmptyState
              title="Nothing in your wishlist yet"
              body="Open any product page with the extension installed and click 'Add to wishlist'."
            />
          ) : (
            <ul className="divide-y divide-border">
              {wishlist.map((w) => (
                <li key={w.id} className="flex items-center gap-3 py-3">
                  {w.product.image_url ? (
                    <img src={w.product.image_url} alt="" className="size-12 rounded-md object-cover border border-border" />
                  ) : (
                    <div className="size-12 rounded-md bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{w.product.canonical_title}</p>
                    {w.product.brand && (
                      <p className="text-xs text-muted-foreground">{w.product.brand}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeWishlist(w.product.id)}
                    className="p-2 text-muted-foreground hover:text-rose-400"
                    title="Remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Active alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active alerts</CardTitle>
          <CardDescription>We'll notify you the moment a tracked product crosses your target.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <EmptyState
              title="No active alerts"
              body="Click 'Notify me on drop' on any product page to set one."
            />
          ) : (
            <ul className="divide-y divide-border">
              {activeAlerts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <div className="size-9 grid place-items-center rounded-md bg-violet-500/10 text-violet-500">
                    <Bell className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {a.alert_kind === "restock"
                        ? "Restock alert"
                        : `Below ${a.currency} ${a.target_price?.toFixed(2) ?? "—"}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => cancelAlert(a.id)} className="text-xs text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Triggered history */}
      {triggered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Drops you caught</CardTitle>
            <CardDescription>The receipts for every alert that fired.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {triggered.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <div className="size-9 grid place-items-center rounded-md bg-emerald-500/10 text-emerald-500">
                    <TrendingDown className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      Hit {a.currency} {a.triggered_price?.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.triggered_at && new Date(a.triggered_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({
  label, value, icon: Icon, highlight,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`size-4 ${highlight ? "text-emerald-500" : "text-muted-foreground"}`} />
      </div>
      <p className={`text-2xl font-semibold ${highlight ? "text-emerald-500" : ""}`}>{value}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}
