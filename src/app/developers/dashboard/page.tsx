"use client";

import { useState, useEffect } from "react";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Loader2,
  Activity,
  Zap,
  Shield,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

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

export default function DeveloperKeysPage() {
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
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-8">
        
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
              <Button onClick={handleCreateKey} disabled={creating} className="bg-emerald-500 hover:bg-emerald-400 text-background h-9 text-xs font-bold px-4">
                {creating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Plus className="h-3 w-3 mr-2" />}
                Create New
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
      </div>

      {/* Sidebar */}
      <div className="space-y-8">
        <Card className="bg-emerald-500/5 border-emerald-500/20 p-8">
           <h3 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-400 mb-6">Security Best Practices</h3>
           <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>Never commit your secret keys to version control. Use environment variables instead.</p>
              <p>If you suspect a key has been compromised, revoke it immediately and generate a new one.</p>
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
           </div>
        </Card>
      </div>
    </div>
  );
}
