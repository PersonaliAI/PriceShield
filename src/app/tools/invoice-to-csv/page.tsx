import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { InvoiceToCsvClient } from "./InvoiceToCsvClient";

export const metadata: Metadata = {
  title: "Free Invoice to CSV Converter - Extract Invoice Data | PriceShield",
  description:
    "Convert PDF invoices to CSV or Excel format instantly. Upload your supplier invoice, review extracted line items, and download clean spreadsheet data — free, no sign-up required.",
  alternates: {
    canonical: "https://trypriceshield.com/tools/invoice-to-csv",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trypriceshield.com/tools/invoice-to-csv/#webpage",
      url: "https://trypriceshield.com/tools/invoice-to-csv",
      name: "Free Invoice to CSV Converter - PriceShield",
      description:
        "Convert PDF invoices to CSV or Excel format. Extract line items, quantities, and prices from supplier invoices.",
      publisher: { "@id": "https://trypriceshield.com/#organization" },
    },
    {
      "@type": "HowTo",
      "@id": "https://trypriceshield.com/tools/invoice-to-csv/#howto",
      name: "How to Convert an Invoice to CSV",
      description:
        "Upload a supplier invoice PDF or image, review the extracted data, then download as a CSV or Excel file.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Upload Invoice",
          text: "Drag and drop your invoice PDF or image file into the upload zone, or click to browse files.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Review Extracted Data",
          text: "Review the extracted line items in the preview table. Edit any cells that need correction.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Download CSV",
          text: "Click Download CSV or Download for Excel to get your clean spreadsheet data.",
        },
      ],
    },
  ],
};

export default function InvoiceToCsvPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-black text-foreground pt-24 pb-16">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6">
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
                <span className="text-foreground font-medium">Invoice to CSV Converter</span>
              </li>
            </ol>
          </nav>

          <InvoiceToCsvClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
