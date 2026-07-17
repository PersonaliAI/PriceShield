import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-24 md:py-32 border-t border-border">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Ready to stop losing margin?
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Audit your next 5 invoices free. See what you've been overpaying — no
          credit card required.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            size="lg"
            className="h-11 px-6 text-sm cursor-pointer"
            render={<Link href="/login" />}
          >
            Start free audit
            <ArrowRight className="size-3.5 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 px-6 text-sm cursor-pointer"
            render={<Link href="/blog" />}
          >
            Read the playbook
          </Button>
        </div>
      </div>
    </section>
  );
}
