import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Receipt,
  Layers,
  ArrowUpRight,
  Info,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Supplier Price Tracking Software for Restaurants | PriceShield",
  description:
    "Track supplier prices and stop stealth inflation in real-time. PriceShield audits every invoice line item and helps you track supplier prices automatically.",
  alternates: {
    canonical: "https://trypriceshield.com/solutions/supplier-price-tracking",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trypriceshield.com/solutions/supplier-price-tracking/#webpage",
      "url": "https://trypriceshield.com/solutions/supplier-price-tracking",
      "name": "Supplier Price Tracking Software - PriceShield",
      "description": "How to track supplier prices and secure restaurant food margins automatically.",
      "publisher": { "@id": "https://trypriceshield.com/#organization" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://trypriceshield.com/solutions/supplier-price-tracking/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Why is it important to track supplier prices for restaurants?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Restaurants operate on thin margins (usually 3-7%). Even a small, unnoticed increase of 2-5% on key ingredients like beef, butter, or oil can wipe out your profitability. Tracking supplier prices manually is time-consuming, but automation catches these hikes before they drain your cash flow.",
          },
        },
        {
          "@type": "Question",
          "name": "Can PriceShield track prices across multiple suppliers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. PriceShield extracts and matches line-item data across all of your food service distributors (such as Sysco, US Foods, GFS, and regional vendors). It normalizes unit measurements so you can compare prices on identical items instantly.",
          },
        },
      ],
    },
  ],
};

