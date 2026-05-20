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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Search, ShoppingBag, Trash2, TrendingDown, TrendingUp } from "lucide-react";
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
  product_title: string | null;
  product_brand: string | null;
  product_image_url: string | null;
}
interface ProductResult {
  id: string;
  canonical_title: string;
  brand: string | null;
  image_url: string | null;
  observation_count: number;
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
  const [newProductTitle, setNewProductTitle] = useState("");
  const [newProductImage, setNewProductImage] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newOwnPrice, setNewOwnPrice] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  // product search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q || q.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await authedFetch<ProductResult[]>(`/shopper/products/search?q=${encodeURIComponent(q.trim())}&limit=8`);
        setSearchResults(res);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
  }, [authedFetch]);

  function selectProduct(p: ProductResult) {
    setNewProductId(p.id);
    setNewProductTitle(p.canonical_title);
    setNewProductImage(p.image_url);
    setSearchQuery(p.canonical_title);
    setSearchResults([]);
  }

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
                    Search for any product already in the PriceShield catalog by name, or
                    use the extension on the product page to add it first.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={addItem} className="space-y-3 max-w-2xl">
                    {/* Product search */}
                    <div className="space-y-1">
                      <Label htmlFor="product-search">Search product</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <input
                          id="product-search"
                          autoComplete="off"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          placeholder="Type a product name…"
                          className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />}
                      </div>
                      {searchResults.length > 0 && (
                        <ul className="mt-1 border border-border rounded-md bg-card shadow-md divide-y divide-border overflow-hidden">
                          {searchResults.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => selectProduct(p)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                              >
                                {p.image_url
                                  ? <img src={p.image_url} alt="" className="size-9 rounded object-cover shrink-0 border border-border" />
                                  : <div className="size-9 rounded bg-muted flex items-center justify-center shrink-0"><ShoppingBag className="size-4 text-muted-foreground" /></div>
                                }
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{p.canonical_title}</p>
                                  {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {newProductTitle && (
                        <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                          {newProductImage
                            ? <img src={newProductImage} alt="" className="size-8 rounded object-cover border border-border shrink-0" />
                            : <ShoppingBag className="size-5 text-muted-foreground shrink-0" />
                          }
                          <p className="text-xs font-medium truncate text-emerald-400">{newProductTitle}</p>
                          <button type="button" onClick={() => { setNewProductId(""); setNewProductTitle(""); setSearchQuery(""); setNewProductImage(null); }} className="ml-auto text-xs text-muted-foreground hover:text-foreground">✕</button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="label">Your label (optional)</Label>
                        <Input id="label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="SKU 142-A" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="own-price">Your price ($)</Label>
                        <Input id="own-price" type="number" step="0.01" min="0" value={newOwnPrice} onChange={(e) => setNewOwnPrice(e.target.value)} placeholder="249.99" />
                      </div>
                    </div>
                    <Button type="submit" disabled={addingItem || !newProductId} className="w-fit">
                      {addingItem && <Loader2 className="size-3.5 animate-spin mr-2" />}
                      <Plus className="size-3.5 mr-1" /> Track product
                    </Button>
                  </form>

                  {items.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead className="text-right">Your price</TableHead>
                          <TableHead className="text-right">Added</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-0">
                                {i.product_image_url
                                  ? <img src={i.product_image_url} alt="" className="size-8 rounded object-cover border border-border shrink-0" />
                                  : <div className="size-8 rounded bg-muted flex items-center justify-center shrink-0"><ShoppingBag className="size-3.5 text-muted-foreground" /></div>
                                }
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate max-w-[200px]">{i.product_title || "Unknown product"}</p>
                                  {i.product_brand && <p className="text-xs text-muted-foreground">{i.product_brand}</p>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{i.label || "—"}</TableCell>
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
