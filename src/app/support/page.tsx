"use client";

import Link from "next/link";
import { Shield, ArrowLeft, Mail, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="border-b border-border/40 bg-card/30 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-400" />
            <span className="text-xl font-bold tracking-tight">PriceShield</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20 prose prose-invert prose-emerald">
        <h1 className="text-4xl font-bold mb-8">Support</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          We're here to help you protect your margins. Reach out to our support team and we'll get back to you as soon as possible.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 not-prose">
          <a
            href="mailto:tharindu@priceshield.com"
            className="flex flex-col items-center justify-center p-8 bg-card/50 border border-border/50 rounded-2xl hover:border-emerald-500/30 transition-all group"
          >
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Email Us</h3>
            <p className="text-sm text-muted-foreground mt-2">tharindu@priceshield.com</p>
          </a>

          <a
            href="https://www.linkedin.com/company/108097023"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-8 bg-card/50 border border-border/50 rounded-2xl hover:border-emerald-500/30 transition-all group"
          >
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Linkedin className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Follow on LinkedIn</h3>
            <p className="text-sm text-muted-foreground mt-2">PriceShield</p>
          </a>
        </div>
      </main>

      <footer className="border-t border-border/40 py-12 text-center bg-card/10 mt-auto">
        <p className="text-sm text-muted-foreground">© 2026 PriceShield AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
