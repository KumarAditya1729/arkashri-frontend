'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import { AutomationScoreWidget } from '@/components/audit/AutomationScoreWidget'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Activity, Users, FileWarning, TrendingUp, Loader2, CalendarClock, ClipboardCheck, FileText, FolderOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAutomationScore, AutomationScoreResponse, getEngagements, ApiError } from '@/lib/api'
import { AUDIT_TYPE_DEFINITIONS, getSlaStatus, normalizeAuditTypeTitle, SLA_STATUS_STYLES, type AuditSlaStatus } from '@/lib/audit-types'

type DashboardEngagement = {
    id: string
    type: string
    client: string
    status: string
    risk: string
    createdAt: string | null
}

// Dynamically fetched
const statusColors: Record<string, string> = {
    'In Progress': 'bg-blue-100 text-blue-800',
    'Planning': 'bg-amber-100 text-amber-800',
    'Review': 'bg-purple-100 text-purple-800',
    'Completed': 'bg-green-100 text-green-700',
    'Not Started': 'bg-gray-100 text-gray-600',
}

const riskDot: Record<string, string> = {
    Critical: 'bg-red-500',
    High: 'bg-orange-400',
    Medium: 'bg-yellow-400',
    Low: 'bg-green-400',
}

const auditIcons: Record<string, string> = {
    'Forensic Audit': '🔍',
    'Financial Audit': '💰',
    'ESG Audit': '🌿',
    'Internal Audit': '🏛️',
    'External Audit': '🔬',
    'Statutory Audit': '📜',
    'Tax Audit': '🧾',
    'GST Audit / GST Reconciliation': '🧾',
    'Compliance Audit': '✅',
    'Operational Audit': '⚙️',
    'IT Audit': '💻',
    'Payroll Audit': '👥',
    'Performance Audit': '📈',
    'Quality Audit': '🎯',
    'Environmental Audit': '♻️',
    'Cost Audit (CRA-3)': '💳',
    'Social Audit': '🤝',
    'Inventory Audit': '📦',
    'Stock Audit': '📦',
    'Bank / Loan Audit': '🏦',
    'Single Audit (US Federal / USAS)': '🏛️',
}

