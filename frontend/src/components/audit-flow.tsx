"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Bell,
  CheckCircle2,
  GitCompareArrows,
  Inbox,
  ScanText,
  Scale,
} from "lucide-react";

const pipeline = [
  {
    icon: Inbox,
    title: "Invoice arrives",
    desc: "Email auto-forward, drag-drop PDF, or a photo of a paper invoice.",
    accent: "text-sky-400",
    ring: "ring-sky-400/20",
  },
  {
    icon: ScanText,
    title: "AI extraction",
    desc: "Every line item parsed — vendor, SKU, qty, unit price — in ~5s with confidence scores.",
    accent: "text-violet-400",
    ring: "ring-violet-400/20",
  },
  {
    icon: GitCompareArrows,
    title: "Baseline comparison",
    desc: "Semantic SKU matching pairs each item with your last invoice from that vendor.",
    accent: "text-amber-400",
    ring: "ring-amber-400/20",
  },
  {
    icon: Scale,
    title: "Variance check",
    desc: "Price movement measured against your threshold (default 2%).",
    accent: "text-emerald-400",
    ring: "ring-emerald-400/20",
    decision: true,
  },
];

const outcomes = [
  {
    icon: CheckCircle2,
    label: "Within threshold",
    title: "Price stable",
    desc: "Item is logged as the new baseline. Nothing to do — your history just got smarter.",
    badge: "≤ 2%",
    color: "emerald" as const,
  },
  {
    icon: AlertTriangle,
    label: "Hike detected",
    title: "Instant alert",
    desc: "Telegram / Slack / email ping with the exact margin impact and the proof to renegotiate.",
    badge: "> 2%",
    color: "rose" as const,
  },
];

const outcomeStyles = {
  emerald: {
    card: "border-emerald-500/30 bg-emerald-500/[0.06]",
    icon: "bg-emerald-500/15 text-emerald-400",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    line: "bg-emerald-500/40",
  },
  rose: {
    card: "border-rose-400/30 bg-rose-400/[0.06]",
    icon: "bg-rose-400/15 text-rose-400",
    badge: "border-rose-400/30 bg-rose-400/10 text-rose-400",
    line: "bg-rose-400/40",
  },
};

function Connector({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      aria-hidden
      className={
        vertical
          ? "flex flex-col items-center py-1 md:hidden"
          : "hidden md:flex items-center px-1 self-center"
      }
    >
      {vertical ? (
        <ArrowDown className="size-4 text-muted-foreground/60" />
      ) : (
        <ArrowRight className="size-4 text-muted-foreground/60 shrink-0" />
      )}
    </div>
  );
}

export function AuditFlow() {
  return (
    <div className="mb-12">
      {/* Main pipeline */}
      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-stretch">
          {pipeline.map((node, i) => (
            <div key={node.title} className="contents">
              {i > 0 && (
                <>
                  <Connector />
                  <Connector vertical />
                </>
              )}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.1 }}
                className={`flex-1 rounded-lg border border-border bg-background/60 p-4 ring-1 ring-inset ${node.ring} ${
                  node.decision ? "border-dashed" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <node.icon className={`size-4 ${node.accent}`} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    0{i + 1}
                  </span>
                </div>
                <h4 className="text-sm font-semibold mb-1">{node.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {node.desc}
                </p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Branch connector: drops from the decision node and splits to both outcomes */}
        <svg
          aria-hidden
          className="hidden md:block w-full h-10 mt-1"
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M 87.5 0 V 5 H 25"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="text-border"
          />
          <path
            d="M 25 5 V 10"
            stroke="currentColor"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            className="text-emerald-500/60"
          />
          <path
            d="M 75 5 V 10"
            stroke="currentColor"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            className="text-rose-400/60"
          />
        </svg>
        <div aria-hidden className="flex md:hidden flex-col items-center py-1">
          <ArrowDown className="size-4 text-muted-foreground/60" />
        </div>

        {/* Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:mt-0 mt-1">
          {outcomes.map((o, i) => {
            const s = outcomeStyles[o.color];
            return (
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.4 + i * 0.12 }}
                className={`rounded-lg border p-4 ${s.card}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-8 rounded-md flex items-center justify-center shrink-0 ${s.icon}`}
                    >
                      <o.icon className="size-4" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {o.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${s.badge}`}
                  >
                    {o.badge}
                  </span>
                </div>
                <h4 className="text-sm font-semibold mb-1">{o.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {o.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.7 }}
          className="mt-5 flex items-center gap-2 justify-center text-xs text-muted-foreground"
        >
          <Bell className="size-3.5 text-emerald-400" />
          The whole loop runs automatically — from inbox to alert in under 10
          seconds.
        </motion.div>
      </div>
    </div>
  );
}
