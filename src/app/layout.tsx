import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trypriceshield.com"),
  title: {
    default: "PriceShield — Supplier Price Increase Detection & Monitoring",
    template: "%s | PriceShield"
  },
  description:
    "Protect your margins with PriceShield. Automatically detect supplier price increases, stealth hikes, and price creep via AI-powered PDF extraction.",
  keywords: [
    "supplier price increase detect", 
    "price creep monitoring", 
    "restaurant margin protection", 
    "invoice auditing AI",
    "food cost control",
    "supply chain overhead reduction"
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://trypriceshield.com",
    siteName: "PriceShield",
    title: "PriceShield — Stop Supplier Price Creep Automatically",
    description: "The AI-powered margin guardian for restaurants. Detect stealth supplier price hikes in seconds.",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "PriceShield Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PriceShield — Stop Supplier Price Creep",
    description: "AI-powered invoice auditing and margin protection for restaurants.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://trypriceshield.com/#organization",
      "name": "PriceShield",
      "url": "https://trypriceshield.com",
      "logo": "https://trypriceshield.com/logo.png",
      "sameAs": [
        "https://linkedin.com/company/priceshield"
      ]
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://trypriceshield.com/#software",
      "name": "PriceShield AI",
      "url": "https://trypriceshield.com",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "49.00",
        "priceCurrency": "USD"
      }
    }
  ]
};

import { Suspense } from "react";
import AnalyticsProvider from "@/components/AnalyticsProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Suspense fallback={null}>
            <AnalyticsProvider>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
              />
              {children}
            </AnalyticsProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
