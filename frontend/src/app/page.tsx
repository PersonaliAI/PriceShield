import type { Metadata } from "next";
import Script from "next/script";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Products } from "@/components/products";
import { Pricing } from "@/components/pricing";
import { FAQ } from "@/components/faq";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title:
    "PriceShield — AI Supplier Price Monitoring & Invoice Auditing for Hospitality",
  description:
    "Catch every supplier price hike automatically. PriceShield audits invoices in 5 seconds, flags stealth creep, and alerts you on Telegram, Slack, or email. Start free — 5 audits, no credit card.",
  alternates: { canonical: "https://trypriceshield.com" },
};

// FAQPage schema for rich results in Google.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does PriceShield detect a supplier price hike?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every line item on every invoice is compared against the most recent baseline from the same vendor. PriceShield uses semantic SKU matching so renames like 'Prime Beef Tenderloin' vs 'USDA Beef Tenderloin' still match. If variance exceeds your threshold (default 2%), the item is flagged with the exact margin impact.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is the AI invoice extraction?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PriceShield's extraction model returns a confidence score per line item. Typed supplier PDFs (Cheney Bros, Performance Food Group, GFS, regional distributors, and all major broadline suppliers) average 97%+ accuracy. Photographed paper invoices average ~93%. Low-confidence items are flagged for one-click review.",
      },
    },
    {
      "@type": "Question",
      name: "What alert channels does PriceShield support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Telegram, Slack, WhatsApp, OneSignal push, and email — daily, weekly, or monthly digests. Most operators use Telegram for real-time hike alerts plus a weekly email summary for their accountant.",
      },
    },
    {
      "@type": "Question",
      name: "How much does PriceShield cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Free for the first 5 invoice audits, no credit card required. Pro Shield is $49/month for unlimited invoices and real-time alerts. Multi-Location is $149/month for up to 5 venue locations. Most operators recover 5–40x the subscription in caught hikes within the first month.",
      },
    },
    {
      "@type": "Question",
      name: "Do I have to upload invoices manually?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Set up auto-forwarding once: a Gmail/Outlook filter forwards your supplier invoice emails to your unique PriceShield address. Future invoices audit themselves automatically. Manual upload remains available for one-off audits.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data shared with anyone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Your invoice data lives in an isolated Postgres database protected by row-level security. AI compute runs in private cloud infrastructure; no provider retains your inputs. We've never sold data and never will.",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Products />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />

      {/* Chatty AI chat assistant widget */}
      <Script
        id="chatty-widget"
        src="https://chatty.personaliai.com/widget.js"
        data-id="9930ce3a-6152-4b2d-bc83-c78ab893a2e5"
        strategy="lazyOnload"
      />
    </>
  );
}
