import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  BellRing,
  AlertTriangle,
  MessageSquare,
  Mail,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Supplier Price Increase Detection & Alerts | PriceShield",
  description:
    "Detect supplier price increases and stop stealth inflation in real-time. PriceShield monitors purveyor invoices and alerts you on Slack, Telegram, or email.",
  alternates: {
    canonical:
      "https://trypriceshield.com/solutions/supplier-price-increase-detection",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trypriceshield.com/solutions/supplier-price-increase-detection/#webpage",
      "url": "https://trypriceshield.com/solutions/supplier-price-increase-detection",
      "name": "Supplier Price Increase Detection & Alerts - PriceShield",
      "description": "Set up real-time alerts to detect supplier price increases and creeping costs.",
      "publisher": { "@id": "https://trypriceshield.com/#organization" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://trypriceshield.com/solutions/supplier-price-increase-detection/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does the system detect supplier price increases?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "PriceShield matches line item SKUs on every invoice and compares the unit pricing against your recent baselines. If any item increases beyond your custom percentage threshold (e.g. 2%), it is flagged immediately.",
          },
        },
        {
          "@type": "Question",
          "name": "Can I receive price hike alerts on Slack or Telegram?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. PriceShield has native integrations to send real-time alerts to Slack channels, Telegram groups, WhatsApp, or standard email addresses. You can configure notifications to suit your operations.",
          },
        },
      ],
    },
  ],
};

export default function SupplierPriceIncreaseDetectionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-black text-foreground pt-24 pb-16 relative overflow-hidden">
        {/* Glow Elements */}
        <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none" />

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
                <span className="text-foreground font-medium">Price Hike Detection</span>
              </li>
            </ol>
          </nav>

          {/* Hero Section */}
          <div className="text-center md:text-left md:flex md:items-center md:gap-12 py-10 md:py-20">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-amber-400">
                  Price Hike Alerts
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40 animate-pulse-glow" />
              </div>
              <h1 className="font-heading text-xl sm:text-2xl lg:text-[28px] font-light tracking-wide text-white/95 leading-tight">
                Supplier Price Increase{" "}
                <span className="font-normal bg-gradient-to-r from-amber-400 via-orange-300 to-rose-300 bg-clip-text text-transparent">
                  detected instantly.
                </span>
              </h1>
              <p className="text-xs md:text-[13px] text-zinc-400/90 leading-relaxed max-w-md">
                Purveyors rely on you not noticing small price increases. PriceShield is your margin guardian—detecting price creep and alerting your team the moment it happens.
              </p>
              <div className="flex items-center gap-4 pt-2 justify-center md:justify-start">
                <Button
                  size="sm"
                  className="cursor-pointer font-medium text-xs h-9 px-4 bg-zinc-100 hover:bg-zinc-200 text-black rounded-lg transition-all border-none"
                  render={<Link href="/login" />}
                >
                  Configure Price Alerts
                </Button>
                <Link
                  href="/#products"
                  className="inline-flex items-center text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Notification Channels
                  <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </div>
            </div>

            {/* Interactive Alert Mockup Panel */}
            <div className="flex-1 mt-12 md:mt-0">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative rounded-2xl border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl p-5 shadow-2xl shadow-black/80">
                  {/* Mockup Channels Tab Preview */}
                  <div className="flex items-center gap-1 border-b border-white/[0.06] pb-3 mb-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <MessageSquare className="size-3" /> Telegram Alert
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                      <Zap className="size-3" /> Slack
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                      <Mail className="size-3" /> Email
                    </span>
                  </div>

                  {/* Simulated Mobile Notification */}
                  <div className="space-y-4">
                    <div className="bg-zinc-950/60 border border-white/[0.04] rounded-xl p-4 shadow-inner relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="size-5 rounded bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-300">
                            PS
                          </div>
                          <span className="text-[11px] font-bold text-zinc-200">PriceShield Bot</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">Just now</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] text-zinc-200 leading-relaxed font-medium">
                          ⚠️ **Price Increase Detected** at **US Foods**
                        </p>
                        <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-xs font-mono">
                          <div className="flex justify-between text-zinc-200 font-semibold">
                            <span>Bacon 18/22 Layout</span>
                            <span className="text-rose-400">+$18.50 (Case)</span>
                          </div>
                          <div className="flex justify-between text-zinc-500 text-[10px] mt-1">
                            <span>Old Price: $62.00</span>
                            <span>New Price: $80.50</span>
                          </div>
                          <div className="text-[10px] text-rose-300 mt-1">
                            Drift: +29.8% (Breached 2.0% threshold)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mockup Config Actions */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Sliders className="size-3.5 text-amber-400" /> Threshold Limit: 2.0%
                    </span>
                    <span className="text-amber-400 font-semibold cursor-pointer">Configure Settings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Feature Sections */}
          <section className="py-16 border-t border-border/60">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                How we detect supplier price increases and protect margins
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Establish custom price limit thresholds, manage alerts across channels, and audit supplier contracts in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-border bg-card p-6 hover:border-amber-500/20 transition-all">
                <div className="size-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                  <Sliders className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Custom Thresholds</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Decide what counts as a price increase. Alert your team only when item variance exceeds 2%, 5%, or specific dollar figures on your custom list.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 hover:border-orange-500/20 transition-all">
                <div className="size-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4 border border-orange-500/20">
                  <BellRing className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Omnichannel Alerts</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Receive notifications where you already communicate. Get push alerts in Telegram, Slack, WhatsApp, or weekly email summary reports.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 hover:border-rose-500/20 transition-all">
                <div className="size-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
                  <AlertTriangle className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Contract Auditing</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compare prices against pre-set group purchasing organization (GPO) or supplier contract pricing. Flag deviating charges instantly.
                </p>
              </div>
            </div>
          </section>

          {/* Alert Configuration */}
          <section className="py-12 border-t border-border/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Detect supplier price increase hikes before payments clear
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Once an invoice gets paid, recovering money is difficult. Use our free <Link href="/tools/margin-leakage-calculator" className="text-amber-400 underline hover:text-amber-300">Margin Leakage Calculator</Link> to see how much margin drift costs you annually.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-amber-400 shrink-0" />
                    <span>Real-time analysis before bookkeeping entries are finalized.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-amber-400 shrink-0" />
                    <span>Compile clear histories of supplier overcharges automatically.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-amber-400 shrink-0" />
                    <span>Resolve disputes in minutes instead of days.</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-gradient-to-b from-card to-card/20 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white">Configure Your Alerts</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>Threshold Sensitivity</span>
                      <span className="text-amber-400">2.0% (Medium)</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                      <div className="h-full w-2/5 bg-amber-400" />
                    </div>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-xs text-muted-foreground">Telegram Notifications</span>
                    <span className="text-xs font-semibold text-emerald-400">Enabled</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-xs text-muted-foreground">Slack Channels</span>
                    <span className="text-xs font-semibold text-emerald-400">Enabled</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-xs text-muted-foreground">Email Digests</span>
                    <span className="text-xs font-semibold text-muted-foreground">Weekly</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-12 border-t border-border/60 text-center">
            <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-amber-500/5 p-8 max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Never miss another supplier price hike
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Join thousands of kitchens protected by automated price increase monitoring. Save hours of labor and protect your bottom line.
              </p>
              <Button
                size="lg"
                className="font-semibold cursor-pointer bg-amber-600 hover:bg-amber-500 text-white border-none"
                render={<Link href="/login" />}
              >
                Sign Up for Price Alerts
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
