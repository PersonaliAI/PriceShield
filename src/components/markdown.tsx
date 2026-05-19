"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

/**
 * Markdown renderer with GitHub-flavored markdown + KaTeX math support.
 */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-base leading-relaxed [&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:my-1",
        "[&_strong]:font-semibold [&_em]:italic",
        "[&_a]:underline [&_a]:underline-offset-4 [&_a]:font-medium hover:[&_a]:text-foreground/80",
        "[&_code]:font-mono [&_code]:text-[0.875em] [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded",
        "[&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-emerald-500/60 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
        "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:tracking-tight",
        "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2",
        "[&_table]:w-full [&_table]:my-4 [&_table]:text-sm [&_th]:text-left [&_th]:font-semibold [&_th]:px-3 [&_th]:py-2 [&_th]:border-b [&_th]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-border/50",
        "[&_hr]:border-border [&_hr]:my-6",
        "[&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ href, children, ...props }) => {
            const isInternal = href?.startsWith("/") || href?.startsWith("#");
            return (
              <a
                href={href}
                target={isInternal ? undefined : "_blank"}
                rel={isInternal ? undefined : "noopener noreferrer"}
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
