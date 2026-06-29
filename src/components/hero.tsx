"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="pt-24 pb-10 md:pt-32 md:pb-14">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center text-center">
          <div>
            <Link
              href="#products"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors mb-8"
            >
              Invoices audited in 5 seconds — see how it works
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl">
            Stop supplier price creep before it{" "}
            <span className="text-emerald-500">eats your margins</span>
          </h1>

          <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed">
            PriceShield audits every supplier invoice the moment it lands, flags
            stealth price hikes, and alerts you on Telegram, Slack, or email —
            so a 2% creep never becomes a quarter of lost margin.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Button
              size="lg"
              className="h-11 px-6 text-sm cursor-pointer"
              render={<Link href="/login" />}
            >
              Start free audit
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-6 text-sm cursor-pointer"
              render={<Link href="#products" />}
            >
              See how it works
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No credit card · 5 free invoice audits · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
