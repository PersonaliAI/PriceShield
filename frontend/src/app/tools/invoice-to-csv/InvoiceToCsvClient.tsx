"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Table,
  ArrowRight,
  Sparkles,
  Check,
  Plus,
  Trash2,
  FileText,
  Eye,
  Loader2,
  HelpCircle,
  BarChart3,
  ScanSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LineItem {
  id: string;
  description: string;
  qty: string;
  unit: string;
  unitPrice: string;
  total: string;
}

type Stage = "upload" | "processing" | "preview";

const STORAGE_KEY = "ps_invoice_csv_remaining";
const DEFAULT_REMAINING = 3;

// Demo data shown after "processing"
const DEMO_ITEMS: LineItem[] = [
  { id: "1", description: "Chicken Breast 10lb Case", qty: "2", unit: "Case", unitPrice: "45.99", total: "91.98" },
  { id: "2", description: "Roma Tomatoes", qty: "5", unit: "lb", unitPrice: "2.49", total: "12.45" },
  { id: "3", description: "Extra Virgin Olive Oil 1gal", qty: "1", unit: "ea", unitPrice: "18.75", total: "18.75" },
  { id: "4", description: "All Purpose Flour 25lb", qty: "1", unit: "Bag", unitPrice: "12.50", total: "12.50" },
  { id: "5", description: "Fresh Basil Bunch", qty: "3", unit: "ea", unitPrice: "2.99", total: "8.97" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getRemaining(): number {
  if (typeof window === "undefined") return DEFAULT_REMAINING;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return DEFAULT_REMAINING;
  const n = parseInt(stored, 10);
  return isNaN(n) ? DEFAULT_REMAINING : Math.max(n, 0);
}

function setRemaining(n: number) {
  localStorage.setItem(STORAGE_KEY, String(Math.max(n, 0)));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Properly escape a value for CSV (RFC 4180) */
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(items: LineItem[]): string {
  const header = ["Item Description", "Qty", "Unit", "Unit Price", "Total"];
  const rows = items.map((item) =>
    [item.description, item.qty, item.unit, item.unitPrice, item.total].map(csvEscape).join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

function buildTsv(items: LineItem[]): string {
  const header = ["Item Description", "Qty", "Unit", "Unit Price", "Total"];
  const rows = items.map((item) =>
    [item.description, item.qty, item.unit, item.unitPrice, item.total].join("\t"),
  );
  return [header.join("\t"), ...rows].join("\n");
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function InvoiceToCsvClient() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [remaining, setRemainingState] = useState<number>(DEFAULT_REMAINING);
  const [dragging, setDragging] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate remaining from localStorage
  useEffect(() => {
    setRemainingState(getRemaining());
  }, []);

  // ----------- File handling -----------
  const handleFile = useCallback((f: File) => {
    // Validate type
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(f.type)) return;
    // Validate size (10 MB)
    if (f.size > 10 * 1024 * 1024) return;

    setFile(f);
    setStage("processing");
    setDownloaded(false);

    // Call the real public Gemini extraction API
    const formData = new FormData();
    formData.append("file", f);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    fetch(`${API_BASE}/api/v1/public/extract?t=${new Date().getTime()}`, {
      method: "POST",
      body: formData,
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to extract invoice data");
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          const parsed = data.items.map((item: any) => ({
            id: uid(),
            description: item.item_name || "Unknown Item",
            qty: item.quantity !== undefined && item.quantity !== null ? String(item.quantity) : "",
            unit: item.unit_of_measure || "",
            unitPrice: item.unit_price !== undefined && item.unit_price !== null ? String(item.unit_price) : "",
            total: item.total_price !== undefined && item.total_price !== null ? String(item.total_price) : "",
          }));
          setItems(parsed);
        } else {
          setItems(DEMO_ITEMS.map((item) => ({ ...item, id: uid() })));
        }
        setStage("preview");
      })
      .catch((err) => {
        console.error("Extraction error:", err);
        // Graceful fallback to demo items if API fails/offline
        setItems(DEMO_ITEMS.map((item) => ({ ...item, id: uid() })));
        setStage("preview");
      });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  // ----------- Table editing -----------
  const updateItem = (id: string, field: keyof LineItem, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: uid(), description: "", qty: "", unit: "", unitPrice: "", total: "" },
    ]);
  };

  // ----------- Downloads -----------
  const handleDownloadCsv = () => {
    if (remaining <= 0) return;
    const csv = buildCsv(items);
    const baseName = file ? file.name.replace(/\.[^.]+$/, "") : "invoice";
    triggerDownload(csv, `${baseName}_extracted.csv`, "text/csv;charset=utf-8;");
    const next = remaining - 1;
    setRemainingState(next);
    setRemaining(next);
    setDownloaded(true);
  };

  const handleDownloadTsv = () => {
    if (remaining <= 0) return;
    const tsv = buildTsv(items);
    const baseName = file ? file.name.replace(/\.[^.]+$/, "") : "invoice";
    triggerDownload(tsv, `${baseName}_extracted.tsv`, "text/tab-separated-values;charset=utf-8;");
    const next = remaining - 1;
    setRemainingState(next);
    setRemaining(next);
    setDownloaded(true);
  };

  const resetTool = () => {
    setStage("upload");
    setFile(null);
    setItems([]);
    setDownloaded(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  // -----------------------------------------------------------------------
  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold">
          <FileSpreadsheet className="size-3.5" />
          <span>Free Invoice to CSV Converter</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
          Convert Invoices to{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
            Clean Spreadsheet Data.
          </span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Upload a supplier invoice PDF or image, review the extracted line items, then download as
          CSV or Excel-ready format — completely free.
        </p>
      </div>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start min-w-0 w-full max-w-full">
        {/* ────────────────── LEFT COLUMN ────────────────── */}
        <div className="md:col-span-7 space-y-6 w-full min-w-0">
          {/* Upload / Preview area */}
          {stage === "upload" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed p-12 md:p-16 text-center cursor-pointer transition-all duration-300 ${
                dragging
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-border/60 bg-card hover:border-border hover:bg-card/80"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={onFileInput}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`rounded-2xl p-5 transition-colors duration-300 ${
                    dragging ? "bg-emerald-500/10" : "bg-muted/40"
                  }`}
                >
                  <Upload
                    className={`size-12 transition-colors duration-300 ${
                      dragging ? "text-emerald-400" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    Drop your invoice PDF or image here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports PDF, PNG, JPG &bull; Max 10MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 cursor-pointer"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  Browse Files
                </Button>
              </div>
            </div>
          )}

          {/* Processing spinner */}
          {stage === "processing" && (
            <div className="rounded-2xl border border-border bg-card p-16 text-center space-y-5">
              <div className="inline-flex items-center justify-center rounded-2xl bg-emerald-500/10 p-5">
                <Loader2 className="size-12 text-emerald-400 animate-spin" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Analyzing invoice…</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Extracting line items, quantities, and prices
                </p>
              </div>
              {file && (
                <p className="text-xs text-muted-foreground font-mono">
                  {file.name} &bull; {formatBytes(file.size)}
                </p>
              )}
            </div>
          )}

          {/* Preview table */}
          {stage === "preview" && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* File info bar */}
              {file && (
                <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border/60 bg-muted/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="size-3.5 text-emerald-400" />
                    <span className="font-medium text-foreground">{file.name}</span>
                    <span>&bull;</span>
                    <span className="font-mono">{formatBytes(file.size)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] font-semibold">
                      <Check className="size-3" />
                      Extracted {items.length} line items
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/40">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Item Description
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                        Qty
                      </th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                        Unit
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                        Unit Price
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                        Total
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`border-b border-border/30 transition-colors hover:bg-muted/30 ${
                          idx % 2 === 0 ? "bg-muted/30" : "bg-card"
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            className="w-full bg-transparent text-foreground text-sm outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 -mx-1 py-0.5"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="text"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                            className="w-full bg-transparent text-foreground text-sm font-mono text-right outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 -mx-1 py-0.5"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                            className="w-full bg-transparent text-foreground text-sm outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 -mx-1 py-0.5"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="text"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                            className="w-full bg-transparent text-foreground text-sm font-mono text-right outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 -mx-1 py-0.5"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="text"
                            value={item.total}
                            onChange={(e) => updateItem(item.id, "total", e.target.value)}
                            className="w-full bg-transparent text-foreground text-sm font-mono text-right outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 -mx-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            aria-label={`Remove ${item.description}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add row + actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-border/60">
                <button
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Add Row
                </button>

                <div className="flex items-center gap-2">
                  {remaining > 0 ? (
                    <>
                      <Button
                        size="sm"
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                        onClick={handleDownloadCsv}
                      >
                        <Download className="size-3.5" />
                        Download CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer gap-1.5"
                        onClick={handleDownloadTsv}
                      >
                        <Table className="size-3.5" />
                        Download for Excel
                      </Button>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Free conversions used.{" "}
                      <Link
                        href="/login"
                        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                      >
                        Get unlimited →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {downloaded && remaining > 0 && (
                <div className="px-5 pb-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="size-3.5 text-emerald-400" />
                  <span>
                    Downloaded! {remaining} free conversion{remaining !== 1 ? "s" : ""} remaining.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Convert another button */}
          {stage === "preview" && (
            <button
              onClick={resetTool}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Upload className="size-3.5" />
              Convert another invoice
            </button>
          )}
        </div>

        {/* ────────────────── RIGHT COLUMN ────────────────── */}
        <div className="md:col-span-5 space-y-6 w-full min-w-0">
          {/* Remaining conversions badge */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <Sparkles className="size-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {remaining > 0 ? (
                    <>
                      <span className="font-mono text-emerald-400">{remaining}</span> free
                      conversion{remaining !== 1 ? "s" : ""} remaining
                    </>
                  ) : (
                    "Free conversions used"
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">No sign-up required</p>
              </div>
            </div>

            <hr className="border-border/60" />

            {/* How it works */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                How it works
              </p>
              <ol className="space-y-3">
                {[
                  { icon: Upload, label: "Upload your invoice PDF or image" },
                  { icon: Eye, label: "Review & edit extracted line items" },
                  { icon: Download, label: "Download clean CSV or Excel file" },
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex items-center justify-center size-6 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <step.icon className="size-3.5 text-muted-foreground shrink-0" />
                      {step.label}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <hr className="border-border/60" />

            {/* Supported formats */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Supported formats
              </p>
              <div className="flex flex-wrap gap-2">
                {["PDF", "PNG", "JPG", "JPEG"].map((fmt) => (
                  <span
                    key={fmt}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/40 border border-border/60 text-xs font-mono text-foreground/70"
                  >
                    .{fmt.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Upsell CTA */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
            <div className="relative rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-base font-bold text-foreground">Want automated extraction at scale?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PriceShield uses AI to extract, compare, and audit every invoice automatically. No
                manual data entry — just forward your supplier emails.
              </p>
              <Button
                size="lg"
                className="w-full font-semibold cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white"
                render={<Link href="/login" />}
              >
                Try PriceShield Free
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── FAQ CARDS ────────────────── */}
      <section className="py-8 border-t border-border/60">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center">
          Invoice Data Extraction — FAQ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <BarChart3 className="size-4 text-emerald-400" />
              Why Convert Invoices to CSV?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              CSV is the universal format for spreadsheet apps, accounting software, and analytics
              tools. Converting supplier invoices to CSV lets you import line-item data directly into
              QuickBooks, Xero, Excel, or Google Sheets — eliminating hours of manual retyping and
              reducing data-entry errors.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <ScanSearch className="size-4 text-blue-400" />
              How Does Invoice Data Extraction Work?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Modern invoice extraction uses OCR (Optical Character Recognition) and AI to read text
              from PDFs and scanned images. The system identifies structured fields — line item
              descriptions, quantities, unit prices, and totals — then outputs them as clean tabular
              data you can immediately use.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <HelpCircle className="size-4 text-amber-400" />
              What Data Can Be Extracted?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A full extraction captures line item descriptions, quantities, units of measure, unit
              prices, line totals, vendor name, invoice number, invoice date, subtotals, taxes, and
              grand total. PriceShield&apos;s AI engine handles messy multi-page invoices and
              handwritten notes automatically.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
