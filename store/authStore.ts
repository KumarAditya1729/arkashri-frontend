'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signIn as apiSignIn, clearAuth, verifySession } from '@/lib/api'

export type UserRole = 'admin' | 'operator' | 'reviewer' | 'auditor' | 'read_only'

export interface AuthUser {
    id: string
    tenantId: string
    fullName: string
    email: string
    role: UserRole
    organisation: string
    avatarInitials: string
}

interface AuthState {
    user: AuthUser | null
    isAuthenticated: boolean
    backendLinked: boolean   // true when a real API token was issued
    login: (user: AuthUser) => void
    loginWithBackend: (email: string, password: string) => Promise<void>
    verifyBackendSession: () => Promise<boolean>
    logout: () => void
}

function mapBackendUser(res: Awaited<ReturnType<typeof verifySession>>): AuthUser {
    return {
        id: res.user.email,
        tenantId: res.user.tenant_id,
        fullName: res.user.full_name,
        email: res.user.email,
        role: res.user.role as UserRole,
        organisation: 'Arkashri Systems',
        avatarInitials: res.user.initials,
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            backendLinked: false,
            login: (user) => set({ user, isAuthenticated: true, backendLinked: false }),
            loginWithBackend: async (email, password) => {
                const res = await apiSignIn(email, password)
                set({
                    isAuthenticated: true,
                    backendLinked: true,
                    user: mapBackendUser(res),
                })
            },
            verifyBackendSession: async () => {
                try {
                    const res = await verifySession()
                    set({ isAuthenticated: true, backendLinked: true, user: mapBackendUser(res) })
                    return true
                } catch {
                    set({ user: null, isAuthenticated: false, backendLinked: false })
                    return false
                }
            },
            logout: () => {
                clearAuth()
                set({ user: null, isAuthenticated: false, backendLinked: false })
            },
        }),
        { name: 'arkashri-auth' }
    )
)
