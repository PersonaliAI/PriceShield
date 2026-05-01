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
  BarChart3
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

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            API Keys
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Authenticate your requests using secret keys.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2 border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-400">
            <ExternalLink className="h-4 w-4" /> View Docs
          </Button>
        </Link>
      </div>

      {/* New Key Alert */}
      {newKey && (
        <Card className="bg-emerald-500/10 border-emerald-500/30 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Check className="h-5 w-5" /> Key Generated Successfully
            </div>
            <CardDescription className="text-emerald-400/70">
              Copy this key now. It will only be shown once for security reasons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#06080a] border border-emerald-500/20 rounded-xl p-4 font-mono text-sm break-all text-emerald-400 shadow-inner">
                {newKey.raw_key}
              </div>
              <Button size="icon" onClick={() => copyToClipboard(newKey.raw_key)} className="h-12 w-12 shrink-0 bg-emerald-500 hover:bg-emerald-400 text-background">
                {copiedKey ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setNewKey(null)} className="w-full text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/5">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* API Keys List */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-card/20 border-border/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-6">
              <div>
                <CardTitle>Your Keys</CardTitle>
                <CardDescription>Limit: 5 active keys per account</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Input 
                  placeholder="Key name..." 
                  value={keyName} 
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-48 bg-background/50 border-border/40 focus:border-emerald-500/50"
                />
                <Button onClick={handleCreateKey} disabled={creating || keys.filter(k => k.is_active).length >= 5} className="bg-emerald-500 hover:bg-emerald-400 text-background gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                </div>
              ) : keys.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-border/40">
                  <Key className="h-16 w-16 mx-auto mb-4 opacity-10" />
                  <p className="text-lg">No API keys active</p>
                  <p className="text-sm opacity-60">Create your first key to start using the PriceShield API</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {keys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-5 rounded-2xl border border-border/20 bg-white/5 hover:bg-white/10 transition-all group">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-base">{key.name}</span>
                          <Badge className="text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {key.tier.replace('api_', '')}
                          </Badge>
                          {!key.is_active && <Badge variant="secondary" className="text-[10px] uppercase">Revoked</Badge>}
                        </div>
                        <div className="flex items-center gap-6 text-xs text-muted-foreground font-mono">
                          <span className="bg-background/50 px-2 py-0.5 rounded border border-border/20">{key.key_prefix}</span>
                          <span className="flex items-center gap-2">
                            <BarChart3 className="h-3.5 w-3.5 text-emerald-400/50" /> {key.total_requests.toLocaleString()} total requests
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

          {/* Usage Analytics Placeholder */}
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { label: "Today's Requests", value: "0", icon: Zap },
              { label: "Monthly Volume", value: "0", icon: BarChart3 },
              { label: "Extraction Health", value: "100%", icon: Shield },
            ].map((stat, i) => (
              <Card key={i} className="bg-card/20 border-border/40 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="h-5 w-5 text-emerald-400/50" />
                    <Badge variant="outline" className="text-[10px] opacity-50">Live</Badge>
                  </div>
                  <p className="text-3xl font-black mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar Help */}
        <div className="space-y-8">
          <Card className="bg-emerald-500/5 border-emerald-500/20 overflow-hidden">
             <div className="p-6 space-y-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                   <Terminal className="h-5 w-5 text-emerald-400" /> Usage Guide
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Base URL</p>
                    <code className="block p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] text-emerald-400 font-mono">
                       https://api.trypriceshield.com/api/v1
                    </code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Authentication</p>
                    <code className="block p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] text-emerald-400 font-mono">
                       X-API-Key: ps_live_...
                    </code>
                  </div>
                  <Link href="/">
                    <Button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold uppercase tracking-widest h-11">
                      Full Documentation
                    </Button>
                  </Link>
                </div>
             </div>
          </Card>

          <Card className="bg-card/20 border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" /> Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4 leading-relaxed">
              <div className="flex gap-3">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                 <p>Never share your secret keys or commit them to public repositories.</p>
              </div>
              <div className="flex gap-3">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                 <p>Use different keys for development and production environments.</p>
              </div>
              <div className="flex gap-3">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                 <p>Monitor your usage logs daily for unexpected spike in requests.</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
