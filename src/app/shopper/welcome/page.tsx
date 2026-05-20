import type { Metadata } from "next";
import Link from "next/link";
import { Chrome, ArrowRight, ShoppingBag, Bell, Brain } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Welcome to PriceShield Shopper",
  description:
    "Your extension is installed. Here's how to make the most of it in 60 seconds.",
  robots: { index: false },
};

export default function ShopperWelcome() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="pt-24 pb-12 md:pt-32">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-600 dark:text-emerald-300 mb-6">
              <Chrome className="size-3.5" /> Extension installed — you're all set
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Welcome to <span className="text-violet-500">PriceShield Shopper</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
              You're 60 seconds away from never overpaying again. Here's the quick tour.
            </p>
          </div>
        </section>

        <section className="pb-16">
          <div className="mx-auto max-w-3xl px-6 space-y-4">
            <Step
              num={1}
              title="Visit any product page"
              desc="Try Amazon, Walmart, Best Buy, Target, eBay, AliExpress, Apple, Nike, or any Shopify store. The PriceShield panel appears in the bottom-right within a second."
              cta="Open a test product"
              ctaHref="https://www.amazon.com/dp/B0CHXDDJ7Q"
              icon={ShoppingBag}
            />
            <Step
              num={2}
              title="Set your first drop alert"
              desc="Click 'Notify me on drop' in the panel. We default to 10% below the current price — change it anywhere later from your dashboard."
              cta="Open dashboard"
              ctaHref="/shopper/dashboard"
              icon={Bell}
            />
            <Step
              num={3}
              title="Let the AI tell you when to buy"
              desc="After a few visits, our AI builds a 90-day model of when each product typically drops. You'll see a Buy / Wait recommendation right in the panel."
              icon={Brain}
            />
          </div>
        </section>

        <section className="py-12 border-t border-border">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Tip: Pin the extension
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
              Click the puzzle-piece icon in Chrome's toolbar → pin PriceShield Shopper.
              The popup gives you fast access to your wishlist and alerts from any page.
            </p>
            <div className="mt-8">
              <Button size="lg" className="h-11 px-6 font-semibold" render={
                <Link href="/shopper/dashboard">
                  Go to my dashboard
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              } />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Step({
  num, title, desc, cta, ctaHref, icon: Icon,
}: {
  num: number;
  title: string;
  desc: string;
  cta?: string;
  ctaHref?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex items-start gap-5">
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-violet-500/10 text-violet-500 font-semibold">
        {num}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="size-4 text-muted-foreground" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        {cta && ctaHref && (
          <a
            href={ctaHref}
            target={ctaHref.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline underline-offset-4"
          >
            {cta} <ArrowRight className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
