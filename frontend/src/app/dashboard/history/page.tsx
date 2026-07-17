"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { ChevronDown, ChevronRight, Download, Loader2, RefreshCw, Search, History as HistoryIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
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
import { useAuth } from "@/lib/auth-context";
import { api, InvoiceHistoryRow } from "@/lib/api";

const LIMIT = 25;

export default function InvoiceHistoryPage() {
  const { getToken } = useAuth();

  const [rows, setRows] = useState<InvoiceHistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedVendor, setSelectedVendor] = useState("All Vendors");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = {
    vendor: selectedVendor,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: debouncedSearch || undefined,
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    setOffset(0);
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const [historyData, vendorsData] = await Promise.all([
        api.getInvoiceHistory(token, filters, LIMIT, 0),
        api.getVendors(token),
      ]);
      setRows(historyData.rows);
      setTotal(historyData.total);
      setVendors(vendorsData.vendors);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load invoice history";
      setError(msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, selectedVendor, startDate, endDate, debouncedSearch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const newOffset = offset + LIMIT;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getInvoiceHistory(token, filters, LIMIT, newOffset);
      if (data.rows.length > 0) {
        setRows((prev) => [...prev, ...data.rows]);
        setOffset(newOffset);
      }
    } catch {
      // Fail silently, keep existing rows
    } finally {
      setLoadingMore(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.exportInvoiceHistory(token, filters);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setError(msg);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Extraction History</h1>
          <p className="text-muted-foreground mt-1">Every invoice PriceShield has extracted, in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            <RefreshCw className="mr-2 h-3 w-3" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold shadow-lg shadow-emerald-500/20"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <Download className="mr-2 h-3 w-3" />
            )}
            Export to Excel
          </Button>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="space-y-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <HistoryIcon className="h-4 w-4 text-emerald-400" />
            {total} Extracted Invoice{total === 1 ? "" : "s"}
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice #, vendor, item..."
              className="pl-8 h-9 w-full"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" className="w-full" />
            <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" className="w-full" />
            <Select value={selectedVendor} onValueChange={(val) => val && setSelectedVendor(val)}>
              <SelectTrigger className="w-full h-9 col-span-2 sm:col-span-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Vendors">All Vendors</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-muted-foreground">Loading invoice history…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchHistory}>
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
              <HistoryIcon className="h-12 w-12 text-muted-foreground/20" />
              <p className="text-lg font-semibold text-foreground">No invoices found</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Try adjusting your filters, or forward a supplier invoice to start building history.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead>Extracted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const isExpanded = expandedIds.has(row.id);
                    return (
                      <Fragment key={row.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() => toggleExpanded(row.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{row.invoice_date}</TableCell>
                          <TableCell className="font-medium">{row.vendor_name}</TableCell>
                          <TableCell>{row.invoice_number || "—"}</TableCell>
                          <TableCell className="text-right">{row.item_count}</TableCell>
                          <TableCell className="text-right">
                            {row.subtotal != null ? `${row.currency} ${row.subtotal.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.tax_total != null ? `${row.currency} ${row.tax_total.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.grand_total != null ? `${row.currency} ${row.grand_total.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={9} className="bg-muted/10 p-0">
                              {row.items.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 px-8">
                                  No line items recorded for this invoice.
                                </p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-b-border/50">
                                      <TableHead className="pl-8">Item</TableHead>
                                      <TableHead>SKU</TableHead>
                                      <TableHead className="text-right">Qty</TableHead>
                                      <TableHead>UoM</TableHead>
                                      <TableHead className="text-right">Unit Price</TableHead>
                                      <TableHead className="text-right pr-8">Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {row.items.map((item, idx) => (
                                      <TableRow key={idx} className="hover:bg-transparent border-b-border/30">
                                        <TableCell className="pl-8 font-medium">{item.item_name}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.sku || "—"}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.unit_of_measure || "—"}</TableCell>
                                        <TableCell className="text-right">
                                          {row.currency} {item.unit_price.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                          {item.total_price != null ? `${row.currency} ${item.total_price.toFixed(2)}` : "—"}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>

              {rows.length < total && (
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
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
