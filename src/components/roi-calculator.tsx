"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingDown, ArrowRight } from "lucide-react";

export function ROICalculator() {
  const [monthlySpend, setMonthlySpend] = useState<number>(5000);
  
  const estimatedLeakage = monthlySpend * 0.04; // 4% average leakage
  const yearlySavings = estimatedLeakage * 12;

  return (
    <Card className="bg-card/50 border-emerald-500/20 shadow-xl shadow-emerald-500/5">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-emerald-400" />
          Leakage Calculator
        </CardTitle>
        <CardDescription>See how much your business is likely losing to stealth price hikes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="spend">Monthly Supplier Spend ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input 
              id="spend" 
              type="number" 
              className="pl-7 bg-background/50" 
              value={monthlySpend} 
              onChange={(e) => setMonthlySpend(Number(e.target.value))}
            />
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-center">
          <p className="text-sm text-emerald-400 font-medium uppercase tracking-wider">Estimated Yearly Savings</p>
          <p className="text-3xl font-bold text-emerald-500">${yearlySavings.toLocaleString()}</p>
        </div>

        <p className="text-xs text-muted-foreground text-center italic">
          *Based on industry average of 3-5% stealth price creep.
        </p>

        <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-semibold">
          Recover Your Margins <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
