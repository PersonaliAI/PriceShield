"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
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
import { api, DashboardSummary, InvoiceRow, PriceTrendPoint } from "@/lib/api";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;

      const [summaryData, vendorsData, invoicesData] = await Promise.all([
        api.getDashboardSummary(token),
        api.getVendors(token),
        api.getInvoices(token),
      ]);

      setSummary(summaryData);
      setVendors(vendorsData.vendors);
      setInvoices(invoicesData.rows);

      // Auto-select first item for trend chart
      if (invoicesData.rows.length > 0) {
        const firstRow = invoicesData.rows[0];
        setTrendItem(firstRow.item_name);
        setTrendVendor(firstRow.vendor_name);
        try {
          const trends = await api.getPriceTrends(token, firstRow.vendor_name, firstRow.item_name);
          setTrendData(trends.data);
        } catch {
          // Trend data is optional
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Filter invoices by vendor
  const handleVendorFilter = useCallback(
    async (vendor: string) => {
      setSelectedVendor(vendor);
      const token = await getToken();
      if (!token) return;
      try {
        const data = await api.getInvoices(
          token,
          vendor === "All Vendors" ? undefined : vendor
        );
        setInvoices(data.rows);
      } catch {
        // Keep existing data
      }
    },
    [getToken]
  );

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
      value: vendors.length.toString(),
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <TrendingUp className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-lg font-medium">No invoice data yet</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Upload your first invoices via the onboarding flow to start seeing price trends and analytics.
            </p>
            <a href="/onboarding">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-background font-semibold">
                Upload Invoices
              </Button>
            </a>
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
                      <stop offset="5%" stopColor="oklch(0.696 0.17 162.48)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.696 0.17 162.48)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.01 260)" />
                  <XAxis dataKey="date" stroke="oklch(0.5 0 0)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.5 0 0)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.008 260)",
                      border: "1px solid oklch(0.26 0.01 260)",
                      borderRadius: "0.5rem",
                      color: "oklch(0.95 0.01 260)",
                      fontSize: "0.875rem",
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Unit Price"]}
                  />
                  <Area type="monotone" dataKey="unit_price" stroke="oklch(0.696 0.17 162.48)" strokeWidth={2} fill="url(#priceGradient)" />
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
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
