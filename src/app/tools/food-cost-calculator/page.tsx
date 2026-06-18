import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FoodCostClient } from "./FoodCostClient";

export const metadata: Metadata = {
  title: "Free Food Cost Calculator for Restaurants | PriceShield",
  description:
    "Calculate food cost percentage, cost per serving, and ideal menu pricing for your restaurant. Free interactive tool with industry benchmarks and margin analysis.",
  alternates: {
    canonical: "https://trypriceshield.com/tools/food-cost-calculator",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trypriceshield.com/tools/food-cost-calculator/#webpage",
      "url": "https://trypriceshield.com/tools/food-cost-calculator",
      "name": "Food Cost Calculator - PriceShield",
      "description":
        "Free tool to calculate food cost percentage, cost per serving, and recommended menu pricing for restaurants.",
      "publisher": { "@id": "https://trypriceshield.com/#organization" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://trypriceshield.com/tools/food-cost-calculator/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is food cost percentage and how do you calculate it?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Food cost percentage is the ratio of ingredient costs to the menu selling price, expressed as a percentage. The formula is: Food Cost % = (Total Ingredient Cost ÷ Menu Selling Price) × 100. For example, if a dish costs $4 in ingredients and sells for $14, the food cost percentage is 28.6%.",
          },
        },
        {
          "@type": "Question",
          "name": "What is the ideal food cost percentage for a restaurant?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The ideal food cost percentage varies by restaurant type. Fast food and quick-service restaurants typically target 25-30%, casual dining restaurants aim for 28-35%, and fine dining establishments usually run between 30-40%. Most full-service restaurants target an overall food cost between 28% and 35%.",
          },
        },
        {
          "@type": "Question",
          "name": "How can a restaurant reduce its food cost percentage?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Restaurants can lower food costs through portion control and standardized recipes, regular supplier price auditing to catch price creep, reducing food waste with better inventory management, negotiating volume discounts with vendors, cross-utilizing ingredients across menu items, and using technology like PriceShield to automatically track supplier price changes.",
          },
        },
      ],
    },
  ],
};

export default function FoodCostCalculatorPage() {
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
                <span className="text-foreground font-medium">Food Cost Calculator</span>
              </li>
            </ol>
          </nav>

          <FoodCostClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