export default function SupplierPriceTrackingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-black text-foreground pt-24 pb-16">
        {/* Glow Elements */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

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
                <span className="text-foreground font-medium">Supplier Price Tracking</span>
              </li>
            </ol>
          </nav>

          {/* Hero Section */}
          <div className="text-center md:text-left md:flex md:items-center md:gap-12 py-8 md:py-16">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                <span>Supplier Price Track Solution</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Track Supplier Prices <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                  Without spreadsheets.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Manual tracking is a chore that never gets done. PriceShield automates food distributor price tracking, revealing stealth inflation and item-by-item drift automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center md:justify-start">
                <Button
                  size="lg"
                  className="cursor-pointer font-semibold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
                  render={<Link href="/login" />}
                >
                  Start Tracking Free
                  <ArrowRight className="size-4 ml-2" />
                </Button>
                <Link
                  href="/#products"
                  className="inline-flex items-center justify-center text-sm font-semibold hover:text-white transition-colors py-3"
                >
                  How it works
                </Link>
              </div>
            </div>

            {/* Interactive Live Mockup Panel */}
            <div className="flex-1 mt-12 md:mt-0">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
                <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-2xl">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Live Supplier Price Track</h2>
                      <p className="text-xs text-muted-foreground">Sysco vs US Foods · May 2026</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase font-bold tracking-wide">
                      Active Monitoring
                    </span>
                  </div>

                  {/* Mockup Items */}
                  <div className="space-y-4">
                    {[
                      {
                        name: "Prime Beef Tenderloin (1855)",
                        supplier: "Sysco Corp",
                        base: 18.5,
                        curr: 21.2,
                        unit: "lb",
                        status: "up",
                      },
                      {
                        name: "Heavy Whipping Cream 36%",
                        supplier: "US Foods",
                        base: 34.2,
                        curr: 34.2,
                        unit: "case",
                        status: "flat",
                      },
                      {
                        name: "Extra Virgin Olive Oil 5L",
                        supplier: "Cheney Bros",
                        base: 62.0,
                        curr: 78.5,
                        unit: "tin",
                        status: "up",
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-border/40 hover:border-blue-500/30 transition-all">
                        <div>
                          <div className="text-xs font-semibold text-white">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span>{item.supplier}</span>
                            <span>•</span>
                            <span>per {item.unit}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono font-semibold text-white">
                            ${item.curr.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            {item.status === "up" ? (
                              <>
                                <TrendingUp className="size-3 text-rose-500" />
                                <span className="text-[10px] font-semibold text-rose-500 font-mono">
                                  +{(((item.curr - item.base) / item.base) * 100).toFixed(0)}%
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] font-semibold text-muted-foreground font-mono">
                                  0.0%
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Micro-insight Footer inside Card */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground bg-blue-500/5 -mx-6 -mb-6 p-4 rounded-b-2xl">
                    <Info className="size-3.5 text-blue-400 shrink-0" />
                    <span>Olive Oil increase detected at Cheney Bros. Sysco is offering $68.00.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Feature Sections */}
          <section className="py-16 border-t border-border/60">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                How automated supplier price tracking protects your kitchen
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Distributors count on restaurant operators being too busy to audit invoices. PriceShield shifts the balance of power back to you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-border bg-card p-6 hover:border-blue-500/20 transition-all">
                <div className="size-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                  <TrendingDown className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Drift Tracking</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Most inflation happens gradually—a 10¢ increase here, 20¢ there. PriceShield builds historical baselines and tracks total cumulative drift on every ingredient.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 hover:border-emerald-500/20 transition-all">
                <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                  <Receipt className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Cross-Supplier Auditing</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compare equivalent products between Sysco, US Foods, and local purveyors. Our system standardizes SKU names, so you see alternative vendor pricing instantly.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 hover:border-indigo-500/20 transition-all">
                <div className="size-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
                  <ShieldAlert className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Proactive Guarding</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Get notified the moment a supplier breaches your pre-set price tolerances. Keep your purveyors honest with verifiable transaction histories.
                </p>
              </div>
            </div>
          </section>

          {/* Interactive ROI Calculator Section */}
          <section id="roi-calc" className="py-12 border-t border-border/60">
            <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-card/50 p-6 md:p-10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 space-y-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Interactive Calculator</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Calculate your leaks</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Industry estimates show restaurants leak 2% to 4% of total supplier spend to stealth price hikes. Try our fully interactive <Link href="/tools/margin-leakage-calculator" className="text-emerald-400 underline hover:text-emerald-300">Margin Leakage Calculator</Link> to customize error rates, invoice volume, and audit times.
                </p>
                <div className="pt-2">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Average Monthly Supplier Spend</div>
                  <div className="flex items-center gap-2 max-w-[240px] bg-black/40 rounded-lg p-2.5 border border-border">
                    <span className="text-muted-foreground font-semibold">$</span>
                    <input
                      id="spend-input"
                      type="number"
                      defaultValue="25000"
                      className="bg-transparent border-none outline-none w-full text-sm font-semibold font-mono text-white"
                      placeholder="e.g. 25000"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full md:w-80 rounded-xl bg-black/60 border border-border/80 p-6 space-y-6 shrink-0 text-center md:text-left">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold">Estimated Monthly Leakage</div>
                  <div className="text-3xl font-mono font-bold text-rose-500 mt-1">$750 - $1,500</div>
                  <p className="text-[10px] text-muted-foreground mt-1">Based on 3% to 6% variance</p>
                </div>
                <div className="border-t border-border/40 pt-4">
                  <div className="text-xs text-muted-foreground uppercase font-bold">Potential Annual Savings</div>
                  <div className="text-4xl font-mono font-bold text-emerald-400 mt-1">$9,000+</div>
                  <p className="text-[10px] text-muted-foreground mt-1">When tracking supplier prices daily</p>
                </div>
                <Button className="w-full font-semibold cursor-pointer" render={<Link href="/login" />}>
                  Stop the Leakage
                </Button>
              </div>
            </div>
          </section>

          {/* FAQ Block */}
          <section className="py-12 border-t border-border/60">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">
              Supplier Price Tracking FAQs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">How does manual tracking compare to PriceShield?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Manual tracking requires writing down price lines in spreadsheet tables weekly. It takes 3-4 hours of labor. PriceShield does it automatically in 5 seconds via invoice email forwarding.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">What formats of invoices are supported?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We support PDF invoices from all major distributors, scanned paper invoices, phone photos, and direct supplier portal CSV files.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
