"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORY_META, POSTS_BY_DATE, type Category, type Post } from "@/lib/blog";
import { PostCard } from "./post-card";

export function CategoryFilteredGrid({ all }: { all: Post[] }) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const used = new Set(all.map((p) => p.category));
  const available: ("all" | Category)[] = [
    "all",
    ...(Array.from(used) as Category[]),
  ];

  const visible = filter === "all" ? all : all.filter((p) => p.category === filter);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {available.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize cursor-pointer",
              filter === f
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
            )}
          >
            {f === "all" ? "All articles" : CATEGORY_META[f].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((p, i) => (
          <PostCard key={p.slug} post={p} index={i} />
        ))}
      </div>
    </>
  );
}

export { POSTS_BY_DATE };
