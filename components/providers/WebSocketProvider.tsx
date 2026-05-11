'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { apiFetch } from '@/lib/api'

interface WebSocketContextType {
    isConnected: boolean
    lastEvent: any | null
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

const BACKOFF_BASE_MS = 1000
const BACKOFF_MAX_MS = 30000

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false)
    const [lastEvent, setLastEvent] = useState<any | null>(null)
    const socketRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const connectWsRef = useRef<((auth: boolean) => void) | null>(null)
    const attemptRef = useRef(0)
    const mountedRef = useRef(true)
    const ticketFailureWarnedRef = useRef(false)

    const user = useAuthStore((s) => s.user)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const backendLinked = useAuthStore((s) => s.backendLinked)

    const getBackoffMs = (attempt: number) =>
        Math.min(BACKOFF_BASE_MS * Math.pow(2, attempt), BACKOFF_MAX_MS)

    const scheduleReconnect = useCallback((auth: boolean) => {
        if (!auth || !mountedRef.current) return
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
        const delay = getBackoffMs(attemptRef.current)
        console.log(`WebSocket: reconnecting in ${delay}ms (attempt ${attemptRef.current + 1})`)
        reconnectTimeoutRef.current = setTimeout(() => {
            attemptRef.current += 1
            connectWsRef.current?.(auth)
        }, delay)
    }, [])

    const connectWs = useCallback(async (auth: boolean) => {
        if (!auth || !mountedRef.current) return
        if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) return

        const currentUser = useAuthStore.getState().user
        if (!currentUser) return

        const tenantId = currentUser.tenantId ?? process.env.NEXT_PUBLIC_API_TENANT ?? 'default_tenant'
        const jurisdiction = 'IN'
        const wsBase = (process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8001').replace(/\/+$/, '').replace(/\/ws$/, '')

        let ticket = ''
        try {
            const ticketRes = await apiFetch<{ ticket: string }>(`/api/v1/token/ws-ticket?jurisdiction=${jurisdiction}`, {
                method: 'POST'
            })
            ticket = ticketRes.ticket
        } catch (err) {
            if (!ticketFailureWarnedRef.current) {
                console.warn('WebSocket ticket unavailable; continuing without realtime updates.', err)
                ticketFailureWarnedRef.current = true
            }
            scheduleReconnect(auth)
            return
        }

        const wsUrl = `${wsBase}/ws/audit/${tenantId}/${jurisdiction}?ticket=${encodeURIComponent(ticket)}`

        console.log(`Connecting to WebSocket: ${wsUrl}`)

        try {
            const socket = new WebSocket(wsUrl)
            socketRef.current = socket

            socket.onopen = () => {
                if (!mountedRef.current) { socket.close(); return }
                console.log('WebSocket Connected')
                setIsConnected(true)
                attemptRef.current = 0
            }

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    setLastEvent(data)
                } catch (err) {
                    console.warn('Failed to parse WS message:', err)
                }
            }

            socket.onclose = (event) => {
                console.log('WebSocket Disconnected', event.code, event.reason)
                setIsConnected(false)
                socketRef.current = null
                // Reconnect on abnormal close, not intentional close (1000)
                if (event.code !== 1000) scheduleReconnect(auth)
            }

            socket.onerror = () => {
                console.warn('WebSocket error — closing, will reconnect with backoff')
                socket.close()
            }
        } catch (error) {
            console.warn('Failed to create WebSocket:', error)
            scheduleReconnect(auth)
        }
    }, [scheduleReconnect])

    useEffect(() => {
        connectWsRef.current = connectWs
    }, [connectWs])

    useEffect(() => {
        mountedRef.current = true
        if (isAuthenticated && user && backendLinked) {
            const t = setTimeout(() => connectWs(true), 1000)
            return () => clearTimeout(t)
        } else {
            socketRef.current?.close()
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
        }
        return () => {
            mountedRef.current = false
            socketRef.current?.close()
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
        }
    }, [isAuthenticated, user, backendLinked, connectWs])

    return (
        <WebSocketContext.Provider value={{ isConnected, lastEvent }}>
            {children}
        </WebSocketContext.Provider>
    )
}

export function useWebSocket() {
    const context = useContext(WebSocketContext)
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider')
    }
    return context
}
