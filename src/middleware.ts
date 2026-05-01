import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const host = request.headers.get('host') || ''
  
  // Detect developer subdomain in host or x-forwarded-host
  const isDevSubdomain = host.toLowerCase().includes('developer')

  if (isDevSubdomain) {
    // If at the root of developer.trypriceshield.com, serve the portal
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/developers', request.url))
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
