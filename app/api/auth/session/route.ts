import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { getBackendBaseUrl } from '@/lib/env'

const ACCESS_COOKIE = 'arkashri_token'
const REFRESH_COOKIE = 'arkashri_refresh_token'

export async function GET() {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_COOKIE)?.value

    if (!accessToken) {
        return NextResponse.json({ error: 'No active session.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }

    try {
        const baseUrl = getBackendBaseUrl()
        const targetUrl = baseUrl.endsWith('/api/v1')
            ? `${baseUrl}/token/verify`
            : `${baseUrl}/api/v1/token/verify`

        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: accessToken }),
            cache: 'no-store',
        })

        if (!res.ok) {
            cookieStore.delete(ACCESS_COOKIE)
            cookieStore.delete(REFRESH_COOKIE)
            return NextResponse.json({ error: 'Session is invalid or expired.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
        }

        const data = await res.json()
        return NextResponse.json({ user: data.user }, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
        return NextResponse.json({ error: 'Unable to verify session.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }
}
