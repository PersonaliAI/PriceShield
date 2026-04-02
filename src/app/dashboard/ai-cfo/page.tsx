"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Sparkles,
  Info
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { api, UserSettings } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export default function AICFOPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history & settings
  useEffect(() => {
    async function init() {
      try {
        const token = await getToken();
        if (!token) return;

        const [history, userSettings] = await Promise.all([
          api.getAICFOHistory(token),
          api.getSettings(token)
        ]);

        setMessages(history as ChatMessage[]);
        setSettings(userSettings);
      } catch (err) {
        console.error("Failed to load AI CFO history:", err);
      } finally {
        setIsInitialLoading(false);
      }
    }
    init();
  }, [getToken]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || settings?.tier === "free") return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) return;
      
      const res = await api.askAICFO(token, input);
      const assistantMessage: ChatMessage = { 
        role: "assistant", 
        content: res.answer 
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("AI CFO Error:", err);
      setMessages((prev) => [
        ...prev, 
        { role: "assistant", content: "⚠️ Sorry, I encountered an error processing your request. Please try again later." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-muted-foreground">Initializing AI CFO…</p>
      </div>
    );
  }

  const isFreeTier = settings?.tier === "free";

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI CFO Diagnostics</h1>
            <p className="text-sm text-muted-foreground">Conversational pricing analysis & financial strategy</p>
          </div>
        </div>
        
        {isFreeTier && (
          <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
            <Info className="h-4 w-4 text-rose-400" />
            <span className="text-xs font-medium text-rose-400">Upgrade to Pro to use AI CFO Chat</span>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col bg-card/30 border-border/40 overflow-hidden relative backdrop-blur-sm">
        {isFreeTier && (
          <div className="absolute inset-0 z-20 bg-background/40 backdrop-blur-[2px] flex items-center justify-center p-8">
            <div className="bg-background/95 border border-border/60 p-8 rounded-2xl shadow-2xl max-w-sm text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold">Unlock AI CFO Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                Get high-level diagnostics on your supplier contracts, detected margin leaks, and complex financial analysis in real-time.
              </p>
              <a 
                href="/dashboard/billing" 
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-11")}
              >
                Upgrade to Pro Shield
              </a>
            </div>
          </div>
        )}

        <CardContent 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 text-center opacity-70 mt-12">
              <div className="h-20 w-20 rounded-3xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 animate-pulse">
                <Bot className="h-10 w-10 text-emerald-500/40" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Your Financial Second Brain</h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Ask me about price hikes, vendor reliability, or to calculate complex financial models like CAGR or margin leak across locations.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
                {[
                  "Which item had the biggest price jump this month?",
                  "Compare Sysco vs GFS pricing on Chicken.",
                  "Calculate my total margin lost since Jan.",
                  "What&apos;s my average price variance across all vendors?"
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => !isFreeTier && setInput(q)}
                    className="text-xs p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                  >
                    &quot;{q}&quot;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <Shield className="h-4 w-4 text-background" />
                  </div>
                )}
                <div 
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-emerald-500 text-background font-medium shadow-md"
                      : "bg-muted/40 border border-border/40 text-foreground"
                  }`}
                >
                  <div className="markdown-content prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        b: ({...props}) => <b className="font-bold text-emerald-400" {...props} />,
                        strong: ({...props}) => <strong className="font-bold text-emerald-400" {...props} />,
                        p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-lg bg-border flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                <Loader2 className="h-4 w-4 text-background animate-spin" />
              </div>
              <div className="max-w-[85%] bg-muted/20 rounded-2xl p-4 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-bounce"></span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Input area */}
        <div className="p-4 border-t border-border/40 bg-card/50 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || isFreeTier}
              placeholder={isFreeTier ? "Upgrade to chat with AI CFO..." : "Ask your AI assistant anything..."}
              className="flex-1 bg-background/50 border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading || isFreeTier}
              className="h-auto px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-background font-bold shadow-lg shadow-emerald-500/20 disabled:scale-95 transition-transform"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: oklch(0.26 0.01 260);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: oklch(0.35 0.01 260);
        }
        .markdown-content b, .markdown-content strong {
          color: oklch(0.696 0.17 162.48);
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
