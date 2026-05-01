"use client";

import { Settings, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function DevSettingsPage() {
  return (
    <Card className="bg-card/20 border-border/40 p-32 text-center flex flex-col items-center justify-center">
       <Settings className="h-20 w-20 mb-6 text-emerald-500/10" />
       <h3 className="text-2xl font-bold mb-2">Developer Settings</h3>
       <p className="text-muted-foreground max-w-sm mb-8">Configure your developer profile, preferred API version, and regional routing preferences.</p>
       <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase text-xs tracking-widest bg-emerald-500/10 px-6 py-3 rounded-xl border border-emerald-500/20">
          <Loader2 className="h-4 w-4 animate-spin" /> Feature Under Construction
       </div>
    </Card>
  );
}
