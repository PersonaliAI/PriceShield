"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import WebhooksPage from "@/app/developers/dashboard/webhooks/page";
import { Loader2 } from "lucide-react";

export default function DashboardWebhooksShadowPage() {
  const [isDevSubdomain, setIsDevSubdomain] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const host = window.location.hostname;
    if (host.toLowerCase().startsWith('developer')) {
      setIsDevSubdomain(true);
    } else {
      setIsDevSubdomain(false);
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
    return <WebhooksPage />;
  }

  return null;
}
