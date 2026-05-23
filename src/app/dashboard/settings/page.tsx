"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell,
  Mail,
  Send,
  ExternalLink,
  Loader2,
  Check,
  Copy,
  Shield,
  AlertTriangle,
  X,
  Plus,
  ArrowRight,
  Hash,
  Key,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { api, UserSettings, SettingsUpdate, APIKeyListItem, APIKeyResponse } from "@/lib/api";

export default function SettingsPage() {
  const { getToken, user } = useAuth();
  const searchParams = useSearchParams();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedInbox, setCopiedInbox] = useState(false);
  const [success, setSuccess] = useState("");
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [showConfirmDisconnectSlack, setShowConfirmDisconnectSlack] = useState(false);

  // Form state
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [forwardingEmails, setForwardingEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [alertChannels, setAlertChannels] = useState<string[]>(["push", "email"]);
  
  // Reporting Preferences
  const [alertEmail, setAlertEmail] = useState("");
  const [reportDaily, setReportDaily] = useState(false);
  const [reportWeekly, setReportWeekly] = useState(true);
  const [reportMonthly, setReportMonthly] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(2.0);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  
  const [triggeringReport, setTriggeringReport] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKeyListItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyResponse, setNewKeyResponse] = useState<APIKeyResponse | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Claude OAuth copy states
  const [copiedOAuthSse, setCopiedOAuthSse] = useState(false);
  const [copiedOAuthAuth, setCopiedOAuthAuth] = useState(false);
  const [copiedOAuthToken, setCopiedOAuthToken] = useState(false);
  const [copiedOAuthClientId, setCopiedOAuthClientId] = useState(false);
  const [copiedOAuthClientSecret, setCopiedOAuthClientSecret] = useState(false);

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const fetchKeys = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getKeys(token);
      setApiKeys(data || []);
    } catch (err) {
      console.error("Failed to load API keys", err);
    } finally {
      setLoadingKeys(false);
    }
  }, [getToken]);

  const fetchSettings = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getSettings(token);
      setSettings(data);
      setWhatsappNumber(data.whatsapp_number || "");
      setForwardingEmails(data.forwarding_emails || []);
      setAlertChannels(data.alert_channels || ["push", "email"]);
      setAlertEmail(data.alert_email || "");
      setReportDaily(data.report_daily);
      setReportWeekly(data.report_weekly);
      setReportMonthly(data.report_monthly);
      setAlertThreshold(data.alert_threshold || 2.0);
      setSlackWebhookUrl(data.slack_webhook_url || "");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load settings";
      setError(msg);
    } finally {
      setLoading(false);
      // Give React a cycle to apply the state updates before letting the save EFFECT run
      setTimeout(() => {
        initialLoadDone.current = true;
      }, 0);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSettings();
    fetchKeys();
  }, [fetchSettings, fetchKeys]);

  // Handle Slack OAuth redirect status
  useEffect(() => {
    const slackStatus = searchParams.get('slack');
    if (slackStatus === 'success') {
      setSuccess("Slack account connected successfully!");
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      fetchSettings();
    } else if (slackStatus === 'error') {
      setError("Failed to connect Slack account. Please try again.");
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, fetchSettings]);

  const handleDisconnectTelegram = async () => {
    setShowConfirmDisconnect(false);
    try {
      const token = await getToken();
      if (!token) return;
      await api.disconnectTelegram(token);
      await fetchSettings(); // Refresh to show "Not linked"
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to disconnect Telegram";
      setError(msg);
    } finally {
    }
  };

  const handleDisconnectSlack = async () => {
    setShowConfirmDisconnectSlack(false);
    try {
      const token = await getToken();
      if (!token) return;
      await api.disconnectSlack(token);
      await fetchSettings(); 
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to disconnect Slack";
      setError(msg);
    }
  };

  // Automatically save settings when state changes (debounced)
  useEffect(() => {
    // Only save if we have loaded the initial settings AND we are past the initial fetch
    if (loading || !settings || !initialLoadDone.current) return;

    // Deep compare to prevent saving when initial data is fetched
    const isDirty = 
      whatsappNumber !== (settings.whatsapp_number || "") ||
      JSON.stringify(forwardingEmails) !== JSON.stringify(settings.forwarding_emails || []) ||
      JSON.stringify(alertChannels) !== JSON.stringify(settings.alert_channels || ["push", "email"]) ||
      alertEmail !== (settings.alert_email || "") ||
      reportDaily !== settings.report_daily ||
      reportWeekly !== settings.report_weekly ||
      reportMonthly !== settings.report_monthly ||
      alertThreshold !== (settings.alert_threshold || 2.0) ||
      slackWebhookUrl !== (settings.slack_webhook_url || "");

    if (!isDirty) return;

    const saveTimer = setTimeout(async () => {
      setSaving(true);
      setSaved(false);
      setError("");
      try {
        const token = await getToken();
        if (!token) return;

        const update: SettingsUpdate = {
          whatsapp_number: whatsappNumber || null,
          forwarding_emails: forwardingEmails,
          alert_channels: alertChannels,
          alert_email: alertEmail || null,
          report_daily: reportDaily,
          report_weekly: reportWeekly,
          report_monthly: reportMonthly,
          alert_threshold: alertThreshold,
          slack_webhook_url: slackWebhookUrl || null,
        };

        await api.updateSettings(token, update);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save settings";
        setError(msg);
      } finally {
        setSaving(false);
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(saveTimer);
  }, [
    whatsappNumber,
    forwardingEmails,
    alertChannels,
    alertEmail,
    reportDaily,
    reportWeekly,
    reportMonthly,
    alertThreshold,
    slackWebhookUrl,
    loading,
    settings,
    getToken,
  ]);

  const toggleChannel = (channel: string) => {
    setAlertChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleTestReport = async (cycle: string) => {
    const token = await getToken();
    if (!token || !settings || !user?.id) return;
    setTriggeringReport(cycle);
    try {
      await api.triggerTestReport(token, cycle, user.id);
      setSuccess(`Test ${cycle} report sent successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to send test report: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setTriggeringReport(null);
    }
  };

  const addEmail = () => {
    if (newEmail && newEmail.includes("@") && !forwardingEmails.includes(newEmail)) {
      setForwardingEmails([...forwardingEmails, newEmail]);
      setNewEmail("");
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setForwardingEmails(forwardingEmails.filter(e => e !== emailToRemove));
  };

  const telegramDeepLink = user?.id
    ? `https://t.me/PriceShieldBot?start=${user.id}`
    : "";

  const copyTelegramLink = () => {
    navigator.clipboard.writeText(telegramDeepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inboxEmail = settings?.priceshield_inbox_email || "";
  const copyInboxEmail = () => {
    if (!inboxEmail) return;
    navigator.clipboard.writeText(inboxEmail);
    setCopiedInbox(true);
    setTimeout(() => setCopiedInbox(false), 2000);
  };

  const handleCreateKey = async () => {
    const keyName = newKeyName.trim() || "Default";
    setIsCreatingKey(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.createKey(token, keyName, "api_free");
      setNewKeyResponse(data);
      setNewKeyName("");
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      await api.deleteKey(token, keyId);
      await fetchKeys();
      setSuccess("API key revoked successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    }
  };

  const copyRawKey = () => {
    if (!newKeyResponse?.raw_key) return;
    navigator.clipboard.writeText(newKeyResponse.raw_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  const isFree = settings?.tier === "free";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your alert channels and email forwarding
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3">
          <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Email Forwarding Setup */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle>Email Forwarding</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-1">
                Forward supplier invoices and we&apos;ll extract them automatically with AI.
                <Link href="/blog/mastering-auto-forwarding" className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 font-medium">
                  Setup Guide <ArrowRight className="h-3 w-3" />
                </Link>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Step 1: The PriceShield inbox address */}
          <div>
            <p className="text-sm font-medium mb-2">📬 Forward invoices to this address:</p>
            {inboxEmail ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm sm:text-base font-mono font-semibold text-emerald-400 tracking-wide break-all min-w-0">
                  {inboxEmail}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInboxEmail}
                  className="h-11 sm:h-11 px-3 w-full sm:w-auto flex items-center justify-center"
                >
                  {copiedInbox ? <Check className="h-4 w-4 text-emerald-400 mr-2 sm:mr-0" /> : <Copy className="h-4 w-4 mr-2 sm:mr-0" />}
                  <span className="sm:hidden text-xs">Copy Address</span>
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
                ⚠️ Inbox not configured yet. Set <code className="bg-muted/30 px-1.5 py-0.5 rounded text-xs">INGESTION_EMAIL</code> in the backend .env file.
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="rounded-lg border border-border/50 bg-muted/10 p-4 space-y-3">
            <p className="text-sm font-medium">How it works:</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                <p className="text-sm text-muted-foreground">Get an invoice email from your supplier? Just <strong className="text-foreground">forward it</strong> to the address above</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                <p className="text-sm text-muted-foreground">Our AI <strong className="text-foreground">extracts every line item</strong> from the PDF automatically</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold-3">3</span>
                <p className="text-sm text-muted-foreground">You get <strong className="text-foreground">instant alerts</strong> on Telegram or email if any prices went up &gt;2%</p>
              </div>
            </div>
          </div>

          {/* Step 2: Supplier emails (optional mapping) */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">
                Your Supplier Emails <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                If suppliers email you (and you auto-forward to us), add their addresses here so we can match invoices to your account.
              </p>
            </div>

            {forwardingEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {forwardingEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="pl-3 pr-1.5 py-1 text-sm bg-emerald-500/10 text-emerald-400 border-0 flex items-center gap-1">
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:bg-emerald-500/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isFree && addEmail()}
                placeholder="supplier@vendor.com"
                disabled={isFree}
                className="flex-1 rounded-lg border border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button onClick={addEmail} type="button" variant="outline" className="h-[42px]" disabled={isFree}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {isFree && (
              <p className="text-sm text-rose-400 mt-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Auto-forwarding requires Pro Shield. <a href="/dashboard/billing" className="underline font-medium ml-1">Upgrade now</a>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Channels */}
      <Card id="tour-settings-channels" className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <CardTitle>Alert Channels</CardTitle>
              <CardDescription>
                Choose how you want to receive price hike notifications
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <Badge variant="outline" className="animate-pulse flex items-center gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-[10px]">Saving...</span>
              </Badge>
            )}
            {saved && (
              <Badge variant="outline" className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5">
                <Check className="h-3 w-3" />
                <span className="text-[10px]">Saved</span>
              </Badge>
            )}
            {!saving && !saved && (
              <span className="text-xs text-muted-foreground italic opacity-50">Auto-save active</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Telegram */}
          <div className="rounded-lg border border-border/50 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-[140px]">
                <Send className="h-5 w-5 text-sky-400" />
                <div>
                  <p className="font-medium text-sm">Telegram</p>
                  <p className="text-xs text-muted-foreground">Interactive Bot</p>
                  <p className="text-[10px] text-sky-400 opacity-80">Supports PROOF & AI CFO chat</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 ml-auto sm:ml-0">
                {settings?.telegram_linked ? (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-2">
                       <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Alerts</span>
                       <button
                         onClick={() => !isFree && toggleChannel("telegram")}
                         disabled={isFree}
                         className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                           alertChannels.includes("telegram") ? "bg-emerald-500" : "bg-muted"
                         } ${isFree ? "opacity-50 cursor-not-allowed" : ""}`}
                       >
                         <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                           alertChannels.includes("telegram") ? "translate-x-5" : ""
                         }`} />
                       </button>
                    </div>
                    <div className="border-l border-border/40 h-8 mx-2 hidden sm:block" />
                    <div className="flex flex-col items-end">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-0 h-6 mb-1">
                        <Check className="h-3 w-3 mr-1" /> Linked
                      </Badge>
                      <button 
                        onClick={() => setShowConfirmDisconnect(true)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-[9px] uppercase tracking-wider font-bold p-1"
                      >
                        Disconnect Bot
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="border-0 h-6">Not linked</Badge>
                    <button
                      onClick={() => !isFree && toggleChannel("telegram")}
                      disabled={isFree}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        alertChannels.includes("telegram") ? "bg-emerald-500" : "bg-muted"
                      } ${isFree ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        alertChannels.includes("telegram") ? "translate-x-5" : ""
                      }`} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!settings?.telegram_linked && !isFree && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                <div className="flex-1 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground font-mono break-all min-w-0">
                  {telegramDeepLink || "Sign in to get your link"}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none h-9"
                    onClick={copyTelegramLink}
                    disabled={!telegramDeepLink}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 mr-2" /> : <Copy className="h-3.5 w-3.5 mr-2" />}
                    <span className="text-[11px]">Copy Link</span>
                  </Button>
                  <a href={telegramDeepLink} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                    <Button variant="outline" size="sm" className="w-full h-9" disabled={!telegramDeepLink}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            )}
            {isFree && (
              <p className="text-sm text-rose-400 mt-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Telegram alerts require Pro Shield. <a href="/dashboard/billing" className="underline font-medium ml-1">Upgrade now</a>
              </p>
            )}
          </div>


          {/* Email Alerts */}
          <div className="rounded-lg border border-border/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="font-medium text-sm">Email Alerts</p>
                  <p className="text-xs text-muted-foreground">Transactional email via OneSignal</p>
                </div>
              </div>
              <button
                onClick={() => toggleChannel("email")}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  alertChannels.includes("email")
                    ? "bg-emerald-500"
                    : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    alertChannels.includes("email") ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
            
            {alertChannels.includes("email") && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Target Email (Optional override)</p>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder={settings?.email || "Enter alert email"}
                  className="w-full bg-muted/20 border border-border/50 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
          
          {/* Slack */}
          <div className="rounded-lg border border-border/50 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-[140px]">
                <Hash className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="font-medium text-sm">Slack App</p>
                  <p className="text-xs text-muted-foreground">Snapshot & Send + AI CFO</p>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-auto sm:ml-0">
                {settings?.slack_linked ? (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-2">
                       <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Alerts</span>
                       <button
                         onClick={() => !isFree && toggleChannel("slack")}
                         disabled={isFree}
                         className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                           alertChannels.includes("slack") ? "bg-emerald-500" : "bg-muted"
                         } ${isFree ? "opacity-50 cursor-not-allowed" : ""}`}
                       >
                         <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                           alertChannels.includes("slack") ? "translate-x-5" : ""
                         }`} />
                       </button>
                    </div>
                    <div className="border-l border-border/40 h-8 mx-2 hidden sm:block" />
                    <div className="flex flex-col items-end">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-0 h-6 mb-1">
                        <Check className="h-3 w-3 mr-1" /> Linked
                      </Badge>
                      <button 
                        onClick={() => setShowConfirmDisconnectSlack(true)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-[9px] uppercase tracking-wider font-bold p-1"
                      >
                        Disconnect Slack
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="border-0 h-6">Not linked</Badge>
                    <button
                      onClick={() => !isFree && toggleChannel("slack")}
                      disabled={isFree}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        alertChannels.includes("slack") ? "bg-emerald-500" : "bg-muted"
                      } ${isFree ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        alertChannels.includes("slack") ? "translate-x-5" : ""
                      }`} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!settings?.slack_linked && !isFree && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Bidirectional App Setup</p>
                <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-4 space-y-3">
                  <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest">Connect to Your Workspace</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Automatically link your PriceShield account and enable deep interactive audits and AI CFO chat in Slack.
                  </p>
                  <a 
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'https://priceshield-api-647257091960.us-central1.run.app'}/webhook/slack/install?uid=${user?.id}`}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-md transition-all shadow-lg shadow-purple-900/20"
                  >
                    <Plus className="h-3 w-3" /> Connect to Slack
                  </a>
                </div>
              </div>
            )}

            {!isFree && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Legacy Webhook URL <span className="text-[10px] opacity-60 font-normal">(Push Alerts only)</span></p>
                <input
                  type="text"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full bg-muted/20 border border-border/50 rounded-md px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}

            {isFree && (
              <p className="text-sm text-rose-400 mt-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Slack integration requires Pro Shield. <a href="/dashboard/billing" className="underline font-medium ml-1">Upgrade now</a>
              </p>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Alert Sensitivity */}
      <Card id="tour-settings-sensitivity" className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle>Alert Sensitivity</CardTitle>
              <CardDescription>
                Define the minimum price increase (%) that should trigger an alert
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Notification Threshold</span>
              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold border border-emerald-500/20">
                {alertThreshold}%
              </span>
            </div>
            <div className="relative pt-1">
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-muted/30 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-2 px-1">
                <span>0.5% (Sensitive)</span>
                <span>10%</span>
                <span>20% (Conservative)</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We recommend <span className="text-emerald-400 font-bold">2%</span> for most restaurants to ignore minor market fluctuations while catching meaningful supplier jumps.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reporting Preferences */}
      <Card id="tour-settings-reports" className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <CardTitle>Reporting Preferences</CardTitle>
              <CardDescription>
                Receive automated summaries of your margin performance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Daily Report */}
          <div className={`flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/5 ${isFree ? "opacity-50 grayscale" : ""}`}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Daily Summary</p>
                <button
                  onClick={() => handleTestReport("daily")}
                  disabled={triggeringReport === "daily" || isFree}
                  className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50"
                >
                  {triggeringReport === "daily" ? "Sending..." : "Test"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Every morning at 8:00 AM</p>
            </div>
            <button
              onClick={() => !isFree && setReportDaily(!reportDaily)}
              disabled={isFree}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                reportDaily ? "bg-emerald-500" : "bg-muted"
              } ${isFree ? "cursor-not-allowed" : ""}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  reportDaily ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Weekly Report */}
          <div className={`flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/5 ${isFree ? "opacity-50 grayscale" : ""}`}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Weekly Digest</p>
                <button
                  onClick={() => handleTestReport("weekly")}
                  disabled={triggeringReport === "weekly" || isFree}
                  className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50"
                >
                  {triggeringReport === "weekly" ? "Sending..." : "Test"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Every Monday morning</p>
            </div>
            <button
              onClick={() => !isFree && setReportWeekly(!reportWeekly)}
              disabled={isFree}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                reportWeekly ? "bg-emerald-500" : "bg-muted"
              } ${isFree ? "cursor-not-allowed" : ""}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  reportWeekly ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Monthly Report */}
          <div className={`flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/5 ${isFree ? "opacity-50 grayscale" : ""}`}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Monthly Insight</p>
                <button
                  onClick={() => handleTestReport("monthly")}
                  disabled={triggeringReport === "monthly" || isFree}
                  className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50"
                >
                  {triggeringReport === "monthly" ? "Sending..." : "Test"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">First day of each month</p>
            </div>
            <button
              onClick={() => !isFree && setReportMonthly(!reportMonthly)}
              disabled={isFree}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                reportMonthly ? "bg-emerald-500" : "bg-muted"
              } ${isFree ? "cursor-not-allowed" : ""}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  reportMonthly ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {isFree && (
            <p className="text-sm text-rose-400 mt-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Automated reports require Pro Shield. <a href="/dashboard/billing" className="underline font-medium ml-1">Upgrade now</a>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Developer API Keys */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Key className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <CardTitle>Developer API Keys</CardTitle>
              <CardDescription>
                Generate and manage API keys to connect external AI tools (like Claude Desktop or Cursor) via MCP
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* List of active keys */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Your API Keys</h3>
            {loadingKeys ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
              </div>
            ) : apiKeys.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-muted/10 border border-border/40 p-4 rounded-lg">
                No API keys generated yet. Generate a key below to connect your local IDE or AI client.
              </p>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="p-3 font-semibold text-muted-foreground">Name</th>
                      <th className="p-3 font-semibold text-muted-foreground">Prefix</th>
                      <th className="p-3 font-semibold text-muted-foreground">Created</th>
                      <th className="p-3 font-semibold text-muted-foreground">Last Used</th>
                      <th className="p-3 font-semibold text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-medium">{key.name}</td>
                        <td className="p-3"><code className="bg-muted/40 px-1.5 py-0.5 rounded font-mono text-[11px]">{key.key_prefix}...</code></td>
                        <td className="p-3 text-muted-foreground">{new Date(key.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-muted-foreground">
                          {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Key Generator Form */}
          <div className="pt-4 border-t border-border/30 space-y-3">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generate New API Key</h4>
              <p className="text-xs text-muted-foreground">API keys let your custom MCP clients pull data for your user account.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Cursor IDE"
                disabled={isCreatingKey}
                className="flex-1 rounded-lg border border-border/50 bg-background/50 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all disabled:opacity-50"
              />
              <Button
                onClick={handleCreateKey}
                disabled={isCreatingKey}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-[36px]"
              >
                {isCreatingKey ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claude Web App Integration (OAuth 2.0) */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle>Claude Web Integration (OAuth 2.0)</CardTitle>
                <CardDescription>
                  Configure a native custom connector in the Claude Web App to audit invoices securely
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-purple-500/10 text-purple-400 border-0 h-6">
              OAuth 2.0 Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">How to set up in Claude.ai</p>
            <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
              <li>Open <strong>Claude.ai</strong>, click on your profile picture, and select <strong>Settings</strong> or <strong>Connectors</strong>.</li>
              <li>Click <strong>Add Connector</strong> and select <strong>Custom MCP (SSE)</strong>.</li>
              <li>Provide a Name (e.g. <code className="bg-zinc-900/60 px-1 py-0.5 rounded text-purple-300">PriceShield</code>).</li>
              <li>Copy and paste the configuration parameters shown below into their respective fields.</li>
              <li>Click <strong>Authorize</strong> to log in and establish the secure user-scoped connection.</li>
            </ol>
          </div>

          <div className="space-y-4">
            {/* SSE URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">SSE Connection URL</label>
                <button
                  onClick={() => copyToClipboard("https://priceshield-mcp-647257091960.us-central1.run.app/sse", setCopiedOAuthSse)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                >
                  {copiedOAuthSse ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedOAuthSse ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs font-mono select-all truncate">
                https://priceshield-mcp-647257091960.us-central1.run.app/sse
              </div>
            </div>

            {/* Authorize URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Authorization URL</label>
                <button
                  onClick={() => copyToClipboard("https://priceshield-mcp-647257091960.us-central1.run.app/authorize", setCopiedOAuthAuth)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                >
                  {copiedOAuthAuth ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedOAuthAuth ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs font-mono select-all truncate">
                https://priceshield-mcp-647257091960.us-central1.run.app/authorize
              </div>
            </div>

            {/* Token URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Token URL</label>
                <button
                  onClick={() => copyToClipboard("https://priceshield-mcp-647257091960.us-central1.run.app/token", setCopiedOAuthToken)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                >
                  {copiedOAuthToken ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedOAuthToken ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs font-mono select-all truncate">
                https://priceshield-mcp-647257091960.us-central1.run.app/token
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Client ID <span className="text-[10px] opacity-60">(Any string)</span></label>
                  <button
                    onClick={() => copyToClipboard("priceshield", setCopiedOAuthClientId)}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                  >
                    {copiedOAuthClientId ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedOAuthClientId ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs font-mono select-all truncate">
                  priceshield
                </div>
              </div>

              {/* Client Secret */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Client Secret <span className="text-[10px] opacity-60">(Any string)</span></label>
                  <button
                    onClick={() => copyToClipboard("priceshield-secret", setCopiedOAuthClientSecret)}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                  >
                    {copiedOAuthClientSecret ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedOAuthClientSecret ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs font-mono select-all truncate">
                  priceshield-secret
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                Overview of your integrations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/50 bg-muted/10 p-3 text-center">
              <Send className="h-5 w-5 mx-auto mb-2 text-sky-400" />
              <p className="text-xs font-medium">Telegram</p>
              <p className={`text-xs mt-1 ${settings?.telegram_linked ? "text-emerald-400" : "text-muted-foreground"}`}>
                {settings?.telegram_linked ? "✓ Connected" : "Not connected"}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/10 p-3 text-center">
              <Mail className="h-5 w-5 mx-auto mb-2 text-blue-400" />
              <p className="text-xs font-medium">Email Forwarding</p>
              <p className={`text-xs mt-1 ${forwardingEmails.length > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                {forwardingEmails.length > 0 ? `✓ ${forwardingEmails.length} Configured` : "Not configured"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showConfirmDisconnect} onOpenChange={setShowConfirmDisconnect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-5 w-5" /> Disconnect Telegram?
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure? You will stop receiving instant price alerts on Telegram. You can reconnect anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowConfirmDisconnect(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDisconnectTelegram} 
              className="bg-rose-500 hover:bg-rose-600"
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated API Key Dialog */}
      <Dialog open={!!newKeyResponse} onOpenChange={(open) => !open && setNewKeyResponse(null)}>
        <DialogContent className="max-w-lg bg-zinc-950 border border-zinc-800/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-400 text-lg">
              <Check className="h-5 w-5 text-emerald-400 animate-pulse" /> API Key Generated!
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Copy this key and save it in a safe place. You will **not** be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div className="flex items-stretch gap-2">
              <div className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 font-mono text-xs text-emerald-400 tracking-wide break-all min-w-0 select-all">
                {newKeyResponse?.raw_key}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyRawKey}
                className="h-[38px] px-3 shrink-0 flex items-center justify-center border-zinc-700/50 hover:bg-zinc-900"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-400 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                <span>{copiedKey ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
              <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">MCP Configuration Guides</p>
              
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-400 font-semibold">1. Claude Desktop Config</p>
                <p className="text-[10px] text-zinc-500">Add this to your <code className="bg-zinc-900/60 px-1 py-0.5 rounded">claude_desktop_config.json</code> file:</p>
                <pre className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-lg text-[9px] font-mono text-zinc-300 overflow-x-auto select-all">
{`{
  "mcpServers": {
    "priceshield-mcp": {
      "type": "sse",
      "url": "https://priceshield-mcp-647257091960.us-central1.run.app/sse?api_key=${newKeyResponse?.raw_key || "YOUR_API_KEY"}"
    }
  }
}`}
                </pre>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-zinc-400 font-semibold">2. Cursor IDE Config</p>
                <ul className="text-[10px] text-zinc-500 list-disc list-inside space-y-0.5 pl-1">
                  <li>Open Cursor Settings → **Features** → **MCP**.</li>
                  <li>Click **+ Add New MCP Server**.</li>
                  <li>Name: <code className="bg-zinc-900/60 px-1 rounded text-zinc-400">priceshield-mcp</code></li>
                  <li>Type: <code className="bg-zinc-900/60 px-1 rounded text-zinc-400">sse</code></li>
                  <li>URL: <code className="bg-zinc-900/60 px-1 rounded text-zinc-400 font-mono text-[9px]">https://priceshield-mcp-647257091960.us-central1.run.app/sse?api_key=${newKeyResponse?.raw_key || "YOUR_API_KEY"}</code></li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs w-full sm:w-auto h-[36px]"
              onClick={() => setNewKeyResponse(null)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
