import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  FileCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Automated Invoice Audit Software for Restaurants | PriceShield",
  description:
    "Audit supplier invoices in 5 seconds. PriceShield uses AI to perform invoice audits, flag errors, and stop hidden food cost inflation automatically.",
  alternates: {
    canonical: "https://trypriceshield.com/solutions/invoice-audit",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trypriceshield.com/solutions/invoice-audit/#webpage",
      "url": "https://trypriceshield.com/solutions/invoice-audit",
      "name": "Automated Invoice Audit Software - PriceShield",
      "description": "Perform automated invoice audits on food and restaurant purveyors.",
      "publisher": { "@id": "https://trypriceshield.com/#organization" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://trypriceshield.com/solutions/invoice-audit/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does an automated invoice audit save money?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Automated invoice auditing checks every line item against your negotiated price list or last week's invoice. It catches billing errors, delivery surcharges, and stealth pricing hikes that manual auditing misses.",
          },
        },
        {
          "@type": "Question",
          "name": "Does PriceShield read handwritten or photographed invoices?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. PriceShield's advanced AI engine extracts data from high-quality typed distributor PDFs at 97%+ accuracy and photographed paper invoices at ~93% accuracy. Any ambiguous data is flagged for your final approval.",
          },
        },
      ],
    },
  ],
};

export default function InvoiceAuditPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-black text-foreground pt-24 pb-16">
        {/* Glow Elements */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6">
          {/* Breadcrumb */}
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
                <span className="text-foreground font-medium">Invoice Audit</span>
              </li>
            </ol>
          </nav>

          {/* Hero Section */}
          <div className="text-center md:text-left md:flex md:items-center md:gap-12 py-8 md:py-16">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                <span>Automated Invoice Audit</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                Run an Invoice Audit <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
                  In just 5 seconds.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Toss paper and manual data entry. PriceShield automatically extracts line items, compares prices against baseline costs, and flags purveyor invoice errors instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center md:justify-start">
                <Button
                  size="lg"
                  className="cursor-pointer font-semibold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white"
                  render={<Link href="/login" />}
                >
                  Upload Your First Invoice
                  <ArrowRight className="size-4 ml-2" />
                </Button>
                <Link
                  href="/#products"
                  className="inline-flex items-center justify-center text-sm font-semibold hover:text-white transition-colors py-3"
                >
                  Watch Video Demo
                </Link>
              </div>
            </div>

            {/* Interactive Live Audit Mockup Panel */}
            <div className="flex-1 mt-12 md:mt-0">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
                <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-2xl">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Invoice Audit Analysis</h2>
                      <p className="text-xs text-muted-foreground">Invoice #SYS-90812 · GFS Foodservice</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase font-bold tracking-wide">
                      1 Issue Found
                    </span>
                  </div>

                  {/* Mockup Audit Analysis */}
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-black/40 border border-rose-500/30 flex items-start gap-3">
                      <AlertTriangle className="size-4 text-rose-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">Price Creep: Heavy Whipping Cream</span>
                          <span className="text-xs font-mono font-semibold text-rose-400">+$24.00</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Price rose from $32.00 to $56.00 (Case of 12). Limit threshold was 3.0%.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-black/40 border border-emerald-500/20 flex items-start gap-3">
                      <CheckCircle2 className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">USDA Prime Ribeye (Case)</span>
                          <span className="text-xs font-mono font-semibold text-emerald-400">OK</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Price stable at $340.00. Match confidence: 99.8%.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-black/40 border border-emerald-500/20 flex items-start gap-3">
                      <CheckCircle2 className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">Unbleached Flour 50lb</span>
                          <span className="text-xs font-mono font-semibold text-emerald-400">OK</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Matched via Semantic SKU matching with "GFS Flour 50#". Price stable.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Block */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-white">Total Audit Result:</span>
                    <span className="text-rose-400 font-semibold font-mono">1 anomaly flagged</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Steps Section */}
          <section className="py-16 border-t border-border/60">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                How PriceShield runs automated invoice audits
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Say goodbye to manually reviewing every line item. Get it done in 3 simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative p-6 rounded-xl border border-border bg-card">
                <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4 border border-emerald-500/20">
                  1
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Forward Invoices</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Configure your supplier emails (Gmail, Outlook) to automatically forward receipt invoices to your custom `@trypriceshield.com` mailbox.
                </p>
              </div>

              <div className="relative p-6 rounded-xl border border-border bg-card">
                <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4 border border-emerald-500/20">
                  2
                </div>
                <h3 className="text-base font-semibold text-white mb-2">AI Extraction & Audit</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  PriceShield's extraction AI parses each line item, tax, and delivery fee. It references historical baselines and contracts.
                </p>
              </div>

              <div className="relative p-6 rounded-xl border border-border bg-card">
                <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4 border border-emerald-500/20">
                  3
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Instant Alert Notification</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Receive alerts containing the exact overcharge detail on your phone or computer. File claims with distributors backed by hard data.
                </p>
              </div>
            </div>
          </section>

          {/* Why Audit Invoices? */}
          <section className="py-12 border-t border-border/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Why restaurant invoice audits fail when done manually
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Reviewing supplier pricing manually is incredibly tedious. A typical food delivery contains 30 to 80 line items. Prices change on a weekly basis, and purveyors often use different SKU names.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span>AI matches names across product line renames automatically.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span>Catches delivery fee and packaging cost spikes.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span>Audits require zero manual data transcription or typing.</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-gradient-to-b from-card to-card/20 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white">Manual vs. Automated Invoice Audits</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-xs text-muted-foreground">Audit time per invoice</span>
                    <span className="text-xs font-semibold text-rose-400">15 min (Manual) vs 5s (PriceShield)</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-xs text-muted-foreground">SKU matching accuracy</span>
                    <span className="text-xs font-semibold text-white">Highly prone to human error vs 97% AI</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-xs text-muted-foreground">Detection capability</span>
                    <span className="text-xs font-semibold text-emerald-400">Flags every 1% drift instantly</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-12 border-t border-border/60 text-center">
            <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-emerald-500/5 p-8 max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Perform your first invoice audit free
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                No credit card required. Upload up to 5 supplier invoices and discover what overcharges are already slipping by.
              </p>
              <Button
                size="lg"
                className="font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white"
                render={<Link href="/login" />}
              >
                Get Started with Free Audit
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
