import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Pricing } from "@/components/pricing";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing — PriceShield | Supplier Invoice Auditing for Small Business",
  description:
    "Start free with 5 invoice audits — no credit card. Pro Shield is $49/mo for automatic protection and real-time alerts. Multi-Location is $149/mo for businesses with up to 5 sites.",
  alternates: { canonical: "https://trypriceshield.com/pricing" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is there a free plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Upload up to 5 invoices for free — no credit card required. The AI extracts every line item and flags any price increases against your history. It's designed to show you what PriceShield catches before you pay anything.",
      },
    },
    {
      "@type": "Question",
      name: "How much does PriceShield cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pro Shield is $49/month for one business location with unlimited auto-forwarding, real-time alerts, and AI cost analysis. Multi-Location is $149/month for up to 5 locations. Most small businesses recover 5–20× the subscription cost in caught price hikes within the first month.",
      },
    },
    {
      "@type": "Question",
      name: "Will it pay for itself?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Almost certainly. Suppliers routinely raise prices by 3–8% across individual line items, knowing most small business owners are too busy to check. If one missed increase costs you more than $49 in a month — and it usually does — PriceShield pays for itself.",
      },
    },
    {
      "@type": "Question",
      name: "Can I change or cancel my plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Upgrade, downgrade, or cancel anytime from your billing dashboard. No long-term contracts.",
      },
    },
  ],
};

const faqs = [
  {
    q: "Is there a free plan?",
    a: "Yes — upload up to 5 invoices with no credit card. The AI reads every line item and flags anything that went up vs your previous orders. See exactly what PriceShield catches before you pay a cent.",
  },
  {
    q: "Will it actually pay for itself?",
    a: "Almost always. Suppliers raise prices 3–8% on individual line items and rely on owners being too busy to notice. If one missed increase costs more than $49 a month — and it usually does — PriceShield more than covers itself. Most small businesses recover 5–20× the monthly fee in the first month alone.",
  },
  {
    q: "What's the difference between Pro Shield and Multi-Location?",
    a: "Pro Shield ($49/mo) covers one location — perfect for a single business. Multi-Location ($149/mo) covers up to 5 sites, with a combined view of supplier costs across all of them. Same features, bigger picture.",
  },
  {
    q: "Does it work for my type of business?",
    a: "If you buy from suppliers regularly and get invoices as PDFs or emails, it works. Cafes, contractors, clinics, caterers, print shops, wholesalers — any small business with supplier relationships.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Upgrade, downgrade, or cancel from your billing dashboard whenever you want. No contracts, no fees.",
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
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
            Simple pricing
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            Costs less than <span className="text-emerald-500">one missed hike.</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Start free and see what the AI catches on your own invoices.
            Upgrade only once you&apos;ve seen it work.
          </p>
        </div>

        <Pricing />

        {/* ROI callout */}
        <section className="max-w-3xl mx-auto px-6 mt-8">
          <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-emerald-500/5 p-8 text-center space-y-3">
            <h2 className="text-xl md:text-2xl font-bold">Every plan pays for itself.</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Suppliers raise prices line item by line item, counting on you being too busy to check.
              A single missed increase on one product often costs more per month than your entire subscription.
              PriceShield flags every change the day it happens.
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
            No credit card. Upload up to 5 supplier invoices and see exactly what&apos;s slipping past you.
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
