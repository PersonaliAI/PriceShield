"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Bell, MessageSquare, ArrowRight, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

/* ─── Feature cards ─── */
const features = [
  {
    icon: TrendingUp,
    title: "AI-Powered Extraction",
    desc: "Forward invoices. Our Advanced AI extracts every line item — vendor, SKU, price, quantity — automatically.",
  },
  {
    icon: TrendingUp,
    title: "Supplier Price Increase Detect",
    desc: "We compare every delivery against your baseline. If a vendor sneaks in even a 2% hike, we catch it.",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    desc: "Get notified via Telegram or email the second a price shift is detected. Stop overpaying immediately.",
  },
  {
    icon: MessageSquare,
    title: "AI CFO Chat",
    desc: 'Ask questions like "Is $14/lb for ribeye a good deal?" and get data-backed answers from your pricing history.',
  },
];

/* ─── Pricing tiers ─── */
const plans = [
  {
    name: "Free Audit",
    price: "$0",
    period: "",
    description: "Prove the AI works and see exactly what you're losing.",
    features: ["5 Manual Invoice Uploads", "AI Line-Item Extraction", "Basic Price Comparison", "Web Dashboard Access"],
    cta: "Start Free Audit",
    href: "/login",
    highlighted: false,
  },
  {
    name: "Pro Shield",
    price: "$49",
    period: "/mo",
    description: "Core revenue engine. Catch every stealth hike.",
    features: [
      "1 Business Location",
      "Unlimited Auto-Forwarding",
      "Real-Time Telegram Alerts",
      "AI CFO Chat Access",
      "Unlimited Vendor Tracking",
    ],
    cta: "Start Pro Shield",
    href: "/login?redirect=/dashboard/billing",
    highlighted: true,
  },
  {
    name: "Multi-Location",
    price: "$149",
    period: "/mo",
    description: "Built for restaurant groups and multi-site owners.",
    features: [
      "Up to 5 Business Locations",
      "Combined AI CFO Insights",
      "Everything in Pro Shield",
      "Priority Email Support",
    ],
    cta: "Scale Your Shield",
    href: "/login?redirect=/dashboard/billing",
    highlighted: false,
  },
];

import dynamic from "next/dynamic";

const AudioDemoButton = dynamic(() => import("@/components/AudioDemoButton"), {
  loading: () => (
    <div className="h-12 w-[180px] rounded-lg bg-card/30 border border-border/40 animate-pulse" />
  )
});

import { useABTest } from "@/components/ab-test-provider";
import { ROICalculator } from "@/components/roi-calculator";
import { Testimonials } from "@/components/testimonials";

