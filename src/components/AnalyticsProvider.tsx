"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      analytics?.then((instance) => {
        if (instance) {
          logEvent(instance, "page_view", {
            page_path: pathname,
            page_search: searchParams.toString(),
            page_title: document.title,
          });
        }
      });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
