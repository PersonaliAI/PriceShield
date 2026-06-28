import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BbInvoiceClient } from "./BbInvoiceClient";

export const metadata: Metadata = {
  title: "Free Bed & Breakfast Invoice Template Generator | PriceShield",
  description:
    "Generate professional invoices for your Bed & Breakfast or boutique hotel. Custom calculators for occupancy rates, nightly stays, and hospitality amenities.",
  alternates: {
    canonical: "https://trypriceshield.com/tools/bed-and-breakfast-invoice-template",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trypriceshield.com/tools/bed-and-breakfast-invoice-template/#webpage",
      url: "https://trypriceshield.com/tools/bed-and-breakfast-invoice-template",
      name: "Free Bed & Breakfast Invoice Template Generator - PriceShield",
      description:
        "Create hospitality invoices. Ideal for B&Bs, small hotels, guesthouses, and homestay owners.",
      publisher: { "@id": "https://trypriceshield.com/#organization" },
    },
    {
      "@type": "HowTo",
      "@id": "https://trypriceshield.com/tools/bed-and-breakfast-invoice-template/#howto",
      name: "How to Create a B&B Invoice",
      description:
        "Input guesthouse details, guest information, stay dates, nightly rates, room charges, and local tourism taxes, then save or print.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Add Booking Info",
          text: "Set check-in and check-out dates, room name/number, and nightly rate.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Add Extras and Services",
          text: "Add lines for breakfast upgrades, parking, rental equipment, or local experiences.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Compute Occupancy Tax",
          text: "Apply regional lodging or occupancy tax rates to the subtotal.",
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Generate PDF",
          text: "Print the finalized invoice sheet or save it natively as a PDF.",
        },
      ],
    },
  ],
};

export default function BbInvoicePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-black text-foreground pt-24 pb-16 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6 print:hidden">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li className="after:content-['/'] after:ml-2"></li>
              <li>
                <span className="text-muted-foreground">Tools</span>
              </li>
              <li className="after:content-['/'] after:ml-2"></li>
              <li>
                <span className="text-foreground font-medium">B&B Invoice Template</span>
              </li>
            </ol>
          </nav>

          <BbInvoiceClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
