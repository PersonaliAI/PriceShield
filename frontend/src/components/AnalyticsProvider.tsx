"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/firebase-analytics";

/**
 * Fires a Firebase Analytics page_view on every client-side route change.
 * Initialisation is lazy — see lib/firebase-analytics for details.
 */
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fire = () => {
      track("page_view", {
        page_path: pathname,
        page_search: searchParams.toString(),
        page_title: document.title,
        page_location: window.location.href,
      });
    };

    // Defer to idle so we don't block first paint.
    const idleCallback =
      (window as Window & typeof globalThis).requestIdleCallback ||
      ((cb: IdleRequestCallback) => setTimeout(cb, 1500) as unknown as number);
    const handle = idleCallback(fire as IdleRequestCallback);

    return () => {
      if ((window as Window & typeof globalThis).cancelIdleCallback) {
        (window as Window & typeof globalThis).cancelIdleCallback(handle as number);
      } else {
        clearTimeout(handle as unknown as number);
      }
    };
  }, [pathname, searchParams]);

  return <>{children}</>;
}
