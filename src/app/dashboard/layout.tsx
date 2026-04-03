"use client";

import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  Mail, 
  CreditCard, 
  MapPin, 
  Shield,
  Menu,
  X 
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/protected-route";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/ai-cfo", icon: Shield, label: "AI CFO" },
  { href: "/onboarding", icon: FileText, label: "Upload Invoices" },
  { href: "/dashboard/inbox", icon: Mail, label: "Inbox" },
  { href: "/dashboard/locations", icon: MapPin, label: "Locations" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user, sendVerification } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSendVerification = async () => {
    setVerifying(true);
    try {
      await sendVerification();
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      console.error("Failed to send verification:", error);
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card/30 backdrop-blur">
          <div className="flex items-center gap-2 px-6 h-20 border-b border-border/40">
            <img src="/logo.png" alt="PriceShield Logo" className="h-10 w-auto" />
            <span className="hidden">PriceShield</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-border/40 space-y-2">
            {user?.email && (
              <p className="px-3 text-xs text-muted-foreground truncate">{user.email}</p>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile header */}
          <header className="md:hidden flex items-center justify-between px-6 h-14 border-b border-border/40 bg-card/30 backdrop-blur sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
              </button>
              <img src="/logo.png" alt="PriceShield Logo" className="h-6 w-auto" />
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </header>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="fixed inset-0 z-[100] md:hidden">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={() => setIsMenuOpen(false)}
              />
              
              {/* Drawer */}
              <div className="absolute inset-y-0 left-0 w-72 bg-card border-r border-border/40 shadow-2xl animate-in slide-in-from-left duration-300">
                <div className="flex items-center justify-between px-6 h-20 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="PriceShield Logo" className="h-10 w-auto" />
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/40 bg-card/50">
                  {user?.email && (
                    <p className="px-3 py-2 text-xs text-muted-foreground truncate mb-2">{user.email}</p>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email Verification Banner */}
          {user && !user.emailVerified && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                <Mail className="h-3.5 w-3.5" />
                <span>Your email is not verified. Please check your inbox.</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="text-[10px] uppercase tracking-wider font-bold text-amber-400 hover:text-amber-300"
                >
                  Already Verified? Click to Refresh
                </button>
                <button
                  onClick={handleSendVerification}
                  disabled={verifying || sent}
                  className="text-[10px] uppercase tracking-wider font-bold text-amber-400 hover:text-amber-300 disabled:opacity-50 border-l border-amber-500/20 pl-4"
                >
                  {sent ? "Sent!" : verifying ? "Sending..." : "Resend Link"}
                </button>
              </div>
            </div>
          )}

          <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
