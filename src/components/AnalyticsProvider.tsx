"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only load analytics on client side when idle to prevent blocking FCP
    const loadAnalytics = async () => {
      try {
        const { analytics } = await import("@/lib/firebase");
        if (!analytics) return;
        
        const instance = await analytics;
        if (instance) {
          const { logEvent } = await import("firebase/analytics");
          logEvent(instance, "page_view", {
            page_path: pathname,
            page_search: searchParams.toString(),
            page_title: document.title,
          });
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      }
    };

    if (typeof window !== "undefined") {
      // Defer analytics for 2 seconds to prioritize LCP/FCP
      const timer = setTimeout(loadAnalytics, 2000);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
