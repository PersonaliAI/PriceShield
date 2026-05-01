import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Define the main domain and the developer subdomain
  const mainDomain = 'trypriceshield.com'
  const devSubdomain = 'developer.trypriceshield.com'

  // 1. Handle Developer Subdomain
  if (hostname === devSubdomain || hostname.includes('developer.')) {
    // If they are at the root of developer.trypriceshield.com, 
    // silently rewrite to the /developers page
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/developers', request.url))
    }

    // If they try to access /developers on the subdomain, 
    // redirect to the root of the subdomain to keep URLs clean
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
