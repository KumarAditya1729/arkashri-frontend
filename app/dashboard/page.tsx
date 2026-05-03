'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import { AutomationScoreWidget } from '@/components/audit/AutomationScoreWidget'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Activity, Users, FileWarning, TrendingUp, Loader2, ClipboardCheck, FileText, FolderOpen, CheckCircle2, ListChecks, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAutomationScore, AutomationScoreResponse, getEngagements, ApiError, getApiErrorMessage, type AuditSlaApiStatus, type WorkflowReportStatus, type WorkflowReviewStatus } from '@/lib/api'
import { AUDIT_TYPE_DEFINITIONS, getSlaStatus, normalizeAuditTypeTitle, SLA_STATUS_STYLES, toDisplaySlaStatus, type AuditSlaStatus } from '@/lib/audit-types'

type DashboardEngagement = {
    id: string
    type: string
    client: string
    status: string
    createdAt: string | null
    startDate: string | null
    slaStatus?: AuditSlaApiStatus
    checklistProgress?: Record<string, unknown>
    documentProgress?: Record<string, unknown>
    reviewStatus?: WorkflowReviewStatus
    reportStatus?: WorkflowReportStatus
}

// Dynamically fetched
const statusColors: Record<string, string> = {
    'In Progress': 'bg-blue-100 text-blue-800',
    'Planning': 'bg-amber-100 text-amber-800',
    'Review': 'bg-purple-100 text-purple-800',
    'Completed': 'bg-green-100 text-green-700',
    'Not Started': 'bg-gray-100 text-gray-600',
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

function progressNumber(progress: Record<string, unknown> | undefined, keys: string[]): number | null {
    if (!progress) return null
    for (const key of keys) {
        const value = progress[key]
        if (typeof value === 'number' && Number.isFinite(value)) return value
    }
    return null
}

function hasPendingProgress(progress: Record<string, unknown> | undefined): boolean {
    const total = progressNumber(progress, ['total', 'required', 'count'])
    const completed = progressNumber(progress, ['completed', 'verified', 'uploaded', 'done'])
    if (total !== null && completed !== null) return completed < total
    return progress ? Object.keys(progress).length === 0 : true
}

export default function Dashboard() {
    const [ENGAGEMENTS, setEngagements] = useState<DashboardEngagement[]>([])

    const inProgress = ENGAGEMENTS.filter(e => e.status === 'In Progress').length
    const critical = 0
    const pending = ENGAGEMENTS.filter(e => e.status === 'Planning' || e.status === 'Not Started').length
    const slaSummary = ENGAGEMENTS.reduce<Record<AuditSlaStatus, number>>((acc, engagement) => {
        const status = toDisplaySlaStatus(engagement.slaStatus) ?? getSlaStatus({
            status: engagement.status,
            startDate: engagement.startDate ?? engagement.createdAt,
            evidencePending: hasPendingProgress(engagement.documentProgress),
            reviewPending: engagement.reviewStatus !== 'approved',
            reportGenerated: engagement.reportStatus === 'generated' || engagement.reportStatus === 'sealed',
        })
        acc[status] += 1
        return acc
    }, { 'On Track': 0, 'At Risk': 0, Delayed: 0, Completed: 0 })
    const evidencePending = ENGAGEMENTS.filter(e => hasPendingProgress(e.documentProgress)).length
    const reviewPending = ENGAGEMENTS.filter(e => e.reviewStatus !== 'approved').length
    const reportsReady = ENGAGEMENTS.filter(e => e.reportStatus === 'generated' || e.reportStatus === 'sealed').length
    const hasEngagements = ENGAGEMENTS.length > 0

    const router = useRouter()
    const [automationData, setAutomationData] = useState<AutomationScoreResponse | null>(null)
    const [scoreLoading, setScoreLoading] = useState(true)
    const [isLiveScore, setIsLiveScore] = useState(false)
    const [engagementLoadError, setEngagementLoadError] = useState('')

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
            setEngagementLoadError('')
            // Map EngagementResponse into the dashboard view model.
            setEngagements(data.map(d => ({
                id: d.id,
                type: normalizeAuditTypeTitle(d.auditType ?? d.engagement_type),
                client: d.client_name,
                status: d.status === 'FIELD_WORK' ? 'In Progress' :
                    d.status === 'REVIEW' ? 'Review' :
                        d.status === 'COMPLETED' || d.status === 'SEALED' ? 'Completed' : 'Planning',
                createdAt: d.created_at,
                startDate: d.startDate ?? d.created_at,
                slaStatus: d.slaStatus,
                checklistProgress: d.checklistProgress,
                documentProgress: d.documentProgress,
                reviewStatus: d.reviewStatus,
                reportStatus: d.reportStatus,
            })))
        }).catch(err => {
            setEngagements([])
            setEngagementLoadError(getApiErrorMessage(err, 'Unable to load engagements from the backend.'))
        })
    }, [router])

    return (
        <AuditShell>
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#002776] mb-1 tracking-tight">Operator Dashboard</h1>
                <p className="text-gray-500 text-sm">Indian CA audit command surface — guided workflows, evidence status, review readiness and report progress.</p>
            </div>
            {engagementLoadError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {engagementLoadError}
                </div>
            )}

            {/* Top grid: KPI cards + Automation Score Widget */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* KPI cards */}
                {[
                    { label: 'Active Engagements', value: ENGAGEMENTS.length, sub: hasEngagements ? 'Assigned audits' : 'Create the first workflow', icon: Activity, color: 'text-[#002776]', bg: 'bg-blue-50' },
                    { label: 'In Progress', value: inProgress, sub: 'Actively running', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Pending Review', value: reviewPending || pending, sub: 'Awaiting partner action', icon: Users, color: 'text-amber-500', bg: 'bg-amber-50' },
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
                            <h2 className="text-xl font-black text-[#002776]">Start a Guided Audit Workflow</h2>
                            <p className="text-sm text-gray-500">Choose the Indian CA workflow first, then Arkashri guides documents, checklist, review and final reporting.</p>
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
                                <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px] font-bold text-gray-500">
                                    <span className="rounded-lg bg-white px-2 py-1 text-center">{auditType.requiredDocuments.length} docs</span>
                                    <span className="rounded-lg bg-white px-2 py-1 text-center">{auditType.checklistItems.length} checks</span>
                                    <span className="rounded-lg bg-white px-2 py-1 text-center">{auditType.timeline.length} stages</span>
                                </div>
                                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#002776] shadow-sm ring-1 ring-gray-100 group-hover:ring-blue-200">
                                    Start audit <ArrowRight className="h-3 w-3" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-black text-[#002776]">Audit Progress Summary</h2>
                    <p className="mb-4 text-sm text-gray-500">Engagement progress, evidence gaps and review readiness across active audits.</p>
                    {!hasEngagements ? (
                        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-4">
                            <div className="mb-2 flex items-center gap-2 text-[#002776]">
                                <Sparkles className="h-4 w-4" />
                                <span className="text-sm font-black">No engagements yet</span>
                            </div>
                            <p className="text-xs leading-5 text-gray-600">Start your first guided audit workflow to see evidence pending, review readiness and report status here.</p>
                            <Link href="/engagement-overview" className="mt-3 inline-flex rounded-lg bg-[#002776] px-3 py-2 text-xs font-bold text-white hover:bg-[#001a54]">
                                New Engagement
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {[
                                    { label: 'Active workflows', value: ENGAGEMENTS.length, icon: ListChecks, style: 'bg-blue-50 text-blue-700' },
                                    { label: 'Evidence pending', value: evidencePending, icon: FolderOpen, style: 'bg-amber-50 text-amber-700' },
                                    { label: 'Review pending', value: reviewPending || pending, icon: ClipboardCheck, style: 'bg-purple-50 text-purple-700' },
                                    { label: 'Reports ready', value: reportsReady || slaSummary.Completed, icon: FileText, style: 'bg-green-50 text-green-700' },
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
                        </>
                    )}
                </div>
            </div>

            {/* Automation Score Widget — full width */}
            <div className="mb-8">
                {scoreLoading ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#002776]">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                            <div className="flex-1">
                                <div className="h-3 w-40 rounded-full bg-gray-100" />
                                <div className="mt-2 h-2 w-72 max-w-full rounded-full bg-gray-100" />
                            </div>
                        </div>
                    </div>
                ) : !automationData || !isLiveScore ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#002776]">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Automation score
                                </div>
                                <h2 className="text-xl font-black text-[#002776]">Automation score will appear after engagement data is added.</h2>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500">Create an engagement, upload documents and complete review steps to generate meaningful audit automation signals.</p>
                            </div>
                            <Link href="/engagement-overview" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#002776] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#001a54]">
                                New Engagement
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 relative">
                        <AutomationScoreWidget
                            score={automationData.overall_score}
                            grade={automationData.grade}
                            insight={automationData.insight}
                            dimensions={automationData.dimensions}
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

            {hasEngagements ? (
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
                                    <span className="text-xs text-gray-500">Live backend record</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#002776]">
                        <FolderOpen className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">No engagements yet. Start your first guided audit workflow.</h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">Create an engagement to begin client onboarding, document requests, checklist progress, evidence linking, review and report readiness tracking.</p>
                    <Link href="/engagement-overview" className="mt-5 inline-flex rounded-xl bg-[#002776] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#001a54]">
                        New Engagement
                    </Link>
                </div>
            )}
        </AuditShell>
    )
}
