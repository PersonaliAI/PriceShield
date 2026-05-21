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
      <main className="flex-1 bg-black text-foreground pt-24 pb-16">
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
          <div className="text-center md:text-left md:flex md:items-center md:gap-12 py-8 md:py-16">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                <span>Real-Time Alert Solution</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Supplier Price Increase <br />
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                  Detected instantly.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Purveyors rely on you not noticing small price increases. PriceShield is your margin guardian—detecting price creep and alerting your team the moment it happens.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center md:justify-start">
                <Button
                  size="lg"
                  className="cursor-pointer font-semibold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 bg-amber-600 hover:bg-amber-500 text-white border-none"
                  render={<Link href="/login" />}
                >
                  Configure Price Alerts
                  <ArrowRight className="size-4 ml-2" />
                </Button>
                <Link
                  href="/#products"
                  className="inline-flex items-center justify-center text-sm font-semibold hover:text-white transition-colors py-3"
                >
                  See Notification Channels
                </Link>
              </div>
            </div>

            {/* Interactive Alert Mockup Panel */}
            <div className="flex-1 mt-12 md:mt-0">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-rose-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
                <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-2xl">
                  {/* Mockup Channels Tab Preview */}
                  <div className="flex items-center gap-1 border-b border-border/60 pb-3 mb-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <MessageSquare className="size-3" /> Telegram Alert
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Zap className="size-3" /> Slack
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Mail className="size-3" /> Email
                    </span>
                  </div>

                  {/* Simulated Mobile Notification */}
                  <div className="space-y-4">
                    <div className="bg-black/60 border border-border/80 rounded-xl p-4 shadow-inner relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="size-5 rounded bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-300">
                            PS
                          </div>
                          <span className="text-xs font-bold text-white">PriceShield Bot</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">Just now</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-white leading-relaxed font-medium">
                          ⚠️ **Price Increase Detected** at **US Foods**
                        </p>
                        <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-xs font-mono">
                          <div className="flex justify-between text-white font-semibold">
                            <span>Bacon 18/22 Layout</span>
                            <span className="text-rose-400">+$18.50 (Case)</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground text-[10px] mt-1">
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
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
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
