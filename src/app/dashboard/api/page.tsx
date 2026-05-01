"use client";

import { useState, useEffect } from "react";
import { 
  Key, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Check, 
  Terminal, 
  AlertCircle, 
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
import { api } from "@/lib/api";
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

export default function ApiManagementPage() {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer API</h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys and integrate PriceShield into your platform.
          </p>
        </div>
        <Link href="/developers" target="_blank">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" /> API Documentation
          </Button>
        </Link>
      </div>

      {/* New Key Alert */}
      {newKey && (
        <Card className="bg-emerald-500/10 border-emerald-500/50 animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Check className="h-5 w-5" /> API Key Generated
            </div>
            <CardDescription className="text-emerald-400/70">
              Please copy your API key now. You won&apos;t be able to see it again for security reasons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background/50 border border-emerald-500/30 rounded-lg p-3 font-mono text-sm break-all">
                {newKey.raw_key}
              </div>
              <Button size="icon" onClick={() => copyToClipboard(newKey.raw_key)} className="shrink-0 bg-emerald-500 hover:bg-emerald-400">
                {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setNewKey(null)} className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
              I have saved my key
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* API Keys List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active API Keys</CardTitle>
                <CardDescription>You can have up to 5 active keys.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Key name..." 
                  value={keyName} 
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-40 h-9 text-xs"
                />
                <Button size="sm" onClick={handleCreateKey} disabled={creating || keys.filter(k => k.is_active).length >= 5} className="gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                </div>
              ) : keys.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No API keys found. Create one to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {keys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/5 hover:bg-muted/10 transition-colors">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{key.name}</span>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/5 border-emerald-500/20">
                            {key.tier.replace('api_', '')}
                          </Badge>
                          {!key.is_active && <Badge variant="secondary" className="text-[10px] uppercase">Revoked</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono">
                          <span>{key.key_prefix}</span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" /> {key.total_requests} requests
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {key.is_active && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRevokeKey(key.id)}
                            className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
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

          {/* Usage Stats (Placeholder for now) */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" /> API Usage
              </CardTitle>
              <CardDescription>Summary of your extraction volume across all keys.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Today", value: "0" },
                  { label: "This Month", value: "0" },
                  { label: "Success Rate", value: "0%" },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/20 border border-border/40 text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-sm">Developer Quickstart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Endpoint</p>
                <div className="bg-background/50 rounded p-2 font-mono text-[11px] border border-border/40">
                  POST /api/v1/extract
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Auth Header</p>
                <div className="bg-background/50 rounded p-2 font-mono text-[11px] border border-border/40">
                  X-API-Key: ps_live_...
                </div>
              </div>
              <Link href="/developers" className="block">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-background text-xs font-bold uppercase tracking-wider">
                  Full API Reference
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" /> Security Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-3 leading-relaxed">
              <p>• Never commit API keys to version control systems like Git.</p>
              <p>• Use environment variables to store keys in your server-side code.</p>
              <p>• Rotate keys immediately if you suspect they have been compromised.</p>
              <p>• Only call the API from backend environments to hide your key from client-side traffic.</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
