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


const STEPS = [
  { title: "Upload Invoices", desc: "Upload your last 3 supplier invoices (PDF)" },
  { title: "AI Analysis", desc: "Our AI extracts and compares every line item" },
  { title: "See Your Results", desc: "Discover exactly how much you've been overcharged" },
];

const StatusDisplay = ({ logs, isProcessing }: { logs: string[], isProcessing: boolean }) => {
  // Map complex logs to friendly messages
  const getFriendlyStatus = () => {
    if (!isProcessing && logs.length === 0) return "Ready to audit";
    const lastLog = logs[logs.length - 1] || "";
    
    if (lastLog.includes("Initializing")) return "Initializing PriceShield Agent...";
    if (lastLog.includes("Waiting for invoice")) return "Waiting for uploads...";
    if (lastLog.includes("Extracting items")) return "AI is extracting line items...";
    if (lastLog.includes("Success: Extracted")) return "Extraction complete!";
    if (lastLog.includes("Running historical comparison")) return "Analyzing price hikes...";
    if (lastLog.includes("Saving results")) return "Finalizing your report...";
    if (lastLog.includes("SUCCESS")) return "Audit Complete!";
    if (lastLog.includes("ERROR")) return "Something went wrong.";
    
    return "Processing your data...";
  };

  const status = getFriendlyStatus();
  
  return (
    <div className="w-full max-w-md mx-auto py-8 px-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl flex flex-col items-center space-y-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        </div>
        <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-t-2 border-emerald-500 animate-[spin_3s_linear_infinite]" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white tracking-tight">{status}</h3>
        <p className="text-sm text-emerald-500/60 font-medium">
            {logs.length > 0 ? `Stage ${Math.min(3, Math.ceil(logs.length / 7))} of 3: Deep Analysis` : "Connecting to AI Engine..."}
        </p>
      </div>

      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
        <div 
            className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
            style={{ width: `${Math.min(95, (logs.length / 25) * 100)}%` }} 
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-emerald-500 uppercase font-black tracking-widest">Neural Link Active</span>
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

  // Stable Polling State via useRef to survive re-renders
  const pollJobIdRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (!jobId || !isProcessing) {
        isPollingRef.current = false;
        pollJobIdRef.current = null;
        return;
    }
    
    // Prevent duplicate loops for the same jobId
    if (isPollingRef.current && pollJobIdRef.current === jobId) return;

    console.log("%c[PS-FIX] POLLING LOOP STARTING", "color: #3b82f6; font-weight: bold", { jobId });
    isPollingRef.current = true;
    pollJobIdRef.current = jobId;

    let pollCount = 0;
    const runPoll = async () => {
      // Check if we should still be polling
      if (!isPollingRef.current || pollJobIdRef.current !== jobId) {
          console.log("[PS-FIX] Stop signal received, exiting poll loop");
          return;
      }

      pollCount++;
      try {
        console.log(`[PS-FIX] #${pollCount} - Requesting Token...`);
        const token = await getToken();
        if (!token) {
          console.warn(`[PS-FIX] #${pollCount} - No token, retrying in 3s`);
          setTimeout(runPoll, 3000);
          return;
        }

        console.log(`[PS-FIX] #${pollCount} - Fetching Status & Logs for ${jobId}...`);
        // Using separate awaits for even finer logging if needed, or Promise.all
        const [statusData, logsData] = await Promise.all([
          api.getJobStatus(token, jobId),
          api.getJobLogs(token, jobId)
        ]);

        console.log(`%c[PS-FIX] #${pollCount} - RESPONSE RECEIVED`, "color: #10b981", { 
            status: statusData?.status, 
            logs: logsData?.length 
        });

        // Always update terminalLogs if it's an array to ensure the UI has the latest
        if (Array.isArray(logsData)) {
            setTerminalLogs(logsData.map((l: { message: string }) => l.message));
        }

        if (statusData.status === "completed") {
          console.log("[PS-FIX] MATCH! Status completed. Finalizing UI in 2s...");
          setAuditResult(statusData);
          setTimeout(() => {
            if (isPollingRef.current) {
              setCurrentStep(2);
              setIsProcessing(false);
              setJobId(null);
              router.refresh();
            }
          }, 2000);
          return;
        } else if (statusData.status === "failed") {
          console.error("[PS-FIX] Status failed:", statusData.error);
          setErrorMessage(statusData.error || "Audit failed.");
          setShowErrorDialog(true);
          setIsProcessing(false);
          setJobId(null);
          return;
        }

        // Recursive call for next poll
        if (pollCount < 400 && isPollingRef.current) {
          setTimeout(runPoll, 2000);
        } else {
          console.warn("[PS-FIX] Loop reached max count or was stopped.");
          if (pollCount >= 400) {
              setErrorMessage("Audit timed out.");
              setShowErrorDialog(true);
              setIsProcessing(false);
          }
        }
      } catch (err) {
        console.error(`[PS-FIX] #${pollCount} - EXCEPTION:`, err);
        // Retry on error
        if (isPollingRef.current) setTimeout(runPoll, 3000);
      }
    };

    runPoll();

    return () => {
      console.log("[PS-FIX] Effect cleanup triggered");
      // We don't necessarily want to stop polling if it's just a re-render
      // unless jobId changed or isProcessing became false.
    };
  }, [jobId, isProcessing, getToken, router]);

  const handleSubmit = async () => {
    if (files.length < 2) return;
    console.log("[PS] === SUBMIT CLICKED ===", files.length, "files");
    setIsProcessing(true);
    setError("");
    setTerminalLogs([]);
    setCurrentStep(1);
    
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      console.log("[PS] got token, creating job...");

      // Save Address if provided/missing
      const selectedLoc = settings?.locations.find(l => l.id === selectedLocationId);
      if (selectedLoc && !selectedLoc.address && addrStreet && addrCity) {
        const fullAddr = [addrStreet, addrCity, addrZip].filter(Boolean).join(", ");
        await api.updateLocation(token, selectedLocationId, {
          name: selectedLoc.name,
          address: fullAddr
        });
      }

      // Step 1: Create job instantly (writes to Firestore, returns job_id)
      const { job_id } = await api.createAuditJob(token);
      console.log("[PS] JOB CREATED:", job_id);
      setJobId(job_id); // Triggers polling immediately!

      // Step 2: Fire file upload in background (don't await)
      api.uploadAuditFiles(token, files, job_id, selectedLocationId).then(() => {
        console.log("[PS] upload finished OK");
      }).catch((err) => {
        console.error("[PS] upload error:", err);
      });

    } catch (err) {
      console.error("[PS] SUBMIT ERROR:", err);
      const msg = err instanceof Error ? err.message : "Audit failed";
      setErrorMessage(msg);
      setShowErrorDialog(true);
      setCurrentStep(0);
      setIsProcessing(false);
      setJobId(null);
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
            <CardContent className="py-12">
               <StatusDisplay logs={terminalLogs} isProcessing={isProcessing} />
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
                
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-bold mb-3 text-center">Process Audit Trail</p>
                  <StatusDisplay logs={terminalLogs} isProcessing={isProcessing} />
                </div>
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
