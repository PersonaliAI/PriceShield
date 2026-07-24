"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  TrendingDown,
  Calculator,
  FileSpreadsheet,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CATEGORY_META, FEATURED_POSTS } from "@/lib/blog";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#products", label: "Products" },
  { href: "/free-audit", label: "Free Audit" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

function TwoLineIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <line x1="0" y1="3" x2="18" y2="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image src="/logo.png" alt="" width={36} height={36} className="size-8 shrink-0" priority />
      <span className="font-semibold tracking-tight text-lg">PriceShield</span>
    </span>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const isAuthed = !loading && !!user;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled || open
          ? "bg-background/85 backdrop-blur-md border-b border-border"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto max-w-5xl px-6 h-16 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1 cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <CloseIcon /> : <TwoLineIcon />}
          </button>
          <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
        </div>

        {/* Center — desktop */}
        <div className="hidden md:flex items-center justify-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <SolutionsMenu />
          <ToolsMenu />
          <ResourcesMenu />
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-3">
          <ThemeToggle />
          {isAuthed ? (
            <UserMenu email={user?.email ?? ""} onSignOut={signOut} />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline-flex text-sm font-medium hover:text-foreground/80 transition-colors"
              >
                Log in
              </Link>
              <Button
                size="sm"
                className="cursor-pointer text-xs md:text-sm h-9 px-4 font-semibold"
                render={<Link href="/login" />}
              >
                Sign up
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-x-0 top-16 bottom-0 z-40 md:hidden overflow-y-auto bg-background border-b border-border shadow-2xl overscroll-contain"
          >
            <div className="mx-auto max-w-5xl px-6 py-6 pb-28 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base text-foreground py-1"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Expandable Solutions section */}
              <div>
                <button
                  onClick={() => setMobileSolutionsOpen((s) => !s)}
                  className="w-full flex items-center justify-between text-base text-foreground py-1 cursor-pointer"
                  aria-expanded={mobileSolutionsOpen}
                >
                  Solutions
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      mobileSolutionsOpen && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {mobileSolutionsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-3 mt-2 mb-2 space-y-2 border-l border-border">
                        <Link
                          href="/solutions/supplier-price-tracking"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px"
                        >
                          <div className="text-sm font-medium leading-snug">
                            Supplier Price Tracking
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Track vendor price drift & control costs
                          </div>
                        </Link>
                        <Link
                          href="/solutions/invoice-audit"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px"
                        >
                          <div className="text-sm font-medium leading-snug">
                            Invoice Auditing
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Automate checks on line items in seconds
                          </div>
                        </Link>
                        <Link
                          href="/solutions/supplier-price-increase-detection"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px"
                        >
                          <div className="text-sm font-medium leading-snug">
                            Price Hike Detection
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Get instant alerts on stealth vendor adjustments
                          </div>
                        </Link>
                        <Link
                          href="/solutions/invoice-ocr"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px"
                        >
                          <div className="text-sm font-medium leading-snug">
                            Invoice OCR Software
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Extract line items and data with AI OCR
                          </div>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Expandable Tools section */}
              <div>
                <button
                  onClick={() => setMobileToolsOpen((s) => !s)}
                  className="w-full flex items-center justify-between text-base text-foreground py-1 cursor-pointer"
                  aria-expanded={mobileToolsOpen}
                >
                  Tools
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      mobileToolsOpen && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {mobileToolsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-3 mt-2 mb-2 space-y-2 border-l border-border">
                        <Link
                          href="/tools/invoice-to-csv"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px"
                        >
                          <div className="text-sm font-medium leading-snug">
                            Invoice to CSV Converter
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Extract line items from PDFs instantly
                          </div>
                        </Link>
                        <Link
                          href="/tools/food-cost-calculator"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px"
                        >
                          <div className="text-sm font-medium leading-snug">
                            Food Cost Calculator
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Calculate cost per serving & ideal price
                          </div>
                        </Link>
                        <Link
                          href="/tools/margin-leakage-calculator"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px"
                        >
                          <div className="text-sm font-medium leading-snug">
                            Margin Leakage Calculator
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Find what you lose to billing errors
                          </div>
                        </Link>
                        <Link
                          href="/tools/catering-invoice-template"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px"
                        >
                          <div className="text-sm font-medium leading-snug">
                            Catering Invoice Template
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Free template for food & event packages
                          </div>
                        </Link>
                        <Link
                          href="/tools/bed-and-breakfast-invoice-template"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px"
                        >
                          <div className="text-sm font-medium leading-snug">
                            B&B Invoice Template
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Free lodging room stay invoice template
                          </div>
                        </Link>
                        <Link
                          href="/tools/massage-invoice-template"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px"
                        >
                          <div className="text-sm font-medium leading-snug">
                            Massage Invoice Template
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Free therapist session & email receipt tool
                          </div>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Expandable Resources section */}
              <div>
                <button
                  onClick={() => setMobileResourcesOpen((s) => !s)}
                  className="w-full flex items-center justify-between text-base text-foreground py-1 cursor-pointer"
                  aria-expanded={mobileResourcesOpen}
                >
                  Resources
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      mobileResourcesOpen && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {mobileResourcesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-3 mt-2 mb-2 space-y-2 border-l border-border">
                        {FEATURED_POSTS.map((post) => {
                          const meta = CATEGORY_META[post.category];
                          return (
                            <Link
                              key={post.slug}
                              href={`/blog/${post.slug}`}
                              onClick={() => setOpen(false)}
                              className="block py-2 pl-3 -ml-px"
                            >
                              <div className="flex items-center gap-2 mb-0.5">
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider text-[9px]",
                                    meta.tone,
                                  )}
                                >
                                  {meta.label}
                                </span>
                              </div>
                              <div className="text-sm font-medium leading-snug">
                                {post.title}
                              </div>
                            </Link>
                          );
                        })}
                        <Link
                          href="/blog"
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-3 -ml-px text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          View all resources →
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="pt-3 border-t border-border flex items-center gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  render={<Link href="/login" onClick={() => setOpen(false)} />}
                >
                  Log in
                </Button>
                <ThemeToggle className="border border-border" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/**
 * Compact account dropdown shown to signed-in users. Replaces the cluttered
 * row of Shopper/Competitors/My-dashboard links that overlapped the center
 * nav. Hosts the user's email + the two Shopper destinations + sign-out.
 *
 * Notably we DO NOT link to /dashboard here — that's the separate invoice
 * product. Linking from this Shopper-flavoured dropdown would be confusing.
 */
