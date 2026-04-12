"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  Loader2, 
  Plus,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { api, AuditResult, UserSettings } from "@/lib/api";
import Link from "next/link";
import { useEffect } from "react";

const STEPS = [
  { title: "Upload Invoices", desc: "Upload your last 3 supplier invoices (PDF)" },
  { title: "AI Analysis", desc: "Our AI extracts and compares every line item" },
  { title: "See Your Results", desc: "Discover exactly how much you've been overcharged" },
];

const ProcessingTerminal = ({ logs }: { logs: string[] }) => {
  useEffect(() => {
    const terminal = document.getElementById("terminal-logs");
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
  }, [logs]);

  return (
    <div className="w-full max-w-xl mx-auto rounded-xl border border-emerald-500/20 bg-black/40 backdrop-blur-xl p-4 font-mono text-xs overflow-hidden shadow-2xl">
      <div className="flex gap-1.5 mb-3 border-b border-white/5 pb-2">
        <div className="h-2 w-2 rounded-full bg-rose-500/50" />
        <div className="h-2 w-2 rounded-full bg-amber-500/50" />
        <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
        <span className="ml-2 text-[10px] text-muted-foreground/60 uppercase tracking-tighter">AI_Agent_Real_Time.log</span>
      </div>
      <div id="terminal-logs" className="h-48 overflow-y-auto space-y-1 scrollbar-hide">
        {logs.map((log, i) => (
          <div key={i} className={`${log.startsWith(">") ? "text-emerald-400/80" : "text-emerald-400"} animate-in fade-in slide-in-from-left-2 duration-300`}>
            <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
            {log}
          </div>
        ))}
        <div className="h-1 w-full animate-pulse bg-emerald-500/20 rounded mt-1" />
      </div>
    </div>
  );
};

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
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  
  // Address Setup State
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let incomingFiles: File[] = [];
    
    if ('target' in e && e.target instanceof HTMLInputElement && e.target.files) {
      incomingFiles = Array.from(e.target.files);
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      incomingFiles = Array.from(e.dataTransfer.files);
    }

    const newFiles = incomingFiles.filter((f) => f.type === "application/pdf");
    
    if (newFiles.length === 0 && incomingFiles.length > 0) {
      setError("Please upload PDF files only.");
      return;
    }

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
  }, [isFree, uploadsRemaining]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e);
  }, [handleFileChange]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (error && error.includes("limit")) setError("");
  };

  const handleSaveAddress = async () => {
    if (!addrStreet || !addrCity) return;
    setIsSavingAddress(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const selectedLoc = settings?.locations.find(l => l.id === selectedLocationId);
      if (!selectedLoc) throw new Error("No location selected");

      const fullAddr = [addrStreet, addrCity, addrZip].filter(Boolean).join(", ");
      await api.updateLocation(token, selectedLocationId, {
        name: selectedLoc.name,
        address: fullAddr
      });

      // Update local state to hide the box
      if (!settings) return;
      
      const updatedLocations = settings.locations.map(l => 
        l.id === selectedLocationId ? { ...l, address: fullAddr } : l
      );
      
      setSettings(prev => prev ? ({ ...prev, locations: updatedLocations }) : null);
    } catch (err) {
      console.error("Failed to save address:", err);
      alert("Failed to save address. Please try again.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Reliable Polling Effect
  useEffect(() => {
    if (!jobId || !isProcessing) return;

    let pollCount = 0;
    const interval = setInterval(async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const [statusData, logsData] = await Promise.all([
          api.getJobStatus(token, jobId),
          api.getJobLogs(token, jobId)
        ]);

        if (logsData) {
          setTerminalLogs(logsData.map(l => l.message));
        }

        if (statusData.status === "completed") {
          setAuditResult(statusData);
          setCurrentStep(2);
          setIsProcessing(false);
          setJobId(null);
          clearInterval(interval);
          // Force dashboard refresh so KPIs are updated
          setTimeout(() => router.refresh(), 1000);
        } else if (statusData.status === "failed") {
          setErrorMessage(statusData.error || "Audit failed unexpectedly.");
          setShowErrorDialog(true);
          setIsProcessing(false);
          setJobId(null);
          clearInterval(interval);
        }
        
        // Safety timeout after 10 minutes
        pollCount++;
        if (pollCount > 400) { // ~10 mins at 1.5s
           clearInterval(interval);
           setErrorMessage("Audit timed out. Please check your data and try again.");
           setShowErrorDialog(true);
           setIsProcessing(false);
        }
      } catch (pollErr) {
        console.error("Polling error:", pollErr);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId, isProcessing]);

  const handleSubmit = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    setError("");
    setTerminalLogs([]);
    
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      // Save Address if provided/missing
      const selectedLoc = settings?.locations.find(l => l.id === selectedLocationId);
      if (selectedLoc && !selectedLoc.address && addrStreet && addrCity) {
        const fullAddr = [addrStreet, addrCity, addrZip].filter(Boolean).join(", ");
        await api.updateLocation(token, selectedLocationId, {
          name: selectedLoc.name,
          address: fullAddr
        });
      }

      setCurrentStep(1);
      const { job_id } = await api.runAudit(token, files, selectedLocationId);
      setJobId(job_id);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Audit failed";
      setErrorMessage(msg);
      setShowErrorDialog(true);
      setCurrentStep(0);
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-emerald-500/8 blur-3xl animate-pulse-glow" />
      </div>

      {/* Header - Simplified for Dashboard */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Manual Price Audit</h1>
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

        <div className="flex flex-col items-center">
        {/* Step content */}
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur border-border/50">
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
                  <div className="space-y-2 mb-6" id="tour-upload-location">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                      Target Audit Location
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        {settings.locations.length === 1 ? (
                          <div className="w-full h-11 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 flex items-center gap-2 text-sm font-bold text-emerald-400">
                             <MapPin className="h-4 w-4" />
                             <span>{settings.locations[0].name}</span>
                             <Badge variant="outline" className="ml-auto text-[9px] uppercase border-emerald-500/30 text-emerald-400/80">Default Location</Badge>
                          </div>
                        ) : (
                          <Select 
                            value={selectedLocationId} 
                            onValueChange={(val) => setSelectedLocationId(val || "")}
                          >
                            <SelectTrigger className="w-full h-11 bg-background/50 border-border/50 rounded-xl px-4 text-sm font-medium">
                              <SelectValue placeholder="Select Location" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover/80 backdrop-blur-xl border-border/50 rounded-xl shadow-2xl">
                              {settings.locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>{loc.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <Link href="/dashboard/locations">
                        <Button variant="outline" size="icon" className="shrink-0 h-11 w-11 rounded-xl border-border/50 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors" title="Manage Locations">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* New: Address Setup if missing */}
                {settings && selectedLocationId && !settings.locations.find(l => l.id === selectedLocationId)?.address && (
                  <div className="space-y-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <MapPin className="h-4 w-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">Setup Restaurant Address</p>
                    </div>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed">
                      Enter your physical site address so our AI can match future invoices to this location automatically.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Street</label>
                        <input
                          type="text"
                          value={addrStreet}
                          onChange={(e) => setAddrStreet(e.target.value)}
                          placeholder="e.g. 123 Business Way"
                          className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">City</label>
                        <input
                          type="text"
                          value={addrCity}
                          onChange={(e) => setAddrCity(e.target.value)}
                          placeholder="New York"
                          className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Zip / Region</label>
                        <input
                          type="text"
                          value={addrZip}
                          onChange={(e) => setAddrZip(e.target.value)}
                          placeholder="10001"
                          className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={handleSaveAddress}
                         disabled={!addrStreet || !addrCity || isSavingAddress}
                         className="h-9 px-4 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all"
                       >
                         {isSavingAddress ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle className="h-3 w-3 mr-2" />}
                         Save Location Address
                       </Button>
                    </div>
                  </div>
                )}

                {/* Drop zone */}
                <label 
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                    isDragging 
                      ? "border-emerald-500 bg-emerald-500/10 scale-[0.99]" 
                      : "border-border/50 bg-muted/30 hover:border-emerald-500/40"
                  }`}
                >
                  <Upload className={`h-8 w-8 mb-2 transition-colors ${isDragging ? "text-emerald-400" : "text-muted-foreground"}`} />
                  <span className="text-sm text-muted-foreground">
                    {isDragging ? "Drop to upload" : (
                      <>Drop PDFs here or <span className="text-emerald-400 font-medium">browse</span></>
                    )}
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
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="h-12 w-12 text-emerald-400 animate-spin relative" />
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-lg font-bold tracking-tight">AI Agent Processing</p>
                <p className="text-xs text-muted-foreground px-10">
                  Our neural engine is precisely extracting and matching every line item across {files.length} invoices.
                </p>
              </div>

              <ProcessingTerminal logs={terminalLogs} />
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

      {/* Error Details Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-5 w-5" /> Audit Failed
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/80">
              We couldn&apos;t process your historical audit for the following reason:
            </DialogDescription>
          </DialogHeader>
          
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 my-2">
            <p className="text-sm font-mono text-rose-400 break-words">
              {errorMessage}
            </p>
          </div>

          <p className="text-xs text-muted-foreground px-1">
            Common reasons include blurry scans, incorrect file formats, or exceeding your plan&apos;s location limits.
          </p>

          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowErrorDialog(false)}
              className="border-border/50"
            >
              Close
            </Button>
            <Button 
              onClick={() => setShowErrorDialog(false)}
              className="bg-emerald-500 hover:bg-emerald-600 text-background"
            >
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
