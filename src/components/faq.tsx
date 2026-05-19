"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    q: "How does PriceShield detect a price hike?",
    a: "Every line item on every invoice gets compared against the most recent baseline from the same vendor. We use semantic SKU matching so renames like 'Prime Beef Tenderloin' → 'USDA Beef Tenderloin' still match. If variance exceeds your threshold (default 2%), it's flagged with the exact margin impact.",
  },
  {
    q: "What does 'forward invoices' actually mean?",
    a: "You get a unique forwarding address like <your-id>@priceshield.email. Set up a one-time Gmail/Outlook rule that forwards your supplier emails there. From then on, every supplier invoice with a PDF attachment audits itself within seconds.",
  },
  {
    q: "How accurate is the AI extraction?",
    a: "Our extraction model returns a confidence score per line item. In production we see 97%+ accuracy on standard supplier invoice formats (US Foods, Sysco, Cheney Bros, Performance Food Group, GFS, regional distributors). Low-confidence items get flagged for one-click review in the dashboard. Photographed paper invoices average ~93% — typed PDFs near 100%.",
  },
  {
    q: "Do you work with suppliers outside North America?",
    a: "Yes. The extraction model handles any major language and currency. We have operators on PriceShield in the US, Canada, UK, Sri Lanka, UAE, and Australia.",
  },
  {
    q: "What if my supplier emails me a portal link, not a PDF?",
    a: "Most supplier portals can be configured to attach a PDF copy of the invoice to the notification email. Check your portal settings. We're also working on a portal-scraping integration for the top 5 US distributors.",
  },
  {
    q: "Is my data shared with anyone?",
    a: "No. Your invoice data lives in a Postgres database isolated by row-level security — only your account can read your rows. The Vertex AI calls run in your isolated project space; Google doesn't retain inputs. We've never sold data, and never will.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-20 border-t border-border">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-muted-foreground mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Questions, answered.
          </h2>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-medium group-hover:text-foreground/80 transition-colors">
                    {item.q}
                  </span>
                  <Plus
                    className={cn(
                      "size-4 text-muted-foreground transition-transform shrink-0",
                      isOpen && "rotate-45",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
