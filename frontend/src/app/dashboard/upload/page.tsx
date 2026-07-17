"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle,
  ArrowRight,
  Loader2,
  Plus,
  MapPin,
  AlertTriangle,
  TrendingDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { api, AuditResult, UserSettings } from "@/lib/api";
import Link from "next/link";

// Plain-English status messages — no jargon
const getFriendlyStatus = (lastLog: string, progress: number, isProcessing: boolean) => {
  if (!isProcessing) return "Ready to check";
  if (progress === 100) return "Done!";
  if (lastLog.includes("Extracting items") || lastLog.includes("Initializing")) return "Reading your invoice…";
  if (lastLog.includes("Connecting")) return "Connecting to AI…";
  if (lastLog.includes("Success: Extracted")) return "Got all the line items";
  if (lastLog.includes("Running historical comparison")) return "Checking for price increases…";
  if (lastLog.includes("Saving results")) return "Wrapping up your report…";
  if (lastLog.includes("SUCCESS")) return "All done!";
  if (lastLog.includes("ERROR")) return "Something went wrong.";
  return "Working on it…";
};

const StatusDisplay = ({ logs, progress, isProcessing }: { logs: string[]; progress: number; isProcessing: boolean }) => {
  const lastLog = logs[logs.length - 1] || "";
  const status = getFriendlyStatus(lastLog, progress, isProcessing);

  return (
    <div className="w-full max-w-md mx-auto py-10 px-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center space-y-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-foreground tracking-tight">{status}</h3>
        <p className="text-sm text-emerald-500/60">
          {progress < 40
            ? "Extracting line items from your PDF"
            : progress < 80
            ? "Comparing prices against your history"
            : "Generating your report"}
          {" — "}{progress}%
        </p>
      </div>

      <div className="w-full space-y-4">
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {isProcessing && progress < 100 && (
        <div className="flex items-center gap-2 text-xs text-emerald-400/70">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>This usually takes 20–40 seconds</span>
        </div>
      )}
    </div>
  );
};

