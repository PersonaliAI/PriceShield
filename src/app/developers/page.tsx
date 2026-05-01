"use client";

import { useState } from "react";
import { Terminal, Box, Shield, Zap, CheckCircle2, ArrowRight, Code2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import Image from "next/image";
import { ApiPlayground } from "@/components/api-playground";

const languages = [
  { id: "curl", name: "cURL", lang: "bash" },
  { id: "python", name: "Python", lang: "python" },
  { id: "node", name: "Node.js", lang: "javascript" },
  { id: "go", name: "Go", lang: "go" },
  { id: "php", name: "PHP", lang: "php" },
  { id: "ruby", name: "Ruby", lang: "ruby" },
];

const snippets: Record<string, string> = {
  curl: `curl -X POST https://api.trypriceshield.com/api/v1/extract \\
  -H "X-API-Key: ps_live_your_api_key_here" \\
  -F "file=@/path/to/invoice.pdf"`,
  
  python: `import requests

url = "https://api.trypriceshield.com/api/v1/extract"
headers = {"X-API-Key": "ps_live_your_api_key_here"}
files = {"file": open("invoice.pdf", "rb")}

response = requests.post(url, headers=headers, files=files)
print(response.json())`,
  
  node: `const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('invoice.pdf'));

const response = await fetch('https://api.trypriceshield.com/api/v1/extract', {
  method: 'POST',
  headers: {
    'X-API-Key': 'ps_live_your_api_key_here'
  },
  body: form
});

const data = await response.json();
console.log(data);`,
  
  go: `package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

func main() {
	url := "https://api.trypriceshield.com/api/v1/extract"
	payload := &bytes.Buffer{}
	writer := multipart.NewWriter(payload)
	file, _ := os.Open("invoice.pdf")
	defer file.Close()
	part, _ := writer.CreateFormFile("file", "invoice.pdf")
	io.Copy(part, file)
	writer.Close()

	client := &http.Client{}
	req, _ := http.NewRequest("POST", url, payload)
	req.Header.Set("X-API-Key", "ps_live_your_api_key_here")
	req.Header.Set("Content-Type", writer.FormDataContentType())
	res, _ := client.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}`,
  
  php: `<?php
$client = new \\GuzzleHttp\\Client();
$response = $client->request('POST', 'https://api.trypriceshield.com/api/v1/extract', [
    'headers' => [
        'X-API-Key' => 'ps_live_your_api_key_here',
    ],
    'multipart' => [
        [
            'name'     => 'file',
            'contents' => fopen('invoice.pdf', 'r'),
            'filename' => 'invoice.pdf'
        ],
    ],
]);
echo $response->getBody();`,
  
  ruby: `require 'net/http'
require 'net/http/post/multipart'

url = URI.parse('https://api.trypriceshield.com/api/v1/extract')
File.open("invoice.pdf") do |file|
  req = Net::HTTP::Post::Multipart.new(url.path,
    "file" => UploadIO.new(file, "application/pdf", "invoice.pdf")
  )
  req.add_field("X-API-Key", "ps_live_your_api_key_here")
  res = Net::HTTP.start(url.host, url.port, use_ssl: true) do |http|
    http.request(req)
  end
  puts res.body
end`,
};

export default function DevelopersPage() {
  const [selectedLang, setSelectedLang] = useState<string | null>("curl");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const snippet = selectedLang ? snippets[selectedLang] : "";
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-emerald-500/30">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="PriceShield Logo" width={32} height={32} className="h-8 w-auto" />
              <span className="font-bold text-lg hidden sm:block">PriceShield</span>
            </Link>
            <Badge variant="outline" className="ml-2 font-mono text-[10px] uppercase text-emerald-400 border-emerald-500/30">API v1</Badge>
            <span className="ml-2 text-[10px] text-emerald-500/40 font-mono">v1.2.1-live</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/dashboard">
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
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="h-12 px-6">
                  Generate Key
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 mt-12 lg:mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Zap, title: "Advanced AI Powered", desc: "Sub-second extraction accuracy." },
                { icon: Shield, title: "Enterprise SLA", desc: "99.99% uptime for Scale tiers." },
                { icon: Box, title: "Structured JSON", desc: "Clean line-item arrays." },
                { icon: CheckCircle2, title: "Confidence Scores", desc: "Built-in OCR certainty." },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border/50 hover:border-emerald-500/30 transition-colors">
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
            <p className="text-muted-foreground">All endpoints are relative to <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-emerald-400 font-mono">https://api.trypriceshield.com/api/v1</code></p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start overflow-hidden">
            
            {/* Left: Endpoint Docs */}
            <div className="lg:col-span-7 space-y-16">
              
              {/* Extract */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-mono">POST</Badge>
                  <h3 className="text-2xl font-mono font-bold">/extract</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Extracts structured data from an invoice PDF or image. The response includes vendor details, parsed line items, and OCR confidence scores.
                </p>
                
                <h4 className="font-semibold text-lg border-b border-border/50 pb-2 mt-8">Headers</h4>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/20 pb-4 gap-2">
                    <span className="font-mono text-emerald-400">X-API-Key</span>
                    <span className="sm:col-span-2 text-muted-foreground">Your secret API key starting with <code className="text-foreground">ps_live_</code></span>
                  </div>
                </div>

                <h4 className="font-semibold text-lg border-b border-border/50 pb-2 mt-8">Form Data</h4>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/20 pb-4 gap-2">
                    <span className="font-mono text-emerald-400">file</span>
                    <span className="sm:col-span-2 text-muted-foreground">The file to upload (PDF, PNG, JPEG, WEBP). Max 20MB.</span>
                  </div>
                </div>
              </div>

              {/* Response Example */}
              <div className="space-y-6 pt-8 border-t border-border/20">
                <h4 className="font-semibold text-xl flex items-center gap-2">
                  <Box className="h-5 w-5 text-blue-400" /> Response Example
                </h4>
                <p className="text-muted-foreground text-sm">
                  A successful extraction returns a <code className="text-emerald-400 font-mono">200 OK</code> with a structured JSON object.
                </p>
                <div className="rounded-xl overflow-hidden bg-[#0c0e12] border border-border/40 shadow-inner">
                  <div className="px-4 py-2 border-b border-border/20 bg-[#13161c] flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">application/json</span>
                  </div>
                  <pre className="p-4 text-[12px] font-mono text-emerald-400/90 leading-relaxed overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-border/20 whitespace-pre">
{`{
  "vendor_name": "Sysco Food Services",
  "invoice_date": "2026-04-28",
  "invoice_number": "INV-99281",
  "currency": "USD",
  "grand_total": 1240.50,
  "items": [
    {
      "item_name": "Premium Beef Tenderloin",
      "sku": "BEEF-001",
      "quantity": 45.5,
      "unit_of_measure": "lbs",
      "unit_price": 14.50,
      "total_price": 659.75,
      "confidence": 0.99
    },
    {
      "item_name": "Organic Roma Tomatoes",
      "sku": "PROD-882",
      "quantity": 5,
      "unit_of_measure": "case",
      "unit_price": 22.00,
      "total_price": 110.00,
      "confidence": 0.97
    }
  ],
  "overall_confidence": 0.98
}`}
                  </pre>
                </div>
              </div>

            </div>

            {/* Right: Code Snippets */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
              <div className="rounded-xl overflow-hidden bg-[#0c0e12] border border-border/40 shadow-2xl">
                {/* Snippet Header */}
                <div className="px-4 py-3 border-b border-border/20 bg-[#13161c] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/30" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                      <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/30" />
                    </div>
                    <div className="h-4 w-px bg-border/20 mx-1" />
                    <Select value={selectedLang} onValueChange={setSelectedLang}>
                      <SelectTrigger className="h-7 w-fit bg-transparent border-none focus:ring-0 text-xs font-mono text-muted-foreground hover:text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#13161c] border-border/40 text-xs font-mono">
                        {languages.map((l) => (
                          <SelectItem key={l.id} value={l.id} className="focus:bg-emerald-500/10 focus:text-emerald-400">
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-400" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                
                {/* Snippet Body */}
                <div className="relative group">
                    <pre className="p-5 text-[13px] font-mono text-gray-300 overflow-x-auto leading-relaxed scrollbar-thin scrollbar-thumb-border/20 whitespace-pre">
                      {selectedLang ? snippets[selectedLang] : ""}
                    </pre>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="outline" className="bg-[#13161c]/80 backdrop-blur-sm border-emerald-500/20 text-emerald-400 text-[10px]">
                        {languages.find(l => l.id === selectedLang)?.name || "Select Language"}
                      </Badge>
                    </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-start gap-3">
                  <Code2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All examples use multipart form-data. Ensure your client supports file streams for invoices larger than 5MB.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
