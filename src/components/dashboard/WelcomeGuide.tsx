"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  ArrowRight, 
  Mail, 
  Bell, 
  MessageSquare, 
  ShieldCheck,
  TrendingUp,
  CreditCard,
  LayoutDashboard,
  Settings,
  MapPin,
  Loader2
} from "lucide-react";
import { 
  Dialog, 
  DialogContent 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function WelcomeGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const hasSeen = localStorage.getItem("priceshield_onboarding_seen");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const closeGuide = () => {
    localStorage.setItem("priceshield_onboarding_seen", "true");
    setIsOpen(false);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => Math.max(1, prev - 1));

  const steps = [
    {
      title: "Overview",
      icon: <LayoutDashboard className="h-6 w-6 text-emerald-400" />,
      bg: "bg-emerald-500/10",
      desc: "Your command center. See exactly how much margin you're losing to stealth price hikes at a glance across all your locations.",
    },
    {
      title: "AI CFO Chat",
      icon: <MessageSquare className="h-6 w-6 text-indigo-400" />,
      bg: "bg-indigo-500/10",
      desc: "Ask anything about your data. 'Who snuck in a hike last week?' or 'Is $12/lb for ribeye a fair price?'",
    },
    {
      title: "Inbox",
      icon: <Mail className="h-6 w-6 text-blue-400" />,
      bg: "bg-blue-500/10",
      desc: "Pure transparency. Every email forwarded to your unique PriceShield address lands here immediately for tracking.",
    },
    {
      title: "Audit History",
      icon: <TrendingUp className="h-6 w-6 text-rose-400" />,
      bg: "bg-rose-500/10",
      desc: "The full paper trail. Detailed line-item breakdown of every variance detected in your historical invoices.",
    },
    {
      title: "Multi-Location",
      icon: <MapPin className="h-6 w-6 text-amber-400" />,
      bg: "bg-amber-500/10",
      desc: "Scaling up? manage multiple restaurant locations from a single login and compare pricing performance between sites.",
    },
    {
      title: "Smart Alerts",
      icon: <Settings className="h-6 w-6 text-sky-400" />,
      bg: "bg-sky-500/10",
      desc: "Set and forget. Connect Telegram or WhatsApp to get notified within minutes when a supplier raises their rates.",
    },
    {
      title: "Pro Shield",
      icon: <CreditCard className="h-6 w-6 text-emerald-400" />,
      bg: "bg-emerald-500/10",
      desc: "Protect every dollar. Pro tiers unlock real-time monitoring, multi-location support, and unlimited AI CFO audit power.",
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl bg-card border-border/40 p-0 overflow-hidden shadow-2xl rounded-2xl">
        <div className="flex flex-col sm:flex-row h-[520px]">
          {/* Left panel - Vertical Timeline */}
          <div className="hidden sm:flex w-[200px] bg-muted/20 border-r border-border/40 flex-col p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-xs uppercase tracking-tighter">PriceShield</span>
            </div>
            
            <div className="flex-1 space-y-3">
              {steps.map((s, i) => (
                <div 
                  key={s.title} 
                  className={`flex items-center gap-3 transition-all duration-300 ${step === i + 1 ? "opacity-100" : "opacity-30"}`}
                >
                  <div className={`h-1 w-1 rounded-full ${step === i + 1 ? "bg-emerald-400" : "bg-muted-foreground"}`} />
                  <span className={`text-[10px] uppercase font-bold tracking-widest whitespace-nowrap ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel - Content */}
          <div className="flex-1 p-10 flex flex-col bg-gradient-to-br from-card to-background">
            <div className="flex-1 flex flex-col justify-center space-y-8">
              <div className={`h-20 w-20 rounded-3xl ${currentStep.bg} flex items-center justify-center animate-in zoom-in-75 duration-500 shadow-inner`}>
                {currentStep.icon}
              </div>
              
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-4xl font-extrabold tracking-tight text-foreground">{currentStep.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
                  {currentStep.desc}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${(step / steps.length) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">0{step} / 0{steps.length}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 mt-auto border-t border-border/40">
               <div className="flex gap-4">
                {step > 1 && (
                  <Button variant="ghost" size="sm" onClick={prevStep} className="text-xs h-8 px-3">
                    Back
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={closeGuide} className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground">
                  Skip
                </Button>
               </div>
              
              {step < steps.length ? (
                <Button onClick={nextStep} className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-10 px-8 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                  Next Step <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={closeGuide} className="bg-emerald-500 hover:bg-emerald-400 text-background font-black h-11 px-10 rounded-xl shadow-xl shadow-emerald-500/30 animate-bounce-subtle">
                  PROCEED TO DASHBOARD
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
