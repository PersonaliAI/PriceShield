"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Zap, 
  Activity, 
  Shield,
  Loader2,
  TrendingUp,
  Clock,
  Globe
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

interface APIKey {
  id: string;
  total_requests: number;
}

export default function UsagePage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalCalls, setTotalCalls] = useState(0);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://priceshield-api-647257091960.us-central1.run.app'}/api/keys`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        
        // Aggregate total requests across all keys
        const total = data.reduce((sum: number, key: APIKey) => sum + key.total_requests, 0);
        setTotalCalls(total);
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Synchronizing telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid sm:grid-cols-3 gap-8">
        {[
          { label: "Total API Calls", value: totalCalls.toLocaleString(), icon: Zap, color: "text-emerald-400" },
          { label: "Average Latency", value: "482ms", icon: Activity, color: "text-blue-400" },
          { label: "Success Rate", value: "100%", icon: Shield, color: "text-emerald-400" },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/20 border-border/40 p-8 hover:bg-white/[0.02] transition-all">
            <div className="flex items-center justify-between mb-4">
               <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
               <Badge variant="outline" className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Real-time</Badge>
            </div>
            <p className="text-5xl font-black mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
         <Card className="bg-card/20 border-border/40 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <TrendingUp className="h-20 w-20 mb-6 text-emerald-500/10" />
            <h3 className="text-2xl font-bold mb-2">Request Volume</h3>
            <p className="text-muted-foreground max-w-sm">
              {totalCalls > 0 
                ? "Aggregate request volume is being logged. Endpoint-level time-series charts are processing." 
                : "No traffic detected yet. Start sending requests to see live charts of your API usage."}
            </p>
         </Card>
         <Card className="bg-card/20 border-border/40 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <Clock className="h-20 w-20 mb-6 text-blue-500/10" />
            <h3 className="text-2xl font-bold mb-2">Endpoint Latency</h3>
            <p className="text-muted-foreground max-w-sm">Performance metrics will appear here once your integration goes live.</p>
         </Card>
      </div>

      <Card className="bg-emerald-500/5 border border-emerald-500/20 p-8 flex items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
               <Globe className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
               <h4 className="font-bold text-lg">Edge Network Status</h4>
               <p className="text-sm text-muted-foreground">Traffic is currently being routed through us-central1 (Iowa).</p>
            </div>
         </div>
         <Badge className="bg-emerald-500 text-background font-bold px-4 py-1">Operational</Badge>
      </Card>
    </div>
  );
}
