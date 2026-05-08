import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { getBackendBaseUrl } from '@/lib/env'

const ACCESS_COOKIE = 'arkashri_token'
const REFRESH_COOKIE = 'arkashri_refresh_token'

function authCookieOptions(maxAge: number) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge,
    }
}

export async function POST(request: Request) {
    try {
        const baseUrl = getBackendBaseUrl()
        const body = await request.json()
        const { fullName, email, password, organisation, role } = body

        const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName,
                email,
                password,
                organisation: organisation ?? '',
                role: role ?? 'OPERATOR',
            }),
        })

        if (!res.ok) {
            const error = await res.text()
            return NextResponse.json({ error }, { status: res.status })
        }

        const data = await res.json()
        const { access_token, refresh_token, expires_in, user } = data

        if (!access_token || !refresh_token || !user) {
            return NextResponse.json({ error: 'Backend registration response is incomplete.' }, { status: 502 })
        }

        // Keep tokens out of browser JavaScript; expose only non-secret session metadata.
        const cookieStore = await cookies()
        cookieStore.set(ACCESS_COOKIE, access_token, authCookieOptions(Math.max(Number(expires_in) || 0, 60)))
        cookieStore.set(REFRESH_COOKIE, refresh_token, authCookieOptions(60 * 60 * 24 * 7))

        return NextResponse.json({ expires_in, user }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
        console.error('Register proxy error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
