import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { getBackendBaseUrl } from '@/lib/env'

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
        const { access_token } = data

        // Set HttpOnly cookie — same flow as login
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
        console.error('Register proxy error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
