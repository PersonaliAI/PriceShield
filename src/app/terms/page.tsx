"use client";

import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Effective Date: April 12, 2026</p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using PriceShield, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our platform.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Service Description</h2>
          <p className="text-muted-foreground leading-relaxed">
            PriceShield provides AI-powered invoice monitoring and price hike detection. Our services are provided "as is" and "as available." We do not guarantee 100% accuracy in AI extraction but strive for the highest industry standards.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Obligations</h2>
          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account and forwarding addresses.</li>
            <li>You agree not to use the service for any illegal or unauthorized purpose.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Subscriptions & Payments</h2>
          <p className="text-muted-foreground leading-relaxed">
            Payments are handled securely via Lemon Squeezy. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            PriceShield shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our service, including lost profits or business interruptions.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These terms are governed by the laws of the jurisdiction in which our company is registered, without regard to its conflict of law principles.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/40 py-12 text-center bg-card/10">
        <p className="text-sm text-muted-foreground">© 2026 PriceShield AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
