import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="space-y-6 max-w-md">
        <h1 className="text-9xl font-black text-emerald-500/10 select-none">404</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Lost in the margin?</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link 
            href="/" 
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/20"
            )}
          >
            <Home className="mr-2 h-4 w-4" /> Back to Home
          </Link>
          <Link 
            href="/blog" 
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-emerald-400 font-bold hover:bg-emerald-500/10"
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Visit Blog
          </Link>
        </div>
      </div>
    </div>
  )
}
