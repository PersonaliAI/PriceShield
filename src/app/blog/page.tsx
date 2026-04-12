import Image from "next/image";
import { useState } from "react";
import { api } from "@/lib/api";

export default function BlogIndexPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) return;
    setIsSubmitting(true);
    try {
      // Mock for now, but wired up
      console.log("Subscribing email:", email);
      await new Promise(r => setTimeout(r, 1000));
      setIsSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("Subscription failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Simplified */}
      <nav className="border-b border-border/40 bg-card/30 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="PriceShield Logo" width={40} height={40} className="h-10 w-auto" />
            <span className="text-xl font-bold tracking-tight">PriceShield</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:text-emerald-400 transition-colors">Dashboard</Link>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold rounded-xl">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
            The Shield Blog
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Intelligence for <span className="text-emerald-400">Modern Restaurants</span></h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deep dives into margin protection, supply chain transparency, and AI-driven operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="group bg-card/50 border-border/50 hover:border-emerald-500/20 transition-all duration-500 overflow-hidden cursor-pointer h-full">
                <div className="aspect-[16/9] w-full bg-muted/30 relative overflow-hidden">
                  {/* Decorative background for missing images */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="h-12 w-12 text-emerald-500/20 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
                <CardHeader className="p-6">
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full uppercase tracking-tighter">{post.category}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {post.readTime}</span>
                  </div>
                  <CardTitle className="text-2xl font-bold group-hover:text-emerald-400 transition-colors leading-tight mb-3">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-base line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                     <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                       <User className="h-4 w-4 text-emerald-400" />
                     </div>
                     <span className="font-medium">{post.author}</span>
                  </div>
                  <div className="flex items-center text-emerald-400 font-bold text-sm">
                    Read Post <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Newsletter / CTA */}
        <div className="mt-32 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 p-12 text-center relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 h-64 w-64 bg-emerald-500/10 blur-[100px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Never miss a price hike again</h2>
            <p className="text-muted-foreground">Join 500+ restaurants getting weekly insights on supplier pricing trends and margin recovery strategies.</p>
            
            {isSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl animate-in zoom-in-95">
                <p className="font-bold flex items-center justify-center gap-2">
                   <Shield className="h-5 w-5" /> You&apos;re protected! Welcome to the Shield.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-8">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  className="flex-1 rounded-xl border border-border/50 bg-background/50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                />
                <Button 
                  onClick={handleSubscribe}
                  disabled={isSubmitting || !email}
                  className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {isSubmitting ? "Joining..." : "Join the Shield"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer - Basic */}
      <footer className="border-t border-border/40 py-12 bg-card/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={24} height={24} className="h-6 w-auto opacity-50" />
            <span className="text-sm font-medium text-muted-foreground">© 2026 PriceShield AI. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground font-medium">
             <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
             <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
             <Link href="/blog" className="text-emerald-400 hover:emerald-200 transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
