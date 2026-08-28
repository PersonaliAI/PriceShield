import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
};

import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { ABTestProvider } from "@/components/ab-test-provider";
import { QueryProvider } from "@/lib/query-client";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trypriceshield.com"),
  title: {
    default:
      "PriceShield — AI Supplier Price Tracking, Invoice Auditing & Price Creep Detection",
    template: "%s · PriceShield",
  },
  description:
    "Stop stealth supplier price hikes. PriceShield performs automatic invoice audits in 5 seconds, lets you track supplier prices, and helps you detect supplier price increases instantly with real-time alerts.",
  applicationName: "PriceShield",
  generator: "Next.js",
  authors: [{ name: "PriceShield Team", url: "https://trypriceshield.com" }],
  creator: "PriceShield",
  publisher: "PriceShield",
  category: "business",
  classification: "Hospitality SaaS, Supplier Price Tracking, Invoice Audit, Price Hike Detection",
  keywords: [
    // Core Target Keywords
    "supplier price track",
    "invoice audit",
    "supplier price increase detect",
    "supplier price tracking",
    "invoice auditing",
    "supplier price increase detection",
    "detect supplier price increase",
    "track supplier prices",
    // High-intent
    "supplier price monitoring software",
    "restaurant invoice audit software",
    "automatic invoice price comparison",
    "food cost control software",
    "supplier price hike detection",
    "restaurant margin protection software",
    "AI invoice extraction",
    "stealth price hike detection",
    "restaurant food cost percentage",
    "supplier price negotiation tools",
    // Long-tail
    "how to track supplier price increases",
    "how to stop supplier price creep restaurants",
    "automated restaurant invoice auditing",
    "real-time supplier price alerts Telegram",
    "Slack alerts food supplier hikes",
    "WhatsApp invoice price monitoring",
    "PDF invoice line item extraction AI",
    "restaurant P&L food cost analysis",
    "multi-location restaurant food cost",
    "restaurant AI CFO software",
  ],
  alternates: {
    canonical: "https://trypriceshield.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://trypriceshield.com",
    siteName: "PriceShield",
    title:
      "PriceShield — Stop Supplier Price Creep. Protect Hospitality Margins.",
    description:
      "Every supplier invoice audited in 5 seconds. Stealth price hikes flagged instantly via Telegram, Slack, or email. Recover 2–7% of margin most businesses leak silently.",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "PriceShield — AI Supplier Price Monitoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@trypriceshield",
    creator: "@trypriceshield",
    title: "PriceShield — Stop Supplier Price Creep",
    description:
      "AI-powered invoice auditing and supplier price monitoring for hospitality operators. Free audit on first 5 invoices.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code when you have one
    // google: "your-search-console-token",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

// JSON-LD structured data — Organization + SoftwareApplication + WebSite (with sitelinks search)
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://trypriceshield.com/#organization",
      name: "PriceShield",
      url: "https://trypriceshield.com",
      logo: {
        "@type": "ImageObject",
        url: "https://trypriceshield.com/logo.png",
        width: 1024,
        height: 1024,
      },
      sameAs: [
        "https://twitter.com/trypriceshield",
        "https://linkedin.com/company/priceshield",
        "https://github.com/Damayantha/PriceShield",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: "https://trypriceshield.com/support",
        availableLanguage: ["English"],
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://trypriceshield.com/#website",
      url: "https://trypriceshield.com",
      name: "PriceShield",
      publisher: { "@id": "https://trypriceshield.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://trypriceshield.com/blog?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://trypriceshield.com/#software",
      name: "PriceShield",
      description:
        "AI-powered supplier price monitoring and invoice auditing platform for hospitality operators.",
      url: "https://trypriceshield.com",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      offers: [
        {
          "@type": "Offer",
          name: "Free Audit",
          price: "0",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "Pro Shield",
          price: "49",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "Multi-Location",
          price: "149",
          priceCurrency: "USD",
        },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "127",
      },
      featureList: [
        "AI invoice extraction",
        "Stealth supplier price hike detection",
        "Real-time Telegram, Slack, WhatsApp, email alerts",
        "AI CFO chat for pricing questions",
        "Multi-location procurement cost tracking",
        "Auto-forwarding from supplier emails",
        "Semantic SKU matching across renames",
      ],
      publisher: { "@id": "https://trypriceshield.com/#organization" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preconnect"
          href="https://kgzkienmztbbwyvywxit.supabase.co"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://kgzkienmztbbwyvywxit.supabase.co" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col w-full max-w-full overflow-x-hidden">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <Suspense fallback={null}>
                <AnalyticsProvider>
                  <ABTestProvider>
                    <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">{children}</main>
                  </ABTestProvider>
                </AnalyticsProvider>
              </Suspense>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Script
          src="https://chatty.personaliai.com/widget.js"
          data-id="2bbeb341-6d57-4c4b-af48-8b5db84a7244"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
