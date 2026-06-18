import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

const links = {
  Product: [
    { label: "How it works", href: "/#products" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Solutions: [
    { label: "Supplier Price Track", href: "/solutions/supplier-price-tracking" },
    { label: "Invoice Audit", href: "/solutions/invoice-audit" },
    { label: "Price Hike Detect", href: "/solutions/supplier-price-increase-detection" },
    { label: "Margin Leakage Calculator", href: "/tools/margin-leakage-calculator" },
    { label: "Food Cost Calculator", href: "/tools/food-cost-calculator" },
    { label: "Invoice to CSV Converter", href: "/tools/invoice-to-csv" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Setup guide", href: "/blog/ultimate-guide-to-priceshield" },
    { label: "Auto-forwarding", href: "/blog/mastering-auto-forwarding" },
    { label: "Support", href: "/support" },
  ],
  Company: [
    { label: "About", href: "/#products" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={36} height={36} className="size-8 shrink-0" />
              <span className="font-semibold tracking-tight text-lg">PriceShield</span>
            </Link>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed max-w-[220px]">
              The margin guardian for hospitality businesses. Detect stealth supplier
              price creep automatically.
            </p>
          </div>
          {Object.entries(links).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                {cat}
              </p>
              <ul className="space-y-2">
                {items.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PriceShield. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://twitter.com/trypriceshield"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Twitter
            </Link>
            <Link
              href="https://github.com/Damayantha/PriceShield"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
