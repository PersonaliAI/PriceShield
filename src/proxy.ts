import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const url = request.nextUrl
  const host = request.headers.get('host') || ''
  
  // Detect developer subdomain
  const isDevSubdomain = host.toLowerCase().includes('developer')

  if (isDevSubdomain) {
    // 1. Root path -> Developer Portal (Docs)
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/developers', request.url))
    }

    // 2. Dashboard path -> Standalone Developer Dashboard
    // Matches /dashboard and any sub-paths of /dashboard
    if (url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/')) {
      // Reconstruct the internal path: /dashboard -> /developers/dashboard
      const internalPath = url.pathname.replace('/dashboard', '/developers/dashboard')
      return NextResponse.rewrite(new URL(internalPath, request.url))
    }

    // 3. Clean up: Redirect /developers to root if visited directly on subdomain
    if (url.pathname === '/developers') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (url.pathname.startsWith('/developers/dashboard')) {
      const externalPath = url.pathname.replace('/developers/dashboard', '/dashboard')
      return NextResponse.redirect(new URL(externalPath, request.url))
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
