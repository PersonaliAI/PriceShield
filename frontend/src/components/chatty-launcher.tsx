"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChattyWidget } from "@personaliai/react-widget";
import "@personaliai/react-widget/styles.css";

interface ChattyLauncherProps {
  botId: string;
}

// Matches the max-sm: breakpoint (640px) used on the panel container below —
// ChattyWidget needs to know this separately so it can drop its own rounded
// corners to match the container going edge-to-edge full-screen.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 639px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

// Replaces the old <Script src="https://chatty.personaliai.com/widget.js">
// embed — that loaded the chat panel in a cross-origin iframe, which gets
// its own separate Chrome compositor surface (Site Isolation) and measurably
// softens text rendering during/after browser zoom. ChattyWidget renders
// the same chat UI directly in this page's own DOM instead, so there's no
// iframe and no cross-origin boundary for that penalty to apply to.
//
// widget.js also handled the floating launcher button, unread badge, and
// proactive teaser message itself — this component re-implements just the
// launcher + open/close + unread badge; the teaser/trigger-rules behavior
// isn't reproduced here since PriceShield's bot has none configured.
export default function ChattyLauncher({ botId }: ChattyLauncherProps) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const isMobile = useIsMobile();

  return (
    <>
      <div
        className="fixed z-[2147483646] flex flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-200 ease-out
          bottom-24 right-5 w-[380px] h-[560px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-7.5rem)]
          max-sm:bottom-0 max-sm:right-0 max-sm:w-screen max-sm:h-[100dvh] max-sm:max-w-none max-sm:max-h-none max-sm:rounded-none"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "none" : "translateY(12px)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <ChattyWidget
          botId={botId}
          originToken={null}
          forceFullscreen={isMobile}
          onWidgetClose={() => setOpen(false)}
          onAssistantMessage={() => {
            if (!open) setUnread((u) => u + 1);
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) setUnread(0);
        }}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-5 z-[2147483647] flex size-[60px] items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-[20px] h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
