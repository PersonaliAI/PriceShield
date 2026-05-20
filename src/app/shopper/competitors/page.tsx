"use client";

/**
 * B2B Pricing Intelligence — competitor watchlist dashboard.
 *
 * For each watchlist we surface:
 *   - the list of products being monitored
 *   - the most recent meaningful price moves (>=0.5% in either direction)
 *   - a delta vs. the user's own price (if they entered one)
 *
 * Phase 3 keeps this to a single-watchlist-per-user UX. Multi-workspace will
 * come with the team-memberships migration.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/protected-route";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Watchlist {
  id: string;
  name: string;
  brand_filter: string | null;
  plan: string;
  digest_channels: string[];
  digest_day: string;
}
interface WatchlistItem {
  id: string;
  product_id: string;
  label: string | null;
  own_price: number | null;
  added_at: string;
}
interface CompetitorMove {
  product_id: string;
  product_title: string;
  store: string;
  current_price: number;
  previous_price: number;
  change_pct: number;
  own_price: number | null;
  own_vs_competitor_pct: number | null;
  observed_at: string;
}

export default function CompetitorsPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <CompetitorsBody />
      </main>
      <Footer />
    </ProtectedRoute>
  );
}

function CompetitorsBody() {
  const { getToken } = useAuth();

  const authedFetch = useCallback(
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail || "Request failed");
      }
      if (res.status === 204) return undefined as T;
      return res.json();
    },
    [getToken],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [moves, setMoves] = useState<CompetitorMove[]>([]);

  // create-watchlist form
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [creating, setCreating] = useState(false);

  // add-item form
  const [newProductId, setNewProductId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newOwnPrice, setNewOwnPrice] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const list = await authedFetch<Watchlist[]>("/shopper/b2b/watchlists");
        setWatchlists(list);
        if (list[0]) setActiveId(list[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [authedFetch]);

  // load active watchlist's items + moves
  useEffect(() => {
    if (!activeId) {
      setItems([]); setMoves([]); return;
    }
    (async () => {
      try {
        const [its, mvs] = await Promise.all([
          authedFetch<WatchlistItem[]>(`/shopper/b2b/watchlists/${activeId}/items`),
          authedFetch<CompetitorMove[]>(`/shopper/b2b/watchlists/${activeId}/moves?days=7`),
        ]);
        setItems(its);
        setMoves(mvs);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [activeId, authedFetch]);

  async function createWatchlist(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const w = await authedFetch<Watchlist>("/shopper/b2b/watchlists", {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          brand_filter: newBrand || null,
          digest_channels: ["email"],
          digest_day: "mon",
        }),
      });
      setWatchlists((cur) => [w, ...cur]);
      setActiveId(w.id);
      setNewName(""); setNewBrand("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId) return;
    setAddingItem(true);
    setError(null);
    try {
      const item = await authedFetch<WatchlistItem>(
        `/shopper/b2b/watchlists/${activeId}/items`,
        {
          method: "POST",
          body: JSON.stringify({
            product_id: newProductId.trim(),
            label: newLabel || null,
            own_price: newOwnPrice ? Number(newOwnPrice) : null,
          }),
        },
      );
      setItems((cur) => [item, ...cur]);
      setNewProductId(""); setNewLabel(""); setNewOwnPrice("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddingItem(false);
    }
  }

  async function removeItem(itemId: string) {
    if (!activeId) return;
    await authedFetch(`/shopper/b2b/watchlists/${activeId}/items/${itemId}`, {
      method: "DELETE",
    });
    setItems((cur) => cur.filter((i) => i.id !== itemId));
  }

  async function removeWatchlist() {
    if (!activeId) return;
    if (!confirm("Delete this watchlist? All tracked items will be removed.")) return;
    await authedFetch(`/shopper/b2b/watchlists/${activeId}`, { method: "DELETE" });
    setWatchlists((cur) => cur.filter((w) => w.id !== activeId));
    setActiveId(null);
  }

  const active = useMemo(
    () => watchlists.find((w) => w.id === activeId) ?? null,
    [watchlists, activeId],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Competitor Watchlists</h1>
        <p className="text-sm text-muted-foreground">
          Monitor competitor prices for the products you sell. Data is drawn from the
          crowdsourced PriceShield Shopper catalog — no scraping required.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-500">
          {error}
        </div>
      )}

      {watchlists.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Create your first watchlist</CardTitle>
            <CardDescription>
              Name it after the brand or category you're monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createWatchlist} className="grid sm:grid-cols-2 gap-3 max-w-xl">
              <div className="space-y-1">
                <Label htmlFor="wl-name">Name</Label>
                <Input
                  id="wl-name" required value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Headphone competitors"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wl-brand">Brand filter (optional)</Label>
                <Input
                  id="wl-brand" value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="Sony"
                />
              </div>
              <Button type="submit" disabled={creating} className="sm:col-span-2 w-fit">
                {creating && <Loader2 className="size-3.5 animate-spin mr-2" />}
                Create watchlist
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* watchlist switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {watchlists.map((w) => (
              <button
                key={w.id}
                onClick={() => setActiveId(w.id)}
                className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                  w.id === activeId
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {w.name}
              </button>
            ))}
            <button
              onClick={() => setActiveId(null)}
              className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Plus className="size-3.5" /> New
            </button>
            {active && (
              <button
                onClick={removeWatchlist}
                className="ml-auto inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="size-3.5" /> Delete this watchlist
              </button>
            )}
          </div>

          {!active ? (
            <Card>
              <CardHeader>
                <CardTitle>New watchlist</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createWatchlist} className="grid sm:grid-cols-2 gap-3 max-w-xl">
                  <Input
                    required value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder="Name"
                  />
                  <Input
                    value={newBrand} onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="Brand filter (optional)"
                  />
                  <Button type="submit" disabled={creating} className="sm:col-span-2 w-fit">
                    Create
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Moves table */}
              <Card>
                <CardHeader>
                  <CardTitle>Last 7 days — competitor moves</CardTitle>
                  <CardDescription>
                    Sorted by absolute change. Moves under 0.5% are filtered out.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {moves.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No meaningful moves yet. Add products below — data starts flowing as
                      soon as a Shopper extension user visits the product page.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead className="text-right">Prev</TableHead>
                          <TableHead className="text-right">Now</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                          <TableHead className="text-right">vs. Yours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {moves.map((m) => (
                          <TableRow key={`${m.product_id}-${m.observed_at}`}>
                            <TableCell className="max-w-xs truncate">{m.product_title}</TableCell>
                            <TableCell className="capitalize text-muted-foreground">{m.store}</TableCell>
                            <TableCell className="text-right tabular-nums">${m.previous_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">${m.current_price.toFixed(2)}</TableCell>
                            <TableCell className={`text-right tabular-nums font-semibold ${m.change_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                              <span className="inline-flex items-center gap-1 justify-end">
                                {m.change_pct >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                                {m.change_pct >= 0 ? "+" : ""}{m.change_pct.toFixed(2)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {m.own_vs_competitor_pct === null
                                ? "—"
                                : `${m.own_vs_competitor_pct >= 0 ? "+" : ""}${m.own_vs_competitor_pct.toFixed(2)}%`}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Items + add form */}
              <Card>
                <CardHeader>
                  <CardTitle>Tracked products ({items.length})</CardTitle>
                  <CardDescription>
                    Paste a product UUID from the Shopper catalog. The Chrome extension
                    surfaces the UUID after the first page visit (see the panel footer).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={addItem} className="grid sm:grid-cols-4 gap-3 items-end">
                    <div className="sm:col-span-2 space-y-1">
                      <Label htmlFor="product-id">Product UUID</Label>
                      <Input
                        id="product-id" required value={newProductId}
                        onChange={(e) => setNewProductId(e.target.value)}
                        placeholder="00000000-…"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="label">Your label</Label>
                      <Input
                        id="label" value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="SKU 142-A"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="own-price">Your price ($)</Label>
                      <Input
                        id="own-price" type="number" step="0.01" min="0"
                        value={newOwnPrice}
                        onChange={(e) => setNewOwnPrice(e.target.value)}
                        placeholder="249.99"
                      />
                    </div>
                    <Button type="submit" disabled={addingItem} className="sm:col-span-4 w-fit">
                      {addingItem && <Loader2 className="size-3.5 animate-spin mr-2" />}
                      <Plus className="size-3.5 mr-1" /> Track product
                    </Button>
                  </form>

                  {items.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Label</TableHead>
                          <TableHead>Product UUID</TableHead>
                          <TableHead className="text-right">Your price</TableHead>
                          <TableHead className="text-right">Added</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell>{i.label || "—"}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{i.product_id}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {i.own_price == null ? "—" : `$${i.own_price.toFixed(2)}`}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs">
                              {new Date(i.added_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                onClick={() => removeItem(i.id)}
                                className="text-rose-400/70 hover:text-rose-400"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
