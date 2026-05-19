"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Page-view tracker. Firebase Analytics was removed during the Supabase migration —
// hook into your analytics provider of choice (PostHog, Plausible, Vercel Analytics)
// inside `track()` below if you want page views recorded.
function track(_path: string, _query: string, _title: string) {
  // no-op until an analytics provider is wired up
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fire = () => track(pathname, searchParams.toString(), document.title);

    const idleCallback =
      (window as Window & typeof globalThis).requestIdleCallback ||
      ((cb: IdleRequestCallback) => setTimeout(cb, 3000) as unknown as number);
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
