"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const BOT_ID = "2bbeb341-6d57-4c4b-af48-8b5db84a7244";

export default function ChatClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Attach open shadow root for style isolation
    const shadow = container.shadowRoot || container.attachShadow({ mode: "open" });

    // Inject stylesheet
    if (!shadow.querySelector("link")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://chatty.personaliai.com/chatty-app.css";
      shadow.appendChild(link);
    }

    let unmountFn: (() => void) | undefined;

    const mountApp = () => {
      const ChattyDOM = (
        window as unknown as {
          ChattyDOM?: {
            mount: (
              target: HTMLElement | ShadowRoot,
              opts: unknown
            ) => { unmount: () => void };
          };
        }
      ).ChattyDOM;

      if (ChattyDOM && ChattyDOM.mount) {
        const instance = ChattyDOM.mount(shadow, {
          botId: BOT_ID,
          mobileFullscreen: false,
        });
        unmountFn = instance?.unmount;
      }
    };

    if ((window as unknown as { ChattyDOM?: unknown }).ChattyDOM) {
      mountApp();
    } else {
      const script = document.createElement("script");
      script.src = "https://chatty.personaliai.com/chatty-app.js";
      script.async = true;
      script.onload = mountApp;
      document.head.appendChild(script);
    }

    return () => {
      unmountFn?.();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="PriceShield"
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-lg"
                priority
              />
              <span className="text-lg font-semibold tracking-tight text-foreground">
                PriceShield
              </span>
            </Link>
            <div className="hidden h-4 w-px bg-border/60 sm:block" />
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">
                AI Assistant Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="size-3.5" />
                Back to Home
              </Button>
            </Link>
            <Link href="/free-audit">
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium">
                <Sparkles className="size-3.5" />
                Free Audit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Chat Container - Direct Shadow DOM Mount (100% Vector Sharp, Zero SDK / Iframe) */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8">
        <div
          ref={containerRef}
          className="w-full max-w-3xl flex flex-col h-[calc(100vh-8rem)] min-h-[600px] max-h-[820px] rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-2xl overflow-hidden relative"
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <p>© 2026 PriceShield AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/support" className="hover:underline">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
