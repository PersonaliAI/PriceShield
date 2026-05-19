import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/blog/post-card";
import { CategoryFilteredGrid } from "@/components/blog/category-filter";
import { FEATURED_POSTS, POSTS_BY_DATE } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Resources & Playbooks",
  description:
    "How operators use PriceShield to catch supplier price hikes, set up auto-forwarding, and run the AI CFO — with real numbers from real kitchens.",
  alternates: { canonical: "https://trypriceshield.com/blog" },
  openGraph: {
    title: "PriceShield — Resources & Playbooks",
    description:
      "Real examples of how restaurant operators stop supplier price creep.",
    url: "https://trypriceshield.com/blog",
    siteName: "PriceShield",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PriceShield — Resources & Playbooks",
    description:
      "Real examples of how restaurant operators stop supplier price creep.",
  },
};

export default function BlogIndexPage() {
  const featured = FEATURED_POSTS;

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        {/* Hero */}
        <section className="border-b border-border pb-14">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <p className="text-sm font-medium text-emerald-500 mb-3">Resources</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              How operators <span className="text-emerald-500">actually</span>{" "}
              stop supplier creep
            </h1>
            <p className="mt-5 text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Playbooks, deep-dives, and step-by-step guides from teams running
              PriceShield in production. Real numbers, real workflows, no
              theory.
            </p>
          </div>
        </section>

        {/* Featured */}
        <section className="py-14 border-b border-border">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Featured
              </h2>
              <Link
                href="#all"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Browse all ↓
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featured.map((p, i) => (
                <PostCard key={p.slug} post={p} variant="featured" index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* All */}
        <section id="all" className="py-14">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-2xl font-bold tracking-tight text-center mb-3">
              All articles
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Filter by topic, or scroll the full list.
            </p>
            <CategoryFilteredGrid all={POSTS_BY_DATE} />
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 border-t border-border">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
              Ready to put PriceShield to work?
            </h2>
            <p className="text-muted-foreground mb-7 max-w-md mx-auto">
              Audit your next 5 invoices free. No credit card. Upgrade when
              you've seen what you're recovering.
            </p>
            <Button
              size="lg"
              className="h-11 px-6 text-sm cursor-pointer"
              render={<Link href="/login" />}
            >
              Try PriceShield free
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
