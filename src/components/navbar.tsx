"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_META, FEATURED_POSTS } from "@/lib/blog";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#products", label: "Products" },
  { href: "/shopper", label: "Extension" },
  { href: "/#pricing", label: "Pricing" },
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
  const { user, loading } = useAuth();
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
      <nav className="mx-auto max-w-5xl px-6 h-16 grid grid-cols-2 md:grid-cols-3 items-center">
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
        <div className="hidden md:flex items-center justify-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <ResourcesMenu />
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-3">
          {isAuthed ? (
            <>
              <Link
                href="/shopper/dashboard"
                className="hidden md:inline-flex text-sm font-medium hover:text-foreground/80 transition-colors"
              >
                Shopper
              </Link>
              <Link
                href="/shopper/competitors"
                className="hidden md:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Competitors
              </Link>
              <Button
                size="sm"
                className="cursor-pointer text-xs md:text-sm h-9 px-4 font-semibold"
                render={<Link href="/dashboard" />}
              >
                My dashboard
              </Button>
            </>
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-background border-b border-border"
          >
            <div className="mx-auto max-w-5xl px-6 py-6 flex flex-col gap-4">
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
              <div className="pt-3 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full"
                  render={<Link href="/login" onClick={() => setOpen(false)} />}
                >
                  Log in
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
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
