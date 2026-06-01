"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Loader2, Globe, Clock, ArrowRight } from "lucide-react";
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

export default function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { getToken } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedTimezone, setSelectedTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load auto-detected settings on mount
  useEffect(() => {
    if (open) {
      setSelectedCountry(detectCountry());
      setSelectedTimezone(detectTimezone());
    }
  }, [open]);

  // Map values for the SearchableDropdowns
  const countryOptions = getCountries().map((c) => ({
    value: c.code,
    label: c.name,
  }));

  const timezoneOptions = getTimezones().map((tz) => ({
    value: tz,
    label: timezoneLabel(tz),
  }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to authenticate. Please sign in again.");
      }

      // Update backend preferences and complete onboarding
      await api.updateSettings(token, {
        country: selectedCountry,
        timezone: selectedTimezone,
        onboarding_complete: true,
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      {/* [&>button]:hidden prevents displaying the default Radix Dialog close (X) button */}
      <DialogContent className="max-w-md bg-card/45 backdrop-blur-xl border border-emerald-500/25 p-8 shadow-2xl rounded-2xl [&>button]:hidden">
        <div className="space-y-6">
          {/* Logo & Welcome Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome to PriceShield</h2>
              <p className="text-xs text-muted-foreground max-w-xs">
                To start monitoring margin stealth-hikes, configure your regional defaults.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-center font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Country Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Default Country
              </label>
              <SearchableDropdown
                options={countryOptions}
                value={selectedCountry}
                onChange={setSelectedCountry}
                placeholder="Search and select country..."
                searchPlaceholder="Type country name..."
              />
              <p className="text-[10px] text-muted-foreground italic pl-1">
                We auto-detected your region based on browser language.
              </p>
            </div>

            {/* Timezone Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Timezone
              </label>
              <SearchableDropdown
                options={timezoneOptions}
                value={selectedTimezone}
                onChange={setSelectedTimezone}
                placeholder="Search and select timezone..."
                searchPlaceholder="Type timezone, e.g. Europe..."
              />
              <p className="text-[10px] text-muted-foreground italic pl-1">
                Used for weekly digest schedules and PDF timestamp reports.
              </p>
            </div>
          </div>

          {/* Save Action */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-extrabold h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-2"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-background" /> Saving preferences...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Save & Proceed to Dashboard <ArrowRight className="h-4 w-4 text-background" />
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
