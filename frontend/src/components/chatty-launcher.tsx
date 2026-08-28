"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Headphones, Sparkles, MessageSquare, User, X, type LucideIcon } from "lucide-react";
import { ChattyWidget } from "@personaliai/react-widget";
import "@personaliai/react-widget/styles.css";
import ChattyErrorBoundary from "./chatty-error-boundary";

interface ChattyLauncherProps {
  botId: string;
}

const BACKEND_URL = "https://api.chatty.personaliai.com";

// Ported 1:1 from the live public/widget.js iframe embed this replaced, so
// the SDK-based launcher stays pixel/behavior-identical to it (see PR
// discussion) rather than drifting into its own look.
const MOBILE_BREAKPOINT = 480;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

// widget.js exits immediately for crawlers/headless browsers so it doesn't
// mount a floating button (or inflate load/analytics) for them.
function isBotUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = (navigator.userAgent || "").toLowerCase();
  return /jina|bot|crawl|spider|headless|lighthouse/i.test(ua) || navigator.webdriver === true;
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
// The chat-PANEL's own corner radius per design (distinct from
// LAUNCHER_STYLES[x].radius above, which is the floating button's radius).
// Matching this exactly on the outer panel wrapper avoids a hairline
// anti-aliasing seam at the corner where a mismatched outer clip radius
// would meet the SDK's own rounded inner content — see widget.js's
// PANEL_RADIUS comment for the full rationale.
const PANEL_RADIUS: Record<string, string> = {
  minimal: "18px", playful: "28px", corporate: "10px", "dark-sleek": "16px",
  "gradient-glow": "24px", glassmorphism: "20px", ecommerce: "14px",
  "healthcare-calm": "18px", neubrutalism: "4px", "luxury-editorial": "6px",
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
  panelRadius: string;
  iconColor: string;
  Icon: LucideIcon | null;
  dotColor: string | null;
  imageUrl: string | null;
}

function defaultLook(): LauncherLook {
  const d = LAUNCHER_STYLES.minimal;
  return {
    bg: d.bg, radius: d.radius, shadow: d.shadow, panelRadius: PANEL_RADIUS.minimal,
    iconColor: getOnColor(d.bg), Icon: null, dotColor: d.dot, imageUrl: null,
  };
}

interface TriggerRule {
  type: "time" | "url" | "scroll" | "exit";
  value?: string | number;
  message?: string;
}

// Subtle two-tone notification chime (Web Audio — no asset needed), ported
// from widget.js's playPing(). Browsers only allow this after the visitor
// has interacted with the page at least once; failures are silently ignored
// same as the original.
let sharedAudioCtx: AudioContext | null = null;
function playPing() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = sharedAudioCtx || new Ctx();
    if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume();
    const now = sharedAudioCtx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const o = sharedAudioCtx!.createOscillator();
      const g = sharedAudioCtx!.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(sharedAudioCtx!.destination);
      const t = now + i * 0.12;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.start(t);
      o.stop(t + 0.2);
    });
  } catch {
    // ignored, same as widget.js
  }
}

function lsGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function lsSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    // ignored
  }
}

