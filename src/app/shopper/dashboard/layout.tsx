import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopper Dashboard — PriceShield",
  description:
    "Your wishlist, active drop alerts, and history of caught price drops from PriceShield Shopper.",
  robots: { index: false },
};

export default function ShopperDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
