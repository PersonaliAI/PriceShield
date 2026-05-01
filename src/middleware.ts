import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  
  // Try to get hostname from multiple headers (important for Proxies/Firebase)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
  
  console.log(`[Middleware] Host: ${host}, Path: ${url.pathname}`)

  // Detect developer subdomain
  const isDevSubdomain = host.startsWith('developer.')

  if (isDevSubdomain) {
    // If at root of developer subdomain, serve the /developers page
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/developers', request.url))
    }

    // Optional: Redirect /developers to / if on the developer subdomain for cleaner URLs
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
