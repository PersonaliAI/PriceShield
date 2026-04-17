"use client";

import { Share2, MessageSquare, Share } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BlogShareProps {
  title: string;
  url: string;
}

export default function BlogShare({ title, url }: BlogShareProps) {
  const shareTitle = `Check out this post from PriceShield: ${title}`;

  const shareLinks = [
    {
      name: "X",
      icon: <Share2 className="h-4 w-4" />,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareTitle)}`,
      color: "hover:bg-slate-900 hover:text-white"
    },
    {
      name: "LinkedIn",
      icon: <Share className="h-4 w-4" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: "hover:bg-blue-600 hover:text-white"
    },
    {
      name: "Reddit",
      icon: <MessageSquare className="h-4 w-4" />,
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareTitle)}`,
      color: "hover:bg-orange-600 hover:text-white"
    }
  ];

  return (
    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/50">
      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Share</div>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={link.name}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "h-8 w-8 rounded-lg transition-all duration-300",
            link.color
          )}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
