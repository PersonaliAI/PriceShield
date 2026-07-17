"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Building2,
  RefreshCw,
  MessageSquare,
  Mail,
  Search,
  Loader2,
  Shield,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useAuth } from "@/lib/auth-context";
import { api, DashboardSummary, InvoiceRow, PriceTrendPoint, UserSettings } from "@/lib/api";
export default function DashboardPage() {
  const { getToken } = useAuth();

  // State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);


  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [trendData, setTrendData] = useState<PriceTrendPoint[]>([]);
  const [selectedVendor, setSelectedVendor] = useState("All Vendors");
  const [trendItem, setTrendItem] = useState<string>("");
  const [trendVendor, setTrendVendor] = useState<string>("");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  // AI CFO Chat State
  const [cfoQuestion, setCfoQuestion] = useState("");
  const [cfoAnswer, setCfoAnswer] = useState<string | null>(null);
  const [isAskingCFO, setIsAskingCFO] = useState(false);

  const [inboxCount, setInboxCount] = useState(0);
  const [inboxLoading, setInboxLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setInboxLoading(true);
    setError("");
    setOffset(0);
    try {
      const token = await getToken();
      if (!token) {
        // No session — turn off the loading state so the page doesn't spin forever.
        // Middleware will redirect unauthenticated users to /login anyway.
        setLoading(false);
        setInboxLoading(false);
        return;
      }

      const [summaryData, vendorsData, invoicesData, inboxData, s] = await Promise.all([
        api.getDashboardSummary(token),
        api.getVendors(token),
        api.getInvoices(token, selectedVendor === "All Vendors" ? undefined : selectedVendor, LIMIT, 0),
        api.getInboxMessages(token),
        api.getSettings(token),
      ]);

      setSummary(summaryData);
      setVendors(vendorsData.vendors);
      setInvoices(invoicesData.rows);
      setInboxCount(inboxData.length);
      setSettings(s);
      setInboxLoading(false);
      // Show the dashboard immediately — don't block the spinner on the optional trend chart.
      setLoading(false);

      // Auto-select first item for the trend chart (loads in the background, non-blocking).
      if (invoicesData.rows.length > 0) {
        const firstRow = invoicesData.rows[0];
        setTrendItem(firstRow.item_name);
        setTrendVendor(firstRow.vendor_name);
        api
          .getPriceTrends(token, firstRow.vendor_name, firstRow.item_name)
          .then((trends) => setTrendData(trends.data))
          .catch(() => {
            // Trend data is optional
          });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(msg);
      setLoading(false);
    }
  }, [getToken, selectedVendor]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Filter invoices by vendor
  const handleVendorFilter = useCallback(
    async (vendor: string) => {
      setSelectedVendor(vendor);
      setLoading(true);
      setOffset(0);
      const token = await getToken();
      if (!token) return;
      try {
        const data = await api.getInvoices(
          token,
          vendor === "All Vendors" ? undefined : vendor,
          LIMIT,
          0
        );
        setInvoices(data.rows);
      } catch {
        // Keep existing data
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const newOffset = offset + LIMIT;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getInvoices(
        token,
        selectedVendor === "All Vendors" ? undefined : selectedVendor,
        LIMIT,
        newOffset
      );
      if (data.rows.length > 0) {
        setInvoices((prev) => [...prev, ...data.rows]);
        setOffset(newOffset);
      }
    } catch {
      // Fail silently
    } finally {
      setLoadingMore(false);
    }
  };

  // Load trend for a specific item
  const handleTrendSelect = useCallback(
    async (vendorName: string, itemName: string) => {
      const token = await getToken();
      if (!token) return;
      setTrendVendor(vendorName);
      setTrendItem(itemName);
      try {
        const trends = await api.getPriceTrends(token, vendorName, itemName);
        setTrendData(trends.data);
      } catch {
        // Keep existing data
      }
    },
    [getToken]
  );

  const handleAskCFO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfoQuestion.trim() || isAskingCFO) return;

    setIsAskingCFO(true);
    setCfoAnswer(null);
    try {
      const token = await getToken();
      if (!token) return;

      // /api/ai-cfo/ask streams Server-Sent Events — read the stream and keep the final answer.
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE}/api/ai-cfo/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ question: cfoQuestion }),
      });
      if (!response.ok) throw new Error(response.statusText);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let finalAnswer = "";
      let streamError = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          if (!part.trim()) continue;
          let eventName = "";
          let dataContent = "";
          for (const line of part.split("\n")) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataContent = line.slice(5).trim();
          }
          if (!eventName || !dataContent) continue;
          let parsed: unknown;
          try {
            parsed = JSON.parse(dataContent);
          } catch {
            continue;
          }
          if (eventName === "answer") finalAnswer = String(parsed);
          else if (eventName === "error") {
            streamError = typeof parsed === "string" ? parsed : "AI CFO error";
          }
        }
      }

      if (finalAnswer) setCfoAnswer(finalAnswer);
      else setCfoAnswer(streamError ? `⚠️ ${streamError}` : "Sorry, I couldn't process your request right now.");
    } catch {
      setCfoAnswer("Sorry, I couldn't process your request right now.");
    } finally {
      setIsAskingCFO(false);
    }
  };

  const kpis = [
    {
      label: "Total Margin Lost",
      value: summary ? `$${summary.total_margin_lost.toLocaleString()}` : "-",
      icon: DollarSign,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      label: "Price Hikes Caught",
      value: summary?.hikes_caught?.toString() ?? "-",
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Top Offending Vendor",
      value: summary?.top_offending_vendor ?? "-",
      icon: Building2,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: "Vendors Tracked",
      value: summary?.vendors_tracked?.toString() ?? vendors.length.toString(),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchDashboard}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const hasData = invoices.length > 0;



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your supplier pricing in real-time</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="mr-2 h-3 w-3" /> Refresh
        </Button>
      </div>
      
      {/* AI CFO Bar */}
      <Card id="tour-cfo-bar" className={`bg-emerald-500/5 border-emerald-500/20 overflow-hidden relative ${settings?.tier === "free" ? "opacity-75" : ""}`}>
        {settings?.tier === "free" && (
          <div className="absolute inset-0 z-10 bg-background/40 backdrop-blur-[1px] flex items-center justify-center p-4">
            <div className="bg-background/90 border border-border px-4 py-2 rounded-xl shadow-xl flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-medium">AI CFO Chat is a Pro feature. <a href="/dashboard/billing" className="text-emerald-400 hover:underline">Upgrade to unlock</a></p>
            </div>
          </div>
        )}
        <CardContent className="p-0">
          <form onSubmit={handleAskCFO} className="flex items-center p-2 gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
              <input
                type="text"
                value={cfoQuestion}
                onChange={(e) => setCfoQuestion(e.target.value)}
                disabled={settings?.tier === "free"}
                placeholder="Ask your AI CFO: 'What's my biggest price hike?' or 'Compare supplier prices...'"
                className="w-full bg-background/50 border-0 focus:ring-0 pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground/60 rounded-xl"
              />
            </div>
            <Button 
              type="submit"
              disabled={isAskingCFO || !cfoQuestion.trim() || settings?.tier === "free"}
              className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold px-6 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              {isAskingCFO ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              {isAskingCFO ? "Analyzing..." : "Ask AI CFO"}
            </Button>
          </form>
          {cfoAnswer && (
            <div className="px-6 py-4 bg-background/30 border-t border-emerald-500/10 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-background" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">AI CFO Analysis</p>
                  <div className="text-sm leading-relaxed text-muted-foreground prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        b: ({...props}) => <b className="font-bold text-emerald-400" {...props} />,
                        strong: ({...props}) => <strong className="font-bold text-emerald-400" {...props} />,
                        p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      }}
                    >
                      {cfoAnswer}
                    </ReactMarkdown>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCfoAnswer(null)}
                    className="text-xs h-7 px-2 hover:bg-emerald-500/10 hover:text-emerald-400"
                  >
                    Clear Chat
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div id="tour-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-card/50 border-border/50 hover:border-border transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!hasData && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-6 text-center px-6">
            {!inboxLoading && inboxCount > 0 ? (
              <>
                <div className="relative">
                  <Mail className="h-16 w-16 text-emerald-400/50" />
                  <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-background animate-bounce">
                    {inboxCount}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold text-foreground">Invoices Received!</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    We see {inboxCount} forwarded email{inboxCount > 1 ? 's' : ''} in your inbox. 
                    Our AI is currently extracting the line items. Check back in a few minutes!
                  </p>
                </div>
                <Button onClick={fetchDashboard} variant="outline" className="h-11">
                  <RefreshCw className="mr-2 h-4 w-4" /> Check Status
                </Button>
              </>
            ) : (
              <>
                <TrendingUp className="h-16 w-16 text-muted-foreground/20" />
                <div className="space-y-2">
                  <p className="text-xl font-bold text-foreground">Awaiting Your First Invoice</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Forward your first supplier invoice to your unique address in <a href="/dashboard/settings" className="text-emerald-400 underline">Settings</a> to start protecting your margins.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="/dashboard/settings">
                    <Button className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold px-8 h-11 w-full sm:w-auto shadow-lg shadow-emerald-500/20">
                      Configure Forwarding
                    </Button>
                  </a>
                  <Button variant="outline" onClick={fetchDashboard} className="h-11">
                    <RefreshCw className="mr-2 h-4 w-4" /> I already forwarded
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Price Trend Chart */}
      {hasData && trendData.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Price Trend — {trendItem}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{trendVendor}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                      color: "var(--foreground)",
                      fontSize: "0.875rem",
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Unit Price"]}
                  />
                  <Area type="monotone" dataKey="unit_price" stroke="var(--primary)" strokeWidth={2} fill="url(#priceGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Table */}
      {hasData && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
            <Select value={selectedVendor} onValueChange={(val) => val && handleVendorFilter(val)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Vendors">All Vendors</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((row, i) => (
                  <TableRow
                    key={`${row.invoice_date}-${row.item_name}-${i}`}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => handleTrendSelect(row.vendor_name, row.item_name)}
                  >
                    <TableCell className="text-muted-foreground">{row.invoice_date}</TableCell>
                    <TableCell className="font-medium">{row.vendor_name}</TableCell>
                    <TableCell>
                      <div>
                        {row.item_name}
                        {row.sku && (
                          <span className="ml-2 text-xs text-muted-foreground">{row.sku}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${row.unit_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
                    <TableCell className="text-right">${row.total_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {row.variance_pct > 2 ? (
                        <Badge variant="secondary" className="bg-rose-500/10 text-rose-400 border-0">
                          +{row.variance_pct}%
                        </Badge>
                      ) : row.variance_pct < 0 ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-0">
                          {row.variance_pct}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">{row.variance_pct}%</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {invoices.length >= LIMIT && (
              <div className="flex justify-center pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLoadMore} 
                  disabled={loadingMore}
                  className="h-9 px-6 bg-muted/20 border-border/50 hover:bg-muted/30 transition-all font-medium"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    "Load More Invoices"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