export default function LandingPage() {
  const { variant } = useABTest();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* ───────── Nav ───────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="PriceShield Logo" width={32} height={32} className="h-8 w-auto" priority />
            <span className="hidden">PriceShield</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="#how" className="hover:text-foreground transition-colors">How It Works</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-background font-semibold">
                Get Free Audit
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ───────── Hero Section (A/B Test) ───────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10 hidden md:block">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-400/8 blur-3xl animate-pulse-glow [animation-delay:1s]" />
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <div className={`grid lg:grid-cols-2 gap-12 items-center ${variant === 'challenger' ? 'text-left' : 'text-center max-w-4xl mx-auto'}`}>
            
            {/* Left Col: Copy */}
            <div className="space-y-8">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                <span role="img" aria-label="shield" className="mr-1">🛡️</span> Trusted by 500+ businesses
              </Badge>
              
              {variant === 'control' ? (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.2]">
                    Stop Suppliers From{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500">
                      Bleeding Your Margins
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                    Forward your invoices. Our AI catches every stealth price hike your suppliers sneak in.
                    Zero setup. Instant alerts. Detect supplier price increases automatically.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.2]">
                    Stop Overpaying Suppliers.{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500">
                      Save $2,400+ Per Year.
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                    PriceShield's AI audits every line-item of every invoice. Catch stealth price hikes 
                    automatically before they bleed your margins.
                  </p>
                </>
              )}

              <div className={`flex flex-col sm:flex-row items-center gap-4 ${variant === 'control' ? 'justify-center' : ''}`}>
                <Link href="/login">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-background font-semibold px-8 h-12 text-base">
                    {variant === 'control' ? 'Get Your Free Audit' : 'Get Your Free Savings Audit'} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <AudioDemoButton />
              </div>
              
              <p className="text-sm text-muted-foreground italic">
                Average user discovers <span className="text-emerald-400 font-semibold">$2,400/year</span> in hidden price hikes
              </p>
            </div>

            {/* Right Col: ROI Calculator (Only on Variant B) */}
            {variant === 'challenger' && (
              <div className="hidden lg:block animate-in fade-in slide-in-from-right-8 duration-700">
                <ROICalculator />
              </div>
            )}
          </div>
        </div>

        {/* ─── Logo Cloud ─── */}
        <div className="mx-auto max-w-6xl px-6 mt-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-10">Works with every supplier category</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-10">
            {[
              { icon: "📦", label: "Office Supplies" },
              { icon: "🚚", label: "Logistics & Freight" },
              { icon: "⚡", label: "Utilities & SaaS" },
              { icon: "🥩", label: "Meat & Poultry" },
              { icon: "🥬", label: "Produce" },
              { icon: "🧀", label: "Dairy" },
            ].map((cat) => (
              <div key={cat.label} className="flex flex-col items-center gap-3 group cursor-default">
                <div 
                  role="img" 
                  aria-label={cat.label}
                  className="h-16 w-16 rounded-2xl bg-card/60 border border-border/30 flex items-center justify-center text-3xl group-hover:border-emerald-500/40 group-hover:bg-emerald-500/5 transition-all duration-300 group-hover:scale-110"
                >
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-emerald-400 transition-colors uppercase tracking-wider">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── ROI Calculator (Mobile/Control) ───────── */}
      {(variant === 'control' || typeof window !== 'undefined' && window.innerWidth < 1024) && (
        <section className="py-12 lg:hidden px-6">
          <ROICalculator />
        </section>
      )}

      {/* ───────── Testimonials ───────── */}
      <section className="py-24 bg-emerald-500/5 border-y border-emerald-500/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Wall of Profits</h2>
            <p className="text-muted-foreground text-lg">See how other owners are protecting their margins.</p>
          </div>
          <Testimonials />
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section id="features" className="py-24 border-t border-border/40">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">AI-Powered Supplier Price Increase Detection</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              PriceShield automates invoice auditing so you can catch stealth hikes and protect your business's bottom line.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="bg-card/50 border-border/50 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                    <f.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── How It Works ───────── */}
      <section id="how" className="py-24 border-t border-border/40">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Three Steps. Zero Effort.</h2>
          <div className="space-y-12">
            {[
              { step: "01", title: "Forward Your Invoices", desc: "Set up email forwarding to your unique PriceShield address. That's it — no scanning, no data entry." },
              { step: "02", title: "AI Extracts Every Detail", desc: "Our Advanced AI reads every line item — item name, SKU, price, quantity — and logs it to your history." },
              { step: "03", title: "Get Alerted Instantly", desc: "Whenever unit prices jump more than 2%, you get a Telegram or email alert with exact amounts and percentages." },
            ].map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-lg">{s.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="pricing" className="py-24 border-t border-border/40">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you are ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.highlighted
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10 overflow-visible"
                    : "bg-card/50 border-border/50"
                }`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-background px-3 py-1 text-[10px] uppercase font-bold tracking-widest whitespace-nowrap shadow-xl">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="block w-full">
                    <Button
                      className={`w-full ${
                        plan.highlighted
                          ? "bg-emerald-500 hover:bg-emerald-400 text-background font-semibold"
                          : ""
                      }`}
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-border/40 py-20 bg-card/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="PriceShield Logo" width={32} height={32} className="h-8 w-auto" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-500">PriceShield</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The industry standard for supplier price increase detection. We protect your margins so you can focus on your guests.
            </p>
            <div className="flex items-center gap-4">
               {/* Placeholders for social icons */}
               <div aria-label="Follow us on X" className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-emerald-500/20 transition-colors cursor-pointer">
                 <span className="text-xs font-bold leading-none">X</span>
               </div>
               <div aria-label="Follow us on LinkedIn" className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-emerald-500/20 transition-colors cursor-pointer">
                 <span className="text-xs font-bold leading-none">In</span>
               </div>
            </div>
          </div>

          {/* Product Col */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-500">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link href="#how" className="hover:text-foreground transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* Company Col */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-500">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/support" className="hover:text-foreground transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-500">The Weekly Shield</h4>
            <p className="text-sm text-muted-foreground">Get margin recovery tips delivered to your inbox.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="email@address.com" 
                aria-label="Newsletter email address"
                className="flex-1 bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none" 
              />
              <Button size="sm" aria-label="Join newsletter" className="bg-emerald-500 hover:bg-emerald-400 text-background h-8">Join</Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-20 pt-8 border-t border-border/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 PriceShield AI. All rights reserved.</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Built for <Shield className="h-3 w-3 text-emerald-400" /> Business Integrity
          </p>
        </div>
      </footer>
    </div>
  );
}
