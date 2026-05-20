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
  product_url?: string | null;
  aliases?: Array<{ product_url: string; store: string }> | null;
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
interface UserSettings {
  email: string;
  telegram_chat_id: string | null;
  telegram_linked: boolean;
  alert_email: string | null;
  alert_channels: string[];
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
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [alertEmail, setAlertEmail] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await authed<UserSettings>("/api/settings");
      setSettings(data);
      setAlertEmail(data.alert_email || data.email || "");
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, [authed]);

  useEffect(() => {
    (async () => {
      try {
        const [w, a, e, s] = await Promise.all([
          authed<WishlistItem[]>("/shopper/wishlist"),
          authed<AlertRow[]>("/shopper/alerts"),
          authed<Entitlements>("/shopper/me/entitlements"),
          authed<UserSettings>("/api/settings"),
        ]);
        setWishlist(w);
        setAlerts(a);
        setEnt(e);
        setSettings(s);
        setAlertEmail(s.alert_email || s.email || "");
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

  async function saveNotificationSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      await authed("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          alert_email: alertEmail || null,
        }),
      });
      setSettings(prev => prev ? { ...prev, alert_email: alertEmail } : null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSettings(false);
    }
  }

  async function disconnectTelegram() {
    try {
      await authed("/webhook/telegram/disconnect", { method: "POST" });
      await fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function refreshTelegramStatus() {
    await fetchSettings();
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
                <li key={w.id} className="flex items-center gap-3 py-3 group">
                  {w.product.product_url ? (
                    <a
                      href={w.product.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition-opacity"
                    >
                      {w.product.image_url ? (
                        <img src={w.product.image_url} alt="" className="size-12 rounded-md object-cover border border-border shrink-0" />
                      ) : (
                        <div className="size-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0"><ShoppingBag className="size-5" /></div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate flex items-center gap-1.5 text-foreground group-hover:text-violet-400 transition-colors">
                          {w.product.canonical_title}
                          <ExternalLink className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-violet-400 shrink-0" />
                        </p>
                        {w.product.brand && (
                          <p className="text-xs text-muted-foreground">{w.product.brand}</p>
                        )}
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {w.product.image_url ? (
                        <img src={w.product.image_url} alt="" className="size-12 rounded-md object-cover border border-border shrink-0" />
                      ) : (
                        <div className="size-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0"><ShoppingBag className="size-5" /></div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{w.product.canonical_title}</p>
                        {w.product.brand && (
                          <p className="text-xs text-muted-foreground">{w.product.brand}</p>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => removeWishlist(w.product.id)}
                    className="p-2 text-muted-foreground hover:text-rose-400 shrink-0"
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
      {/* Alerts & Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-violet-400" />
            Alert & Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure where you receive price drop and restock alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={saveNotificationSettings} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label htmlFor="alert-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Alert Email Address
              </label>
              <div className="flex gap-2">
                <input
                  id="alert-email"
                  type="email"
                  required
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="alerts@example.com"
                  className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <Button type="submit" disabled={savingSettings} size="sm">
                  {savingSettings && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                  Save Email
                </Button>
              </div>
              {saveSuccess && (
                <p className="text-xs text-emerald-400 font-medium">Alert email updated successfully.</p>
              )}
            </div>
          </form>

          <div className="border-t border-border pt-6 max-w-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Telegram Bot Channel
            </h4>
            {settings?.telegram_chat_id ? (
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Telegram Bot Linked</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Receiving instant notifications on Telegram.
                  </p>
                </div>
                <button
                  onClick={disconnectTelegram}
                  className="px-3 py-1.5 text-xs font-medium border border-rose-500/30 hover:border-rose-500/50 rounded-md text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium">Connect with Telegram</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Link your Telegram account to get instant push alerts on price drops.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://t.me/PriceShieldBot?start=${user?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                  >
                    Open Bot Chat
                    <ExternalLink className="size-3" />
                  </a>
                  <button
                    onClick={refreshTelegramStatus}
                    className="px-3 py-1.5 text-xs font-semibold border border-border hover:border-muted-foreground rounded-md text-foreground transition-colors"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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
