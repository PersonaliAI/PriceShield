import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Cpu,
  RefreshCw,
  Table,
  Zap,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Best Invoice OCR Software & Automated Extraction | PriceShield",
  description:
    "Extract structured line items, SKUs, quantities, and unit prices from invoices automatically. High-accuracy AI OCR engine built for hospitality and AP teams.",
  alternates: {
    canonical: "https://trypriceshield.com/solutions/invoice-ocr",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trypriceshield.com/solutions/invoice-ocr/#webpage",
      "url": "https://trypriceshield.com/solutions/invoice-ocr",
      "name": "Invoice OCR Software & Automated Line Extraction - PriceShield",
      "description":
        "Extract invoice line items, prices, and taxes automatically using our AI-driven invoice OCR engine.",
      "publisher": { "@id": "https://trypriceshield.com/#organization" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://trypriceshield.com/solutions/invoice-ocr/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is invoice OCR software?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Invoice OCR (Optical Character Recognition) software is a tool that extracts text and numerical data from invoice documents (PDFs, images, scans) and converts it into structured, machine-readable formats like CSV, Excel, or JSON.",
          },
        },
        {
          "@type": "Question",
          "name": "How accurate is PriceShield's invoice OCR?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "PriceShield uses advanced AI visual models to analyze invoices. Typed supplier PDFs are processed at 97%+ accuracy, and mobile photos or paper scans achieve ~93% accuracy. Ambiguous values or low-confidence extractions are flagged for quick verification.",
          },
        },
        {
          "@type": "Question",
          "name": "How does semantic SKU matching work after OCR?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Typical OCR tools only extract raw text. PriceShield goes further by mapping extracted items semantically. For example, 'Beef Tenderloin 10lb' and 'USDA Prime Tenderloin' are recognized as the same product, letting you track price changes over time despite supplier description updates.",
          },
        },
      ],
    },
  ],
};

