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
import {
  LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { api, UserSettings } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChartSeries { name: string; data: { x: string; y: number }[] }
interface ChartSpec {
  chart_type: "line" | "bar";
  title: string;
  y_label?: string;
  series: ChartSeries[];
}

interface LiveStep {
  type: "thinking" | "tool";
  content: string;
  status: "pending" | "running" | "completed" | "failed";
  details?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  thinkingSteps?: LiveStep[];
  chart?: ChartSpec;
}

const CHART_COLORS = [
  "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#06b6d4",
  "#8b5cf6", "#84cc16", "#f97316", "#ec4899", "#14b8a6",
];

function buildRechartData(series: ChartSeries[]) {
  const xSet = new Set<string>();
  series.forEach(s => s.data.forEach(d => xSet.add(d.x)));
  const xValues = Array.from(xSet).sort();
  return xValues.map(x => {
    const row: Record<string, string | number> = { x };
    series.forEach(s => {
      const pt = s.data.find(d => d.x === x);
      if (pt) row[s.name] = pt.y;
    });
    return row;
  });
}

function InlineChart({ spec }: { spec: ChartSpec }) {
  const data = buildRechartData(spec.series);
  const ChartComponent = spec.chart_type === "bar" ? BarChart : LineChart;

  return (
    <div className="my-4 rounded-2xl bg-zinc-950/60 border border-emerald-500/20 p-4 shadow-lg">
      {spec.title && (
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">{spec.title}</p>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <ChartComponent data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="x" tick={{ fontSize: 10, fill: "#71717a" }} />
          <YAxis
            tick={{ fontSize: 10, fill: "#71717a" }}
            label={spec.y_label ? { value: spec.y_label, angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#71717a" } } : undefined}
          />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {spec.series.map((s, i) =>
            spec.chart_type === "bar"
              ? <Bar key={s.name} dataKey={s.name} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
              : <Line key={s.name} type="monotone" dataKey={s.name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

export default function AICFOPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  // Track which messages have their thinking steps expanded
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    // Clean up typing interval on unmount
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [getToken]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const finalInput = customInput || input;
    if (!finalInput.trim() || isLoading || settings?.tier === "free") return;

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    const userMessage: ChatMessage = { role: "user", content: finalInput };
    const assistantIndex = messages.length + 1; // index of assistant message in the new array
    const initialAssistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      thinkingSteps: [
        {
          type: "thinking",
          content: "Analyzing query intent & parameters...",
          status: "running"
        }
      ]
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setExpandedSteps((prev) => ({ ...prev, [assistantIndex]: true }));
    setInput("");
    setIsLoading(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/ai-cfo/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ question: finalInput }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        let detail = body;
        try { detail = JSON.parse(body)?.detail ?? body; } catch { /* ignore */ }
        throw new Error(`CFO Stream API error (${response.status}): ${detail || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader on response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.trim()) continue;

          let eventName = "";
          let dataContent = "";

          const lines = part.split("\n");
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.substring(6).trim();
            } else if (line.startsWith("data:")) {
              dataContent = line.substring(5).trim();
            }
          }

          if (eventName && dataContent) {
            try {
              const parsedData = JSON.parse(dataContent);

              setMessages((prev) => {
                const next = [...prev];
                const msg = next[assistantIndex];
                if (!msg) return prev;

                let steps = msg.thinkingSteps ? [...msg.thinkingSteps] : [];

                if (eventName === "thinking") {
                  if (steps.length > 0) {
                    steps[steps.length - 1] = {
                      ...steps[steps.length - 1],
                      status: "completed"
                    };
                  }
                  steps.push({
                    type: "thinking",
                    content: parsedData,
                    status: "completed"
                  });
                  msg.thinkingSteps = steps;
                } else if (eventName === "tool_start") {
                  if (steps.length > 0) {
                    steps[steps.length - 1] = {
                      ...steps[steps.length - 1],
                      status: "completed"
                    };
                  }
                  const argStr = parsedData.arguments && Object.keys(parsedData.arguments).length > 0
                    ? Object.entries(parsedData.arguments)
                        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                        .join(", ")
                    : "";
                  steps.push({
                    type: "tool",
                    content: `${parsedData.name}(${argStr})`,
                    status: "running",
                    details: JSON.stringify(parsedData.arguments)
                  });
                  msg.thinkingSteps = steps;
                } else if (eventName === "tool_end") {
                  const toolName = parsedData.name;
                  const idx = steps.findIndex(s => s.type === "tool" && s.status === "running" && s.content.startsWith(toolName));
                  if (idx !== -1) {
                    steps[idx] = {
                      ...steps[idx],
                      status: "completed",
                      details: typeof parsedData.result === "string" ? parsedData.result : JSON.stringify(parsedData.result, null, 2)
                    };
                  }
                  msg.thinkingSteps = steps;
                } else if (eventName === "answer") {
                  steps = steps.map(s => s.status === "running" ? { ...s, status: "completed" } as const : s);
                  msg.thinkingSteps = steps;

                  // Trigger simulated typing effect for answer
                  const fullAnswer = parsedData;
                  const words = fullAnswer.split(" ");
                  let wordIdx = 0;
                  let displayedText = "";

                  if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                  }

                  typingIntervalRef.current = setInterval(() => {
                    if (wordIdx < words.length) {
                      displayedText += (wordIdx === 0 ? "" : " ") + words[wordIdx];
                      wordIdx++;
                      setMessages((prevMessages) => {
                        const updated = [...prevMessages];
                        const activeMsg = updated[assistantIndex];
                        if (activeMsg) {
                          activeMsg.content = displayedText;
                        }
                        return updated;
                      });
                    } else {
                      if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                        typingIntervalRef.current = null;
                      }
                    }
                  }, 15);
                } else if (eventName === "chart") {
                  msg.chart = parsedData as ChartSpec;
                } else if (eventName === "error") {
                  steps = steps.map(s => s.status === "running" ? { ...s, status: "failed" } as const : s);
                  msg.thinkingSteps = steps;
                  msg.content = `⚠️ An error occurred during reasoning: ${parsedData}`;
                }

                return next;
              });

            } catch (jsonErr) {
              console.error("Failed to parse SSE JSON:", jsonErr, dataContent);
            }
          }
        }
      }

      setMessages((prev) => {
        const next = [...prev];
        const msg = next[assistantIndex];
        if (msg && msg.thinkingSteps) {
          msg.thinkingSteps = msg.thinkingSteps.map(s => 
            s.status === "running" ? { ...s, status: "completed" } as const : s
          );
        }
        return next;
      });

    } catch (err) {
      console.error("AI CFO Streaming Error:", err);
      setMessages((prev) => {
        const next = [...prev];
        const msg = next[assistantIndex];
        if (msg) {
          msg.content = "⚠️ Sorry, I encountered an error processing your request. Please try again later.";
          if (msg.thinkingSteps) {
            msg.thinkingSteps = msg.thinkingSteps.map(s => 
              s.status === "running" ? { ...s, status: "failed" } as const : s
            );
          }
        }
        return next;
      });
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
                  { label: "Vendor Compare", text: "Compare my suppliers' pricing on Chicken.", icon: History },
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
                    "flex max-w-[85%] sm:max-w-[75%] gap-4 w-full",
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
                      "rounded-3xl px-5 py-4 text-[15px] leading-relaxed flex-1 min-w-0",
                      msg.role === "user" 
                        ? "bg-emerald-500 text-background font-medium shadow-xl shadow-emerald-500/10 rounded-tr-none"
                        : "bg-muted/10 border border-border/30 text-foreground shadow-sm rounded-tl-none"
                    )}>
                      {msg.role === "assistant" && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                        <div className="mb-4 rounded-2xl bg-zinc-950/40 border border-purple-500/20 shadow-xl overflow-hidden max-w-full">
                          {/* Accordion Trigger Header */}
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedSteps(prev => ({
                                ...prev,
                                [i]: !prev[i]
                              }));
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple-500/5 transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              {(isLoading && i === messages.length - 1) ? (
                                <Loader2 className="h-3.5 w-3.5 text-purple-400 animate-spin" />
                              ) : (
                                <Brain className="h-3.5 w-3.5 text-purple-400" />
                              )}
                              <span className="text-xs font-bold tracking-tight text-purple-400">
                                Thinking Process
                              </span>
                            </div>
                            {expandedSteps[i] ? (
                              <ChevronUp className="h-3.5 w-3.5 text-purple-400/50 group-hover:text-purple-400 transition-colors" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-purple-400/50 group-hover:text-purple-400 transition-colors" />
                            )}
                          </button>

                          {/* Accordion Detail Steps */}
                          {expandedSteps[i] && (
                            <div className="px-4 pb-4 pt-1 space-y-2 border-t border-purple-500/10 bg-purple-950/5">
                              {msg.thinkingSteps.map((step, idx) => {
                                const isCompleted = step.status === "completed";
                                const isActive = step.status === "running";
                                const isFailed = step.status === "failed";

                                return (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "flex flex-col text-xs transition-opacity duration-300",
                                      isCompleted || isActive ? "opacity-100" : "opacity-40"
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      {isCompleted ? (
                                        <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                                          <CheckIcon className="h-2.5 w-2.5" />
                                        </div>
                                      ) : isActive ? (
                                        <div className="h-4 w-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30 animate-pulse">
                                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                        </div>
                                      ) : isFailed ? (
                                        <div className="h-4 w-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                                          <span className="text-[10px] font-bold">!</span>
                                        </div>
                                      ) : (
                                        <div className="h-4 w-4 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center shrink-0 border border-zinc-700">
                                          <span className="text-[8px] font-bold">{idx + 1}</span>
                                        </div>
                                      )}
                                      <span
                                        className={cn(
                                          "font-medium",
                                          isCompleted
                                            ? "text-zinc-400"
                                            : isActive
                                            ? "text-purple-300 font-bold"
                                            : "text-zinc-500"
                                        )}
                                      >
                                        {step.content}
                                      </span>
                                    </div>
                                    
                                    {step.type === "tool" && step.details && (
                                      <div className="pl-6 mt-1.5">
                                        <pre className="p-2 text-[10px] font-mono text-zinc-400 bg-zinc-950/60 rounded-lg border border-border/20 max-w-full overflow-x-auto whitespace-pre-wrap">
                                          {step.details}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {msg.chart && <InlineChart spec={msg.chart} />}

                      {msg.content && (
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
                      )}
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
