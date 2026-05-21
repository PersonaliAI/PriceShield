"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function InlineCalculator() {
  const [spend, setSpend] = useState<number>(25000);

  const minMonthly = spend * 0.02;
  const maxMonthly = spend * 0.04;
  const annualSavings = spend * 0.03 * 12;

  const handleSpendChange = (val: string) => {
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      setSpend(num);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-card/50 p-6 md:p-10 flex flex-col md:flex-row items-center gap-10">
      <div className="flex-1 space-y-4">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Interactive Calculator</span>
        <h2 className="text-2xl md:text-3xl font-bold text-white">Calculate your leaks</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Industry estimates show restaurants leak 2% to 4% of total supplier spend to stealth price hikes. Try our fully interactive{" "}
          <Link href="/tools/margin-leakage-calculator" className="text-emerald-400 underline hover:text-emerald-300">
            Margin Leakage Calculator
          </Link>{" "}
          to customize error rates, invoice volume, and audit times.
        </p>
        <div className="pt-2">
          <label htmlFor="inline-spend-input" className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">
            Average Monthly Supplier Spend
          </label>
          <div className="flex items-center gap-2 max-w-[240px] bg-black/40 rounded-lg p-2.5 border border-border">
            <span className="text-muted-foreground font-semibold">$</span>
            <input
              id="inline-spend-input"
              type="number"
              value={spend || ""}
              onChange={(e) => handleSpendChange(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm font-semibold font-mono text-white"
              placeholder="e.g. 25000"
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 rounded-xl bg-black/60 border border-border/80 p-6 space-y-6 shrink-0 text-center md:text-left">
        <div>
          <div className="text-xs text-muted-foreground uppercase font-bold">Estimated Monthly Leakage</div>
          <div className="text-3xl font-mono font-bold text-rose-500 mt-1">
            ${minMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${maxMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Based on 2% to 4% variance</p>
        </div>
        <div className="border-t border-border/40 pt-4">
          <div className="text-xs text-muted-foreground uppercase font-bold">Potential Annual Savings</div>
          <div className="text-4xl font-mono font-bold text-emerald-400 mt-1">
            ${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}+
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">When tracking supplier prices daily</p>
        </div>
        <Button className="w-full font-semibold cursor-pointer" render={<Link href="/login" />}>
          Stop the Leakage
        </Button>
      </div>
    </div>
  );
}
