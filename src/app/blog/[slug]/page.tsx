import { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-data";
import { ArrowLeft, Clock, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Image from "next/image";
import BlogShare from "@/components/BlogShare";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `https://trypriceshield.com/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
      images: [
        {
          url: post.image,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const url = `https://trypriceshield.com/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": `https://trypriceshield.com${post.image}`,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "datePublished": post.date,
    "description": post.excerpt,
    "publisher": {
      "@type": "Organization",
      "name": "PriceShield",
      "logo": {
        "@type": "ImageObject",
        "url": "https://trypriceshield.com/logo.png"
      }
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Mini Nav */}
      <nav className="border-b border-border/40 bg-card/30 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 group text-sm font-medium text-muted-foreground hover:text-emerald-400 transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 mr-4">
              <Image src="/logo.png" alt="Logo" width={24} height={24} className="h-6 w-auto" />
            </Link>
            <Button size="sm" asChild className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold rounded-lg shadow-lg shadow-emerald-500/20">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <article className="space-y-12">
          {/* Hero */}
          <header className="space-y-6">
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              <span className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{post.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {post.readTime}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-foreground">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-border/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <User className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{post.author}</p>
                  <p className="text-xs text-muted-foreground">{post.date}</p>
                </div>
              </div>

              {/* Social Share */}
              <BlogShare title={post.title} url={url} />
            </div>
          </header>

          {/* Decorative Image area */}
          <div className="aspect-[21/9] w-full rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 relative overflow-hidden flex items-center justify-center group shadow-2xl">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent opacity-50" />
             <div className="absolute -bottom-32 -left-32 h-64 w-64 bg-emerald-500/10 blur-3xl animate-pulse" />
             <Shield className="h-24 w-24 text-emerald-500/10 group-hover:scale-110 transition-transform duration-1000" />
             <div className="absolute inset-0 flex items-center justify-center px-12 text-center select-none pointer-events-none">
                <p className="text-2xl font-black text-emerald-500/5 uppercase tracking-[0.5em]">{post.title.split(' ')[0]}</p>
             </div>
          </div>

          {/* Body Content */}
          <div 
             className="prose prose-emerald prose-invert max-w-none 
                        prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
                        prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:text-lg
                        prose-strong:text-emerald-400 prose-strong:font-bold
                        prose-li:text-muted-foreground prose-li:text-lg
                        prose-ol:list-decimal prose-ul:list-disc
                        animate-in fade-in slide-in-from-bottom-4 duration-1000"
             dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA Footer */}
          <div className="pt-16 border-t border-border/30">
            <div className="rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 p-10 text-center space-y-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/10 blur-[80px] rounded-full group-hover:scale-125 transition-transform" />
               <h3 className="text-2xl font-bold">Stop guessing, start protecting</h3>
               <p className="text-muted-foreground text-lg">PriceShield analyzes every line item of every invoice, automatically. No spreadsheet setup required.</p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Button size="lg" asChild className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold rounded-xl h-12 px-8 shadow-lg shadow-emerald-500/20">
                   <Link href="/login">Create Free Account</Link>
                 </Button>
                 <Button variant="ghost" asChild className="font-bold underline text-emerald-400">
                   <Link href="/blog">More insights</Link>
                 </Button>
               </div>
            </div>
          </div>
        </article>
      </main>

      {/* Basic Footer */}
      <footer className="border-t border-border/40 py-12 mt-20 bg-card/10">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground font-medium">
             <p>© 2026 PriceShield AI. Protecting restaurant margins with precision.</p>
             <div className="mt-4 flex items-center justify-center gap-6">
                <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
             </div>
        </div>
      </footer>
    </div>
  );
}
