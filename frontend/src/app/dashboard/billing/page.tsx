"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Shield, Loader2, ArrowRight, Building2, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { api, UserSettings } from "@/lib/api";

const PLANS = [
  {
    tier: "free",
    name: "Free Audit",
    price: "$0",
    description: "See what the AI catches on your own invoices — before you pay anything.",
    trial: null,
    features: [
      "5 invoice uploads (no expiry)",
      "AI reads every line item",
      "Flags price increases vs your history",
      "Full dashboard access",
    ],
    limitations: [
      "No auto-forwarding",
      "No real-time alerts",
      "No AI cost analysis",
    ],
    icon: Zap,
    popular: false,
  },
  {
    tier: "pro",
    name: "Pro Shield",
    price: "$49 / month",
    description: "Automatic protection. Catches hikes the day they happen — not months later.",
    trial: "14-Day Free Trial",
    features: [
      "1 business location",
      "Forward invoices by email — AI audits automatically",
      "Instant alerts via email, Telegram, or Slack",
      "Ask your AI analyst about any supplier cost",
      "Unlimited suppliers tracked",
      "Weekly cost summary reports",
    ],
    icon: Shield,
    popular: true,
  },
  {
    tier: "multi",
    name: "Multi-Location",
    price: "$149 / month",
    description: "For small businesses running more than one site. One dashboard, full visibility.",
    trial: "14-Day Free Trial",
    features: [
      "Up to 5 business locations",
      "Combined cost view across all sites",
      "Everything in Pro Shield",
      "Priority support",
    ],
    icon: Building2,
    popular: false,
  },
];

export default function BillingPage() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getSettings(token);
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleCheckout = async (tier: string) => {
    setCheckoutLoading(tier);
    try {
      const token = await getToken();
      if (!token) return;
      
      const res = await api.getCheckoutUrl(token, tier);
      if (res.url) {
        window.location.href = res.url;
      } else {
        alert("Failed to generate checkout link.");
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      alert(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-muted-foreground">Loading billing status…</p>
      </div>
    );
  }

  const currentTier = settings?.tier || "free";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Upgrade Your Plan</h1>
        <p className="text-muted-foreground text-lg">
          Most small businesses recover 5–20× the monthly cost in caught price hikes within their first month.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          const PlanIcon = plan.icon;

          return (
            <Card 
              key={plan.tier} 
              className={`relative flex flex-col ${
                plan.popular 
                  ? "border-emerald-500/50 shadow-xl shadow-emerald-500/10 bg-card/80 overflow-visible" 
                  : "border-border/50 bg-card/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 inset-x-0 flex justify-center">
                  <Badge className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold border-0 px-3 py-0.5 uppercase tracking-wider text-[10px]">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <PlanIcon className="h-6 w-6 text-emerald-400" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="pt-2">{plan.description}</CardDescription>
                <div className="mt-4 pb-2 border-b border-border/50 flex items-baseline justify-between">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.trial && (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold text-xs px-2.5 py-0.5">
                      {plan.trial}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex flex-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.limitations && plan.limitations.map((limit, i) => (
                    <li key={`limit-${i}`} className="flex flex-start gap-3 opacity-50">
                      <div className="h-5 w-5 rounded-full border border-muted-foreground/30 flex items-center justify-center shrink-0">
                        <span className="w-2 h-[1px] bg-muted-foreground"></span>
                      </div>
                      <span className="line-through">{limit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4 flex flex-col gap-2">
                {isCurrent ? (
                  <Button className="w-full h-11 pointer-events-none" variant="secondary">
                    Your Current Plan
                  </Button>
                ) : plan.tier === "free" ? (
                  <Button className="w-full h-11" variant="outline" disabled>
                    Included
                  </Button>
                ) : (
                  <Button 
                    className={`w-full h-11 font-semibold ${
                      plan.popular 
                        ? "bg-emerald-500 hover:bg-emerald-400 text-background" 
                        : "bg-primary hover:bg-primary/90"
                    }`}
                    onClick={() => handleCheckout(plan.tier)}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === plan.tier ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center">
                        Start 14-Day Free Trial <ArrowRight className="h-4 w-4 ml-2" />
                      </span>
                    )}
                  </Button>
                )}
                {plan.trial && !isCurrent && (
                  <p className="text-[11px] text-muted-foreground text-center font-medium">
                    14 days free • No charge today • Cancel anytime
                  </p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
