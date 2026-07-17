import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    name: "Marcus Rossi",
    role: "Owner, Rossi's Italian",
    content: "PriceShield caught a 14% increase on our flour baseline that we completely missed. Saved us $600 in the first month alone.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus"
  },
  {
    name: "Sarah Chen",
    role: "Operations Director, GreenLeaf Group",
    content: "Auditing 5 locations manually was impossible. Now I get a Telegram alert if any chef is being overcharged. Essential tech.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
  },
  {
    name: "David Miller",
    role: "Head Chef, The Grill House",
    content: "The AI CFO chat is brilliant. I asked if my produce prices were competitive and it showed me 6 months of data in seconds.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
  }
];

export function Testimonials() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {testimonials.map((t, i) => (
        <Card key={i} className="bg-card/30 border-border/40 hover:border-emerald-500/20 transition-colors">
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-emerald-500 text-emerald-500" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.content}"</p>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 overflow-hidden relative">
                <Image src={t.avatar} alt={t.name} fill className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
