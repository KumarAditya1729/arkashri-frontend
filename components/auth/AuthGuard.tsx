'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'

const PUBLIC_ROUTES = ['/sign-in', '/register']

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const backendLinked = useAuthStore((s) => s.backendLinked)
    const verifyBackendSession = useAuthStore((s) => s.verifyBackendSession)
    const router = useRouter()
    const pathname = usePathname()
    const isMounted = useClientMounted()
    const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
    const needsVerification = isMounted && !isPublicRoute && (!isAuthenticated || backendLinked)
    const [verifiedPath, setVerifiedPath] = useState<string | null>(null)
    const isVerifying = needsVerification && verifiedPath !== pathname

    useEffect(() => {
        if (!isMounted || isPublicRoute) {
            return
        }

        let cancelled = false
        const verify = async () => {
            const ok = backendLinked ? await verifyBackendSession() : false
            if (cancelled) return
            setVerifiedPath(pathname)
            if (!ok) {
                router.replace(`/sign-in?from=${encodeURIComponent(pathname)}`)
            }
        }

        if (!isAuthenticated || backendLinked) {
            verify()
        } else {
            Promise.resolve().then(() => {
                if (cancelled) return
                setVerifiedPath(pathname)
                router.replace(`/sign-in?from=${encodeURIComponent(pathname)}`)
            })
        }

        return () => { cancelled = true }
    }, [isMounted, isPublicRoute, isAuthenticated, backendLinked, pathname, router, verifyBackendSession])

    // Prevent hydration mismatch: wait for client mount
    if (!isMounted || isVerifying) {
        // If it's a public route, it's safe to server-render
        if (isPublicRoute) {
            return <>{children}</>
        }
        // Protected routes return nothing during SSR to avoid flashing unauthorized content
        return null
    }

    if (!isAuthenticated && !isPublicRoute) {
        return null
    }

    return <>{children}</>
}

function useClientMounted(): boolean {
    return useSyncExternalStore(
        () => () => undefined,
        () => true,
        () => false,
    )
}
