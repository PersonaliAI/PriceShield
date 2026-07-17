import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CateringInvoiceClient } from "./CateringInvoiceClient";

export const metadata: Metadata = {
  title: "Free Catering Invoice Template Generator | PriceShield",
  description:
    "Generate, customize, and print professional catering invoices for free. Interactive calculator for food packages, guest counts, gratuities, and setup fees.",
  alternates: {
    canonical: "https://trypriceshield.com/tools/catering-invoice-template",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trypriceshield.com/tools/catering-invoice-template/#webpage",
      url: "https://trypriceshield.com/tools/catering-invoice-template",
      name: "Free Catering Invoice Template Generator - PriceShield",
      description:
        "Create, calculate, and print catering invoices. Perfect for caterers, event planners, and private chefs.",
      publisher: { "@id": "https://trypriceshield.com/#organization" },
    },
    {
      "@type": "HowTo",
      "@id": "https://trypriceshield.com/tools/catering-invoice-template/#howto",
      name: "How to Create a Catering Invoice",
      description:
        "Enter your catering business details, client info, event details, package pricing, tax, and gratuity, then print or save as PDF.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Enter Header Information",
          text: "Fill in your company name, contact info, client details, and event specific notes (venue, guest count, event date).",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "List Food & Service Packages",
          text: "Add rows for catering packages, server hours, bar service, or equipment rentals. Enter the quantities and unit prices.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Calculate Taxes, Fees & Gratuity",
          text: "Set the custom tax rate, gratuity percentage, and delivery/setup fees. The tool automatically computes the total.",
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Print or Download PDF",
          text: "Click the 'Print Invoice' button to open the browser print dialog and save a clean PDF copy for your records.",
        },
      ],
    },
  ],
};

export default function CateringInvoicePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-background text-foreground pt-24 pb-16 relative overflow-hidden">
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
                <span className="text-foreground font-medium">Catering Invoice Template</span>
              </li>
            </ol>
          </nav>

          <CateringInvoiceClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
