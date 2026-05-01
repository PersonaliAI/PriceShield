"use client";

import { useState, useEffect } from "react";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink,
  Shield,
  Zap,
  Loader2,
  BarChart3,
  Terminal,
  Activity,
  Webhook,
  Settings as SettingsIcon,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  tier: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  total_requests: number;
}

export default function DeveloperDashboardPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("keys");
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ id: string; raw_key: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyName, setKeyName] = useState("");

  const fetchKeys = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://priceshield-api-647257091960.us-central1.run.app'}/api/keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setKeys(data);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async () => {
    setCreating(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://priceshield-api-647257091960.us-central1.run.app'}/api/keys`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name: keyName || "Default Key", tier: "api_free" })
      });
      const data = await response.json();
      setNewKey(data);
      setKeyName("");
      fetchKeys();
    } catch (error) {
      console.error("Failed to create key:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this key? This action is permanent.")) return;
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://priceshield-api-647257091960.us-central1.run.app'}/api/keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchKeys();
    } catch (error) {
      console.error("Failed to revoke key:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const tabs = [
    { id: "keys", label: "API Keys", icon: Key },
    { id: "usage", label: "Usage Analytics", icon: Activity },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold tracking-widest uppercase">Developer Portal</Badge>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white mb-2">
            Control Center
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Manage your keys, monitor traffic, and configure automated data synchronization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" className="gap-2 h-11 border-border/40 hover:bg-white/5 transition-all">
              <Terminal className="h-4 w-4" /> API Docs
            </Button>
          </Link>
          <Button onClick={handleCreateKey} className="bg-emerald-500 hover:bg-emerald-400 text-background h-11 font-bold px-6 shadow-lg shadow-emerald-500/20">
            <Plus className="h-4 w-4 mr-2" /> New API Key
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id 
                ? "bg-emerald-500 text-background shadow-lg" 
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          
          {activeTab === "keys" && (
            <>
              {/* New Key Alert */}
              {newKey && (
                <Card className="bg-emerald-500/10 border-emerald-500/30 overflow-hidden relative border-l-4 border-l-emerald-500">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-emerald-400 font-black uppercase text-xs tracking-widest">
                      <Check className="h-4 w-4" /> Security Alert: Secret Key Generated
                    </div>
                    <CardDescription className="text-emerald-400/80">
                      We only show this key once. Copy it now and store it in a secure environment variable.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-black/40 border border-emerald-500/20 rounded-xl p-4 font-mono text-sm break-all text-emerald-400 shadow-inner">
                        {newKey.raw_key}
                      </div>
                      <Button size="icon" onClick={() => copyToClipboard(newKey.raw_key)} className="h-12 w-12 shrink-0 bg-emerald-500 hover:bg-emerald-400 text-background">
                        {copiedKey ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-card/20 border-border/40 backdrop-blur-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-6 bg-white/5">
                  <div>
                    <CardTitle className="text-2xl font-bold">Authentication Keys</CardTitle>
                    <CardDescription>Use these keys to authenticate your requests to the PriceShield API.</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input 
                        placeholder="Search keys..." 
                        className="pl-9 w-48 h-9 bg-background/40 border-border/40"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 gap-2 border-border/40">
                      <Filter className="h-3.5 w-3.5" /> Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex justify-center py-32">
                      <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
                    </div>
                  ) : keys.length === 0 ? (
                    <div className="text-center py-32 text-muted-foreground">
                      <Key className="h-20 w-20 mx-auto mb-6 opacity-5" />
                      <p className="text-xl font-bold text-white/40">No API keys active</p>
                      <p className="text-sm opacity-40 max-w-xs mx-auto mt-2">Generate your first secret key to begin extracting invoice data.</p>
                      <Button onClick={handleCreateKey} className="mt-8 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20">
                        Create Initial Key
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {keys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all group">
                          <div className="flex items-center gap-6">
                            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                               <Key className="h-5 w-5 text-emerald-400/60" />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-lg">{key.name}</span>
                                <Badge className="text-[9px] uppercase font-black bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-2 py-0">
                                  {key.tier.replace('api_', '')}
                                </Badge>
                                {!key.is_active && <Badge variant="secondary" className="text-[9px] uppercase">Revoked</Badge>}
                              </div>
                              <div className="flex items-center gap-8 text-[11px] text-muted-foreground font-mono">
                                <span className="bg-black/40 px-2 py-0.5 rounded border border-white/5 text-emerald-400/80">{key.key_prefix}</span>
                                <span className="flex items-center gap-2">
                                  <Activity className="h-3 w-3 text-emerald-400/30" /> {key.total_requests.toLocaleString()} total calls
                                </span>
                                <span className="flex items-center gap-2">
                                  <Zap className="h-3 w-3 text-emerald-400/30" /> Created {new Date(key.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white">
                              View Logs
                            </Button>
                            {key.is_active && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRevokeKey(key.id)}
                                className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 h-10 w-10 rounded-xl"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "usage" && (
            <div className="grid grid-cols-1 gap-8">
               <Card className="bg-card/20 border-border/40 p-12 text-center">
                  <BarChart3 className="h-20 w-20 mx-auto mb-6 text-emerald-500/20" />
                  <h3 className="text-2xl font-bold mb-2">Usage Analytics</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">Detailed charts and endpoint-level telemetry will appear here as your traffic grows.</p>
               </Card>
               <div className="grid sm:grid-cols-3 gap-8">
                  {[
                    { label: "Today's Calls", value: "0", icon: Zap, color: "text-emerald-400" },
                    { label: "Average Latency", value: "482ms", icon: Activity, color: "text-blue-400" },
                    { label: "Success Rate", value: "100%", icon: Shield, color: "text-emerald-400" },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-card/20 border-border/40 p-6">
                      <div className="flex items-center justify-between mb-4">
                         <stat.icon className={`h-6 w-6 ${stat.color} opacity-50`} />
                         <Badge variant="outline" className="text-[10px] opacity-40">Live</Badge>
                      </div>
                      <p className="text-4xl font-black mb-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {(activeTab === "webhooks" || activeTab === "settings") && (
            <Card className="bg-card/20 border-border/40 p-32 text-center">
               <Loader2 className="h-10 w-10 mx-auto mb-6 text-emerald-500/20 animate-spin" />
               <h3 className="text-xl font-bold opacity-50 uppercase tracking-widest">Feature Under Construction</h3>
               <p className="text-sm text-muted-foreground mt-2">We are currently building this section. Check back soon!</p>
            </Card>
          )}

        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
          <Card className="bg-emerald-500/5 border-emerald-500/20 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4">
                <Zap className="h-12 w-12 text-emerald-500/10 rotate-12" />
             </div>
             <div className="p-8 space-y-6">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-400">Environment Details</h3>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Base API URL</p>
                    <div className="relative group">
                       <code className="block p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-emerald-400 font-mono break-all pr-12">
                          https://api.trypriceshield.com/v1
                       </code>
                       <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Copy className="h-3.5 w-3.5" />
                       </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Status</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                       <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                       All Systems Operational
                    </div>
                  </div>
                  <Link href="/">
                    <Button className="w-full mt-2 bg-emerald-500 text-background hover:bg-emerald-400 font-bold uppercase tracking-widest h-12 shadow-lg shadow-emerald-500/10">
                      Full Documentation
                    </Button>
                  </Link>
                </div>
             </div>
          </Card>

          <Card className="bg-card/20 border-border/40 p-8">
             <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white/50 mb-6 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" /> Security Score
             </h3>
             <div className="space-y-6">
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                   <div className="h-full w-[85%] bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]" />
                </div>
                <div className="space-y-4">
                   {[
                     { label: "IP Whitelisting", status: "Not Active" },
                     { label: "Key Rotation", status: "Healthy" },
                     { label: "SSL Enforcement", status: "Active" },
                   ].map((item, i) => (
                     <div key={i} className="flex justify-between items-center text-[11px] font-medium">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={item.status === "Not Active" ? "text-amber-400/70" : "text-emerald-400"}>{item.status}</span>
                     </div>
                   ))}
                </div>
             </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
