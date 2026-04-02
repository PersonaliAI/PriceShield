"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle, ArrowRight, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { api, AuditResult, UserSettings } from "@/lib/api";
import ProtectedRoute from "@/components/protected-route";
import Link from "next/link";
import { useEffect } from "react";

const STEPS = [
  { title: "Upload Invoices", desc: "Upload your last 3 supplier invoices (PDF)" },
  { title: "AI Analysis", desc: "Our AI extracts and compares every line item" },
  { title: "See Your Results", desc: "Discover exactly how much you've been overcharged" },
];

export default function OnboardingPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = await getToken();
        if (token) {
          const s = await api.getSettings(token);
          setSettings(s);
          if (s.locations.length > 0) {
            setSelectedLocationId(s.locations[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load settings in onboarding:", err);
      }
    };
    loadSettings();
  }, [getToken]);

  const isFree = settings?.tier === "free";
  const uploadsRemaining = isFree ? Math.max(0, 5 - (settings?.manual_uploads_count || 0)) : null;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (f) => f.type === "application/pdf"
      );
      setFiles((prev) => {
        const total = [...prev, ...newFiles];
        const limit = isFree && uploadsRemaining !== null ? uploadsRemaining : 5;
        if (total.length > limit) {
          setError(isFree 
            ? `Free tier limit: You can only upload ${uploadsRemaining} more invoice(s).`
            : `Please select up to 5 invoices at a time.`
          );
          return total.slice(0, limit);
        }
        setError("");
        return total;
      });
    }
  }, [isFree, uploadsRemaining]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (error && error.includes("limit")) setError("");
  };

  const handleSubmit = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    setError("");
    setCurrentStep(1);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const result = await api.runAudit(token, files, selectedLocationId);
      setAuditResult(result);
      setCurrentStep(2);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Audit failed";
      setError(msg);
      setCurrentStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-emerald-500/8 blur-3xl animate-pulse-glow" />
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="PriceShield Logo" className="h-10 w-auto" />
          </Link>
          <h1 className="text-3xl font-bold mb-2">Get Your Free Price Audit</h1>
          <p className="text-muted-foreground">Upload a few invoices and see how much you&apos;ve been overcharged</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  i <= currentStep
                    ? "bg-emerald-500 text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? <CheckCircle className="h-5 w-5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-12 transition-colors duration-300 ${
                    i < currentStep ? "bg-emerald-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <Card className="w-full max-w-lg bg-card/80 backdrop-blur border-border/50">
          {currentStep === 0 && (
            <>
              <CardHeader>
                <CardTitle>Upload Historical Invoices</CardTitle>
                <CardDescription>
                  Upload 2-5 recent invoices from the same supplier to detect price trends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Location Selector */}
                {settings && settings.locations.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Which location are these for?
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        className="flex-1 rounded-lg border border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium appearance-none cursor-pointer"
                      >
                        {settings.locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                      <Link href="/dashboard/locations">
                        <Button variant="outline" size="icon" className="shrink-0" title="Manage Locations">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Drop zone */}
                <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-border/50 hover:border-emerald-500/40 transition-colors cursor-pointer bg-muted/30">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Drop PDFs here or <span className="text-emerald-400 font-medium">browse</span>
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isFree && uploadsRemaining !== null && uploadsRemaining <= 0}
                  />
                </label>

                {isFree && uploadsRemaining !== null && (
                  <p className="text-xs text-center text-muted-foreground">
                    Free tier: <strong className="text-emerald-400">{uploadsRemaining}</strong> manual uploads remaining.
                  </p>
                )}

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(i)}
                          className="text-muted-foreground hover:text-foreground text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-semibold h-11"
                  disabled={files.length < 2 || isProcessing}
                  onClick={handleSubmit}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Run Free Audit <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Minimum 2 invoices needed for comparison
                </p>
              </CardContent>
            </>
          )}

          {currentStep === 1 && (
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
              <p className="text-lg font-semibold">Analysing your invoices…</p>
              <p className="text-sm text-muted-foreground">
                Our AI is extracting line items and comparing prices across {files.length} invoices
              </p>
            </CardContent>
          )}

          {currentStep === 2 && auditResult && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <CardTitle className="text-2xl">Audit Complete! 🎉</CardTitle>
                <CardDescription>
                  We analysed {auditResult.invoices_processed} invoices and found hidden price hikes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-muted/30 p-4 text-center">
                    <p className="text-3xl font-bold text-rose-400">
                      ${auditResult.total_historical_loss.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Total Margin Leaked</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-4 text-center">
                    <p className="text-3xl font-bold text-amber-400">{auditResult.total_hikes_found}</p>
                    <p className="text-sm text-muted-foreground mt-1">Stealth Hikes Found</p>
                  </div>
                </div>
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-semibold h-11"
                  onClick={() => router.push("/dashboard")}
                >
                  View Full Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}
