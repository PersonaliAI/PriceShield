import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CalculatorClient } from "./CalculatorClient";

export const metadata: Metadata = {
  title: "Free Supplier Price Leakage Calculator for Hospitality | PriceShield",
  description:
    "Calculate how much money your hospitality business is leaking to supplier price creep and invoice mistakes. Estimate your potential annual savings and labor reduction.",
  alternates: {
    canonical: "https://trypriceshield.com/tools/margin-leakage-calculator",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trypriceshield.com/tools/margin-leakage-calculator/#webpage",
      "url": "https://trypriceshield.com/tools/margin-leakage-calculator",
      "name": "Supplier Price Leakage Calculator - PriceShield",
      "description": "Free tool to calculate hospitality supplier spend leaks, price creep, and audit times.",
      "publisher": { "@id": "https://trypriceshield.com/#organization" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://trypriceshield.com/tools/margin-leakage-calculator/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does a hospitality business lose money to margin leakage?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Margin leakage happens in two main ways: (1) manual billing mistakes, overcharges, delivery fee additions, or wrong taxes by suppliers; and (2) price creep, which are small weekly price increases on key supplies that go unnoticed by busy operations staff.",
          },
        },
        {
          "@type": "Question",
          "name": "How is the potential annual savings calculated?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The savings estimate combines: (1) the money recovered from catching average supplier error rates (typically 1-3% of spend), (2) margin saved from stopping stealth supplier price creep (typically 2-4%), and (3) the value of labor saved by automating the invoice auditing process (estimated at 15 minutes per manual invoice audit).",
          },
        },
      ],
    },
  ],
};

export default function MarginLeakageCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-black text-foreground pt-24 pb-16">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li className="after:content-['/'] after:ml-2"></li>
              <li>
                <span className="text-muted-foreground">Tools</span>
              </li>
              <li className="after:content-['/'] after:ml-2"></li>
              <li>
                <span className="text-foreground font-medium">Margin Leakage Calculator</span>
              </li>
            </ol>
          </nav>

          <CalculatorClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
