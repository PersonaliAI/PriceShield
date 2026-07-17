"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Printer,
  Sparkles,
  ArrowRight,
  FileText,
  DollarSign,
  Users,
  Sparkle,
  Copy,
  Check,
  Mail,
  Loader2,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  price: number;
}

export function MassageInvoiceClient() {
  // Business / Therapist Info
  const [businessName, setBusinessName] = useState("Aura Wellness & Massage Therapy");
  const [therapistName, setTherapistName] = useState("Sarah Jenkins, LMT");
  const [licenseNumber, setLicenseNumber] = useState("LMT-897612");
  const [businessEmail, setBusinessEmail] = useState("hello@aurawellness.com");
  const [businessPhone, setBusinessPhone] = useState("(555) 018-4499");
  const [businessAddress, setBusinessAddress] = useState("720 Harmony Blvd, Suite A\nSeattle, WA 98101");

  // Client Info
  const [clientName, setClientName] = useState("Richard Martinez");
  const [clientEmail, setClientEmail] = useState("richard.m@outlook.com");
  const [clientPhone, setClientPhone] = useState("(555) 890-1234");

  // Service Details
  const [serviceDate, setServiceDate] = useState("2026-06-28");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-MS-432");

  // Massage sessions & upgrades
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "90-Minute Custom Deep Tissue Massage", qty: 1, price: 120.0 },
    { id: "2", description: "Aromatherapy Upgrade (Lavender & Eucalyptus)", qty: 1, price: 15.0 },
    { id: "3", description: "Organic Soothing Massage Oil (Retail)", qty: 1, price: 24.0 },
  ]);

  // Financial details
  const [tip, setTip] = useState(25.0);
  const [taxRate, setTaxRate] = useState(8.25); // percentage
  const [notes, setNotes] = useState(
    "Thank you for booking with Sarah Jenkins! Please remember that we require 24 hours notice for cancellations. Have a peaceful day!"
  );

  // Tab state: "print" (PDF/paper invoice preview) vs "email" (formatted email template)
  const [previewTab, setPreviewTab] = useState<"print" | "email">("print");
  const [copied, setCopied] = useState(false);

  // Style and Download states
  const [style, setStyle] = useState<"classic" | "modern" | "boutique">("classic");
  const [downloading, setDownloading] = useState(false);

  // Line item handlers
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).slice(2, 9),
      description: "Additional Service / Wellness Add-on",
      qty: 1,
      price: 0.0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tip + tax;

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const payload = {
        style,
        businessName,
        businessEmail,
        businessPhone,
        businessAddress,
        clientName,
        clientContact: "",
        clientEmail,
        clientAddress: "",
        invoiceNumber,
        invoiceDate: serviceDate,
        dueDate: "",
        items: items.map(item => ({
          description: item.description,
          qty: item.qty,
          price: item.price
        })),
        notes,
        therapistName,
        licenseNumber,
        eventDate: serviceDate,
        setupFee: 0.0,
        taxRate,
        gratuityRate: 0.0,
        tip
      };

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Could not generate high-quality PDF from the server. Please try printing to PDF using the 'Print' button instead.");
    } finally {
      setDownloading(false);
    }
  };

  // Email format builder
  const buildEmailContent = () => {
    const lines = [
      `Subject: Receipt for your Massage Session - Invoice ${invoiceNumber}`,
      ``,
      `Dear ${clientName},`,
      ``,
      `Thank you for your visit to ${businessName} on ${serviceDate}.`,
      `Here is a summary of your session and wellness services:`,
      ``,
      `--------------------------------------------------`,
      `Therapist: ${therapistName} (${licenseNumber})`,
      `--------------------------------------------------`,
      items.map((item) => `• ${item.description} (x${item.qty}) - $${(item.qty * item.price).toFixed(2)}`).join("\n"),
      `--------------------------------------------------`,
      `Subtotal: $${subtotal.toFixed(2)}`,
      tip > 0 ? `Gratuity/Tip: $${tip.toFixed(2)}` : null,
      taxRate > 0 ? `Sales Tax (${taxRate}%): $${tax.toFixed(2)}` : null,
      `Total Charged: $${total.toFixed(2)}`,
      `--------------------------------------------------`,
      ``,
      notes ? `${notes}\n` : "",
      `If you have any questions, feel free to reply directly to this email or call us at ${businessPhone}.`,
      ``,
      `Warm regards,`,
      businessName,
    ].filter((line) => line !== null);

    return lines.join("\n");
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(buildEmailContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-8 items-start">
      {/* Stylesheet injected for page printing */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, nav, .print\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .print-area {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
          .print-area * {
            color: black !important;
            border-color: #e5e7eb !important;
          }
        }
      `}</style>

      {/* Left panel: Creator Interface */}
      <div className="space-y-6 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">
            Massage Service Invoice Generator
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure therapist credentials, custom session rates, tips, and print or export an email invoice text receipt.
          </p>
        </div>

        {/* Style Preset Selector */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Palette className="size-4 text-emerald-400" />
            Invoice Style Preset
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {(["classic", "modern", "boutique"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer text-center ${
                  style === s
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Business details */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-400" />
            Therapist / Spa Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Business / Spa Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Therapist Name</label>
              <input
                type="text"
                value={therapistName}
                onChange={(e) => setTherapistName(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">License / Certification #</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Therapist Email</label>
              <input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Spa Phone</label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Physical Location</label>
              <textarea
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                rows={2}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Client details */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <Users className="size-4 text-emerald-400" />
            Client Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Client Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Client Phone</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Invoice ID</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Service Date</label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Sessions & Add-ons */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkle className="size-4 text-emerald-400" />
              Sessions & Upgrades
            </h2>
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              <Plus className="size-3" /> Add Service
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 items-end bg-muted/25 p-3 rounded border border-border/40">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Service Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="w-16 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Qty</label>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => handleItemChange(item.id, "qty", Number(e.target.value))}
                    className="w-full bg-muted/40 border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Cost ($)</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(item.id, "price", parseFloat(e.target.value) || 0)}
                    className="w-full bg-muted/40 border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer mb-0.5"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tip & Tax */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <DollarSign className="size-4 text-emerald-400" />
            Tips & Taxes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Client Tip ($)</label>
              <input
                type="number"
                value={tip}
                onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Service Tax (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-500">Invoice Footer Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Dynamic CTA */}
        <div className="p-6 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-card to-emerald-500/5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold tracking-wide uppercase">
              Spa & Wellness Costs
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground">Losing spa margins on linen services & essential oils?</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Massage oils, linens, towels, and retail spa products have fluctuating costs. PriceShield audits your incoming wholesale supplier invoices in 5 seconds and warns you about price hikes instantly.
          </p>
          <Button
            size="sm"
            className="cursor-pointer text-xs h-8 px-3 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
            render={<Link href="/login" />}
          >
            Audit Supplier Invoices Free
            <ArrowRight className="size-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Right panel: Live PDF / Email template toggle view */}
      <div className="space-y-4 lg:sticky lg:top-24">
        {/* Tab Selector controls */}
        <div className="flex items-center justify-between border-b border-border/80 pb-2 print:hidden">
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewTab("print")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                previewTab === "print" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="size-3.5" /> Invoice PDF
            </button>
            <button
              onClick={() => setPreviewTab("email")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                previewTab === "email" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Mail className="size-3.5" /> Email Template
            </button>
          </div>
          <div>
            {previewTab === "print" ? (
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1 bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground font-medium text-[10px] px-2.5 py-1.5 rounded-lg border border-border transition-colors cursor-pointer"
                >
                  <Printer className="size-3" /> Print
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[10px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {downloading ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <FileText className="size-3" />
                  )}
                  PDF
                </button>
              </div>
            ) : (
              <button
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1 bg-muted hover:bg-muted/70 text-foreground font-medium text-[10px] px-2.5 py-1.5 rounded-lg border border-border transition-colors cursor-pointer"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                {copied ? "Copied!" : "Copy Email"}
              </button>
            )}
          </div>
        </div>

        {/* Paper Invoice sheet */}
        {previewTab === "print" ? (
          <div className="w-full overflow-x-auto pb-4 print:overflow-visible">
            <div className={`print-area bg-white text-black p-8 rounded-lg shadow-2xl border border-zinc-200 min-w-[600px] lg:min-w-0 lg:w-full min-h-[840px] text-[11px] leading-relaxed relative ${
              style === "boutique" ? "font-serif" : "font-sans"
            }`}>
              {/* Style accents */}
              {style === "modern" && <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />}
              {style === "boutique" && <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-705" />}

            {/* Header */}
            <div className="flex justify-between items-start border-b border-zinc-200 pb-5 mb-5">
              <div>
                <h3 className={`text-base font-bold tracking-tight text-black ${style === "boutique" ? "font-serif italic text-stone-850" : ""}`}>{businessName}</h3>
                {therapistName && <p className="text-[10px] font-medium text-zinc-700 mt-0.5">{therapistName} ({licenseNumber})</p>}
                <p className="text-[10px] text-zinc-500 mt-1 whitespace-pre-line">{businessAddress}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{businessPhone} • {businessEmail}</p>
              </div>
              <div className="text-right">
                <h1 className={`text-2xl font-black uppercase tracking-wider ${
                  style === "modern" ? "text-emerald-600" : style === "boutique" ? "text-amber-700 font-serif italic font-bold" : "text-zinc-800"
                }`}>INVOICE</h1>
                <div className="mt-2 text-[10px] space-y-0.5 text-zinc-600">
                  <p><span className="font-semibold text-zinc-800">Invoice ID:</span> {invoiceNumber}</p>
                  <p><span className="font-semibold text-zinc-800">Date:</span> {serviceDate}</p>
                </div>
              </div>
            </div>

            {/* Details split */}
            <div className="mb-6">
              <h4 className={`text-[9px] uppercase font-bold tracking-wider mb-1 ${
                style === "modern" ? "text-emerald-500" : style === "boutique" ? "text-amber-700" : "text-zinc-400"
              }`}>Billed To:</h4>
              <p className="font-bold text-zinc-800">{clientName}</p>
              <p className="text-zinc-500 mt-0.5">{clientEmail} • {clientPhone}</p>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse mb-6">
              <thead>
                <tr className={`border-b-2 text-[9px] uppercase font-bold tracking-wider ${
                  style === "modern" ? "border-emerald-500 bg-emerald-50/50 text-emerald-700" : style === "boutique" ? "border-amber-700 bg-amber-50/20 text-amber-900" : "border-zinc-850 bg-zinc-50 text-zinc-700"
                }`}>
                  <th className="py-2 pl-2">Service / Amenity</th>
                  <th className="py-2 text-center w-12">Qty</th>
                  <th className="py-2 text-right w-20">Price</th>
                  <th className="py-2 text-right pr-2 w-20">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pl-2 font-medium">{item.description}</td>
                    <td className="py-2 text-center">{item.qty}</td>
                    <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                    <td className="py-2 text-right pr-2 font-semibold">${(item.qty * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bottom Summary block */}
            <div className="grid grid-cols-[1fr_180px] gap-6 items-start mt-4 pt-4 border-t border-zinc-200">
              <div>
                <h4 className={`text-[9px] uppercase font-bold tracking-wider mb-1 ${
                  style === "modern" ? "text-emerald-500" : style === "boutique" ? "text-amber-700" : "text-zinc-400"
                }`}>Notes:</h4>
                <p className="text-[10px] text-zinc-500 whitespace-pre-line leading-relaxed">{notes}</p>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-zinc-800">${subtotal.toFixed(2)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Sales Tax ({taxRate}%):</span>
                    <span className="font-semibold text-zinc-800">${tax.toFixed(2)}</span>
                  </div>
                )}
                {tip > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Gratuity/Tip:</span>
                    <span className="font-semibold text-zinc-800">${tip.toFixed(2)}</span>
                  </div>
                )}
                <div className={`flex justify-between border-t pt-2 font-bold text-[12px] ${
                  style === "modern" ? "border-emerald-500 text-emerald-700" : style === "boutique" ? "border-amber-700 text-amber-900" : "border-zinc-800 text-zinc-800"
                }`}>
                  <span>Total Paid:</span>
                  <span className="font-black">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
          /* Email text template box */
          <div className="bg-zinc-950 border border-border p-5 rounded-lg font-mono text-xs text-zinc-300 min-h-[300px] select-all whitespace-pre-wrap leading-relaxed relative">
            <span className="absolute top-2 right-2 text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase font-semibold">Plain Text</span>
            {buildEmailContent()}
          </div>
        )}
      </div>
    </div>
  );
}
