import type { LucideIcon } from 'lucide-react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'slate'

const toneClasses: Record<Tone, string> = {
    blue: 'border-blue-100 bg-blue-50 text-blue-800',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-100 bg-amber-50 text-amber-800',
    red: 'border-red-100 bg-red-50 text-red-800',
    slate: 'border-slate-100 bg-slate-50 text-slate-700',
}

export function PageHeader({
    icon: Icon,
    title,
    description,
    meta,
    actions,
}: {
    icon?: LucideIcon
    title: string
    description?: string
    meta?: React.ReactNode
    actions?: React.ReactNode
}) {
    return (
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-[#002776]">
                            <Icon className="h-4.5 w-4.5" />
                        </span>
                    )}
                    <h1 className="text-2xl font-black tracking-tight text-[#002776]">{title}</h1>
                </div>
                {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}
                {meta && <div className="mt-3 flex flex-wrap gap-2">{meta}</div>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    )
}

export function StatusPill({ children, tone = 'slate' }: { children: React.ReactNode; tone?: Tone }) {
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase', toneClasses[tone])}>
            {children}
        </span>
    )
}

export function MetricCard({
    label,
    value,
    detail,
    icon: Icon,
    tone = 'blue',
}: {
    label: string
    value: string | number
    detail?: string
    icon?: LucideIcon
    tone?: Tone
}) {
    return (
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-2xl font-black tracking-tight text-slate-950">{value}</div>
                    <div className="mt-1 text-[10px] font-black uppercase text-slate-500">{label}</div>
                    {detail && <div className="mt-1 text-xs text-slate-400">{detail}</div>}
                </div>
                {Icon && (
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg border', toneClasses[tone])}>
                        <Icon className="h-4 w-4" />
                    </span>
                )}
            </div>
        </div>
    )
}

export function SectionCard({
    title,
    description,
    icon: Icon,
    action,
    children,
    className,
}: {
    title?: string
    description?: string
    icon?: LucideIcon
    action?: React.ReactNode
    children: React.ReactNode
    className?: string
}) {
    return (
        <section className={cn('rounded-lg border border-slate-100 bg-white shadow-sm', className)}>
            {(title || description || action) && (
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                    <div className="min-w-0">
                        {title && (
                            <div className="flex items-center gap-2">
                                {Icon && <Icon className="h-4 w-4 text-[#002776]" />}
                                <h2 className="text-sm font-black text-slate-950">{title}</h2>
                            </div>
                        )}
                        {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    )
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon?: LucideIcon
    title: string
    description?: string
    action?: React.ReactNode
}) {
    return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center">
            {Icon && (
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-[#002776]">
                    <Icon className="h-6 w-6" />
                </span>
            )}
            <h3 className="text-base font-black text-slate-950">{title}</h3>
            {description && <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    )
}

export function LoadingPanel({ label = 'Loading workspace data' }: { label?: string }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#002776]" />
            {label}
        </div>
    )
}

export function AlertBanner({ tone = 'amber', children }: { tone?: Tone; children: React.ReactNode }) {
    const Icon = tone === 'green' ? CheckCircle2 : AlertCircle
    return (
        <div className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium', toneClasses[tone])}>
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>{children}</div>
        </div>
    )
}
