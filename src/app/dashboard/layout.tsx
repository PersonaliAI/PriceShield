"use client";

import { useState } from "react";
import { LayoutDashboard, FileText, Settings, LogOut, Mail, CreditCard, MapPin, Shield, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/protected-route";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/ai-cfo", icon: Shield, label: "AI CFO" },
  { href: "/onboarding", icon: FileText, label: "Upload Invoices" },
  { href: "/dashboard/inbox", icon: Mail, label: "Inbox" },
  { href: "/dashboard/locations", icon: MapPin, label: "Locations" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const NavContent = ({ 
  pathname, 
  user, 
  handleSignOut, 
  mobile = false, 
  setMobileMenuOpen 
}: { 
  pathname: string; 
  user: any; 
  handleSignOut: () => void; 
  mobile?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}) => (
  <>
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => mobile && setMobileMenuOpen?.(false)}
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
  </>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card/30 backdrop-blur">
          <div className="flex items-center gap-2 px-6 h-20 border-b border-border/40">
            <img src="/logo.png" alt="PriceShield Logo" className="h-14 w-auto" />
            <span className="hidden">PriceShield</span>
          </div>
          <NavContent pathname={pathname} user={user} handleSignOut={handleSignOut} />
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border/40 shadow-xl flex flex-col">
              <div className="flex items-center justify-between px-6 h-20 border-b border-border/40">
                <img src="/logo.png" alt="PriceShield Logo" className="h-10 w-auto" />
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 hover:bg-muted rounded-md"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <NavContent 
                pathname={pathname} 
                user={user} 
                handleSignOut={handleSignOut} 
                mobile 
                setMobileMenuOpen={setMobileMenuOpen} 
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile header */}
          <header className="md:hidden flex items-center justify-between px-4 h-20 border-b border-border/40 bg-card/30 backdrop-blur">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 hover:bg-muted rounded-md transition-colors"
              >
                <Menu className="h-6 w-6 text-emerald-400 font-bold" />
              </button>
              <img src="/logo.png" alt="PriceShield Logo" className="h-10 w-auto" />
            </div>
            <button
               onClick={handleSignOut}
               className="p-2 hover:bg-muted rounded-md transition-shadow"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </button>
          </header>

          <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
