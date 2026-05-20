import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitor Watchlists — PriceShield Shopper",
  description:
    "Monitor competitor product prices across stores. Daily move tracking with own-price comparison for brands and sellers.",
  robots: { index: false },
};

export default function CompetitorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
