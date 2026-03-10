'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    section?: string
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(`[ErrorBoundary:${this.props.section ?? 'unknown'}]`, error, info)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback
            return (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-red-200 bg-red-50 text-red-800 gap-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="font-semibold text-sm">
                        {this.props.section ? `${this.props.section} failed to load` : 'Something went wrong'}
                    </p>
                    <p className="text-xs text-red-600 max-w-xs text-center">
                        {this.state.error?.message ?? 'An unexpected error occurred. Please refresh the page.'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: undefined })}
                        className="mt-1 px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                    >
                        Try again
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}

/** Convenience wrapper — inline hook-friendly usage */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    section: string,
) {
    return function WithBoundary(props: P) {
        return (
            <ErrorBoundary section={section}>
                <Component {...props} />
            </ErrorBoundary>
        )
    }
}