function UserMenu({ email, onSignOut }: { email: string; onSignOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 150);
  }

  // Render the user's first initial as a coloured circle — cheap avatar.
  const initial = (email[0] || "?").toUpperCase();

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        onClick={() => setOpen((s) => !s)}
        onFocus={show}
        onBlur={hide}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-card border border-border px-2.5 py-1 hover:border-foreground/30 transition-colors cursor-pointer"
      >
        <span className="grid size-7 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
          {initial}
        </span>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full pt-3 z-50"
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className="w-64 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Signed in as
                </p>
                <p className="text-sm font-medium truncate mt-0.5">{email}</p>
              </div>
              <div className="p-1.5">
                <UserMenuItem
                  href="/dashboard"
                  icon={LayoutDashboard}
                  label="Invoice Dashboard"
                  desc="Detect stealth supplier creep"
                />
              </div>
              <div className="border-t border-border p-1.5">
                <button
                  onClick={() => onSignOut()}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserMenuItem({
  href, icon: Icon, label, desc, muted = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-2.5 rounded-md px-3 py-2 hover:bg-muted transition-colors group",
        muted && "opacity-70 hover:opacity-100",
      )}
    >
      <Icon className="size-4 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground leading-tight">{desc}</div>
      </div>
    </Link>
  );
}

/**
 * Hover-triggered Solutions menu.
 */
