"use client";

import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: April 12, 2026</p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to PriceShield ("we," "our," or "us"). We are committed to protecting your privacy and ensuring that your personal and business data is handled securely. This Privacy Policy explains how we collect, use, and safeguard your information when you use our invoice monitoring platform.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li><strong>Account Information:</strong> Name, email address, password, and business details provided during registration.</li>
            <li><strong>Invoice Data:</strong> Suppliers, SKU data, pricing history, and billing addresses extracted from invoices you upload or forward to us.</li>
            <li><strong>Communication Data:</strong> Preferences for Telegram, WhatsApp, and email alerts.</li>
            <li><strong>Usage Data:</strong> Analytics collected via Google Firebase to understand how you interact with our platform.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use your data strictly to provide our services, including:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-3 text-muted-foreground">
            <li>Extracting price data to detect stealth supplier hikes.</li>
            <li>Generating automated margin reports.</li>
            <li>Sending real-time alerts via your chosen channels.</li>
            <li>Improving our AI extraction models (anonymized data only).</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use industry-standard encryption (AES-256) and secure cloud infrastructure hosted on Google Cloud Platform. Your data is isolated at the tenant level to prevent unauthorized access.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, export, or delete your account data at any time through the Settings panel. If you have questions about your data, contact us at privacy@trypriceshield.com.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/40 py-12 text-center bg-card/10">
        <p className="text-sm text-muted-foreground">© 2026 PriceShield AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
