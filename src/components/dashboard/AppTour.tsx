"use client";

import { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check, Shield } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

interface TourStep {
  id: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  path?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "tour-sidebar",
    title: "Intelligence Center",
    content: "This is your main navigation. Access your AI CFO diagnostics, Invoices, and Reports from here.",
    position: "right",
    path: "/dashboard"
  },
  {
    id: "tour-kpis",
    title: "Performance Monitor",
    content: "Instantly see how much potential profit you've lost to stealth price hikes this month.",
    position: "bottom",
    path: "/dashboard"
  },
  {
    id: "tour-cfo-bar",
    title: "Conversational CFO",
    content: "Ask our AI complex questions like 'Which vendor had the most price jumps?' or 'Analyze my Sysco invoices'.",
    position: "bottom",
    path: "/dashboard"
  },
  {
    id: "tour-upload",
    title: "AI Ingestion",
    content: "Upload physical invoices here. Our AI will automatically extract every single line item for comparison.",
    position: "right",
    path: "/dashboard/upload"
  },
  {
    id: "tour-inbox",
    title: "Verification Inbox",
    content: "Confirm your email forwarding rules and see exactly what the AI is receiving in real-time.",
    position: "right",
    path: "/dashboard/inbox"
  },
  {
    id: "tour-settings",
    title: "Alert Settings",
    content: "Configure your Telegram and Email alerts to get notified the second a price changes by >2%.",
    position: "right",
    path: "/dashboard/settings"
  },
  {
    id: "tour-upload-location",
    title: "Multi-Location Support",
    content: "If you have multiple sites, select the target location for your audit. We automatically handle address matching for you.",
    position: "bottom",
    path: "/dashboard/upload"
  },
  {
    id: "tour-settings-sensitivity",
    title: "Price Sensitivity",
    content: "Our most powerful feature. Define exactly what % increase triggers an alert. We recommend 2% for maximum protection with minimal noise.",
    position: "top",
    path: "/dashboard/settings"
  },
  {
    id: "tour-settings-channels",
    title: "Omni-Channel Alerts",
    content: "Link your Telegram bot or configure custom email alerts to know about price hikes the moment they happen.",
    position: "top",
    path: "/dashboard/settings"
  },
  {
    id: "tour-settings-reports",
    title: "Automated Reporting",
    content: "Receive Daily, Weekly, or Monthly margin summaries directly to your inbox. Stay ahead of supplier trends effortlessly.",
    position: "top",
    path: "/dashboard/settings"
  }
];

interface AppTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AppTour({ open, onOpenChange }: AppTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Update spotlight position
  const updatePosition = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    const element = document.getElementById(step.id);
    if (element) {
      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setCoords(null);
    }
  }, [currentStep]);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle first-time auto-show
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else if (isVisible) {
      setIsVisible(false);
    }
  }, [open, isVisible]);

  // Handle navigation on step change
  useEffect(() => {
    if (!open || !isVisible) return;
    const step = TOUR_STEPS[currentStep];
    if (step.path && step.path !== pathname) {
      router.push(step.path);
    }
  }, [currentStep, open, isVisible, pathname, router]);

  // Recalculate position when pathname or currentStep changes
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(updatePosition, 300); // Wait for page transition
      return () => clearTimeout(timer);
    }
  }, [currentStep, pathname, isVisible, updatePosition]);

  useLayoutEffect(() => {
    if (isVisible) {
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }
  }, [isVisible, updatePosition]);

  if (!mounted || !open || !isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onOpenChange(false);
      localStorage.setItem("priceshield_onboarding_seen", "true");
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    onOpenChange(false);
    localStorage.setItem("priceshield_onboarding_seen", "true");
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden font-sans">
      {/* Background Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {coords && (
              <rect
                x={coords.left - 8}
                y={coords.top - 8}
                width={coords.width + 16}
                height={coords.height + 16}
                rx="12"
                fill="black"
                className="transition-all duration-500 ease-in-out"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.85)"
          mask={coords ? "url(#spotlight-mask)" : undefined}
          className={cn("backdrop-blur-[2px] transition-all duration-700", !coords && "opacity-40")}
          onClick={handleSkip}
        />
      </svg>

      {/* Pulsing Highlight border */}
      {coords && (
        <div 
          className="absolute border-2 border-emerald-500/50 rounded-2xl transition-all duration-500 ease-in-out animate-pulse pointer-events-none"
          style={{
            top: coords.top - 12,
            left: coords.left - 12,
            width: coords.width + 24,
            height: coords.height + 24
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={cn(
          "absolute transition-all duration-500 ease-in-out pointer-events-auto",
          "w-[calc(100vw-32px)] md:w-[340px] z-[10000] animate-in fade-in zoom-in-95 duration-500",
          (!coords || isMobile) ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : ""
        )}
        style={coords && !isMobile ? (() => {
          const viewportH = window.innerHeight;
          const viewportW = window.innerWidth;
          const tooltipH = 220;
          const tooltipW = 340;

          let top = 0;
          let left = 0;

          if (step.position === "bottom") {
            top = coords.top + coords.height + 24;
            left = coords.left + (coords.width / 2) - (tooltipW / 2);
          } else if (step.position === "top") {
            top = coords.top - tooltipH - 24;
            left = coords.left + (coords.width / 2) - (tooltipW / 2);
          } else if (step.position === "right") {
            top = coords.top + (coords.height / 2) - (tooltipH / 2);
            left = coords.left + coords.width + 32;
          } else {
            top = coords.top + (coords.height / 2) - (tooltipH / 2);
            left = coords.left - tooltipW - 32;
          }

          // Clamp to viewport
          top = Math.max(16, Math.min(top, viewportH - tooltipH - 16));
          left = Math.max(16, Math.min(left, viewportW - tooltipW - 16));

          return { top, left };
        })() : {}}
      >
          <div className="bg-card border border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2rem] p-6 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 blur-[40px] -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/60">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </p>
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {step.content}
            </p>

            <div className="flex items-center justify-between gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkip}
                className="text-muted-foreground hover:text-emerald-400 transition-colors"
              >
                Skip Tour
              </Button>
              
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleBack}
                    className="h-9 w-9 rounded-xl border-border/50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  onClick={handleNext}
                  className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold px-6 h-10 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  {isLast ? "Finish" : "Next"}
                  {isLast ? <Check className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Connected Arrow line */}
          {coords && !isMobile && (
            <div className={cn(
              "absolute w-8 h-px bg-emerald-500/30",
              step.position === "right" && "-left-8 top-1/2 -translate-y-1/2",
              step.position === "left" && "-right-8 top-1/2 -translate-y-1/2",
              step.position === "bottom" && "left-1/2 -translate-x-1/2 -top-8 h-8 w-px",
              step.position === "top" && "left-1/2 -translate-x-1/2 -bottom-8 h-8 w-px"
            )} />
          )}
        </div>
      </div>,
    document.body
  );
}
