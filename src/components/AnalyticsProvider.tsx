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
      // Load analytics when browser is idle or after a 3s timeout
      const idleCallback = window.requestIdleCallback || ((cb: any) => setTimeout(cb, 3000));
      const handle = idleCallback(loadAnalytics);
      
      return () => {
        if (window.cancelIdleCallback) {
          window.cancelIdleCallback(handle);
        } else {
          clearTimeout(handle as any);
        }
      };
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
