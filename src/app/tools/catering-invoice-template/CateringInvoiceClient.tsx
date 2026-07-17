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
  MapPin,
  Calendar,
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

export function CateringInvoiceClient() {
  // Business Info
  const [businessName, setBusinessName] = useState("Elite Catering Co.");
  const [businessEmail, setBusinessEmail] = useState("billing@elitecatering.com");
  const [businessPhone, setBusinessPhone] = useState("(555) 019-2834");
  const [businessAddress, setBusinessAddress] = useState("120 Culinary Way, Suite 400\nChicago, IL 60611");

  // Client Info
  const [clientName, setClientName] = useState("Acme Corporation");
  const [clientContact, setClientContact] = useState("Jane Doe");
  const [clientEmail, setClientEmail] = useState("events@acme.com");
  const [clientAddress, setClientAddress] = useState("500 Tech Blvd\nChicago, IL 60601");

  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-089");
  const [invoiceDate, setInvoiceDate] = useState("2026-06-28");
  const [dueDate, setDueDate] = useState("2026-07-15");

  // Event Details
  const [eventType, setEventType] = useState("Corporate Summer Gala");
  const [eventDate, setEventDate] = useState("2026-07-10");
  const [eventVenue, setEventVenue] = useState("Lakeview Pavilion, Chicago");
  const [guestCount, setGuestCount] = useState(150);

  // Line Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "Premium Buffet Package (per guest)", qty: 150, price: 65.0 },
    { id: "2", description: "Open Bar Package - 4 Hours (per guest)", qty: 150, price: 30.0 },
    { id: "3", description: "Chef & Server Service Fee (Flat)", qty: 1, price: 650.0 },
    { id: "4", description: "Tableware & Linen Rental", qty: 1, price: 400.0 },
  ]);

  // Style and Download states
  const [style, setStyle] = useState<"classic" | "modern" | "boutique">("classic");
  const [downloading, setDownloading] = useState(false);

  // Fees, Tax, Gratuity
  const [setupFee, setSetupFee] = useState(250.0);
  const [taxRate, setTaxRate] = useState(8.25); // percentage
  const [gratuityRate, setGratuityRate] = useState(18); // percentage
  const [notes, setNotes] = useState(
    "Thank you for choosing Elite Catering Co. for your event! A 50% deposit is required to secure the date. Balance is due 7 days prior to the event."
  );

  // Line item handlers
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).slice(2, 9),
      description: "New Item / Service",
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
  const gratuity = subtotal * (gratuityRate / 100);
  const taxableAmount = subtotal + setupFee;
  const tax = taxableAmount * (taxRate / 100);
  const total = subtotal + setupFee + gratuity + tax;

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
        clientContact,
        clientEmail,
        clientAddress,
        invoiceNumber,
        invoiceDate,
        dueDate,
        items: items.map(item => ({
          description: item.description,
          qty: item.qty,
          price: item.price
        })),
        notes,
        eventType,
        eventDate,
        eventVenue,
        guestCount,
        setupFee,
        taxRate,
        gratuityRate,
        tip: 0.0
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
            Catering Invoice Generator
          </h1>
          <p className="text-sm text-muted-foreground">
            Customize event parameters, food packages, gratuities, and download a clean PDF invoice.
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
            Your Catering Company Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Catering Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Contact Email</label>
              <input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Contact Phone</label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Physical Address</label>
              <textarea
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                rows={2}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Client & Event Info */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <Users className="size-4 text-emerald-400" />
            Client & Event Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Client Organization</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Contact Person</label>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
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
              <label className="text-[10px] uppercase font-bold text-zinc-500">Client Address</label>
              <textarea
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                rows={1}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Event Title / Type</label>
              <input
                type="text"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Event Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Event Venue / Location</label>
              <input
                type="text"
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Guest Count</label>
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Invoice details & items */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-emerald-400" />
              Line Items & Packages
            </h2>
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              <Plus className="size-3" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 items-end bg-muted/25 p-3 rounded border border-border/40">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Qty</label>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => handleItemChange(item.id, "qty", Number(e.target.value))}
                    className="w-full bg-muted/40 border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Unit Price ($)</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(item.id, "price", parseFloat(e.target.value) || 0)}
                    className="w-full bg-muted/40 border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={items.length <= 1}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors disabled:opacity-30 cursor-pointer mb-0.5"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Fees, Taxes, Gratuity */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <DollarSign className="size-4 text-emerald-400" />
            Taxes, Fees & Gratuity
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Setup & Delivery ($)</label>
              <input
                type="number"
                value={setupFee}
                onChange={(e) => setSetupFee(parseFloat(e.target.value) || 0)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Gratuity (%)</label>
              <input
                type="number"
                value={gratuityRate}
                onChange={(e) => setGratuityRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-500">Invoice Notes / Terms</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Dynamic CTA */}
        <div className="p-6 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-card to-emerald-500/5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold tracking-wide uppercase">
              Powered by PriceShield
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground">Catering margins slipping on invoice overcharges?</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            While you write invoices for clients, your suppliers are writing invoices for you. PriceShield automatically extracts line items from distributor bills (PDF/photo) and flags price hikes instantly.
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

      {/* Right panel: Live PDF-style invoice Preview */}
      <div className="space-y-4 lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-2 print:hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice Preview</p>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground font-medium text-xs px-3 py-1.5 rounded-lg border border-border transition-colors cursor-pointer"
            >
              <Printer className="size-3.5" /> Print
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileText className="size-3.5" />
              )}
              Download PDF
            </button>
          </div>
        </div>

        {/* Scroll wrapper for mobile responsiveness */}
        <div className="w-full overflow-x-auto pb-4 print:overflow-visible">
          {/* Paper Invoice sheet */}
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
              <p className="text-[10px] text-zinc-500 mt-1 whitespace-pre-line">{businessAddress}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{businessPhone} • {businessEmail}</p>
            </div>
            <div className="text-right">
              <h1 className={`text-2xl font-black uppercase tracking-wider ${
                style === "modern" ? "text-emerald-600" : style === "boutique" ? "text-amber-700 font-serif italic font-bold" : "text-zinc-800"
              }`}>INVOICE</h1>
              <div className="mt-2 text-[10px] space-y-0.5 text-zinc-600">
                <p><span className="font-semibold text-zinc-800">Invoice No:</span> {invoiceNumber}</p>
                <p><span className="font-semibold text-zinc-800">Date:</span> {invoiceDate}</p>
                <p><span className="font-semibold text-zinc-800">Due Date:</span> {dueDate}</p>
              </div>
            </div>
          </div>

          {/* Details split */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className={`text-[9px] uppercase font-bold tracking-wider mb-1.5 ${
                style === "modern" ? "text-emerald-500" : style === "boutique" ? "text-amber-700" : "text-zinc-400"
              }`}>Bill To:</h4>
              <p className="font-bold text-zinc-800">{clientName}</p>
              {clientContact && <p className="text-zinc-600">Attn: {clientContact}</p>}
              <p className="text-zinc-500 whitespace-pre-line mt-1">{clientAddress}</p>
              <p className="text-zinc-500">{clientEmail}</p>
            </div>
            <div>
              <h4 className={`text-[9px] uppercase font-bold tracking-wider mb-1.5 ${
                style === "modern" ? "text-emerald-500" : style === "boutique" ? "text-amber-700" : "text-zinc-400"
              }`}>Event Details:</h4>
              <p className="font-bold text-zinc-800">{eventType}</p>
              <div className="mt-1.5 space-y-0.5 text-zinc-600 text-[10px]">
                <p className="flex items-center gap-1.5"><Calendar className="size-3 text-zinc-400 shrink-0" /> {eventDate}</p>
                <p className="flex items-center gap-1.5"><MapPin className="size-3 text-zinc-400 shrink-0" /> {eventVenue}</p>
                <p className="flex items-center gap-1.5"><Users className="size-3 text-zinc-400 shrink-0" /> {guestCount} Guests</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse mb-6">
            <thead>
              <tr className={`border-b-2 text-[9px] uppercase font-bold tracking-wider ${
                style === "modern" ? "border-emerald-500 bg-emerald-50/50 text-emerald-700" : style === "boutique" ? "border-amber-700 bg-amber-50/20 text-amber-900" : "border-zinc-800 bg-zinc-50 text-zinc-700"
              }`}>
                <th className="py-2 pl-2">Description</th>
                <th className="py-2 text-center w-12">Qty</th>
                <th className="py-2 text-right w-20">Unit Price</th>
                <th className="py-2 text-right pr-2 w-20">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {items.map((item) => (
                <tr key={item.id} className="text-zinc-800">
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
              <h4 className={`text-[9px] uppercase font-bold tracking-wider mb-1.5 ${
                style === "modern" ? "text-emerald-500" : style === "boutique" ? "text-amber-700" : "text-zinc-400"
              }`}>Terms & Notes:</h4>
              <p className="text-[10px] text-zinc-500 whitespace-pre-line leading-relaxed">{notes}</p>
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Setup & Delivery:</span>
                <span className="font-semibold text-zinc-800">${setupFee.toFixed(2)}</span>
              </div>
              {gratuityRate > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Gratuity ({gratuityRate}%):</span>
                  <span className="font-semibold text-zinc-800">${gratuity.toFixed(2)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Sales Tax ({taxRate}%):</span>
                  <span className="font-semibold text-zinc-800">${tax.toFixed(2)}</span>
                </div>
              )}
              <div className={`flex justify-between border-t pt-2 font-bold text-[12px] ${
                style === "modern" ? "border-emerald-500 text-emerald-700" : style === "boutique" ? "border-amber-700 text-amber-900" : "border-zinc-800 text-zinc-800"
              }`}>
                <span>Total Due:</span>
                <span className="font-black">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
