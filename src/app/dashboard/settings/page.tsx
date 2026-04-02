"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  MessageCircle,
  Mail,
  Send,
  Smartphone,
  Loader2,
  Save,
  Check,
  Copy,
  Shield,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [copiedInbox, setCopiedInbox] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  // Form state
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [forwardingEmails, setForwardingEmails] = useState<string[]>([]);
  const [alertChannels, setAlertChannels] = useState<string[]>(["push"]);
  const [dailyReportEnabled, setDailyReportEnabled] = useState(false);
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
  const [monthlyReportEnabled, setMonthlyReportEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [profileEmail, setProfileEmail] = useState("");
  const [testing, setTesting] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getSettings(token);
      setSettings(data);
      setWhatsappNumber(data.whatsapp_number || "");
      setForwardingEmails(data.forwarding_emails || []);
      setAlertChannels(data.alert_channels || ["push"]);
      setDailyReportEnabled(data.daily_report_enabled ?? false);
      setWeeklyReportEnabled(data.weekly_report_enabled ?? true);
      setMonthlyReportEnabled(data.monthly_report_enabled ?? true);
      setEmailNotificationsEnabled(data.email_notifications_enabled ?? true);
      setProfileEmail(data.email || "");
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
        daily_report_enabled: dailyReportEnabled,
        weekly_report_enabled: weeklyReportEnabled,
        monthly_report_enabled: monthlyReportEnabled,
        email_notifications_enabled: emailNotificationsEnabled,
        email: profileEmail || null,
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

  const handleTestReport = async (period: string) => {
    setTesting(period);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      const res = await api.debugReport(token, period);
      if (res.status === "sent") {
        setSaved(true);
        // We'll also use setTesting to show a success message briefly
        setTesting("success-" + period);
        setTimeout(() => {
          setSaved(false);
          setTesting(null);
        }, 5000);
      } else if (res.status === "no_data") {
        setTesting("nodata-" + period);
        setTimeout(() => setTesting(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
      setTimeout(() => setError(""), 5000);
    } finally {
      if (!testing?.startsWith("success") && !testing?.startsWith("nodata")) {
        setTesting(null);
      }
    }
  };

  const inboxEmail = settings?.priceshield_inbox_email || "";
  const copyInboxEmail = () => {
    if (!inboxEmail) return;
    navigator.clipboard.writeText(inboxEmail);
    setCopiedInbox(true);
    setTimeout(() => setCopiedInbox(false), 2000);
  };

  const telegramDeepLink = user?.uid
    ? `https://t.me/PriceShieldBot?start=${user.uid}`
    : "";

  const isFree = settings?.tier === "free";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

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

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your alert channels, email forwarding, and report preferences
        </p>
      </div>

      {/* Profile & Email Management */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle>Report Delivery</CardTitle>
              <CardDescription>
                Where should we send your intelligence reports?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/40 bg-muted/5">
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Notification Email</p>
              <input 
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="you@company.com"
                className="bg-transparent border-none p-0 text-base text-foreground focus:ring-0 w-full font-medium placeholder:text-muted-foreground/30"
              />
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/20">
              <span className="text-xs text-muted-foreground sm:hidden">Email Alerts</span>
              <button
                onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${emailNotificationsEnabled ? "bg-emerald-500" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${emailNotificationsEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Forwarding Card */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle>AI Document Ingestion</CardTitle>
              <CardDescription>
                Forward your invoices here to trigger automated AI analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Private PriceShield Email</p>
            {inboxEmail ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-base font-mono font-bold text-emerald-400 tracking-tight break-all">
                  {inboxEmail}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInboxEmail}
                  className="h-12 w-12 p-0 rounded-xl shrink-0 border-emerald-500/20 hover:bg-emerald-500/10"
                >
                  {copiedInbox ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
                ⚠️ Inbox not configured yet. Please contact support.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/10">
              <span className="shrink-0 h-6 w-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="text-xs font-bold">Forward</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Send any invoice PDF to your private address.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/10">
              <span className="shrink-0 h-6 w-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="text-xs font-bold">AI Extract</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PriceShield AI reads every line item instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/10">
              <span className="shrink-0 h-6 w-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="text-xs font-bold">Alert</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Get notified if price hikes detected &gt;2%.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Channels Card */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <CardTitle>Alert Channels</CardTitle>
              <CardDescription>
                Real-time notifications for price hikes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Telegram */}
            <div className={`p-4 rounded-xl border transition-all ${user?.telegram_chat_id ? 'border-sky-500/30 bg-sky-500/5' : 'border-border/50 bg-card/50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${user?.telegram_chat_id ? 'bg-sky-500/20 text-sky-400' : 'bg-muted text-muted-foreground'}`}>
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Telegram</h4>
                  <p className="text-[10px] text-muted-foreground">Instant alerts via bot</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  {user?.telegram_chat_id ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                      <Check className="h-3 w-3" /> Linked
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium">Not connected</span>
                  )}
                  {user?.telegram_chat_id ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-400/10 font-bold"
                      onClick={() => setShowConfirmDisconnect(true)}
                    >
                      DISCONNECT
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-[10px] font-bold border-sky-500/50 hover:bg-sky-500/10"
                      onClick={() => window.open(telegramDeepLink, '_blank')}
                    >
                      LINK
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className={`p-4 rounded-xl border transition-all ${alertChannels.includes('whatsapp') ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/50 bg-card/50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${alertChannels.includes('whatsapp') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                   <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">WhatsApp</h4>
                  <p className="text-[10px] text-muted-foreground">Mobile messaging</p>
                </div>
              </div>
                <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  {whatsappNumber ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold truncate max-w-[80px]">
                      {whatsappNumber}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium italic">Not set</span>
                  )}
                  <button
                    onClick={() => toggleChannel('whatsapp')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${alertChannels.includes('whatsapp') ? "bg-emerald-500" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${alertChannels.includes('whatsapp') ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Browser Push */}
            <div className={`p-4 rounded-xl border transition-all ${alertChannels.includes('push') ? 'border-purple-500/30 bg-purple-500/5' : 'border-border/50 bg-card/50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${alertChannels.includes('push') ? 'bg-purple-500/20 text-purple-400' : 'bg-muted text-muted-foreground'}`}>
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Push</h4>
                  <p className="text-[10px] text-muted-foreground">Web push alerts</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium">OneSignal</span>
                <button
                  onClick={() => toggleChannel('push')}
                  className={`relative w-10 h-5 rounded-full transition-colors ${alertChannels.includes('push') ? "bg-emerald-500" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${alertChannels.includes('push') ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Scheduled Intelligence Card */}
      <Card className="bg-card/50 border-border/50 shadow-2xl shadow-emerald-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle>Autonomous Reporting</CardTitle>
              <CardDescription>
                Schedule automated financial audits for your mailbox
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'daily', label: 'Daily Audit', sub: 'Every 24h', state: dailyReportEnabled, set: setDailyReportEnabled },
            { id: 'weekly', label: 'Weekly Summary', sub: 'Every 7d', state: weeklyReportEnabled, set: setWeeklyReportEnabled, highlight: true },
            { id: 'monthly', label: 'Monthly Audit', sub: 'Every 30d', state: monthlyReportEnabled, set: setMonthlyReportEnabled }
          ].map((r) => (
            <div key={r.id} className={`rounded-xl border p-4 flex flex-col justify-between gap-6 transition-all ${r.highlight ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border/50 bg-muted/5'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm">{r.label}</p>
                  <p className={`text-[10px] uppercase font-bold tracking-tight ${r.highlight ? 'text-emerald-400' : 'text-muted-foreground'}`}>{r.sub}</p>
                </div>
                <button
                  onClick={() => r.set(!r.state)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${r.state ? "bg-emerald-500" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${r.state ? "translate-x-5" : ""}`} />
                </button>
              </div>
              <Button 
                  variant="outline" 
                  size="sm" 
                  className={`w-full h-9 text-[10px] font-bold transition-all ${testing === `success-${r.id}` ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "border-border/50 hover:bg-muted"}`}
                  onClick={() => handleTestReport(r.id as "daily" | "weekly" | "monthly")}
                  disabled={testing?.includes(r.id)}
              >
                {testing === r.id ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : 
                 testing === `success-${r.id}` ? <Check className="h-3 w-3 mr-2" /> : 
                 <Send className="h-3 w-3 mr-2" />}
                {testing === `success-${r.id}` ? "Sent!" : testing === `nodata-${r.id}` ? "No Data" : "Test Now"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sticky Save Button */}
      <div className="sticky bottom-6 left-0 right-0 z-10 flex justify-center sm:justify-end">
        <div className="bg-card/90 backdrop-blur-2xl border border-border/50 p-4 rounded-2xl shadow-2xl shadow-emerald-500/20 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {saved && (
            <span className="text-sm font-semibold text-emerald-400 animate-in fade-in slide-in-from-right-2">
              ✓ All settings localized & saved
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-56 bg-emerald-500 hover:bg-emerald-400 text-background font-black text-sm px-8 h-12 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin mr-3" />
            ) : saved ? (
              <Check className="h-5 w-5 mr-3" />
            ) : (
              <Save className="h-5 w-5 mr-3" />
            )}
            {saving ? "SAVING..." : saved ? "SAVED!" : "SAVE PREFERENCES"}
          </Button>
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showConfirmDisconnect} onOpenChange={setShowConfirmDisconnect}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-rose-500 text-xl font-bold">
              <AlertTriangle className="h-6 w-6" /> Disconnect Telegram?
            </DialogTitle>
            <DialogDescription className="pt-2 text-muted-foreground leading-relaxed">
              You will stop receiving instant price alerts on your mobile device. Are you sure you want to disable this connection?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 gap-3">
            <Button variant="ghost" onClick={() => setShowConfirmDisconnect(false)} className="font-bold">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDisconnectTelegram} 
              className="bg-rose-500 hover:bg-rose-600 font-bold px-8"
            >
              Confirm Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
