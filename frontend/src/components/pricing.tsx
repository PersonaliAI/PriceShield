"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free Audit",
    price: "$0",
    period: "",
    description: "Upload your invoices and see what the AI catches — before you pay a cent.",
    features: [
      "5 invoice uploads, no expiry",
      "AI reads every line item",
      "Flags price increases vs your history",
      "Dashboard to review results",
    ],
    cta: "Start free — no card needed",
    href: "/login",
    highlighted: false,
  },
  {
    name: "Pro Shield",
    price: "$49",
    period: "/mo",
    description: "Automatic protection. Catches hikes the moment they happen, not months later.",
    features: [
      "1 business location",
      "Forward invoices by email — AI audits them automatically",
      "Instant alerts via email, Telegram, or Slack",
      "Ask your AI analyst anything about your supplier costs",
      "Unlimited suppliers tracked",
      "Weekly cost summary reports",
    ],
    cta: "Start 14-Day Free Trial",
    href: "/login?redirect=/dashboard/billing",
    highlighted: true,
  },
  {
    name: "Multi-Location",
    price: "$149",
    period: "/mo",
    description: "For small businesses running more than one site. One dashboard, full visibility.",
    features: [
      "Up to 5 locations",
      "See cost trends across all sites",
      "Everything in Pro Shield",
      "Priority support",
      "Custom integrations",
    ],
    cta: "Start 14-Day Free Trial",
    href: "/login?redirect=/dashboard/billing",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-muted-foreground mb-3">Simple pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Costs less than <span className="text-emerald-500">one missed hike.</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Most small businesses recover 5–20× the monthly cost in caught overcharges within the first month.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className={cn(
                "rounded-2xl border p-6 flex flex-col bg-card",
                plan.highlighted
                  ? "border-emerald-500/50 shadow-[0_0_40px_-12px_rgba(16,185,129,0.4)]"
                  : "border-border",
              )}
            >
              {plan.highlighted && (
                <div className="self-start mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                {plan.description}
              </p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                variant={plan.highlighted ? "default" : "outline"}
                className={cn(
                  "h-10 w-full cursor-pointer",
                  plan.highlighted && "bg-emerald-500 hover:bg-emerald-600 text-white",
                )}
                render={<Link href={plan.href} />}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
