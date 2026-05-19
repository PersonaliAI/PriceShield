"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="pt-24 pb-10 md:pt-32 md:pb-14">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="#products"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors mb-8"
            >
              Now powered by Vertex AI Gemini — invoices audited in 5 seconds
              <ArrowRight className="size-3.5" />
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl"
          >
            Stop supplier price creep before it{" "}
            <span className="text-emerald-500">eats your margins</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed"
          >
            PriceShield audits every supplier invoice the moment it lands, flags
            stealth price hikes, and alerts you on Telegram, Slack, or email —
            so a 2% creep never becomes a quarter of lost margin.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="mt-8 flex items-center gap-3"
          >
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
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.32 }}
            className="mt-4 text-xs text-muted-foreground"
          >
            No credit card · 5 free invoice audits · Cancel anytime
          </motion.p>
        </div>
      </div>
    </section>
  );
}
