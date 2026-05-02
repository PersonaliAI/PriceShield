"use client";

import { 
  TrendingUp, 
  Shield, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  Play,
  ArrowUpRight,
  Smartphone,
  Layout,
  Clock,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ROICalculator } from "@/components/roi-calculator";

const features = [
  {
    icon: TrendingUp,
    title: "AI-Powered Extraction",
    desc: "Forward invoices. Our Advanced AI extracts every line item — vendor, SKU, price, quantity — automatically.",
  },
  {
    icon: TrendingUp,
    title: "Price Trend Tracking",
    desc: "See price history for every item across all vendors. Never guess if you're getting a fair deal.",
  },
  {
    icon: TrendingUp,
    title: "Instant Hike Alerts",
    desc: "Get notified via Telegram or Email the moment a unit price jumps. Dispute hikes before you pay.",
  },
];

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Nav */}
      <nav 
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled 
            ? "border-b border-border/40 bg-background/80 backdrop-blur-xl py-3" 
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="PriceShield Logo" width={32} height={32} className="h-8 w-auto" />
            <span className="text-xl font-black tracking-tighter text-white">PriceShield</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">How it Works</Link>
            <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Blog</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-bold text-muted-foreground hover:text-white transition-colors px-4">Login</Link>
            <Link href="/login">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-background font-black px-6 shadow-lg shadow-emerald-500/20 group">
                Get Started <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[49] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 md:hidden animate-in fade-in duration-300">
           <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold">Features</Link>
           <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold">How it Works</Link>
           <Link href="/blog" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold">Blog</Link>
           <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-emerald-400">Get Started</Link>
        </div>
      )}

      {/* Hero */}
      <section className="relative pt-40 pb-20 md:pt-60 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Badge variant="outline" className="px-4 py-1.5 border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-bold tracking-widest uppercase rounded-full">
               Stop Overpaying Suppliers. Save $2,400+ Per Year.
             </Badge>
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            Automate Your <span className="text-emerald-400">Price Protection.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            PriceShield monitors every line item on every invoice. We alert you the moment a supplier raises a price, so you can dispute it instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Link href="/login">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-background font-black px-10 h-14 text-lg rounded-2xl shadow-xl shadow-emerald-500/20 group">
                Start Saving Now <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl font-bold border-border/40 hover:bg-white/5 transition-all">
                <Play className="mr-2 h-4 w-4 fill-current" /> How it Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-24 relative" id="calculator">
         <div className="mx-auto max-w-7xl px-6">
            <div className="bg-card/40 border border-border/40 rounded-[3rem] p-8 md:p-16 backdrop-blur-sm overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp className="h-64 w-64 text-emerald-500" />
               </div>
               <div className="relative z-10">
                  <ROICalculator />
               </div>
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-y border-border/40 bg-white/[0.02]" id="features">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Built for <span className="text-emerald-400">Speed.</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Zero data entry. Zero friction. Just pure margin protection.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="group p-10 rounded-[2.5rem] bg-card/40 border border-border/40 hover:border-emerald-500/30 transition-all hover:translate-y-[-4px] shadow-2xl">
                <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 w-fit group-hover:bg-emerald-500/20 transition-colors">
                   <f.icon className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black mb-4">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 relative overflow-hidden" id="how-it-works">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest">
                <Zap className="h-3 w-3" /> The PriceShield Process
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">Hands-Free <span className="text-emerald-400">Monitoring.</span></h2>
              <div className="space-y-12">
                {[
                  { step: "01", title: "Forward Your Invoices", desc: "Set up email forwarding to your unique PriceShield address. That's it — no scanning, no data entry." },
                  { step: "02", title: "AI Extracts Every Detail", desc: "Our Advanced AI reads every line item — item name, SKU, price, quantity — and logs it to your history." },
                  { step: "03", title: "Get Alerted Instantly", desc: "Whenever unit prices jump more than 2%, you get a Telegram or email alert with exact amounts and percentages." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-6 items-start">
                    <div className="text-4xl font-black text-emerald-500/20 font-mono leading-none pt-1">{s.step}</div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{s.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl opacity-20 rounded-full" />
              <div className="relative rounded-[3rem] border border-border/40 bg-card p-6 shadow-2xl">
                 <div className="aspect-[4/5] rounded-[2rem] bg-background/50 flex flex-col overflow-hidden border border-white/5">
                    {/* Mock UI */}
                    <div className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-white/[0.02]">
                       <div className="flex gap-2">
                          <div className="h-2 w-2 rounded-full bg-rose-500/50" />
                          <div className="h-2 w-2 rounded-full bg-amber-500/50" />
                          <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
                       </div>
                       <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">Real-time Feed</Badge>
                    </div>
                    <div className="p-8 space-y-6">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                  <Shield className="h-5 w-5 text-emerald-400" />
                               </div>
                               <div>
                                  <div className="h-3 w-24 bg-white/10 rounded-full mb-2" />
                                  <div className="h-2 w-16 bg-white/5 rounded-full" />
                               </div>
                            </div>
                            <Badge className="bg-rose-500/20 text-rose-400 border-0">+14.2%</Badge>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-20 border-t border-border/40">
         <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-[0.3em] mb-12">Built with Next-Gen Tech</p>
            <div className="flex flex-wrap items-center justify-center gap-12 grayscale opacity-30">
               {["FastAPI", "Next.js", "Firebase", "PostgreSQL", "Tailwind"].map(t => (
                 <span key={t} className="text-2xl font-black tracking-tighter">{t}</span>
               ))}
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-6 relative z-10 text-center">
          <div className="rounded-[4rem] bg-emerald-500 p-12 md:p-24 shadow-2xl shadow-emerald-500/30 overflow-hidden relative">
            {/* CTA Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-background mb-8 leading-none">
              Ready to protect <br /> your margins?
            </h2>
            <p className="text-background/80 text-lg md:text-xl font-medium mb-12 max-w-xl mx-auto">
              Join dozens of restaurant operators who have already automated their price auditing. Start your 14-day free trial.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="bg-background text-foreground hover:bg-white font-black px-12 h-16 text-xl rounded-2xl shadow-2xl">
                  Try it Free
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="ghost" className="text-background font-bold hover:bg-background/10 h-16 px-8 rounded-2xl">
                  Book a Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border/40 bg-card/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Image src="/logo.png" alt="PriceShield Logo" width={32} height={32} className="h-8 w-auto" />
                <span className="text-2xl font-black tracking-tighter text-white">PriceShield</span>
              </div>
              <p className="text-muted-foreground text-lg max-w-sm">
                The first automated price auditing platform for the hospitality industry. Built for operators, not accountants.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Product</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link href="#features" className="hover:text-emerald-400 transition-colors">Features</Link></li>
                <li><Link href="#calculator" className="hover:text-emerald-400 transition-colors">ROI Calculator</Link></li>
                <li><Link href="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Company</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link href="/support" className="hover:text-emerald-400 transition-colors">Support</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-muted-foreground text-sm">
              © 2026 PriceShield. All rights reserved.
            </p>
            <div className="flex gap-6">
               <ArrowUpRight className="h-5 w-5 text-muted-foreground hover:text-emerald-400 cursor-pointer" />
               <Smartphone className="h-5 w-5 text-muted-foreground hover:text-emerald-400 cursor-pointer" />
               <Layout className="h-5 w-5 text-muted-foreground hover:text-emerald-400 cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
