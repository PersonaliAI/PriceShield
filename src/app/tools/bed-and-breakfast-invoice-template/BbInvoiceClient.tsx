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
  Bed,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  price: number;
}

export function BbInvoiceClient() {
  // Business Info
  const [businessName, setBusinessName] = useState("Whispering Pines Bed & Breakfast");
  const [businessEmail, setBusinessEmail] = useState("stay@whisperingpinesbb.com");
  const [businessPhone, setBusinessPhone] = useState("(555) 014-9988");
  const [businessAddress, setBusinessAddress] = useState("450 Forest Lane\nAsheville, NC 28801");

  // Guest Info
  const [guestName, setGuestName] = useState("John Henderson");
  const [guestEmail, setGuestEmail] = useState("john.henderson@gmail.com");
  const [guestPhone, setGuestPhone] = useState("(555) 321-7654");
  const [guestAddress, setGuestAddress] = useState("742 Maple Street\nAtlanta, GA 30301");

  // Booking details
  const [roomName, setRoomName] = useState("Room 204 - Deluxe King Suite");
  const [checkIn, setCheckIn] = useState("2026-06-25");
  const [checkOut, setCheckOut] = useState("2026-06-28");
  const [nights, setNights] = useState(3);
  const [nightlyRate, setNightlyRate] = useState(185.00);

  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState("INV-WP-9871");
  const [invoiceDate, setInvoiceDate] = useState("2026-06-28");

  // Additional charges
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "Gourmet Breakfast Basket Upgrade", qty: 3, price: 15.0 },
    { id: "2", description: "Linen & Spa Services", qty: 1, price: 50.0 },
    { id: "3", description: "Bicycle Rental (Half-day)", qty: 2, price: 20.0 },
  ]);

  // Tax rates
  const [lodgingTaxRate, setLodgingTaxRate] = useState(6.0); // lodging tax %
  const [stateTaxRate, setStateTaxRate] = useState(7.0); // state tax %
  const [notes, setNotes] = useState(
    "Thank you for staying at Whispering Pines B&B! A receipt has been sent to your email. We hope to welcome you back again soon."
  );

  // Line item handlers
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).slice(2, 9),
      description: "Additional Service / Item",
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
  const roomCostTotal = nights * nightlyRate;
  const servicesSubtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const subtotal = roomCostTotal + servicesSubtotal;
  
  // Tax calculations
  const lodgingTax = roomCostTotal * (lodgingTaxRate / 100);
  const stateTax = subtotal * (stateTaxRate / 100);
  const total = subtotal + lodgingTax + stateTax;

  const handlePrint = () => {
    window.print();
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            Bed & Breakfast Invoice Generator
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate detailed room invoices, add extra amenities or breakfasts, compute regional lodging taxes, and print.
          </p>
        </div>

        {/* Business details */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-white border-b border-border pb-2 flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-400" />
            Your B&B Property Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Property Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Contact Email</label>
              <input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Contact Phone</label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Physical Address</label>
              <textarea
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                rows={2}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Guest & Stay Details */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-white border-b border-border pb-2 flex items-center gap-2">
            <Bed className="size-4 text-emerald-400" />
            Guest & Booking Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Guest Name</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Guest Email</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Guest Address</label>
              <textarea
                value={guestAddress}
                onChange={(e) => setGuestAddress(e.target.value)}
                rows={1}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/30">
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Room Info (Type / Number)</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Check-In Date</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Check-Out Date</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Nights Stayed</label>
              <input
                type="number"
                value={nights}
                onChange={(e) => setNights(Number(e.target.value))}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Nightly Rate ($)</label>
              <input
                type="number"
                value={nightlyRate}
                onChange={(e) => setNightlyRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Charges */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="size-4 text-emerald-400" />
              Additional Charges (Breakfast, Spa, Parking)
            </h2>
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              <Plus className="size-3" /> Add Charge
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 items-end bg-black/25 p-3 rounded border border-border/40">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Charge Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    className="w-full bg-black/40 border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="w-16 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Qty</label>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => handleItemChange(item.id, "qty", Number(e.target.value))}
                    className="w-full bg-black/40 border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Price ($)</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(item.id, "price", parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500"
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

        {/* Taxes */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-white border-b border-border pb-2 flex items-center gap-2">
            <DollarSign className="size-4 text-emerald-400" />
            Hospitality & Lodging Taxes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Lodging / Occupancy Tax (%)</label>
              <input
                type="number"
                value={lodgingTaxRate}
                onChange={(e) => setLodgingTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">State / Sales Tax (%)</label>
              <input
                type="number"
                value={stateTaxRate}
                onChange={(e) => setStateTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-500">Invoice Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Dynamic CTA */}
        <div className="p-6 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-card to-emerald-500/5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold tracking-wide uppercase">
              Hospitality Margin Defense
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white">Running a Bed & Breakfast is a high-cost operation</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            From food ingredients to bed linens, laundry, and energy, your supplier costs can spiral out of control. PriceShield audits your incoming supplier invoices in 5 seconds and warns you about price hikes instantly.
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
        <div className="flex items-center justify-between print:hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice Preview</p>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
          >
            <Printer className="size-3.5" /> Print / Save PDF
          </button>
        </div>

        {/* Paper Invoice sheet */}
        <div className="print-area bg-white text-black p-8 rounded-lg shadow-2xl border border-zinc-200 aspect-[1/1.4] w-full text-[11px] leading-relaxed">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-zinc-200 pb-5 mb-5">
            <div>
              <h3 className="text-base font-bold tracking-tight text-black">{businessName}</h3>
              <p className="text-[10px] text-zinc-500 mt-1 whitespace-pre-line">{businessAddress}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{businessPhone} • {businessEmail}</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-black uppercase tracking-wider text-zinc-800">INVOICE</h1>
              <div className="mt-2 text-[10px] space-y-0.5 text-zinc-600">
                <p><span className="font-semibold text-zinc-800">Invoice No:</span> {invoiceNumber}</p>
                <p><span className="font-semibold text-zinc-800">Date:</span> {invoiceDate}</p>
              </div>
            </div>
          </div>

          {/* Details split */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">Guest Information:</h4>
              <p className="font-bold text-zinc-800">{guestName}</p>
              <p className="text-zinc-500 whitespace-pre-line mt-1">{guestAddress}</p>
              <p className="text-zinc-500">{guestEmail}</p>
              {guestPhone && <p className="text-zinc-500">{guestPhone}</p>}
            </div>
            <div>
              <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">Stay Information:</h4>
              <p className="font-bold text-zinc-800">{roomName}</p>
              <div className="mt-1.5 space-y-0.5 text-zinc-600 text-[10px]">
                <p className="flex items-center gap-1.5"><Calendar className="size-3 text-zinc-400 shrink-0" /> <span className="font-semibold text-zinc-800">Check-in:</span> {checkIn}</p>
                <p className="flex items-center gap-1.5"><Calendar className="size-3 text-zinc-400 shrink-0" /> <span className="font-semibold text-zinc-800">Check-out:</span> {checkOut}</p>
                <p className="flex items-center gap-1.5"><Users className="size-3 text-zinc-400 shrink-0" /> <span className="font-semibold text-zinc-800">Nights Stayed:</span> {nights}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse mb-6">
            <thead>
              <tr className="border-b-2 border-zinc-800 text-[9px] uppercase font-bold tracking-wider text-zinc-700">
                <th className="py-2 pl-1">Description</th>
                <th className="py-2 text-center w-12">Qty / Nights</th>
                <th className="py-2 text-right w-20">Rate</th>
                <th className="py-2 text-right pr-1 w-20">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {/* Room Stay Row */}
              <tr>
                <td className="py-2 pl-1 font-medium">{roomName} (Room Charge)</td>
                <td className="py-2 text-center">{nights}</td>
                <td className="py-2 text-right">${nightlyRate.toFixed(2)}</td>
                <td className="py-2 text-right pr-1 font-semibold">${roomCostTotal.toFixed(2)}</td>
              </tr>
              {/* Other Services */}
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pl-1">{item.description}</td>
                  <td className="py-2 text-center">{item.qty}</td>
                  <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                  <td className="py-2 text-right pr-1 font-semibold">${(item.qty * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Summary block */}
          <div className="grid grid-cols-[1fr_180px] gap-6 items-start mt-4 pt-4 border-t border-zinc-200">
            <div>
              <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">Guest Notes:</h4>
              <p className="text-[10px] text-zinc-500 whitespace-pre-line leading-relaxed">{notes}</p>
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-800">${subtotal.toFixed(2)}</span>
              </div>
              {lodgingTaxRate > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Lodging Tax ({lodgingTaxRate}%):</span>
                  <span className="font-semibold text-zinc-800">${lodgingTax.toFixed(2)}</span>
                </div>
              )}
              {stateTaxRate > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Sales Tax ({stateTaxRate}%):</span>
                  <span className="font-semibold text-zinc-800">${stateTax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-800 pt-2 text-zinc-800 font-bold text-[12px]">
                <span>Total Due:</span>
                <span className="font-black text-emerald-700">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
