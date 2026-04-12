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
  title: "PriceShield — Supplier Price Increase Detect & Creep Monitoring",
  description:
    "Protect your margins with PriceShield. Automatically detect supplier price increase, stealth hikes, and price creep via AI-powered PDF extraction.",
  keywords: ["supplier price increase detect", "price creep monitoring", "restaurant margin protection", "invoice auditing AI"],
  icons: {
    icon: "/logo.png",
  },
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
              {children}
            </AnalyticsProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
