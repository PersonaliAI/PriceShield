"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  History,
  Brain,
  Check as CheckIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { api, UserSettings } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

const THINKING_STEPS = [
  "Analyzing query intent & parameters...",
  "Scanning invoice database for relevant records...",
  "Comparing pricing points with baseline targets...",
  "Running margin variance and leakage calculations...",
  "Formulating financial recommendations...",
];

export default function AICFOPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  // Real-time simulated thinking steps
  const [thinkingStep, setThinkingStep] = useState(0);
  const [showThinkingDetails, setShowThinkingDetails] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Run thinking steps simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setThinkingStep(0);
      interval = setInterval(() => {
        setThinkingStep((prev) => {
          if (prev < THINKING_STEPS.length - 1) {
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 950);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSendMessage = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const finalInput = customInput || input;
    if (!finalInput.trim() || isLoading || settings?.tier === "free") return;

    const userMessage: ChatMessage = { role: "user", content: finalInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) return;
      
      const res = await api.askAICFO(token, finalInput);
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
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
          <Shield className="h-12 w-12 text-emerald-400 relative z-10 animate-bounce" />
        </div>
        <p className="text-muted-foreground font-medium tracking-wide">Initializing CFO Intelligence…</p>
      </div>
    );
  }

  const isFreeTier = settings?.tier === "free";

  return (
    <div className="relative flex flex-col h-[calc(100vh-100px)] overflow-hidden">
      {/* Centered Scrollable Area */}
      <div className="flex-1 overflow-y-auto pt-4 pb-32 scroll-smooth custom-scrollbar">
        <div className="max-w-5xl mx-auto px-4 w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 space-y-10 animate-in fade-in duration-700">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-20 rounded-[2rem] bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 shadow-2xl shadow-emerald-500/5">
                  <Shield className="h-10 w-10 text-emerald-400" />
                </div>
                <div className="text-center">
                  <h1 className="text-3xl font-bold tracking-tight mb-2">AI CFO Diagnostics</h1>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
                    Analyzing your pricing data for margin leaks, stealth hikes, and contract optimization.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  { label: "Price Audit", text: "Which item had the biggest price jump this month?", icon: TrendingUp },
                  { label: "Vendor Compare", text: "Compare Sysco vs GFS pricing on Chicken.", icon: History },
                  { label: "Margin Leak", text: "Calculate my total margin lost since January.", icon: AlertTriangle },
                  { label: "Analysis", text: "What's my average price variance across all vendors?", icon: Sparkles }
                ].map((item) => (
                  <button
                    key={item.text}
                    onClick={() => handleSendMessage(undefined, item.text)}
                    className="group flex flex-col items-start p-4 rounded-2xl border border-border/40 bg-card/40 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all text-left space-y-2 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 group-hover:text-emerald-400">
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </div>
                    <p className="text-sm font-medium pr-8 leading-snug">
                      &quot;{item.text}&quot;
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "flex max-w-[85%] sm:max-w-[75%] gap-4",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    {msg.role === "assistant" && (
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                          <Shield className="h-4 w-4 text-emerald-400" />
                        </div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "rounded-3xl px-5 py-4 text-[15px] leading-relaxed",
                      msg.role === "user" 
                        ? "bg-emerald-500 text-background font-medium shadow-xl shadow-emerald-500/10 rounded-tr-none"
                        : "bg-muted/10 border border-border/30 text-foreground shadow-sm rounded-tl-none"
                    )}>
                      <div className="markdown-content prose prose-sm prose-invert max-w-none prose-p:leading-relaxed">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath, remarkGfm]} 
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            b: ({...props}) => <b className="font-bold text-emerald-400" {...props} />,
                            strong: ({...props}) => <strong className="font-bold text-emerald-400" {...props} />,
                            p: ({...props}) => <p className="mb-4 last:mb-0" {...props} />,
                            ul: ({...props}) => <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />,
                            li: ({...props}) => <li className="marker:text-emerald-500" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {msg.role === "user" && (
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-8 w-8 rounded-lg bg-border/20 border border-border/40 flex items-center justify-center overflow-hidden">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          {isLoading && (
            <div className="flex flex-col items-start gap-4 mt-8 animate-in fade-in slide-in-from-bottom-3 duration-300 w-full">
              <div className="flex max-w-[85%] sm:max-w-[75%] gap-4 w-full">
                <div className="mt-1 flex-shrink-0">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/5">
                    <Brain className="h-4 w-4 text-purple-400 animate-pulse" />
                  </div>
                </div>
                
                <div className="flex-1 rounded-3xl bg-zinc-950/40 border border-purple-500/20 shadow-xl shadow-purple-950/5 overflow-hidden">
                  {/* Accordion Trigger Header */}
                  <button
                    type="button"
                    onClick={() => setShowThinkingDetails(!showThinkingDetails)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-purple-500/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                      <span className="text-sm font-bold tracking-tight text-purple-400">
                        Thinking Process...
                      </span>
                    </div>
                    {showThinkingDetails ? (
                      <ChevronUp className="h-4 w-4 text-purple-400/50 group-hover:text-purple-400 transition-colors" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-purple-400/50 group-hover:text-purple-400 transition-colors" />
                    )}
                  </button>

                  {/* Accordion Detail Steps */}
                  {showThinkingDetails && (
                    <div className="px-5 pb-5 pt-1 space-y-3 border-t border-purple-500/10 bg-purple-950/5">
                      {THINKING_STEPS.map((step, idx) => {
                        const isCompleted = thinkingStep > idx;
                        const isActive = thinkingStep === idx;
                        const isPending = thinkingStep < idx;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center gap-3 text-xs transition-opacity duration-300",
                              isPending ? "opacity-30" : "opacity-100"
                            )}
                          >
                            {isCompleted ? (
                              <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                                <CheckIcon className="h-2.5 w-2.5" />
                              </div>
                            ) : isActive ? (
                              <div className="h-4.5 w-4.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30 animate-pulse">
                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              </div>
                            ) : (
                              <div className="h-4.5 w-4.5 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center shrink-0 border border-zinc-700">
                                <span className="text-[9px] font-bold">{idx + 1}</span>
                              </div>
                            )}
                            <span
                              className={cn(
                                "font-medium",
                                isCompleted
                                  ? "text-zinc-400 line-through decoration-zinc-700/80"
                                  : isActive
                                  ? "text-purple-300 font-bold"
                                  : "text-zinc-500"
                              )}
                            >
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Guard Overlay */}
      {isFreeTier && (
        <div className="absolute inset-0 z-30 bg-background/60 backdrop-blur-md flex items-center justify-center p-6 border-t border-border/10">
          <div className="bg-background/95 border border-border/40 p-10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] max-w-sm text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto h-20 w-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="h-10 w-10 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Pro CFO Intelligence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Analyze supplier contracts, detect margin leaks, and forecast pricing trends with your conversational AI assistant.
              </p>
            </div>
            <a 
              href="/dashboard/billing" 
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-12 rounded-2xl transition-all shadow-lg shadow-emerald-500/20")}
            >
              Upgrade to Pro Shield
            </a>
          </div>
        </div>
      )}

      {/* Centered Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
        <div className="max-w-5xl mx-auto w-full pointer-events-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-500/0 rounded-[2rem] blur opacity-40 group-focus-within:opacity-100 transition-opacity duration-500"></div>
            <form 
              onSubmit={handleSendMessage}
              className="relative flex items-center bg-card/60 backdrop-blur-2xl border border-border/40 rounded-[2rem] shadow-2xl overflow-hidden p-1.5 pl-6"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || isFreeTier}
                placeholder={isFreeTier ? "Upgrade for CFO access..." : "Ask your financial assistant anything..."}
                className="flex-1 bg-transparent py-3.5 text-sm focus:outline-none placeholder:text-muted-foreground/30 disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading || isFreeTier}
                className={cn(
                  "p-3 rounded-full transition-all duration-300",
                  input.trim() && !isLoading 
                    ? "bg-emerald-500 text-background shadow-lg shadow-emerald-500/20 scale-100" 
                    : "bg-muted/10 text-muted-foreground/30 scale-90"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
          <p className="mt-2 text-[10px] text-center text-muted-foreground/40 font-medium tracking-wide">
            Powered by PriceShield Financial Intelligence Engine v2.0
          </p>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.2);
        }
        .markdown-content b, .markdown-content strong {
          color: #10b981 !important; /* emerald-500 */
          font-weight: 800 !important;
        }
        .markdown-content pre {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
