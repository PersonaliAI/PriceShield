import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MassageInvoiceClient } from "./MassageInvoiceClient";

export const metadata: Metadata = {
  title: "Free Massage Service Invoice & Email Template | PriceShield",
  description:
    "Generate professional invoices and copy-pasteable email invoice templates for massage therapists and wellness centers. Calculate sessions, tips, and taxes.",
  alternates: {
    canonical: "https://trypriceshield.com/tools/massage-invoice-template",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trypriceshield.com/tools/massage-invoice-template/#webpage",
      url: "https://trypriceshield.com/tools/massage-invoice-template",
      name: "Free Massage Service Invoice & Email Template Generator - PriceShield",
      description:
        "Create massage therapy invoices and formatted email receipt text blocks. Ideal for private therapists, chiropractors, and spa owners.",
      publisher: { "@id": "https://trypriceshield.com/#organization" },
    },
    {
      "@type": "HowTo",
      "@id": "https://trypriceshield.com/tools/massage-invoice-template/#howto",
      name: "How to Create a Massage Invoice & Email Receipt",
      description:
        "Input therapist details, license number, client name, service type, tips, and taxes, then copy as an email template or print.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Add Service Info",
          text: "Select massage type, session length (duration), and hourly/flat rate.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Include Wellness Add-ons",
          text: "Add rows for acupuncture, hot stones, aromatherapy upgrades, or wellness retail products.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Specify Tips and Taxes",
          text: "Add client gratuity and local sales taxes to calculate the final total.",
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Copy Email Template",
          text: "Switch to the email tab to copy a pre-formatted text receipt ready to paste directly into your client emails.",
        },
      ],
    },
  ],
};

export default function MassageInvoicePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-background text-foreground pt-24 pb-16 relative overflow-hidden w-full max-w-full">
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
                <span className="text-foreground font-medium">Massage Invoice Template</span>
              </li>
            </ol>
          </nav>

          <MassageInvoiceClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