export default function ChattyLauncher({ botId }: ChattyLauncherProps) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [ready, setReady] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(
    () => typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
  );
  const isMobile = useIsMobile();
  const [look, setLook] = useState<LauncherLook>(defaultLook);

  const [teaserVisible, setTeaserVisible] = useState(false);
  const [teaserMessage, setTeaserMessage] = useState("");
  const teaserTextRef = useRef("👋 Need help? Chat with us.");
  const triggerRulesRef = useRef<TriggerRule[]>([]);
  const triggeredRef = useRef<Record<string, boolean>>({});

  const isBot = isBotUserAgent();

  // Mirrors widget.js's own theme fetch, but only for the launcher button —
  // the panel itself (ChattyWidget) already fetches and applies the bot's
  // full theme/color_scheme internally.
  useEffect(() => {
    if (isBot) return;
    let cancelled = false;
    const revealTimer = setTimeout(() => setRevealed(true), 3000);
    fetch(`${BACKEND_URL}/api/widget/theme?bot_id=${encodeURIComponent(botId)}&t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const [styleName] = String(d.widget_style || "").split(":");
        const design = normalizeDesign(styleName);
        const preset = LAUNCHER_STYLES[design];
        const panelRadius = PANEL_RADIUS[design] || PANEL_RADIUS.minimal;
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

        setLook({ bg, radius: preset.radius, shadow: preset.shadow, panelRadius, iconColor, Icon, dotColor, imageUrl });

        teaserTextRef.current = d.teaser_message || d.welcome_message || teaserTextRef.current;
        if (d.trigger_rules) {
          try {
            const parsed = typeof d.trigger_rules === "string" ? JSON.parse(d.trigger_rules) : d.trigger_rules;
            if (Array.isArray(parsed)) triggerRulesRef.current = triggerRulesRef.current.concat(parsed);
          } catch {
            // ignored
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRevealed(true);
      });
    return () => {
      cancelled = true;
      clearTimeout(revealTimer);
    };
  }, [botId, isBot]);

  const hideTeaser = () => setTeaserVisible(false);
  const showTeaser = (message?: string) => {
    if (isBot || open) return;
    if (lsGet(`chatty_teaser_${botId}`) === "dismissed") return;
    setTeaserMessage(message || teaserTextRef.current);
    setTeaserVisible(true);
  };

  // Proactive greeting teaser + its trigger rules (time/url/scroll/exit),
  // ported from widget.js's initTriggers(). Falls back to a plain 6s-idle
  // teaser when the bot has no configured trigger rules.
  useEffect(() => {
    if (isBot) return;
    const rules = triggerRulesRef.current;
    const cleanups: Array<() => void> = [];

    if (rules.length === 0) {
      const t = setTimeout(() => showTeaser(), 6000);
      cleanups.push(() => clearTimeout(t));
    } else {
      const fire = (rule: TriggerRule) => {
        const key = `${rule.type}_${String(rule.value || "")}`;
        if (triggeredRef.current[key]) return;
        triggeredRef.current[key] = true;
        showTeaser(rule.message);
      };

      rules.forEach((rule) => {
        if (rule.type === "time") {
          const t = setTimeout(() => fire(rule), parseFloat(String(rule.value || 5)) * 1000);
          cleanups.push(() => clearTimeout(t));
        }
        if (rule.type === "url") {
          try {
            const rx = new RegExp(String(rule.value || ".*"), "i");
            if (rx.test(location.href)) {
              const t = setTimeout(() => fire(rule), 1000);
              cleanups.push(() => clearTimeout(t));
            }
          } catch {
            // ignored, same as widget.js
          }
        }
      });

      const hasScroll = rules.some((r) => r.type === "scroll");
      const hasExit = rules.some((r) => r.type === "exit");

      if (hasScroll) {
        const onScroll = () => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight <= 0) return;
          const pct = (window.scrollY / totalHeight) * 100;
          rules.forEach((rule) => {
            if (rule.type === "scroll" && pct >= parseFloat(String(rule.value || 50))) fire(rule);
          });
        };
        window.addEventListener("scroll", onScroll);
        cleanups.push(() => window.removeEventListener("scroll", onScroll));
      }

      if (hasExit) {
        const onExit = (e: MouseEvent) => {
          if (e.clientY < 20) rules.forEach((rule) => { if (rule.type === "exit") fire(rule); });
        };
        document.addEventListener("mouseleave", onExit);
        cleanups.push(() => document.removeEventListener("mouseleave", onExit));
      }
    }

    return () => cleanups.forEach((c) => c());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, isBot]);

  // widget.js's window.Chatty public API — lets other scripts/buttons on the
  // page open/close/toggle the widget without reaching into this component.
  useEffect(() => {
    if (isBot) return;
    (window as unknown as { Chatty: unknown }).Chatty = {
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((o) => !o),
    };
    return () => {
      delete (window as unknown as { Chatty?: unknown }).Chatty;
    };
  }, [isBot]);

  // Fail-safe: never spin forever if onWidgetReady never fires.
  useEffect(() => {
    if (isBot || ready) return;
    const t = setTimeout(() => setReady(true), 8000);
    return () => clearTimeout(t);
  }, [isBot, ready]);

  useEffect(() => {
    if (ready && pendingOpen) {
      setPendingOpen(false);
      setOpen(true);
    }
  }, [ready, pendingOpen]);

  if (isBot) return null;

  const panelRadius = isMobile ? "0px" : look.panelRadius;

  return (
    <>
      <div
        className={`fixed z-[2147483646] flex flex-col overflow-hidden shadow-2xl transition-all duration-200 ease-out
          ${isMobile ? "inset-0 w-screen h-[100dvh]" : "bottom-[92px] right-5 w-[380px] h-[560px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-7.5rem)]"}`}
        style={{
          borderRadius: panelRadius,
          opacity: open ? 1 : 0,
          transform: open ? "none" : "translateY(12px)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <ChattyErrorBoundary>
          <ChattyWidget
            botId={botId}
            originToken={null}
            forceFullscreen={isMobile}
            notificationGranted={notificationGranted}
            onWidgetReady={() => setReady(true)}
            onWidgetClose={() => setOpen(false)}
            onAssistantMessage={() => {
              if (!open) {
                setUnread((u) => u + 1);
                playPing();
              }
            }}
            onRequestNotificationPermission={() => {
              if (typeof window === "undefined" || !("Notification" in window)) return;
              Notification.requestPermission().then((permission) => {
                setNotificationGranted(permission === "granted");
              });
            }}
            onTriggerNotification={(botName, bodyText, avatarUrl) => {
              if (
                typeof window === "undefined" ||
                !("Notification" in window) ||
                Notification.permission !== "granted" ||
                document.visibilityState === "visible"
              )
                return;
              const notification = new Notification(botName, {
                body: bodyText,
                icon: avatarUrl || undefined,
              });
              notification.onclick = () => {
                window.focus();
                setOpen(true);
              };
            }}
          />
        </ChattyErrorBoundary>
      </div>

      {teaserVisible && (
        <div
          className="fixed bottom-[92px] right-5 max-w-[260px] rounded-2xl bg-white p-3 pr-8 text-sm leading-snug text-gray-900 shadow-xl transition-all duration-200 ease-out z-[2147483646] cursor-pointer"
          style={{ zIndex: 2147483646 }}
          onClick={() => {
            hideTeaser();
            setOpen(true);
          }}
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={(e) => {
              e.stopPropagation();
              hideTeaser();
              lsSet(`chatty_teaser_${botId}`, "dismissed");
            }}
            className="absolute right-2 top-1.5 text-lg leading-none text-gray-400"
          >
            &times;
          </button>
          {teaserMessage}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (!revealed) return;
          if (open) {
            setOpen(false);
            return;
          }
          if (pendingOpen) return;
          hideTeaser();
          if (!ready) {
            setPendingOpen(true);
            return;
          }
          setOpen(true);
          setUnread(0);
        }}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-busy={pendingOpen || (open && !ready)}
        className="fixed bottom-5 right-5 z-[2147483647] flex size-[60px] items-center justify-center shadow-lg transition-[opacity,transform] duration-200 ease-out hover:scale-105 active:scale-95 disabled:cursor-wait"
        style={{
          background: look.bg,
          borderRadius: look.radius,
          boxShadow: look.shadow,
          color: look.iconColor,
          opacity: revealed ? 1 : 0,
          pointerEvents: revealed ? "auto" : "none",
          // On mobile fullscreen, hide the floating launcher while open — the
          // in-panel header close button handles closing, avoiding overlap
          // with the composer (matches widget.js's hideLauncher behavior).
          display: open && isMobile ? "none" : "flex",
        }}
      >
        {pendingOpen || (open && !ready) ? (
          <span
            className="block size-[26px] animate-spin rounded-full border-[3px] border-current border-t-transparent opacity-70"
            aria-hidden
          />
        ) : open ? (
          <X className="size-6" />
        ) : look.Icon ? (
          <look.Icon className="size-7" />
        ) : look.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={look.imageUrl} alt="" className="size-9 rounded-full object-cover" />
        ) : (
          <span className="block size-[17px] rounded-full opacity-90" style={{ background: look.dotColor || look.iconColor }} />
        )}
      </button>

      {!open && unread > 0 && (
        <div className="fixed bottom-16 right-3.5 z-[2147483647] flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow">
          {unread > 9 ? "9+" : unread}
        </div>
      )}
    </>
  );
}
