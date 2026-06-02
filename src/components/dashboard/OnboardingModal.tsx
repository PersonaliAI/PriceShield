"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Loader2,
  Globe,
  Clock,
  ArrowRight,
  ArrowLeft,
  Mail,
  Bell,
  CheckCircle2,
  Zap,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  getCountries,
  getTimezones,
  detectCountry,
  detectTimezone,
  timezoneLabel,
} from "@/lib/locale";
import SearchableDropdown from "./SearchableDropdown";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

// Step 1 — Welcome
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-8 py-4">
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative h-20 w-20 rounded-[1.75rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-xl shadow-emerald-500/10">
          <ShieldCheck className="h-10 w-10 text-emerald-400" />
        </div>
      </div>

      <div className="space-y-3 max-w-xs">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Welcome to PriceShield
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your AI-powered guard against supplier price creep. Let&apos;s set
          you up in under a minute.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        {[
          {
            icon: TrendingDown,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
            title: "Catch hikes instantly",
            desc: "Every invoice line item checked against your baseline",
          },
          {
            icon: Bell,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            title: "Real-time alerts",
            desc: "Telegram, Slack, or email the moment a price jumps",
          },
          {
            icon: Zap,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            title: "5-second audits",
            desc: "AI extracts and audits your PDFs automatically",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border/40 bg-card/40 p-3.5 space-y-2"
          >
            <div
              className={`h-8 w-8 rounded-lg ${f.bg} flex items-center justify-center`}
            >
              <f.icon className={`h-4 w-4 ${f.color}`} />
            </div>
            <p className="text-xs font-semibold leading-snug">{f.title}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      <Button
        onClick={onNext}
        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-11 px-10 rounded-xl shadow-lg shadow-emerald-500/20"
      >
        Get Started <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// Step 2 — Region
function StepRegion({
  country,
  timezone,
  onCountry,
  onTimezone,
  onNext,
  onBack,
}: {
  country: string;
  timezone: string;
  onCountry: (v: string) => void;
  onTimezone: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const countryOptions = getCountries().map((c) => ({
    value: c.code,
    label: c.name,
  }));
  const timezoneOptions = getTimezones().map((tz) => ({
    value: tz,
    label: timezoneLabel(tz),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Globe className="h-4 w-4 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold">Your Region</h3>
        </div>
        <p className="text-sm text-muted-foreground pl-10">
          We auto-detected your location. Correct it if needed — your timezone
          drives when scheduled digests are sent.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-3 w-3" /> Country
          </label>
          <SearchableDropdown
            options={countryOptions}
            value={country}
            onChange={onCountry}
            placeholder="Select country…"
            searchPlaceholder="Search country…"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Timezone
          </label>
          <SearchableDropdown
            options={timezoneOptions}
            value={timezone}
            onChange={onTimezone}
            placeholder="Select timezone…"
            searchPlaceholder="Search e.g. London, Colombo…"
          />
          <p className="text-[11px] text-muted-foreground pl-0.5">
            Used for daily / weekly digest scheduling and PDF timestamps.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-10 px-4 text-sm"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!country || !timezone}
          className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-10 px-8 rounded-xl"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 3 — Alerts setup primer
function StepAlerts({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold">Stay Informed</h3>
        </div>
        <p className="text-sm text-muted-foreground pl-10">
          PriceShield notifies you the moment a supplier sneaks in a price hike.
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            icon: "📬",
            title: "Email Forwarding",
            desc: "Forward supplier invoice emails to your unique PriceShield address. AI extracts and audits them automatically.",
            where: "Settings → Email Forwarding",
          },
          {
            icon: "💬",
            title: "Telegram Bot",
            desc: "Get instant push alerts with price details and a one-tap dispute button right in Telegram.",
            where: "Settings → Alert Channels → Telegram",
          },
          {
            icon: "#",
            title: "Slack Integration",
            desc: "Receive structured alerts in your ops channel — with AI CFO summaries baked in.",
            where: "Settings → Alert Channels → Slack",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3.5 rounded-xl border border-border/40 bg-card/30 p-4"
          >
            <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
              <p className="text-[10px] text-emerald-400/70 font-medium mt-1">
                Configure in: {item.where}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="h-10 px-4 text-sm">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-10 px-8 rounded-xl"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 4 — First invoice CTA
function StepDone({
  onFinish,
  saving,
  savedOk,
  error,
  onBack,
}: {
  onFinish: () => void;
  saving: boolean;
  savedOk: boolean;
  error: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">You&apos;re all set!</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Your region is saved. Now forward your first supplier invoice to start
            protecting your margins.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Forward your first invoice</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Head to <span className="font-medium text-foreground">Settings → Email Forwarding</span> to
              grab your unique PriceShield inbox address, then forward any
              Sysco, US Foods, or other distributor invoice PDF to it.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="h-10 px-4 text-sm" disabled={saving}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onFinish}
          disabled={saving || savedOk}
          className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/20"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </span>
          ) : savedOk ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> All set!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { getToken } = useAuth();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState("US");
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState("");

  // Auto-detect on open; reset all transient state
  useEffect(() => {
    if (open) {
      setStep(1);
      setError("");
      setSaving(false);
      setSavedOk(false);
      setCountry(detectCountry());
      setTimezone(detectTimezone());
    }
  }, [open]);

  const handleFinish = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated — please sign in again.");
      await api.updateSettings(token, {
        country,
        timezone,
        onboarding_complete: true,
      });
      setSaving(false);
      setSavedOk(true);
      // Brief success feedback before closing
      setTimeout(onComplete, 900);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    }
  }, [getToken, country, timezone, onComplete]);

  // Progress dots
  const Dots = () => (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <span
          key={i}
          className={`block rounded-full transition-all duration-300 ${
            i + 1 === step
              ? "w-6 h-1.5 bg-emerald-500"
              : i + 1 < step
              ? "w-1.5 h-1.5 bg-emerald-500/50"
              : "w-1.5 h-1.5 bg-muted/40"
          }`}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 p-6 sm:p-8 shadow-2xl rounded-2xl [&>button]:hidden overflow-y-auto max-h-[calc(100vh-2rem)]">
        <Dots />

        {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
        {step === 2 && (
          <StepRegion
            country={country}
            timezone={timezone}
            onCountry={setCountry}
            onTimezone={setTimezone}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepAlerts onNext={() => setStep(4)} onBack={() => setStep(2)} />
        )}
        {step === 4 && (
          <StepDone
            onFinish={handleFinish}
            saving={saving}
            savedOk={savedOk}
            error={error}
            onBack={() => setStep(3)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
