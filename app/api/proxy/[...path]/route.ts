import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.API_URL ?? 'http://localhost:8000'

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params
    return handleProxy(request, path.join('/'))
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params
    return handleProxy(request, path.join('/'))
}

export async function PUT(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params
    return handleProxy(request, path.join('/'))
}

export async function PATCH(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params
    return handleProxy(request, path.join('/'))
}

export async function DELETE(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params
    return handleProxy(request, path.join('/'))
}

async function handleProxy(request: Request, path: string) {
    const searchParams = new URL(request.url).search
    
    // Normalize backend URL and handle if it already includes /api/v1
    let baseUrl = BACKEND_URL.replace(/\/+$/, '')
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `https://${baseUrl}`
    }
    let targetUrl: string
    
    if (baseUrl.endsWith('/api/v1')) {
        // If baseUrl already has /api/v1, we need to strip 'api/v1/' from path if it has it
        const cleanPath = path.startsWith('api/v1/') ? path.slice(7) : path
        // Ensure we don't end up with double slashes if cleanPath starts with /
        targetUrl = `${baseUrl}/${cleanPath.replace(/^\/+/, '')}${searchParams}`
    } else {
        const apiPath = path.startsWith('api/') ? path : `api/${path}`
        targetUrl = `${baseUrl}/${apiPath}${searchParams}`
    }

    console.log(`[PROXY] forwarding to: ${targetUrl}`)

    const cookieStore = await cookies()
    const token = cookieStore.get('arkashri_token')?.value

    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.delete('connection')
    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    try {
        const body = request.method !== 'GET' ? await request.arrayBuffer() : undefined

        const res = await fetch(targetUrl, {
            method: request.method,
            headers,
            body,
            // Skip cache in dev/production to ensure fresh audit data
            cache: 'no-store',
        })

        const resBody = await res.arrayBuffer()
        const responseHeaders = new Headers(res.headers)
        // Remove headers that might cause issues when proxied
        responseHeaders.delete('content-encoding')
        responseHeaders.delete('transfer-encoding')

        // Always forward the actual backend status (including 4xx/5xx)
        // so the frontend sees the real error detail, not a wrapped 500
        if (!res.ok) {
            const text = Buffer.from(resBody).toString('utf-8')
            console.error(`[PROXY] backend error ${res.status} for ${targetUrl}: ${text.slice(0, 500)}`)
        }

        return new Response(resBody, {
            status: res.status,
            statusText: res.statusText,
            headers: responseHeaders,
        })
    } catch (error: any) {
        console.error(`Proxy error for ${targetUrl}:`, error)
        return NextResponse.json({
            error: 'Proxy failed to reach backend',
            proxy_target: targetUrl,
            error_message: error?.message || String(error)
        }, { status: 502 })
    }
}

