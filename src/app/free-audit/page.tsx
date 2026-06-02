import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Upload,
  ScanLine,
  BadgeDollarSign,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Free Invoice Audit for Hospitality Businesses | PriceShield",
  description:
    "Send your last 2–3 supplier invoices and get a free, line-by-line breakdown of every stealth price increase — and what it's costing you per month. No credit card, no signup hassle.",
  alternates: { canonical: "https://trypriceshield.com/free-audit" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the invoice audit really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Your first 5 invoice audits are free with no credit card. You'll see exactly which line items rose, by how much, and the monthly cost before you ever pay anything.",
      },
    },
    {
      "@type": "Question",
      name: "What do I need to send?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your 2–3 most recent supplier invoices from any broadline distributor as PDFs. Even one recent invoice is enough for a useful sample.",
      },
    },
  ],
};

const steps = [
  {
    icon: Upload,
    title: "Upload 2–3 invoices",
    body: "Drop in your most recent supplier PDFs. One is enough for a sample.",
  },
  {
    icon: ScanLine,
    title: "AI audits every line",
    body: "PriceShield extracts each line item at 97%+ accuracy and compares it to your baseline — in about 5 seconds.",
  },
  {
    icon: BadgeDollarSign,
    title: "See the money slipping by",
    body: "Get the exact items that crept up, by how much, and the monthly cost. Then decide if it's worth catching automatically.",
  },
];

export default function FreeAuditPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-black text-foreground pt-24 pb-16 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6">
          {/* Hero */}
          <div className="text-center md:text-left md:flex md:items-center md:gap-12 py-10 md:py-16">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
                  Free Invoice Audit
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 animate-pulse" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                See what your distributor is{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-300 bg-clip-text text-transparent">
                  quietly overcharging you.
                </span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">
                Send your last 2–3 supplier invoices. We'll show you every line item
                that crept up, by how much, and what it's costing you each month —
                free, no credit card.
              </p>
              <div className="flex items-center gap-4 pt-1 justify-center md:justify-start">
                <Button
                  size="lg"
                  className="font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white"
                  render={<Link href="/login" />}
                >
                  Start your free audit
                </Button>
                <Link
                  href="/pricing"
                  className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  See pricing
                  <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                5 free audits · no credit card · your data is never sold
              </p>
            </div>

            {/* Proof mockup */}
            <div className="flex-1 mt-12 md:mt-0">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative rounded-2xl border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl p-5 shadow-2xl shadow-black/80">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <div>
                        <h2 className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider">
                          Free Audit Result
                        </h2>
                        <p className="text-[10px] text-zinc-500">
                          Invoice #SYS-90812 • Your Supplier
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-medium tracking-wide">
                      1 Issue Found
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-rose-500/20 flex items-start gap-3">
                      <AlertTriangle className="size-4 text-rose-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-zinc-200">
                            Price Creep: Heavy Whipping Cream
                          </span>
                          <span className="text-[11px] font-mono font-medium text-rose-400">
                            +$24.00
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Rose from $32.00 → $56.00 (Case of 12). ~$310/mo at your volume.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] flex items-start gap-3">
                      <CheckCircle2 className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-zinc-200">
                            USDA Prime Ribeye (Case)
                          </span>
                          <span className="text-[11px] font-mono font-medium text-emerald-400">
                            OK
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Stable at $340.00. Match confidence 99.8%.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] flex items-start gap-3">
                      <CheckCircle2 className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-zinc-200">
                            Unbleached Flour 50lb
                          </span>
                          <span className="text-[11px] font-mono font-medium text-emerald-400">
                            OK
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Matched via semantic SKU matching. Price stable.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-medium text-zinc-200">Estimated monthly leakage:</span>
                    <span className="text-rose-400 font-semibold font-mono">~$310 / mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <section className="py-14 border-t border-border/60">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold">How the free audit works</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Three steps. About five seconds of AI per invoice.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <div key={s.title} className="relative p-6 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <s.icon className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">Step {i + 1}</span>
                  </div>
                  <h3 className="text-base font-semibold mb-2">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Trust */}
          <section className="py-10 border-t border-border/60">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-emerald-400">97%+</p>
                <p className="text-xs text-muted-foreground">
                  extraction accuracy on typed distributor PDFs
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">PFG · GFS · Cheney Bros · and all major distributors</p>
                <p className="text-xs text-muted-foreground">
                  works with every major broadline distributor
                </p>
              </div>
              <div className="space-y-1 flex flex-col items-center">
                <ShieldCheck className="size-6 text-emerald-400" />
                <p className="text-xs text-muted-foreground">
                  isolated database, row-level security, never sold
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-12 border-t border-border/60 text-center">
            <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-emerald-500/5 p-8 max-w-3xl mx-auto space-y-5">
              <h2 className="text-2xl md:text-3xl font-bold">
                Find out what's slipping by — free.
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Most operators recover 5–20× a subscription in their first month of caught
                hikes. Start by seeing it on your own invoices, no card required.
              </p>
              <Button
                size="lg"
                className="font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white"
                render={<Link href="/login" />}
              >
                Start your free audit
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
