import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Pricing } from "@/components/pricing";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing — PriceShield | Supplier Price Monitoring for Hospitality",
  description:
    "Simple pricing for PriceShield. Start free with 5 invoice audits, no credit card. Pro Shield is $49/mo for unlimited audits and real-time alerts; Multi-Location is $149/mo for up to 5 sites.",
  alternates: { canonical: "https://trypriceshield.com/pricing" },
};

// Pricing FAQ schema for rich results in Google.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is there a free plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Free Audit plan includes 5 manual invoice uploads with full AI line-item extraction and variance detection — no credit card required. It's designed to prove the AI works on your own invoices before you pay anything.",
      },
    },
    {
      "@type": "Question",
      name: "How much does PriceShield cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pro Shield is $49/month for one location with unlimited auto-forwarding, real-time alerts, AI CFO chat, and unlimited vendor tracking. Multi-Location is $149/month for up to 5 venue locations. Most operators recover 5–20× the subscription in caught price hikes within the first month.",
      },
    },
    {
      "@type": "Question",
      name: "Can I change or cancel my plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can upgrade, downgrade, or cancel anytime from your billing dashboard. Billing runs through a secure checkout provider.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a credit card to start?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. You can run your first 5 invoice audits on the Free plan without entering any payment details.",
      },
    },
  ],
};

const faqs = [
  {
    q: "Is there a free plan?",
    a: "Yes — the Free Audit plan gives you 5 invoice uploads with full AI extraction and variance detection, no credit card required. Prove the AI works on your own invoices first.",
  },
  {
    q: "What's the difference between Pro Shield and Multi-Location?",
    a: "Pro Shield ($49/mo) covers one venue with unlimited auto-forwarding, real-time alerts, and AI CFO chat. Multi-Location ($149/mo) covers up to 5 venues with a combined AI CFO across locations and priority support.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Upgrade, downgrade, or cancel from your billing dashboard whenever you want.",
  },
  {
    q: "Will it really pay for itself?",
    a: "Most operators recover 5–20× the subscription in caught hikes in their first month. If a single missed price increase costs more than $49, the math works.",
  },
];

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-black text-foreground pt-24 pb-16 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
            Pricing
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            Pay <span className="text-emerald-500">less</span> than one missed hike costs.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Start free and audit your own invoices in seconds. Upgrade only once you've
            seen what PriceShield catches.
          </p>
        </div>

        {/* Reuse the homepage pricing grid */}
        <Pricing />

        {/* Why it pays */}
        <section className="max-w-3xl mx-auto px-6 mt-8">
          <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-emerald-500/5 p-8 text-center space-y-3">
            <h2 className="text-xl md:text-2xl font-bold">Every plan pays for itself.</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              A typical delivery has 30–80 line items. One stealth increase the eye misses
              can cost more per month than your whole subscription. PriceShield flags every
              drift the day it happens.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 mt-14">
          <h2 className="text-2xl font-bold text-center mb-8">Pricing FAQ</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-1.5">{f.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 mt-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Run your first audit free.
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            No credit card. Upload up to 5 supplier invoices and see what's slipping by.
          </p>
          <Button
            size="lg"
            className="font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white"
            render={<Link href="/login" />}
          >
            Start free
          </Button>
        </section>
      </main>
      <Footer />
    </>
  );
}
