"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Brain,
  FileSearch,
  MessageSquare,
  ShieldCheck,
  Workflow,
} from "lucide-react";

export function Products() {
  return (
    <section id="products" className="py-16 md:py-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-sm font-medium text-muted-foreground mb-3">Products</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Meet <span className="text-emerald-500">PriceShield</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mb-12">
          The invoice-monitoring engine for restaurants and food-service
          operators. Forward your suppliers' emails once — every future hike
          gets caught, flagged, and surfaced before you reorder.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-8 md:p-10 mb-16"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">PriceShield</h3>
                  <p className="text-xs text-muted-foreground">
                    trypriceshield.com/dashboard
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm max-w-md">
                Vertex AI extracts every line item from every invoice you
                forward, compares against your vendor baseline, and pings you
                the moment a price moves more than your threshold. One setup,
                weekly margin recovery.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline underline-offset-4 shrink-0"
            >
              Try PriceShield
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileSearch,
                title: "AI Invoice Extraction",
                desc: "Vertex AI Gemini reads every line — vendor, SKU, qty, unit price — with confidence scores. 5 seconds per PDF.",
              },
              {
                icon: ShieldCheck,
                title: "Stealth Hike Detection",
                desc: "Each item compared against your last baseline. Even a 2% creep gets caught — before your next order.",
              },
              {
                icon: Bell,
                title: "Multi-Channel Alerts",
                desc: "Telegram, Slack, WhatsApp, OneSignal, or email. Real-time push the second a variance is flagged.",
              },
              {
                icon: MessageSquare,
                title: "AI CFO Chat",
                desc: "Ask 'which vendor raised prices the most this month?' Get an answer grounded in your real data.",
              },
              {
                icon: Workflow,
                title: "Auto-Forwarding",
                desc: "Set up a Gmail rule once. Every future supplier email audits itself. No clicking 'upload' ever again.",
              },
              {
                icon: Brain,
                title: "Semantic SKU Matching",
                desc: "Suppliers rename items between invoices. The AI knows 'Prime Tenderloin' is the same as 'USDA Beef Tenderloin'.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex gap-3"
              >
                <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <f.icon className="size-4 text-foreground" />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div id="how-it-works">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-10">
            Set it up once. Stop overpaying forever.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Forward an invoice",
                desc: "Drag-drop a PDF, snap a photo, or set up a Gmail rule to auto-forward your supplier emails.",
              },
              {
                step: "2",
                title: "AI extracts every line",
                desc: "Vertex AI Gemini parses the document — vendor, SKU, unit price, quantity — in ~5 seconds.",
              },
              {
                step: "3",
                title: "Engine compares baselines",
                desc: "Each item checked against your last invoice from that supplier. Fuzzy SKU match catches renames.",
              },
              {
                step: "4",
                title: "You hear about hikes",
                desc: "Alerts via your chosen channel, with margin-lost math and the proof to renegotiate.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="flex gap-3"
              >
                <span className="text-sm font-semibold text-muted-foreground shrink-0 mt-px">
                  {s.step}.
                </span>
                <div>
                  <h4 className="text-sm font-semibold mb-1">{s.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
