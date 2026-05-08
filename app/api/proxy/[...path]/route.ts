import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { getAppBaseUrl, getBackendBaseUrl } from '@/lib/env'

const FORWARDED_REQUEST_HEADERS = [
    'accept',
    'content-type',
    'x-arkashri-tenant',
    'x-correlation-id',
    'x-request-id',
] as const

const STRIPPED_RESPONSE_HEADERS = [
    'connection',
    'content-encoding',
    'content-length',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
] as const

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

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
    if (MUTATING_METHODS.has(request.method) && !isAllowedBrowserOrigin(request)) {
        return NextResponse.json(
            { error: 'Cross-origin backend mutation rejected.' },
            { status: 403, headers: { 'Cache-Control': 'no-store' } },
        )
    }

    const searchParams = new URL(request.url).search
    
    // Normalize backend URL and handle if it already includes /api/v1
    const baseUrl = getBackendBaseUrl()
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

    if (request.method === 'GET') {
        const url = new URL(targetUrl)
        url.searchParams.set('_arkashri_proxy_bust', Date.now().toString())
        targetUrl = url.toString()
    }

    console.log(`[PROXY] forwarding to: ${targetUrl}`)

    const cookieStore = await cookies()
    const token = cookieStore.get('arkashri_token')?.value

    const headers = new Headers()
    for (const headerName of FORWARDED_REQUEST_HEADERS) {
        const value = request.headers.get(headerName)
        if (value) headers.set(headerName, value)
    }
    // Railway/undici can terminate proxied compressed streams while reading the
    // full response body. Ask the backend for identity encoding so the proxy can
    // safely forward the body without content-encoding mismatches.
    headers.set('accept-encoding', 'identity')
    headers.set('cache-control', 'no-cache')
    headers.set('pragma', 'no-cache')
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

        const responseHeaders = new Headers(res.headers)
        // Never forward hop-by-hop or body-size headers through the proxy;
        // mismatches here can break Railway/Next response forwarding.
        for (const headerName of STRIPPED_RESPONSE_HEADERS) {
            responseHeaders.delete(headerName)
        }

        // Always forward the actual backend status (including 4xx/5xx)
        // so the frontend sees the real error detail, not a wrapped 500
        if (!res.ok) {
            console.error(`[PROXY] backend error ${res.status} for ${targetUrl}`)
        }

        return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: responseHeaders,
        })
    } catch (error: unknown) {
        console.error(`Proxy error for ${targetUrl}:`, error)
        return NextResponse.json({
            error: 'Proxy failed to reach backend',
            proxy_target: targetUrl,
            error_message: error instanceof Error ? error.message : String(error)
        }, { status: 502 })
    }
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
