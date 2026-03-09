import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/sign-in', '/register']

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow public auth routes
    if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
        return NextResponse.next()
    }

    // All other routes: let the client-side AuthGuard handle protection
    // (Zustand persists to localStorage, not cookies, so we can't check here)
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
