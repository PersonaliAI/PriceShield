"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  MessageCircle,
  Mail,
  Send,
  Smartphone,
  ExternalLink,
  Loader2,
  Save,
  Check,
  Copy,
  Shield,
  AlertTriangle,
  X,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { api, UserSettings, SettingsUpdate } from "@/lib/api";

export default function SettingsPage() {
  const { getToken, user } = useAuth();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedInbox, setCopiedInbox] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  // Form state
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [forwardingEmails, setForwardingEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [alertChannels, setAlertChannels] = useState<string[]>(["push", "email"]);
  
  // Reporting Preferences
  const [reportDaily, setReportDaily] = useState(false);
  const [reportWeekly, setReportWeekly] = useState(true);
  const [reportMonthly, setReportMonthly] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getSettings(token);
      setSettings(data);
      setWhatsappNumber(data.whatsapp_number || "");
      setForwardingEmails(data.forwarding_emails || []);
      setAlertChannels(data.alert_channels || ["push", "email"]);
      setReportDaily(data.report_daily);
      setReportWeekly(data.report_weekly);
      setReportMonthly(data.report_monthly);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load settings";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleDisconnectTelegram = async () => {
    setShowConfirmDisconnect(false);
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.disconnectTelegram(token);
      await fetchSettings(); // Refresh to show "Not linked"
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to disconnect Telegram";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
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
        report_daily: reportDaily,
        report_weekly: reportWeekly,
        report_monthly: reportMonthly,
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
  };

  const toggleChannel = (channel: string) => {
    setAlertChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
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

  const telegramDeepLink = user?.uid
    ? `https://t.me/PriceShieldBot?start=${user.uid}`
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
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your alert channels and email forwarding
        </p>
      </div>

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
              <CardDescription>
                Forward supplier invoices and we&apos;ll extract them automatically with AI
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Step 1: The PriceShield inbox address */}
          <div>
            <p className="text-sm font-medium mb-2">📬 Forward invoices to this address:</p>
            {inboxEmail ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-base font-mono font-semibold text-emerald-400 tracking-wide">
                  {inboxEmail}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInboxEmail}
                  className="h-11 px-3"
                >
                  {copiedInbox ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
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
                <span className="shrink-0 h-6 w-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                <p className="text-sm text-muted-foreground">You get <strong className="text-foreground">instant alerts</strong> on Telegram, WhatsApp, or email if any prices went up &gt;2%</p>
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
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
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
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Telegram */}
          <div className="rounded-lg border border-border/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-sky-400" />
                <div>
                  <p className="font-medium text-sm">Telegram</p>
                  <p className="text-xs text-muted-foreground">Get alerts via Telegram bot</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {settings?.telegram_linked ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-0">
                      <Check className="h-3 w-3 mr-1" /> Linked
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowConfirmDisconnect(true)}
                      className="h-7 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-[10px] uppercase tracking-wider font-bold cursor-pointer"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary" className="border-0">Not linked</Badge>
                )}
                <button
                  onClick={() => !isFree && toggleChannel("telegram")}
                  disabled={isFree}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    alertChannels.includes("telegram")
                      ? "bg-emerald-500"
                      : "bg-muted"
                  } ${isFree ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      alertChannels.includes("telegram") ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {!settings?.telegram_linked && !isFree && (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground font-mono truncate">
                  {telegramDeepLink || "Sign in to get your link"}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyTelegramLink}
                  disabled={!telegramDeepLink}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <a
                  href={telegramDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" disabled={!telegramDeepLink}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            )}
            {isFree && (
              <p className="text-sm text-rose-400 mt-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Telegram alerts require Pro Shield. <a href="/dashboard/billing" className="underline font-medium ml-1">Upgrade now</a>
              </p>
            )}
          </div>

          {/* WhatsApp */}
          <div className="rounded-lg border border-border/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-medium text-sm">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Get alerts via WhatsApp messages</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://wa.me/15556359583"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-xs font-semibold"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open Chat
                </a>
                <button
                  onClick={() => !isFree && toggleChannel("whatsapp")}
                  disabled={isFree}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    alertChannels.includes("whatsapp")
                      ? "bg-emerald-500"
                      : "bg-muted"
                  } ${isFree ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      alertChannels.includes("whatsapp") ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {alertChannels.includes("whatsapp") && !isFree && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium" htmlFor="whatsapp-number">
                  WhatsApp Number (with country code)
                </label>
                <input
                  id="whatsapp-number"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                />
              </div>
            )}
            {isFree && (
              <p className="text-sm text-rose-400 mt-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                WhatsApp alerts require Pro Shield. <a href="/dashboard/billing" className="underline font-medium ml-1">Upgrade now</a>
              </p>
            )}
          </div>

          {/* Email Alerts */}
          <div className="rounded-lg border border-border/50 p-4">
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
          </div>

          {/* Browser Notifications */}
          <div className="rounded-lg border border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="font-medium text-sm">Browser Notifications</p>
                  <p className="text-xs text-muted-foreground">Real-time push via OneSignal</p>
                </div>
              </div>
              <button
                onClick={() => toggleChannel("push")}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  alertChannels.includes("push")
                    ? "bg-emerald-500"
                    : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    alertChannels.includes("push") ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reporting Preferences */}
      <Card className="bg-card/50 border-border/50">
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
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Daily Summary</p>
              <p className="text-xs text-muted-foreground">Every morning at 8:00 AM</p>
            </div>
            <button
              onClick={() => setReportDaily(!reportDaily)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                reportDaily ? "bg-emerald-500" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  reportDaily ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Weekly Report */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Weekly Digest</p>
              <p className="text-xs text-muted-foreground">Every Monday morning</p>
            </div>
            <button
              onClick={() => setReportWeekly(!reportWeekly)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                reportWeekly ? "bg-emerald-500" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  reportWeekly ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Monthly Report */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Monthly Insight</p>
              <p className="text-xs text-muted-foreground">First day of each month</p>
            </div>
            <button
              onClick={() => setReportMonthly(!reportMonthly)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                reportMonthly ? "bg-emerald-500" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  reportMonthly ? "translate-x-5" : ""
                }`}
              />
            </button>
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
              <MessageCircle className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
              <p className="text-xs font-medium">WhatsApp</p>
              <p className={`text-xs mt-1 ${whatsappNumber ? "text-emerald-400" : "text-muted-foreground"}`}>
                {whatsappNumber ? "✓ Number set" : "Not configured"}
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

      {/* Sticky Save Button Container */}
      <div className="sticky bottom-6 left-0 right-0 z-10 flex justify-end">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 p-4 rounded-2xl shadow-2xl shadow-emerald-500/10 flex items-center gap-4">
          {saved && (
            <span className="text-sm font-medium text-emerald-400 animate-in fade-in slide-in-from-right-2">
              Settings updated successfully
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold px-8 h-12 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : saved ? (
              <Check className="h-5 w-5 mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </Button>
        </div>
      </div>

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
    </div>
  );
}
