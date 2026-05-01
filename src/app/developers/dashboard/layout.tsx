"use client";

import { 
  FileCode, 
  Terminal, 
  Key, 
  BarChart3, 
  Settings, 
  LogOut, 
  ExternalLink,
  Menu,
  X,
  Activity,
  Webhook,
  Shield,
  Plus
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/protected-route";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const sidebarNavItems = [
  { href: "/", icon: FileCode, label: "Documentation" },
  { href: "/dashboard", icon: Key, label: "API Keys" },
  { href: "/dashboard/usage", icon: BarChart3, label: "Usage Analytics" },
];

const dashboardTabs = [
  { id: "keys", label: "API Keys", icon: Key, href: "/dashboard" },
  { id: "usage", label: "Usage Analytics", icon: Activity, href: "/dashboard/usage" },
  { id: "webhooks", label: "Webhooks", icon: Webhook, href: "/dashboard/webhooks" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Check if we are in the dashboard area to show dashboard-specific headers
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#06080a] text-foreground">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card/20 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-6 h-20 border-b border-border/40">
            <img src="/logo.png" alt="PriceShield Logo" className="h-8 w-auto" />
            <span className="font-bold text-lg tracking-tight">Developers</span>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1">
            {sidebarNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-border/40 space-y-2">
            <Link href="https://trypriceshield.com" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
              <ExternalLink className="h-4 w-4" />
              Main Platform
            </Link>
            <div className="pt-4 px-3">
               <p className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest mb-2">Account</p>
               <p className="text-xs text-muted-foreground truncate mb-4">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/5 w-full transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-[#06080a] to-background flex flex-col">
          {/* Mobile header */}
          <header className="md:hidden flex items-center justify-between px-6 h-16 border-b border-border/40 bg-card/20 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
              </button>
              <img src="/logo.png" alt="PriceShield Logo" className="h-7 w-auto" />
              <span className="font-bold text-sm">Dev Portal</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 flex flex-col">
            {isDashboard && (
              <div className="px-6 md:px-10 pt-10 space-y-8 max-w-full">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold tracking-widest uppercase">Developer Portal</Badge>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-white mb-2">
                      Control Center
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                      Manage your keys, monitor traffic, and configure automated data synchronization.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/">
                      <Button variant="outline" className="gap-2 h-11 border-border/40 hover:bg-white/5 transition-all">
                        <Terminal className="h-4 w-4" /> API Docs
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Dashboard Tabs */}
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5 w-fit mb-4">
                  {dashboardTabs.map((tab) => {
                    const isActive = pathname === tab.href || (tab.href === '/dashboard' && pathname === '/dashboard');
                    return (
                      <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          isActive 
                            ? "bg-emerald-500 text-background shadow-lg" 
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`p-6 md:p-10 w-full max-w-full mx-auto ${isDashboard ? 'pt-2' : ''}`}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
