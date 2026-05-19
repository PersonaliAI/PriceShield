import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Brain,
  Chrome,
  LineChart,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title:
    "PriceShield Shopper — Real Price History for Every Online Store | Chrome Extension",
  description:
    "Free Chrome extension that shows the real 90-day price history of any product on Amazon, Walmart, Best Buy, eBay, AliExpress and more. Spot fake discounts, compare across stores, and get drop alerts — powered by AI.",
  alternates: { canonical: "https://trypriceshield.com/shopper" },
  openGraph: {
    title: "PriceShield Shopper — CamelCamelCamel for the entire internet",
    description:
      "Real price history, cross-store comparison, fake-discount detection and AI buy-or-wait predictions on every product page.",
    type: "website",
    url: "https://trypriceshield.com/shopper",
  },
};

// Chrome Web Store URL — fill in after first publication. Falls back to the
// landing page for the install CTA in the meantime.
const CHROME_WEBSTORE_URL =
  "https://chromewebstore.google.com/search/priceshield";

export default function ShopperLanding() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* ----------- Hero ----------- */}
        <section className="pt-24 pb-12 md:pt-32 md:pb-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex flex-col items-center text-center">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/5 px-4 py-1.5 text-sm text-violet-700 dark:text-violet-300 hover:border-violet-500/60 transition-colors mb-8"
              >
                <Sparkles className="size-3.5" />
                New product · Free Chrome extension
              </Link>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl">
                Real price history.{" "}
                <span className="text-violet-500">Every product.</span>{" "}
                Every store.
              </h1>

              <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed">
                PriceShield Shopper is a free Chrome extension that shows the
                actual 90-day price history of any product on Amazon, Walmart,
                Best Buy, eBay, AliExpress and any Shopify store — and catches
                fake "50% off" tricks instantly.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  size="lg"
                  className="h-11 px-6 font-semibold"
                  render={
                    <a
                      href={CHROME_WEBSTORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Chrome className="size-4 mr-2" />
                      Add to Chrome — Free
                      <ArrowRight className="size-4 ml-1" />
                    </a>
                  }
                />
                <Link
                  href="#how-it-works"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Or see how it works ↓
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Works on Chrome, Brave, Edge and Arc · No account needed to start
              </p>
            </div>
          </div>
        </section>

        {/* ----------- Mock screenshot of the overlay ----------- */}
        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 via-card to-card p-8 md:p-12">
              <div className="rounded-xl border border-border bg-background/80 backdrop-blur-sm p-6 max-w-sm mx-auto shadow-2xl">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <div className="grid size-7 place-items-center rounded-lg bg-violet-500">
                    <ShoppingBag className="size-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold leading-tight">
                      PriceShield Shopper
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      4,239 prices tracked
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Current
                    </div>
                    <div className="font-semibold text-emerald-600 mt-0.5">
                      $249
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted border border-border p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Lowest 90d
                    </div>
                    <div className="font-semibold mt-0.5">$199</div>
                  </div>
                  <div className="rounded-lg bg-muted border border-border p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Avg 90d
                    </div>
                    <div className="font-semibold mt-0.5">$228</div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-amber-300/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                  ⚠ Fake discount: store claims <strong>50% off $499</strong>,
                  but the real 90-day max was only $279.
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Also at
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5">
                    <span>Walmart</span>
                    <span className="font-semibold">$229</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5">
                    <span>Target</span>
                    <span className="font-semibold">$235</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-6">
                The panel you see on every product page.
              </p>
            </div>
          </div>
        </section>

        {/* ----------- Features ----------- */}
        <section id="features" className="py-16 border-t border-border">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Six features that flip the power back to you
            </h2>
            <p className="text-muted-foreground max-w-xl mb-12">
              Stores have spent a decade making it impossible to know if a
              deal is real. PriceShield Shopper makes it impossible to miss.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f) => (
                <div key={f.title} className="space-y-3">
                  <div className="size-10 rounded-lg bg-violet-500/10 grid place-items-center">
                    <f.icon className="size-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ----------- How it works ----------- */}
        <section id="how-it-works" className="py-16 border-t border-border">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              How it works
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-10">
              Install once. Shop smarter forever.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  step: "1",
                  title: "Add to Chrome",
                  desc: "One click in the Chrome Web Store. The extension installs in 5 seconds.",
                },
                {
                  step: "2",
                  title: "Visit any product page",
                  desc: "A small badge appears in the bottom-right. Click to expand the full panel.",
                },
                {
                  step: "3",
                  title: "See the real story",
                  desc: "90-day chart, fake-discount alarm, cheaper competing offers, and an AI buy/wait call.",
                },
                {
                  step: "4",
                  title: "Set a drop alert",
                  desc: "One click: 'ping me when it drops below $X.' Email, push, Telegram — your choice.",
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <span className="text-sm font-semibold text-muted-foreground shrink-0 mt-px">
                    {s.step}.
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">{s.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ----------- Install CTA ----------- */}
        <section className="py-20 border-t border-border">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Stop guessing if a deal is real.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Join the crowdsourced price-history network. Every install
              improves the data for everyone — and for free.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                className="h-11 px-6 font-semibold"
                render={
                  <a
                    href={CHROME_WEBSTORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Chrome className="size-4 mr-2" />
                    Add to Chrome — Free
                  </a>
                }
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const features = [
  {
    icon: LineChart,
    title: "Real 90-day price history",
    desc: "A clean chart on every product page showing actual prices over time — not seller marketing.",
  },
  {
    icon: ShieldCheck,
    title: "Fake-discount detection",
    desc: "Catches the 'was $499, now $249' trick when the price was never $499 in the last 90 days. We show you the real discount %.",
  },
  {
    icon: Chrome,
    title: "Cross-store comparison",
    desc: "Instantly see if Walmart, Target, eBay or another store has the same product cheaper, including shipping.",
  },
  {
    icon: Bell,
    title: "Smart drop alerts",
    desc: "One-click 'notify me when below $X'. We watch the price 24/7 and ping you on your channel of choice.",
  },
  {
    icon: Brain,
    title: "AI buy-or-wait",
    desc: "Our model looks at seasonality, inventory pressure and historical patterns to call whether you should pull the trigger or wait.",
  },
  {
    icon: Sparkles,
    title: "Smart wishlist",
    desc: "Tracks restocks, resale value and historical lows for everything you bookmark — far beyond what built-in wishlists do.",
  },
];
