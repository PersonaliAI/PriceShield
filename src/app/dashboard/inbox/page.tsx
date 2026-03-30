"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Loader2, Maximize2, X, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { api, InboxMessage } from "@/lib/api";

export default function InboxPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);

  const fetchMessages = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getInboxMessages(token);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-muted-foreground">Loading inbox...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground mt-1">
            View forwarded emails to verify forwarding rules.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchMessages(true)} 
          disabled={refreshing}
          className="w-fit"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Message List */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle>Received Emails</CardTitle>
              <CardDescription>
                Live feed of emails sent to your PriceShield address
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No emails yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Any emails forwarded to your custom `@priceshield.email` address will appear here. Useful for confirming Gmail forwarding verification codes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className="p-4 sm:px-6 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedMessage(msg)}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <p className="font-medium truncate">{msg.from_email || "Unknown Sender"}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(msg.created_at).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1 truncate">
                    {msg.subject || "(No Subject)"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {msg.text_body?.substring(0, 150) || "No text content"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Viewer Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center">
          <Card className="w-full max-w-3xl max-h-full flex flex-col bg-card border-border shadow-2xl relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 rounded-full z-10"
              onClick={() => setSelectedMessage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-bold pr-8 mb-4">{selectedMessage.subject || "(No Subject)"}</h2>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium text-foreground truncate">{selectedMessage.from_email}</span>
                <span className="text-muted-foreground">To:</span>
                <span className="text-muted-foreground truncate">{selectedMessage.to_email}</span>
                <span className="text-muted-foreground">Date:</span>
                <span className="text-muted-foreground">{new Date(selectedMessage.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-muted/10">
              {/* If we have HTML, render it in an iframe. Otherwise, text. */}
              {selectedMessage.html_body ? (
                <div className="h-full min-h-[500px] w-full bg-white rounded-md border border-border overflow-hidden">
                  <iframe 
                    srcDoc={selectedMessage.html_body} 
                    className="w-full h-full"
                    title="Email Content"
                    sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  />
                </div>
              ) : (
                <div className="bg-background rounded-md border border-border p-6 shadow-inner min-h-[300px]">
                  <pre 
                    className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: (selectedMessage.text_body || "No email body provided.")
                        .replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m] as string))
                        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:text-blue-300 break-all">$1</a>')
                    }}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
