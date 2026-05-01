import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * PriceShield Subdomain Proxy (Next.js 16+ Convention)
 * Handles routing for developer.trypriceshield.com
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl
  
  // Try to get hostname from multiple sources for maximum compatibility
  const host = url.hostname || request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
  
  console.log(`[Proxy] Incoming request for: ${host}${url.pathname}`)

  // Detect if we are on the developer subdomain
  const isDevSubdomain = host.toLowerCase().startsWith('developer')

  if (isDevSubdomain) {
    // 1. Root path -> serve the Developer Portal (/developers)
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/developers', request.url))
    }

    // 2. Dashboard path -> serve the standalone Developer Dashboard (/developers/dashboard)
    if (url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/')) {
      const internalPath = url.pathname.replace('/dashboard', '/developers/dashboard')
      return NextResponse.rewrite(new URL(internalPath, request.url))
    }

    // 3. Clean up: Redirect internal paths to root if accessed directly on subdomain
    if (url.pathname === '/developers') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
}