function SolutionsMenu() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 150);
  }

  const solutions = [
    {
      href: "/solutions/supplier-price-tracking",
      label: "Supplier Price Tracking",
      desc: "Track vendor price drift and secure your food margins.",
      icon: TrendingDown,
      tone: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      href: "/solutions/invoice-audit",
      label: "Invoice Auditing",
      desc: "Extract line items and audit every supplier invoice instantly.",
      icon: ReceiptText,
      tone: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      href: "/solutions/supplier-price-increase-detection",
      label: "Price Hike Detection",
      desc: "Get immediate alerts on any stealth pricing adjustments.",
      icon: AlertTriangle,
      tone: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      href: "/solutions/invoice-ocr",
      label: "Invoice OCR Software",
      desc: "Extract structured line items with AI OCR engine.",
      icon: Cpu,
      tone: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    },
  ];

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <Link
        href="/solutions/supplier-price-tracking"
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        Solutions
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50"
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className="w-[320px] sm:w-[400px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden p-2">
              <div className="px-3 pt-3 pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What We Solve</h3>
              </div>
              <div className="space-y-1">
                {solutions.map((sol) => {
                  const Icon = sol.icon;
                  return (
                    <Link
                      key={sol.href}
                      href={sol.href}
                      className="group flex items-start gap-3 rounded-xl p-3 hover:bg-muted transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <div className={cn("p-2 rounded-lg border shrink-0", sol.tone)}>
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                          {sol.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-normal">
                          {sol.desc}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Hover-triggered Resources menu showing 3 featured blog posts + "View all".
 */
function ResourcesMenu() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <Link
        href="/blog"
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Resources
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50"
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className="w-[min(640px,90vw)] rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-baseline justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Featured guides</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    How operators use PriceShield in production.
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="text-xs font-medium text-foreground hover:underline underline-offset-4 inline-flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 p-2">
                {FEATURED_POSTS.map((post) => {
                  const meta = CATEGORY_META[post.category];
                  return (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group block rounded-xl p-3 hover:bg-muted transition-colors"
                    >
                      <div
                        className={cn(
                          "h-20 rounded-lg mb-3 grid place-items-center text-center px-2 text-[11px] font-semibold leading-tight",
                          meta.tone,
                        )}
                      >
                        <span className="line-clamp-3">{post.title}</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                        {meta.label}
                      </div>
                      <div className="text-xs text-foreground/90 leading-snug line-clamp-2 group-hover:underline underline-offset-4">
                        {post.description}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolsMenu() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 150);
  }

  const tools = [
    {
      href: "/tools/invoice-to-csv",
      label: "Invoice to CSV Converter",
      desc: "Extract structured line items from PDFs instantly.",
      icon: FileSpreadsheet,
      tone: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      href: "/tools/food-cost-calculator",
      label: "Food Cost Calculator",
      desc: "Find recommended pricing based on ingredient cost.",
      icon: Calculator,
      tone: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    },
    {
      href: "/tools/margin-leakage-calculator",
      label: "Margin Leakage Calculator",
      desc: "Calculate savings from catching supplier overcharges.",
      icon: TrendingDown,
      tone: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      href: "/tools/catering-invoice-template",
      label: "Catering Invoice Template",
      desc: "Free template for food and event packages.",
      icon: FileSpreadsheet,
      tone: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      href: "/tools/bed-and-breakfast-invoice-template",
      label: "B&B Invoice Template",
      desc: "Free nightly stay lodging invoice tool.",
      icon: Calculator,
      tone: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    {
      href: "/tools/massage-invoice-template",
      label: "Massage Invoice Template",
      desc: "Free therapist session & email receipt tool.",
      icon: FileSpreadsheet,
      tone: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
  ];

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <Link
        href="/tools/margin-leakage-calculator"
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        Free Tools
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50"
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className="w-[320px] sm:w-[400px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden p-2">
              <div className="px-3 pt-3 pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Free Growth Calculators</h3>
              </div>
              <div className="space-y-1">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="group flex items-start gap-3 rounded-xl p-3 hover:bg-muted transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <div className={cn("p-2 rounded-lg border shrink-0", tool.tone)}>
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                          {tool.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-normal">
                          {tool.desc}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
