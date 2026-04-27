import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { getBackendBaseUrl } from '@/lib/env'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        // Gracefully handle if the backend URL includes /api/v1 or trailing slashes.
        const baseUrl = getBackendBaseUrl()
        const targetUrl = baseUrl.endsWith('/api/v1') 
            ? `${baseUrl}/token/` 
            : `${baseUrl}/api/v1/token/`

        console.log(`[AUTH] login attempt to: ${targetUrl}`)

        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
            console.error(`[AUTH] error from backend status: ${res.status}`)
            const error = await res.text()
            return NextResponse.json({ error }, { status: res.status })
        }

        const data = await res.json()
        const { access_token } = data

        // Set HttpOnly cookie
        const cookieStore = await cookies()
        cookieStore.set('arkashri_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',  // 'strict' breaks OAuth redirects and external navigations
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
        })


        return NextResponse.json(data)
    } catch (error) {
        console.error('Auth proxy error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
