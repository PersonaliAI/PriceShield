"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_META, type Post } from "@/lib/blog";

export function PostCard({
  post,
  variant = "default",
  index = 0,
}: {
  post: Post;
  variant?: "default" | "featured" | "compact";
  index?: number;
}) {
  const meta = CATEGORY_META[post.category];

  if (variant === "compact") {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group flex items-start gap-3 rounded-lg p-3 -mx-3 hover:bg-muted transition-colors"
      >
        <span
          className={`shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${meta.tone}`}
        >
          {meta.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-snug group-hover:underline underline-offset-4 truncate">
            {post.title}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {post.description}
          </p>
        </div>
        <ArrowUpRight className="size-3.5 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
      >
        <Link
          href={`/blog/${post.slug}`}
          className="group block rounded-2xl border border-border bg-card overflow-hidden hover:border-foreground/20 transition-all hover:-translate-y-0.5"
        >
          <div
            className={`aspect-[16/9] grid place-items-center ${meta.tone} relative overflow-hidden`}
          >
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,currentColor_1px,transparent_1px)] [background-size:18px_18px]" />
            <h3 className="relative text-2xl md:text-3xl font-bold tracking-tight px-6 text-center leading-tight">
              {post.title}
            </h3>
          </div>
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
              <span
                className={`px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider text-[9px] ${meta.tone}`}
              >
                {meta.label}
              </span>
              <span>·</span>
              <span>{formatDate(post.date)}</span>
              <span>·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {post.description}
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium group-hover:underline underline-offset-4">
              Read article
              <ArrowUpRight className="size-3.5" />
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group block rounded-xl border border-border bg-card p-5 h-full hover:border-foreground/20 transition-all hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3">
          <span
            className={`px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider text-[9px] ${meta.tone}`}
          >
            {meta.label}
          </span>
          <span>·</span>
          <span>{post.readingMinutes} min</span>
        </div>
        <h3 className="text-base font-semibold leading-snug group-hover:underline underline-offset-4">
          {post.title}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {post.description}
        </p>
        <div className="mt-4 text-[11px] text-muted-foreground">
          {formatDate(post.date)}
        </div>
      </Link>
    </motion.article>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
