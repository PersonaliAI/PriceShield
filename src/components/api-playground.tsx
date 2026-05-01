"use client";

import { useState, useRef } from "react";
import { Terminal, Key, Upload, Play, CheckCircle2, AlertCircle, Loader2, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function ApiPlayground() {
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRunRequest = async () => {
    if (!apiKey) {
      setError("Please provide an API Key.");
      return;
    }
    if (!file) {
      setError("Please upload a sample invoice file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const res = await fetch(`${apiUrl}/api/v1/extract`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail?.message || data.detail || "An error occurred");
        setResponse(data);
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to the API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#0c0e12] border-border/40 shadow-2xl overflow-hidden rounded-xl">
      <div className="flex flex-col lg:flex-row">
        
        {/* Left Side: Inputs */}
        <div className="w-full lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-border/40 bg-[#13161c]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Play className="h-4 w-4 text-emerald-400" />
            Test /extract
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Key className="h-3 w-3" /> API Key
              </label>
              <Input
                type="password"
                placeholder="ps_live_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-background/50 border-border/50 text-sm font-mono h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Upload className="h-3 w-3" /> Invoice File
              </label>
              <div 
                className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400 truncate w-full max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload PDF/Image
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button 
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-semibold"
              onClick={handleRunRequest}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><Play className="mr-2 h-4 w-4 fill-current" /> Run Request</>
              )}
            </Button>

            {error && !response && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Terminal Output */}
        <div className="w-full lg:w-2/3 bg-[#0c0e12] flex flex-col relative min-h-[400px]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/20 bg-[#0c0e12]">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-mono text-muted-foreground">Response</span>
            <Code2 className="h-4 w-4 text-muted-foreground/50" />
          </div>
          
          <div className="flex-1 p-4 overflow-auto max-h-[500px] font-mono text-xs md:text-sm">
            {response ? (
              <pre className={error ? "text-red-400" : "text-emerald-400"}>
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground/30 gap-4">
                <Terminal className="h-16 w-16" />
                <p>Output will appear here</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </Card>
  );
}
