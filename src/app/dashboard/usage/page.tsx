"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UsagePage from "@/app/developers/dashboard/usage/page";
import { Loader2 } from "lucide-react";

export default function DashboardUsageShadowPage() {
  const [isDevSubdomain, setIsDevSubdomain] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const host = window.location.hostname;
    if (host.toLowerCase().startsWith('developer')) {
      setIsDevSubdomain(true);
    } else {
      setIsDevSubdomain(false);
      // If someone hits /dashboard/usage on the main domain, it doesn't exist for business yet
      router.push('/dashboard');
    }
  }, [router]);

  if (isDevSubdomain === null) {
    return (
      <div className="min-h-screen bg-[#06080a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (isDevSubdomain) {
    return <UsagePage />;
  }

  return null;
}
