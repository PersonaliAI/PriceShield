import { Terminal, Box, Shield, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import Image from "next/image";
import { ApiPlayground } from "@/components/api-playground";

export const metadata = {
  title: "Developer API | PriceShield",
  description: "Integrate stealth margin protection directly into your ERP or POS system.",
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="PriceShield Logo" width={32} height={32} className="h-8 w-auto" />
              <span className="font-bold text-lg hidden sm:block">PriceShield</span>
            </Link>
            <Badge variant="outline" className="ml-2 font-mono text-[10px] uppercase text-emerald-400 border-emerald-500/30">API v1</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/api" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/dashboard/api">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-background">
                Get API Key
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-24">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 py-12 md:py-20 lg:flex gap-12 items-center">
          <div className="lg:w-1/2 space-y-8">
            <Badge variant="secondary" className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
              <Terminal className="w-3 h-3 mr-2 inline" /> Developers & Partners
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Build margin protection into your platform.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              PriceShield's public API allows POS, ERP, and accounting platforms to offer automated line-item invoice auditing to their users. Zero ML expertise required.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="#endpoints">
                <Button size="lg" className="h-12 px-6">
                  Explore Endpoints <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/api">
                <Button variant="outline" size="lg" className="h-12 px-6">
                  Generate Key
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 mt-12 lg:mt-0">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Zap, title: "Gemini 2.0 Powered", desc: "Sub-second extraction accuracy." },
                { icon: Shield, title: "Enterprise SLA", desc: "99.99% uptime for Scale tiers." },
                { icon: Box, title: "Structured JSON", desc: "Clean line-item arrays." },
                { icon: CheckCircle2, title: "Confidence Scores", desc: "Built-in OCR certainty." },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border/50">
                  <f.icon className="h-6 w-6 text-emerald-400 mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Playground Section */}
        <section className="mx-auto max-w-7xl px-6 py-12" id="playground">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">Interactive Playground</h2>
            <p className="text-muted-foreground">Test the extraction endpoint live. Provide your key and drop an invoice.</p>
          </div>
          <ApiPlayground />
        </section>

        {/* API Reference */}
        <section className="mx-auto max-w-7xl px-6 py-16 border-t border-border/40 mt-12" id="endpoints">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">API Reference</h2>
            <p className="text-muted-foreground">All endpoints are relative to <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-emerald-400">https://api.priceshield.com/api/v1</code></p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Left: Endpoint Docs */}
            <div className="lg:col-span-7 space-y-16">
              
              {/* Extract */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">POST</Badge>
                  <h3 className="text-2xl font-mono font-bold">/extract</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Extracts structured data from an invoice PDF or image. The response includes vendor details, parsed line items, and OCR confidence scores.
                </p>
                
                <h4 className="font-semibold text-lg border-b border-border/50 pb-2 mt-8">Headers</h4>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 border-b border-border/20 pb-4">
                    <span className="font-mono text-emerald-400">X-API-Key</span>
                    <span className="col-span-2 text-muted-foreground">Your secret API key starting with <code className="text-foreground">ps_live_</code></span>
                  </div>
                </div>

                <h4 className="font-semibold text-lg border-b border-border/50 pb-2 mt-8">Form Data</h4>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 border-b border-border/20 pb-4">
                    <span className="font-mono text-emerald-400">file</span>
                    <span className="col-span-2 text-muted-foreground">The file to upload (PDF, PNG, JPEG, WEBP). Max 20MB.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Code Snippets */}
            <div className="lg:col-span-5 sticky top-24 h-fit">
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 bg-[#13161c]">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="node">Node.js</TabsTrigger>
                </TabsList>
                
                <TabsContent value="curl">
                  <div className="rounded-xl overflow-hidden bg-[#0c0e12] border border-border/40">
                    <div className="px-4 py-2 border-b border-border/20 bg-[#13161c] flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    </div>
                    <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`curl -X POST https://api.priceshield.com/api/v1/extract \\
  -H "X-API-Key: ps_live_your_api_key_here" \\
  -F "file=@/path/to/invoice.pdf"`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="python">
                  <div className="rounded-xl overflow-hidden bg-[#0c0e12] border border-border/40">
                    <div className="px-4 py-2 border-b border-border/20 bg-[#13161c] flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    </div>
                    <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`import requests

url = "https://api.priceshield.com/api/v1/extract"
headers = {"X-API-Key": "ps_live_your_api_key_here"}
files = {"file": open("invoice.pdf", "rb")}

response = requests.post(url, headers=headers, files=files)
print(response.json())`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="node">
                  <div className="rounded-xl overflow-hidden bg-[#0c0e12] border border-border/40">
                    <div className="px-4 py-2 border-b border-border/20 bg-[#13161c] flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    </div>
                    <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('invoice.pdf'));

const response = await fetch('https://api.priceshield.com/api/v1/extract', {
  method: 'POST',
  headers: {
    'X-API-Key': 'ps_live_your_api_key_here'
  },
  body: form
});

const data = await response.json();
console.log(data);`}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
