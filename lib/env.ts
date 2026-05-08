function normalizeUrl(value: string): string {
    const trimmed = value.trim().replace(/\/+$/, '')
    if (!trimmed) return trimmed
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    return `https://${trimmed}`
}

function isPlaceholderUrl(value: string | undefined): boolean {
    if (!value) return true
    const normalized = value.toLowerCase()
    return normalized.includes('your_') || normalized.includes('<backend-host>') || normalized.includes('<backend')
}

export function getBackendBaseUrl(): string {
    const raw = [
        process.env.API_URL,
        process.env.NEXT_PUBLIC_API_BASE_URL,
        process.env.NEXT_PUBLIC_API_URL,
    ].find(value => !isPlaceholderUrl(value))

    if (!raw && process.env.NODE_ENV === 'production') {
        throw new Error('Backend API URL is missing. Set API_URL or NEXT_PUBLIC_API_BASE_URL.')
    }

    return normalizeUrl(raw ?? 'http://localhost:8000')
}

export function getAppBaseUrl(): string {
    const raw = [
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ].find(value => !isPlaceholderUrl(value))

    return normalizeUrl(raw ?? 'http://localhost:3000')
}