export default function UploadPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = await getToken();
        if (token) {
          const s = await api.getSettings(token);
          setSettings(s);
          if (s.locations.length > 0) setSelectedLocationId(s.locations[0].id);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    loadSettings();
  }, [getToken]);

  const isFree = settings?.tier === "free";
  const uploadsRemaining = isFree ? Math.max(0, 5 - (settings?.manual_uploads_count || 0)) : null;

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
      let incoming: File[] = [];
      if ("target" in e && e.target instanceof HTMLInputElement && e.target.files) {
        incoming = Array.from(e.target.files);
      } else if ("dataTransfer" in e && e.dataTransfer.files) {
        incoming = Array.from(e.dataTransfer.files);
      }
      const pdfs = incoming.filter((f) => f.type === "application/pdf");
      if (pdfs.length === 0 && incoming.length > 0) {
        setError("Please upload PDF files only.");
        return;
      }
      setFiles((prev) => {
        const combined = [...prev, ...pdfs];
        const limit = isFree && uploadsRemaining !== null ? uploadsRemaining : 5;
        if (combined.length > limit) {
          setError(
            isFree
              ? `You have ${uploadsRemaining} free upload(s) remaining.`
              : "You can upload up to 5 invoices at a time."
          );
          return combined.slice(0, limit);
        }
        setError("");
        return combined;
      });
    },
    [isFree, uploadsRemaining]
  );

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileChange(e); }, [handleFileChange]);
  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  // Polling
  const pollJobIdRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (!jobId || !isProcessing) {
      isPollingRef.current = false;
      pollJobIdRef.current = null;
      return;
    }
    if (isPollingRef.current && pollJobIdRef.current === jobId) return;

    isPollingRef.current = true;
    pollJobIdRef.current = jobId;
    let pollCount = 0;

    const runPoll = async () => {
      if (!isPollingRef.current || pollJobIdRef.current !== jobId) return;
      pollCount++;
      try {
        const token = await getToken();
        if (!token) throw new Error("No token");
        const [statusData, logsData] = await Promise.all([
          api.getJobStatus(token, jobId),
          api.getJobLogs(token, jobId),
        ]);
        if (statusData?.progress !== undefined) setProgress(statusData.progress);
        if (Array.isArray(logsData)) setTerminalLogs(logsData.map((l: { message: string }) => l.message));

        if (statusData.status === "completed") {
          setAuditResult(statusData);
          setTimeout(() => {
            if (isPollingRef.current) {
              setCurrentStep(2);
              setIsProcessing(false);
              setJobId(null);
              router.refresh();
            }
          }, 1500);
          return;
        } else if (statusData.status === "failed") {
          setErrorMessage(statusData.error || "Audit failed.");
          setShowErrorDialog(true);
          setIsProcessing(false);
          setJobId(null);
          return;
        }
        if (pollCount < 600 && isPollingRef.current) setTimeout(runPoll, 1000);
        else if (pollCount >= 600) {
          setErrorMessage("Audit timed out. Please try again.");
          setShowErrorDialog(true);
          setIsProcessing(false);
        }
      } catch {
        if (isPollingRef.current) setTimeout(runPoll, 3000);
      }
    };
    runPoll();
  }, [jobId, isProcessing, getToken, router]);

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError("");
    setTerminalLogs([]);
    setCurrentStep(1);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const { job_id } = await api.createAuditJob(token);
      setJobId(job_id);
      api.uploadAuditFiles(token, files, job_id, selectedLocationId).catch(console.error);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Audit failed";
      setErrorMessage(msg);
      setShowErrorDialog(true);
      setCurrentStep(0);
      setIsProcessing(false);
      setJobId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check Your Invoices</h1>
        <p className="text-muted-foreground mt-1">
          Upload supplier invoices and we&apos;ll flag any price increases — results in under a minute
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {["Upload", "Checking prices", "Results"].map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < currentStep
                    ? "bg-emerald-500 text-background"
                    : i === currentStep
                    ? "bg-emerald-500 text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i === currentStep ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
            {i < 2 && <div className={`h-0.5 w-8 transition-colors duration-300 ${i < currentStep ? "bg-emerald-500" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center">
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur border-border/50">

          {/* Step 0 — Upload */}
          {currentStep === 0 && (
            <>
              <CardHeader>
                <CardTitle>Upload Your Invoice PDFs</CardTitle>
                <CardDescription>
                  Drop in your recent invoices from your suppliers and distributors.
                  {" "}More invoices = better comparison, but even one works.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Location selector */}
                {settings && settings.locations.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Location
                    </label>
                    <div className="flex items-center gap-2">
                      {settings.locations.length === 1 ? (
                        <div className="flex-1 h-10 bg-muted/20 border border-border/40 rounded-lg px-3 flex items-center gap-2 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="font-medium truncate">{settings.locations[0].name}</span>
                        </div>
                      ) : (
                        <Select value={selectedLocationId} onValueChange={(v) => setSelectedLocationId(v ?? "")}>
                          <SelectTrigger className="flex-1 h-10">
                            <SelectValue placeholder="Pick a location" />
                          </SelectTrigger>
                          <SelectContent>
                            {settings.locations.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                                  {loc.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Link href="/dashboard/locations">
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Add location">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Drop zone */}
                <label
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`flex flex-col items-center justify-center gap-3 h-44 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-500/10 scale-[0.99]"
                      : "border-border/50 bg-muted/20 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                  }`}
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${isDragging ? "bg-emerald-500/20" : "bg-muted/40"}`}>
                    <Upload className={`h-6 w-6 transition-colors ${isDragging ? "text-emerald-400" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isDragging ? "Drop your PDFs here" : "Drag & drop or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PDF invoices only · up to 5 at once</p>
                  </div>
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
                    Free plan:{" "}
                    <strong className={uploadsRemaining === 0 ? "text-rose-400" : "text-emerald-400"}>
                      {uploadsRemaining} free upload{uploadsRemaining !== 1 ? "s" : ""} remaining
                    </strong>
                    {uploadsRemaining === 0 && (
                      <> · <Link href="/dashboard/billing" className="underline text-emerald-400">Upgrade to continue</Link></>
                    )}
                  </p>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, i) => (
                      <div key={`${file.name}-${i}`} className="flex items-center justify-between rounded-lg bg-muted/30 border border-border/30 px-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        <button onClick={() => removeFile(i)} className="ml-2 text-muted-foreground hover:text-foreground shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-semibold h-11 rounded-xl"
                  disabled={files.length === 0 || isProcessing || (isFree && uploadsRemaining === 0)}
                  onClick={handleSubmit}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {files.length === 0 ? "Add at least one invoice" : `Check ${files.length} invoice${files.length > 1 ? "s" : ""} for price hikes`}
                  {!isProcessing && files.length > 0 && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Multiple invoices from the same supplier give a better comparison
                </p>
              </CardContent>
            </>
          )}

          {/* Step 1 — Processing */}
          {currentStep === 1 && (
            <CardContent className="py-12">
              <StatusDisplay logs={terminalLogs} progress={progress} isProcessing={isProcessing} />
            </CardContent>
          )}

          {/* Step 2 — Results */}
          {currentStep === 2 && auditResult && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <CardTitle className="text-2xl">Audit Complete</CardTitle>
                <CardDescription>
                  Checked {auditResult.invoices_processed} invoice{auditResult.invoices_processed !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center">
                    <TrendingDown className="h-5 w-5 text-rose-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-rose-400">
                      ${auditResult.total_historical_loss.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Margin leaked to price hikes</p>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                    <AlertTriangle className="h-5 w-5 text-amber-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-amber-400">{auditResult.total_hikes_found}</p>
                    <p className="text-xs text-muted-foreground mt-1">Price increases found</p>
                  </div>
                </div>

                {auditResult.total_hikes_found === 0 ? (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                    <p className="text-sm font-semibold text-emerald-400">✓ No suspicious price hikes found</p>
                    <p className="text-xs text-muted-foreground mt-1">Your supplier prices look consistent with previous invoices.</p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4">
                    <p className="text-sm font-semibold text-rose-400 mb-1">Price increases detected</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Open your dashboard to see exactly which items went up, by how much, and get a one-click dispute letter.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-semibold h-11 rounded-xl"
                  onClick={() => router.push("/dashboard")}
                >
                  View Full Report <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-10 text-sm"
                  onClick={() => { setCurrentStep(0); setFiles([]); setAuditResult(null); setProgress(0); }}
                >
                  Check another invoice
                </Button>
              </CardContent>
            </>
          )}
        </Card>

        {/* Error dialog */}
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="h-5 w-5" /> Couldn&apos;t process that invoice
              </DialogTitle>
              <DialogDescription className="pt-2">
                {errorMessage}
              </DialogDescription>
            </DialogHeader>
            <p className="text-xs text-muted-foreground px-1">
              Common causes: blurry scans, password-protected PDFs, or non-standard invoice formats.
              Try a cleaner scan or a different invoice.
            </p>
            <DialogFooter className="mt-4">
              <Button onClick={() => { setShowErrorDialog(false); setCurrentStep(0); }} className="bg-emerald-500 hover:bg-emerald-600 text-background">
                Try Again
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
