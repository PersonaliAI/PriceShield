import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { PostCard } from "@/components/blog/post-card";
import { CATEGORY_META, POSTS, getPost, relatedPosts } from "@/lib/blog";

type RouteProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `https://trypriceshield.com/blog/${slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      siteName: "PriceShield",
      locale: "en_US",
      publishedTime: post.date,
      authors: ["PriceShield Team"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: RouteProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const meta = CATEGORY_META[post.category];
  const related = relatedPosts(slug, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "PriceShield",
      url: "https://trypriceshield.com",
    },
    publisher: {
      "@type": "Organization",
      name: "PriceShield",
      logo: {
        "@type": "ImageObject",
        url: "https://trypriceshield.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://trypriceshield.com/blog/${post.slug}`,
    },
    articleSection: meta.label,
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex-1 pt-24 pb-20">
        <article>
          {/* Hero */}
          <header className="border-b border-border pb-12">
            <div className="mx-auto max-w-3xl px-6">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="size-3" />
                All articles
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <span
                  className={`px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider text-[10px] ${meta.tone}`}
                >
                  {meta.label}
                </span>
                <span>·</span>
                <span>{formatDate(post.date)}</span>
                <span>·</span>
                <span>{post.readingMinutes} min read</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                {post.title}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {post.description}
              </p>
            </div>
          </header>

          {/* Body */}
          <div className="mx-auto max-w-3xl px-6 py-14">
            <Markdown>{post.body}</Markdown>

            {/* Byline / share */}
            <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-500 text-white grid place-items-center text-sm font-semibold">
                  PS
                </div>
                <div>
                  <div className="text-sm font-semibold">PriceShield Team</div>
                  <div className="text-xs text-muted-foreground">
                    Building the margin guardian for restaurants.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    post.title,
                  )}&url=${encodeURIComponent(
                    `https://trypriceshield.com/blog/${post.slug}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Share on X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    `https://trypriceshield.com/blog/${post.slug}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Share on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="py-14 border-t border-border">
            <div className="mx-auto max-w-5xl px-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
                Keep reading
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {related.map((p, i) => (
                  <PostCard key={p.slug} post={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 border-t border-border">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
              Try PriceShield on your own invoices
            </h2>
            <p className="text-muted-foreground mb-7 max-w-md mx-auto">
              Free to start. Forward 5 supplier invoices and see what you've
              been overpaying.
            </p>
            <Button
              size="lg"
              className="h-11 px-6 text-sm cursor-pointer"
              render={<Link href="/login" />}
            >
              Get started free
              <ArrowUpRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