export default function Dashboard() {
    const [ENGAGEMENTS, setEngagements] = useState<DashboardEngagement[]>([])

    const inProgress = ENGAGEMENTS.filter(e => e.status === 'In Progress').length
    const critical = ENGAGEMENTS.filter(e => e.risk === 'Critical').length
    const pending = ENGAGEMENTS.filter(e => e.status === 'Planning' || e.status === 'Not Started').length
    const slaSummary = ENGAGEMENTS.reduce<Record<AuditSlaStatus, number>>((acc, engagement) => {
        const status = getSlaStatus({ status: engagement.status, startDate: engagement.createdAt })
        acc[status] += 1
        return acc
    }, { 'On Track': 0, 'At Risk': 0, Delayed: 0, Completed: 0 })

    const router = useRouter()
    const [automationData, setAutomationData] = useState<AutomationScoreResponse | null>(null)
    const [scoreLoading, setScoreLoading] = useState(true)
    const [isLiveScore, setIsLiveScore] = useState(false)

    useEffect(() => {
        getAutomationScore().then(data => {
            if (data) {
                setAutomationData(data)
                setIsLiveScore(data.dimensions.some(d => d.total > 0))
            }
        }).catch(err => {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/sign-in')
            }
            // non-auth errors: stay on page with stale overlay
        }).finally(() => setScoreLoading(false))

        getEngagements().then(data => {
            // Map EngagementResponse to local format for UI
            setEngagements(data.map(d => ({
                id: d.id,
                type: normalizeAuditTypeTitle(d.engagement_type),
                client: d.client_name,
                status: d.status === 'FIELD_WORK' ? 'In Progress' :
                    d.status === 'REVIEW' ? 'Review' :
                        d.status === 'COMPLETED' || d.status === 'SEALED' ? 'Completed' : 'Planning',
                risk: 'Medium',
                createdAt: d.created_at,
            })))
        })
    }, [router])

    return (
        <AuditShell>
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#002776] mb-1 tracking-tight">Operator Dashboard</h1>
                <p className="text-gray-500 text-sm">Universal Audit Command Surface — {ENGAGEMENTS.length} active mandates across all audit types</p>
            </div>

            {/* Top grid: KPI cards + Automation Score Widget */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* KPI cards */}
                {[
                    { label: 'Active Mandates', value: ENGAGEMENTS.length, sub: 'Assigned engagements', icon: Activity, color: 'text-[#002776]', bg: 'bg-blue-50' },
                    { label: 'In Progress', value: inProgress, sub: 'Actively running', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Pending Review', value: pending, sub: 'Awaiting action', icon: Users, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Critical Risk', value: critical, sub: 'Require escalation', icon: FileWarning, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <div>
                            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                            <div className="text-xs text-gray-500 leading-tight">{s.label}</div>
                            <div className="text-xs text-gray-300">{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* India CA audit launchpad */}
            <div className="mb-8 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-black text-[#002776]">Start a 7-Day Audit Workflow</h2>
                            <p className="text-sm text-gray-500">Choose the Indian CA workflow first, then Arkashri guides documents, checklist, review and Day 7 reporting.</p>
                        </div>
                        <Link href="/engagement-overview" className="hidden shrink-0 rounded-xl bg-[#002776] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#001a54] md:inline-flex">
                            New Engagement
                        </Link>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {AUDIT_TYPE_DEFINITIONS.map(auditType => (
                            <Link href="/engagement-overview" key={auditType.slug} className="group rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-[#002776] hover:bg-blue-50">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-black text-gray-900">{auditType.title}</span>
                                    <ArrowRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-[#002776]" />
                                </div>
                                <p className="line-clamp-2 text-xs leading-5 text-gray-500">{auditType.shortDescription}</p>
                                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#002776]">
                                    <CalendarClock className="h-3 w-3" /> 7-day target
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-black text-[#002776]">7-Day SLA Summary</h2>
                    <p className="mb-4 text-sm text-gray-500">Demo-ready status logic across active engagements.</p>
                    <div className="space-y-3">
                        {[
                            { label: 'Due within 7 days', value: ENGAGEMENTS.length, icon: CalendarClock, style: 'bg-blue-50 text-blue-700' },
                            { label: 'Evidence pending', value: Math.max(0, ENGAGEMENTS.length - slaSummary.Completed), icon: FolderOpen, style: 'bg-amber-50 text-amber-700' },
                            { label: 'Review pending', value: pending, icon: ClipboardCheck, style: 'bg-purple-50 text-purple-700' },
                            { label: 'Reports ready', value: slaSummary.Completed, icon: FileText, style: 'bg-green-50 text-green-700' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                                <div className="flex items-center gap-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.style}`}>
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                                </div>
                                <span className="text-lg font-black text-gray-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {(Object.keys(slaSummary) as AuditSlaStatus[]).map(status => (
                            <div key={status} className={`rounded-lg border px-3 py-2 text-center text-xs font-bold ${SLA_STATUS_STYLES[status]}`}>
                                {status}: {slaSummary[status]}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Automation Score Widget — full width */}
            <div className="mb-8">
                {scoreLoading ? (
                    <div className="bg-gradient-to-br from-[#001a54] via-[#002776] to-[#0040a0] rounded-2xl p-8 flex items-center justify-center gap-3 text-white min-h-[140px]">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-300" />
                        <span className="text-blue-200 text-sm">Loading automation score…</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 relative">
                        {!automationData ? (
                            // True offline: backend unreachable
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-2xl z-10 flex items-center justify-center">
                                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg border border-red-100 shadow-xl flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Decision Engine Offline — Showing Stale Model</span>
                                </div>
                            </div>
                        ) : !isLiveScore ? (
                            // Online but no audit data yet — show a softer info badge
                            <div className="absolute top-3 right-3 z-10">
                                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-blue-100 shadow-md flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                                    <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Baseline Model · No Engagements Yet</span>
                                </div>
                            </div>
                        ) : null}

                        <AutomationScoreWidget
                            score={automationData?.overall_score ?? 93.4}
                            grade={automationData?.grade ?? 'A'}
                            insight={automationData?.insight ?? 'Local baseline loaded. Connect to production to sync live decision deltas.'}
                            dimensions={automationData?.dimensions ?? [
                                { label: 'Decision Engine Coverage', score: 96.2, weight: 0.35, automated: 0, total: 0, description: '' },
                                { label: 'Audit Step Completion', score: 91.4, weight: 0.25, automated: 0, total: 0, description: '' },
                                { label: 'Approval Auto-Clearance', score: 88.7, weight: 0.20, automated: 0, total: 0, description: '' },
                                { label: 'Exception Auto-Triage', score: 90.3, weight: 0.12, automated: 0, total: 0, description: '' },
                                { label: 'Risk Quantification', score: 99.1, weight: 0.08, automated: 0, total: 0, description: '' },
                            ]}
                            isLive={isLiveScore}
                        />
                    </div>
                )}
            </div>

            {/* All engagements */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#002776]">All Engagements</h2>
                <Link href="/engagement-overview" className="text-sm font-semibold text-[#002776] hover:underline flex items-center gap-1">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {ENGAGEMENTS.map((e) => (
                    <Link href={`/engagement/${e.id}`} key={e.id} className="block group">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-[#002776] hover:shadow-md transition-all h-full cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[e.status]}`}>{e.status}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#002776] transition-colors" />
                            </div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-lg">{auditIcons[e.type]}</span>
                                <h3 className="font-bold text-gray-900 text-sm leading-tight">{e.type}</h3>
                            </div>
                            <p className="text-gray-400 text-xs mb-3">{e.client}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-gray-300">ENG-{e.id}</span>
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <span className={`w-1.5 h-1.5 rounded-full ${riskDot[e.risk]}`} />
                                    {e.risk}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </AuditShell>
    )
}
