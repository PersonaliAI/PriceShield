"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Variant = "control" | "challenger";

interface ABTestContextType {
  variant: Variant;
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined);

export function ABTestProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariant] = useState<Variant>("control");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client
    const savedVariant = localStorage.getItem("ps_landing_variant") as Variant;
    
    if (savedVariant && (savedVariant === "control" || savedVariant === "challenger")) {
      setVariant(savedVariant);
    } else {
      const newVariant: Variant = Math.random() > 0.5 ? "challenger" : "control";
      localStorage.setItem("ps_landing_variant", newVariant);
      setVariant(newVariant);
      
      // Track assignment (mocking an analytics event)
      console.log(`[A/B Test] Assigned variant: ${newVariant}`);
    }
    
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by rendering a consistent state on server
  // and only showing the variant after mounting on the client.
  // In a real app, you might use middleware or edge config to avoid this flicker.
  return (
    <ABTestContext.Provider value={{ variant }}>
      {children}
    </ABTestContext.Provider>
  );
}

export function useABTest() {
  const context = useContext(ABTestContext);
  if (context === undefined) {
    throw new Error("useABTest must be used within an ABTestProvider");
  }
  return context;
}
