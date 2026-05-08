import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { getAppBaseUrl, getBackendBaseUrl } from '@/lib/env'

const ACCESS_COOKIE = 'arkashri_token'
const REFRESH_COOKIE = 'arkashri_refresh_token'

export async function POST(request: Request) {
    if (!isAllowedBrowserOrigin(request)) {
        return NextResponse.json(
            { error: 'Cross-origin logout rejected.' },
            { status: 403, headers: { 'Cache-Control': 'no-store' } },
        )
    }

    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_COOKIE)?.value
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value

    if (accessToken || refreshToken) {
        try {
            const baseUrl = getBackendBaseUrl()
            const targetUrl = baseUrl.endsWith('/api/v1')
                ? `${baseUrl}/token/logout`
                : `${baseUrl}/api/v1/token/logout`

            await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ refresh_token: refreshToken ?? null }),
                cache: 'no-store',
            })
        } catch {
            // Cookie clearing must succeed even if backend revocation is unavailable.
        }
    }

    cookieStore.delete(ACCESS_COOKIE)
    cookieStore.delete(REFRESH_COOKIE)
    return NextResponse.json({ message: 'Logged out successfully' }, { headers: { 'Cache-Control': 'no-store' } })
}

function isAllowedBrowserOrigin(request: Request): boolean {
    const requestOrigin = new URL(request.url).origin
    const allowedOrigins = new Set([requestOrigin, getAppBaseUrl()])
    const origin = request.headers.get('origin')
    if (origin) return allowedOrigins.has(normalizeOrigin(origin))

    const referer = request.headers.get('referer')
    if (referer) return allowedOrigins.has(normalizeOrigin(referer))

    return false
}

function normalizeOrigin(value: string): string {
    try {
        return new URL(value).origin
    } catch {
        return value.replace(/\/+$/, '')
    }
}