export default function InvoiceOcrPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-background text-foreground pt-24 pb-16 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li className="after:content-['/'] after:ml-2"></li>
              <li>
                <span className="text-muted-foreground">Solutions</span>
              </li>
              <li className="after:content-['/'] after:ml-2"></li>
              <li>
                <span className="text-foreground font-medium">Invoice OCR Software</span>
              </li>
            </ol>
          </nav>

          {/* Hero Section */}
          <div className="text-center md:text-left md:flex md:items-center md:gap-12 py-10 md:py-20">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
                  AI Invoice OCR
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 animate-pulse-glow" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-[40px] font-light tracking-wide text-foreground leading-tight">
                Not Just Invoice OCR.{" "}
                <span className="font-normal bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-300 bg-clip-text text-transparent">
                  Structured Invoice Intelligence.
                </span>
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                Standard OCR software gives you a dump of unorganized text. PriceShield reads, understands, and extracts structured line items, quantities, and prices from complex invoices with 97%+ accuracy.
              </p>
              <div className="flex items-center gap-4 pt-2 justify-center md:justify-start">
                <Button
                  size="sm"
                  className="cursor-pointer font-medium text-xs h-9 px-4 bg-foreground hover:bg-foreground/90 text-background rounded-lg transition-all"
                  render={<Link href="/login" />}
                >
                  Start OCR Extraction Free
                </Button>
                <Link
                  href="/tools/invoice-to-csv"
                  className="inline-flex items-center text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Try Free PDF to CSV Tool
                  <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </div>
            </div>

            {/* Visual Panel */}
            <div className="flex-1 mt-12 md:mt-0">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative rounded-2xl border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl p-5 shadow-2xl">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="size-4 text-emerald-400" />
                      <div>
                        <h2 className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider">AI Parsing Engine</h2>
                        <p className="text-[10px] text-zinc-500">Processing: invoice_9872.pdf</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-medium tracking-wide">
                      99.4% Confidence
                    </span>
                  </div>

                  {/* Extraction fields */}
                  <div className="space-y-3.5 font-mono text-[10px]">
                    <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                      <span className="text-zinc-500">vendor_name</span>
                      <span className="text-emerald-400">US FOODS, INC.</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                      <span className="text-zinc-500">invoice_date</span>
                      <span className="text-zinc-200">2026-06-25</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                      <span className="text-zinc-500">invoice_number</span>
                      <span className="text-zinc-200">INV-8761234-9</span>
                    </div>

                    <div className="mt-4 pt-2">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-2">Extracted Line Items:</div>
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                        <div className="flex justify-between bg-foreground/[0.02] p-2 rounded border border-foreground/[0.04]">
                          <span className="text-zinc-300 truncate max-w-[150px]">CANOLA FRY OIL 35LB</span>
                          <span className="text-zinc-400">3 x $42.50 = $127.50</span>
                        </div>
                        <div className="flex justify-between bg-foreground/[0.02] p-2 rounded border border-foreground/[0.04]">
                          <span className="text-zinc-300 truncate max-w-[150px]">WHOLE MILK H.D. GALLON</span>
                          <span className="text-zinc-400">10 x $4.10 = $41.00</span>
                        </div>
                        <div className="flex justify-between bg-foreground/[0.02] p-2 rounded border border-foreground/[0.04]">
                          <span className="text-zinc-300 truncate max-w-[150px]">USDA CHOICE TENDERLOIN</span>
                          <span className="text-zinc-400">45 lb x $14.80 = $666.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* The OCR Difference */}
          <section className="py-16 border-t border-border/60">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Why standard OCR isn't enough for invoices
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Most invoice processing software uses template-based or generic OCR that breaks the second a supplier changes their invoice layout. Here is how PriceShield is different.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-border bg-card/40 space-y-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit border border-emerald-500/20">
                  <RefreshCw className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Zero Template Setup</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No need to build coordinates or bounding boxes for different vendors. Our visual-semantic AI automatically identifies headers, columns, and rows on any invoice layout instantly.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card/40 space-y-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit border border-emerald-500/20">
                  <Table className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Tabular Accuracy</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Line items in invoices are wrapped inside multi-page tables. Standard OCR scrambles columns like quantities and prices. PriceShield extracts clean table grids, matching each unit cost to its description.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card/40 space-y-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit border border-emerald-500/20">
                  <Sparkles className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Semantic Normalization</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Suppliers constantly rename product text strings. Our engine normalizes raw OCR strings into a single SKU profile, so you can track product price drift over time.
                </p>
              </div>
            </div>
          </section>

          {/* Detailed comparison */}
          <section className="py-12 border-t border-border/60">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">
              Compare PriceShield with Traditional OCR Software
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-foreground/[0.02] border-b border-border text-muted-foreground">
                    <th className="p-4 font-semibold">Capability</th>
                    <th className="p-4 font-semibold">Traditional Invoice OCR</th>
                    <th className="p-4 font-semibold text-emerald-400">PriceShield AI Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-zinc-400">
                  <tr>
                    <td className="p-4 font-medium text-foreground">Layout Adaptability</td>
                    <td className="p-4">Breaks on column wraps or new vendor formats</td>
                    <td className="p-4 text-emerald-400">Zero templates required; handles any layout</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-foreground">Line-Item Cost Auditing</td>
                    <td className="p-4">None (text dump only)</td>
                    <td className="p-4 text-emerald-400">Compares extracted prices to past baselines automatically</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-foreground">Product Name Matching</td>
                    <td className="p-4">Requires exact string matches</td>
                    <td className="p-4 text-emerald-400">AI-driven fuzzy SKU & semantic mapping</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-foreground">Ingestion Modes</td>
                    <td className="p-4">Manual uploads only</td>
                    <td className="p-4 text-emerald-400">Upload, email auto-forwarding, or API integration</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-foreground">Workflow Integration</td>
                    <td className="p-4">CSV downloads only</td>
                    <td className="p-4 text-emerald-400">CSV, Slack/Telegram push notifications, and API hooks</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* How it works */}
          <section className="py-12 border-t border-border/60">
            <h2 className="text-2xl font-bold text-center text-foreground mb-12">
              Automate invoice data entry in three steps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="size-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                  1
                </div>
                <h3 className="text-sm font-semibold text-foreground">Upload or Forward</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drag and drop vendor PDFs or configure your mail settings to automatically forward receipts to your PriceShield routing address.
                </p>
              </div>

              <div className="space-y-3">
                <div className="size-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                  2
                </div>
                <h3 className="text-sm font-semibold text-foreground">Instant Data Parsing</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our neural OCR analyzes the layout in 5 seconds. It structures the header metadata, tax rows, shipping fees, and individual line items.
                </p>
              </div>

              <div className="space-y-3">
                <div className="size-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                  3
                </div>
                <h3 className="text-sm font-semibold text-foreground">Download or Sync</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Download clean CSV or Excel files, review audit anomalies on your dashboard, or query pricing trends directly via our AI CFO.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Banner */}
          <section className="py-12 border-t border-border/60 text-center">
            <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-emerald-500/5 p-8 max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Start extracting invoice data today
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                No credit card required. Upload up to 5 supplier invoices for free to experience the speed and accuracy of PriceShield.
              </p>
              <Button
                size="lg"
                className="font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white"
                render={<Link href="/login" />}
              >
                Start Free Invoice Audit
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
