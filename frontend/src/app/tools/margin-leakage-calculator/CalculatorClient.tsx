"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  DollarSign,
  Undo2,
  Percent,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function CalculatorClient() {
  const [spend, setSpend] = useState<number>(25000);
  const [invoices, setInvoices] = useState<number>(40);
  const [errorRate, setErrorRate] = useState<number>(2); // 1% to 10%
  const [creepRate, setCreepRate] = useState<number>(3); // 1% to 10%
  const laborRate = 25; // $/hr

  // Calculations
  const monthlyErrorLeakage = spend * (errorRate / 100);
  const monthlyCreepLeakage = spend * (creepRate / 100);
  const totalMonthlyLeakage = monthlyErrorLeakage + monthlyCreepLeakage;
  const totalAnnualLeakage = totalMonthlyLeakage * 12;

  // Manual auditing time: estimate 15 minutes (0.25 hrs) per invoice
  const manualAuditHours = (invoices * 15) / 60;
  const manualAuditCost = manualAuditHours * laborRate;
  const annualManualAuditCost = manualAuditCost * 12;

  // PriceShield auditing time: 5 seconds (0.00138 hrs) per invoice
  const priceShieldAuditHours = (invoices * 5) / 3600;
  const timeSavedHours = manualAuditHours - priceShieldAuditHours;
  const annualTimeSavedCost = timeSavedHours * laborRate * 12;

  // Total Potential Annual Recovery (Leakage stopped + labor time saved)
  const totalAnnualRecovery = totalAnnualLeakage + annualTimeSavedCost;

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold">
          <Sparkles className="size-3.5" />
          <span>Interactive Margin Leakage Calculator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
          Calculate Your Supplier <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
            Margin Leakage.
          </span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Industry averages show hospitality businesses leak 2% to 6% of spend to invoice errors and stealth price creep. Find out how much you are losing silently.
        </p>
      </div>

      {/* Main Grid: Inputs and Output Results */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start min-w-0 w-full max-w-full">
        {/* Left Side: Inputs */}
        <div className="md:col-span-7 rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 w-full min-w-0">
          <h2 className="text-lg font-bold text-foreground mb-4">1. Your Operations</h2>

          {/* Monthly Spend */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <label htmlFor="spend-range" className="text-muted-foreground">Monthly Supplier Spend</label>
              <span className="text-foreground font-mono text-sm">${spend.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="spend-range"
                type="range"
                min="5000"
                max="200000"
                step="5000"
                value={spend}
                onChange={(e) => setSpend(Number(e.target.value))}
                className="w-full h-1.5 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>$5,000</span>
              <span>$100,000</span>
              <span>$200,000+</span>
            </div>
          </div>

          {/* Monthly Invoices */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <label htmlFor="invoices-range" className="text-muted-foreground">Average Monthly Invoices</label>
              <span className="text-foreground font-mono text-sm">{invoices} invoices</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="invoices-range"
                type="range"
                min="5"
                max="150"
                step="5"
                value={invoices}
                onChange={(e) => setInvoices(Number(e.target.value))}
                className="w-full h-1.5 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>5 invoices</span>
              <span>75</span>
              <span>150+</span>
            </div>
          </div>

          <hr className="border-border/60" />
          <h2 className="text-lg font-bold text-foreground mb-4">2. Leakage Assumptions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Error Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <label htmlFor="error-range" className="text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="size-3.5 text-rose-400" />
                  Invoice Error Rate
                </label>
                <span className="text-rose-400 font-mono text-sm">{errorRate}%</span>
              </div>
              <input
                id="error-range"
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={errorRate}
                onChange={(e) => setErrorRate(Number(e.target.value))}
                className="w-full h-1.5 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <p className="text-[10px] text-muted-foreground">
                Wrong pricing, double billed line items, incorrect taxes.
              </p>
            </div>

            {/* Price Creep Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <label htmlFor="creep-range" className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-amber-400" />
                  Stealth Price Creep
                </label>
                <span className="text-amber-400 font-mono text-sm">{creepRate}%</span>
              </div>
              <input
                id="creep-range"
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={creepRate}
                onChange={(e) => setCreepRate(Number(e.target.value))}
                className="w-full h-1.5 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <p className="text-[10px] text-muted-foreground">
                Gradual weekly price drift on major ingredients without notice.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Outputs & Recovery Visuals */}
        <div className="md:col-span-5 space-y-6 w-full min-w-0">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
            <div className="relative rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
              <div className="text-center pb-4 border-b border-border/60">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Estimated Leakage Result</span>
                <div className="text-4xl md:text-5xl font-mono font-bold text-rose-500 mt-2">
                  ${totalMonthlyLeakage.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  <span className="text-sm font-sans font-semibold text-muted-foreground"> /mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Combined cost of invoice mistakes & pricing creep
                </p>
              </div>

              {/* Grid detail metrics */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500" />
                    Invoice Error Leakage:
                  </span>
                  <span className="text-foreground font-mono font-semibold">
                    ${monthlyErrorLeakage.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Supplier Price Creep:
                  </span>
                  <span className="text-foreground font-mono font-semibold">
                    ${monthlyCreepLeakage.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs border-b border-border/40 pb-3">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-blue-400" />
                    Manual Auditing Labor:
                  </span>
                  <span className="text-foreground font-mono font-semibold">
                    {manualAuditHours.toFixed(1)} hrs (${manualAuditCost.toFixed(0)}/mo)
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold pt-1">
                  <span className="text-foreground">Total Annual Cost:</span>
                  <span className="text-rose-500 font-mono">
                    ${(totalAnnualLeakage + annualManualAuditCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr
                  </span>
                </div>
              </div>

              {/* PriceShield Savings Box */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Potential Recovery With PriceShield</span>
                <div className="text-3xl font-mono font-bold text-emerald-400">
                  ${totalAnnualRecovery.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  <span className="text-xs font-sans font-semibold text-muted-foreground"> /yr</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Stops 98% of invoice creep and saves {timeSavedHours.toFixed(0)} hours of monthly auditing labor automatically.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full font-semibold cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white"
                render={<Link href="/login" />}
              >
                Recover Your Margin Free
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards / FAQ below Calculator */}
      <section className="py-8 border-t border-border/60">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center">
          Understanding Supplier Price Creep
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <DollarSign className="size-4 text-emerald-400" />
              Stealth Inflation
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Suppliers rarely announce a 2% to 4% increase on base ingredients. Instead, price hikes are introduced quietly over weeks. Because operators are focused on service, these stealth changes slip through unnoticed.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Layers className="size-4 text-blue-400" />
              Cross-Vendor Comparison
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Without cross-supplier auditing, you have no leverage. PriceShield normalizes vendor SKU variants to compare equivalent items between your suppliers and local purveyors, identifying cheaper alternative sources.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Clock className="size-4 text-amber-400" />
              Bookkeeping Time Saved
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Manually auditing invoice totals, checking delivery fees, verifying tax, and typing data points into spreadsheets consumes 10+ hours per month. Forwarding your invoices saves 95% of manual labor.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
