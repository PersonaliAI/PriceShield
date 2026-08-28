"use client";

import { useEffect, useState } from "react";
import { Bot, Headphones, Sparkles, MessageSquare, User, X, type LucideIcon } from "lucide-react";
import { ChattyWidget } from "@personaliai/react-widget";
import "@personaliai/react-widget/styles.css";

interface ChattyLauncherProps {
  botId: string;
}

const BACKEND_URL = "https://api.chatty.personaliai.com";

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

// WCAG-based "what icon color goes on this background" — mirrors
// src/lib/color-contrast.ts's getOnColor in the chatty repo (and widget.js's
// own copy). Kept as a small local copy rather than a shared import since
// this is a standalone app pulling the widget in as a package, same
// reasoning widget.js documents for its own copy.
function getOnColor(hex: string): string {
  const clean = (hex || "#f97316").replace("#", "").trim();
  const full = clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean;
  const num = parseInt(full, 16);
  if (full.length !== 6 || isNaN(num)) return "#ffffff";
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  const chan = [r, g, b].map((v) => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const bgLum = 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
  const blackLum = 0.2126 * Math.pow((0x18 / 255 + 0.055) / 1.055, 2.4);
  const whiteContrast = (1 + 0.05) / (bgLum + 0.05);
  const blackContrast = (Math.max(bgLum, blackLum) + 0.05) / (Math.min(bgLum, blackLum) + 0.05);
  return whiteContrast >= blackContrast ? "#ffffff" : "#111827";
}

// Each design preset's own default launcher look — mirrors widget.js's
// LAUNCHER_STYLES (and src/lib/widget-style.ts's copy in the chatty repo)
// so a PriceShield-side custom launcher still matches whichever design the
// dashboard has selected, not a fixed color.
const LAUNCHER_STYLES: Record<string, { bg: string; radius: string; shadow: string; dot: string }> = {
  minimal: { bg: "#1c1a15", radius: "50%", shadow: "0 6px 16px rgba(0,0,0,.18)", dot: "#f3f2ee" },
  playful: { bg: "#ff8a5c", radius: "50%", shadow: "0 8px 20px rgba(255,138,92,.45)", dot: "#ffffff" },
  corporate: { bg: "#1c2e4a", radius: "10px", shadow: "0 6px 16px rgba(28,46,74,.3)", dot: "#8fb0dc" },
  "dark-sleek": { bg: "#14141a", radius: "50%", shadow: "0 0 24px rgba(0,229,199,.35)", dot: "#00e5c7" },
  "gradient-glow": { bg: "linear-gradient(135deg,#a855f7,#ec4899)", radius: "50%", shadow: "0 10px 26px rgba(168,85,247,.4)", dot: "#ffffff" },
  glassmorphism: { bg: "rgba(255,255,255,.25)", radius: "50%", shadow: "0 8px 24px rgba(0,0,0,.2)", dot: "#ffffff" },
  ecommerce: { bg: "#0f9d8c", radius: "50%", shadow: "0 8px 20px rgba(15,157,140,.35)", dot: "#ffffff" },
  "healthcare-calm": { bg: "#6f9c7d", radius: "50%", shadow: "0 8px 20px rgba(111,156,125,.35)", dot: "#f4f7f3" },
  neubrutalism: { bg: "#111111", radius: "6px", shadow: "5px 5px 0 0 #111111", dot: "#ffde59" },
  "luxury-editorial": { bg: "#161412", radius: "50%", shadow: "0 8px 22px rgba(0,0,0,.3)", dot: "#b08a3e" },
};
const LEGACY_STYLE_MAP: Record<string, string> = {
  liquid: "glassmorphism", neumorphism: "corporate", claymorphism: "playful",
  bento: "minimal", brutalism: "neubrutalism", retro: "dark-sleek", aurora: "gradient-glow",
  minimalist: "minimal", elevated: "corporate", frosted: "glassmorphism",
  bold: "gradient-glow", contrast: "dark-sleek",
};
function normalizeDesign(id: string | undefined): string {
  if (!id) return "minimal";
  if (LAUNCHER_STYLES[id]) return id;
  return LEGACY_STYLE_MAP[id] || "minimal";
}
const LAUNCHER_ICONS: Record<string, LucideIcon> = {
  bot: Bot, headset: Headphones, sparkles: Sparkles, message: MessageSquare, user: User,
};

interface LauncherLook {
  bg: string;
  radius: string;
  shadow: string;
  iconColor: string;
  Icon: LucideIcon | null;
  dotColor: string | null;
  imageUrl: string | null;
}

function defaultLook(): LauncherLook {
  const d = LAUNCHER_STYLES.minimal;
  return { bg: d.bg, radius: d.radius, shadow: d.shadow, iconColor: getOnColor(d.bg), Icon: null, dotColor: d.dot, imageUrl: null };
}

export default function ChattyLauncher({ botId }: ChattyLauncherProps) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const isMobile = useIsMobile();
  const [look, setLook] = useState<LauncherLook>(defaultLook);

  // Mirrors widget.js's own theme fetch, but only for the launcher button —
  // the panel itself (ChattyWidget) already fetches and applies the bot's
  // full theme/color_scheme internally.
  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_URL}/api/widget/theme?bot_id=${encodeURIComponent(botId)}&t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const [styleName] = String(d.widget_style || "").split(":");
        const design = normalizeDesign(styleName);
        const preset = LAUNCHER_STYLES[design];
        const launcherScheme = d.color_scheme?.launcher as { bg?: string; text?: string } | undefined;
        const bg = launcherScheme?.bg || preset.bg || d.primary_color || "#f97316";
        const iconColor = launcherScheme?.text || getOnColor(bg);

        let Icon: LucideIcon | null = null;
        let dotColor: string | null = null;
        let imageUrl: string | null = null;
        if (d.avatar_icon && LAUNCHER_ICONS[d.avatar_icon]) {
          Icon = LAUNCHER_ICONS[d.avatar_icon];
        } else if (d.avatar_icon === "custom" && d.avatar_url) {
          imageUrl = d.avatar_url;
        } else if (d.logo_url) {
          imageUrl = d.logo_url;
        } else {
          dotColor = launcherScheme?.text || preset.dot;
        }

        setLook({ bg, radius: preset.radius, shadow: preset.shadow, iconColor, Icon, dotColor, imageUrl });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [botId]);

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
        className="fixed bottom-5 right-5 z-[2147483647] flex size-[60px] items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ background: look.bg, borderRadius: look.radius, boxShadow: look.shadow, color: look.iconColor }}
      >
        {open ? (
          <X className="size-6" />
        ) : look.Icon ? (
          <look.Icon className="size-7" />
        ) : look.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={look.imageUrl} alt="" className="size-9 rounded-full object-cover" />
        ) : (
          <span className="block size-[17px] rounded-full opacity-90" style={{ background: look.dotColor || look.iconColor }} />
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-[20px] h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
