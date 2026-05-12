'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Briefcase,
    ClipboardCheck,
    FileText,
    FolderOpen,
    Gauge,
    LayoutList,
    ShieldCheck,
} from 'lucide-react'

import { AuditShell } from '@/components/layout/AuditShell'
import { AlertBanner, EmptyState, LoadingPanel, StatusPill } from '@/components/ui/enterprise'
import {
    ApiError,
    AutomationScoreResponse,
    getApiErrorMessage,
    getAutomationScore,
    getEngagements,
    type AuditSlaApiStatus,
    type WorkflowReportStatus,
    type WorkflowReviewStatus,
} from '@/lib/api'
import {
    AUDIT_TYPE_DEFINITIONS,
    getSlaStatus,
    normalizeAuditTypeTitle,
    SLA_STATUS_STYLES,
    toDisplaySlaStatus,
    type AuditSlaStatus,
} from '@/lib/audit-types'

type DashboardEngagement = {
    id: string
    type: string
    client: string
    status: string
    risk: string
    createdAt: string | null
    startDate: string | null
    slaStatus?: AuditSlaApiStatus
    checklistProgress?: Record<string, unknown>
    documentProgress?: Record<string, unknown>
    reviewStatus?: WorkflowReviewStatus
    reportStatus?: WorkflowReportStatus
}

const statusStyles: Record<string, string> = {
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-100',
    Planning: 'bg-amber-50 text-amber-700 border-amber-100',
    Review: 'bg-violet-50 text-violet-700 border-violet-100',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Not Started': 'bg-slate-50 text-slate-600 border-slate-100',
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
    const router = useRouter()
    const [engagements, setEngagements] = useState<DashboardEngagement[]>([])
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
            if (err instanceof ApiError && err.status === 401) router.replace('/sign-in')
        }).finally(() => setScoreLoading(false))

        getEngagements().then(data => {
            setEngagementLoadError('')
            setEngagements(data.map(d => ({
                id: d.id,
                type: normalizeAuditTypeTitle(d.auditType ?? d.engagement_type),
                client: d.client_name,
                status: d.status === 'FIELD_WORK' ? 'In Progress' :
                    d.status === 'REVIEW' ? 'Review' :
                        d.status === 'COMPLETED' || d.status === 'SEALED' ? 'Completed' : 'Planning',
                risk: 'Medium',
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

    const inProgress = engagements.filter(e => e.status === 'In Progress').length
    const pending = engagements.filter(e => e.status === 'Planning' || e.status === 'Not Started').length
    const evidencePending = engagements.filter(e => hasPendingProgress(e.documentProgress)).length
    const reviewPending = engagements.filter(e => e.reviewStatus !== 'approved').length
    const reportsReady = engagements.filter(e => e.reportStatus === 'generated' || e.reportStatus === 'sealed').length
    const hasEngagements = engagements.length > 0

    const slaSummary = engagements.reduce<Record<AuditSlaStatus, number>>((acc, engagement) => {
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

    const priorityActions = useMemo(() => [
        { label: 'Evidence pending', value: evidencePending, icon: FolderOpen, href: '/evidence', tone: 'amber' },
        { label: 'Partner review', value: reviewPending || pending, icon: ClipboardCheck, href: '/review', tone: 'violet' },
        { label: 'Reports ready', value: reportsReady, icon: FileText, href: '/report', tone: 'green' },
    ], [evidencePending, pending, reportsReady, reviewPending])

    const launchpad = AUDIT_TYPE_DEFINITIONS.slice(0, 6)
    const score = automationData?.overall_score ?? 0
    const grade = automationData?.grade ?? 'C'

    return (
        <AuditShell>
            <div className="space-y-5">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusPill tone={hasEngagements ? 'green' : 'amber'}>
                                    {hasEngagements ? 'Live workspace' : 'Setup needed'}
                                </StatusPill>
                                <StatusPill tone="blue">CA command desk</StatusPill>
                            </div>
                            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-slate-950">Audit Command Center</h1>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                        Track what needs action, launch the right audit workflow, and move engagements from raw data to review-ready output.
                                    </p>
                                </div>
                                <Link href="/engagement-overview" className="inline-flex w-fit items-center gap-2 rounded-md bg-[#002776] px-4 py-2 text-xs font-bold text-white hover:bg-[#001a54]">
                                    New Engagement <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                            <CommandMetric label="Active" value={engagements.length} icon={Briefcase} />
                            <CommandMetric label="Running" value={inProgress} icon={Activity} />
                            <CommandMetric label="Review" value={reviewPending || pending} icon={ClipboardCheck} />
                            <CommandMetric label="Automation" value={isLiveScore ? `${Math.round(score)}%` : '0%'} icon={Gauge} />
                        </div>
                    </div>
                </section>

                {engagementLoadError && <AlertBanner tone="red">{engagementLoadError}</AlertBanner>}

                <div className="grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)_22rem]">
                    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                        <PanelHeader icon={AlertTriangle} title="Action Queue" subtitle="What should move next" />
                        <div className="divide-y divide-slate-100">
                            {priorityActions.map(item => (
                                <Link key={item.label} href={item.href} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${item.tone === 'amber' ? 'bg-amber-50 text-amber-700' : item.tone === 'green' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>
                                            <item.icon className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{item.label}</div>
                                            <div className="text-xs text-slate-500">Open queue</div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-black text-slate-950">{item.value}</div>
                                </Link>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
                            {(Object.keys(slaSummary) as AuditSlaStatus[]).map(status => (
                                <div key={status} className={`rounded-md border px-2 py-1.5 text-center text-xs font-bold ${SLA_STATUS_STYLES[status]}`}>
                                    {status}: {slaSummary[status]}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                        <PanelHeader
                            icon={LayoutList}
                            title="Audit Workflow Library"
                            subtitle="Select the audit assignment and open its documents, checklist, testing, review and report path."
                            action={<Link href="/engagement-overview" className="text-xs font-bold text-[#002776]">View all</Link>}
                        />
                        <div className="divide-y divide-slate-100">
                            {launchpad.map(auditType => (
                                <Link href="/engagement-overview" key={auditType.slug} className="grid gap-3 px-4 py-3 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_15rem_7rem] md:items-center">
                                    <div className="min-w-0">
                                        <div className="font-black text-slate-950">{auditType.title}</div>
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{auditType.shortDescription}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold text-slate-500">
                                        <span className="rounded bg-slate-50 px-2 py-1">{auditType.requiredDocuments.length} docs</span>
                                        <span className="rounded bg-slate-50 px-2 py-1">{auditType.checklistItems.length} checks</span>
                                        <span className="rounded bg-slate-50 px-2 py-1">{auditType.timeline.length} stages</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs font-black text-[#002776]">Open workflow <ArrowRight className="h-3 w-3" /></span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                        <PanelHeader icon={ShieldCheck} title="Automation Readiness" subtitle="Only useful after real data exists" />
                        {scoreLoading ? (
                            <div className="p-4"><LoadingPanel label="Loading automation score" /></div>
                        ) : (
                            <div className="p-4">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="text-4xl font-black text-slate-950">{isLiveScore ? score.toFixed(1) : '0.0'}</div>
                                        <div className="mt-1 text-xs font-black uppercase text-slate-400">Automation score</div>
                                    </div>
                                    <span className={`rounded-md px-2.5 py-1 text-sm font-black ${grade === 'A+' || grade === 'A' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{grade}</span>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {(automationData?.dimensions ?? []).slice(0, 5).map(dim => (
                                        <div key={dim.label}>
                                            <div className="mb-1 flex justify-between text-xs">
                                                <span className="font-semibold text-slate-600">{dim.label}</span>
                                                <span className="font-bold text-slate-500">{dim.score.toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-slate-100">
                                                <div className="h-1.5 rounded-full bg-[#002776]" style={{ width: `${dim.score}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    {!isLiveScore && (
                                        <p className="rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                                            Import engagement data and run audit automation to get a meaningful score.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <PanelHeader icon={Briefcase} title="Engagements" subtitle="Current audit work in one scan-friendly list" action={<Link href="/engagement-overview" className="text-xs font-bold text-[#002776]">Create or view all</Link>} />
                    {hasEngagements ? (
                        <div className="divide-y divide-slate-100">
                            {engagements.map(engagement => (
                                <Link href={`/engagement/${engagement.id}`} key={engagement.id} className="grid gap-3 px-4 py-3 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_8rem_8rem_9rem] md:items-center">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-[#002776]" />
                                            <span className="font-black text-slate-950">{engagement.type}</span>
                                        </div>
                                        <div className="mt-1 truncate text-xs text-slate-500">{engagement.client} · ENG-{engagement.id.slice(0, 8)}</div>
                                    </div>
                                    <span className={`w-fit rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusStyles[engagement.status] ?? statusStyles.Planning}`}>
                                        {engagement.status}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">Risk: {engagement.risk}</span>
                                    <span className="inline-flex items-center justify-end gap-1 text-xs font-black text-[#002776]">
                                        Open workspace <ArrowRight className="h-3 w-3" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4">
                            <EmptyState
                                icon={FolderOpen}
                                title="No engagements yet"
                                description="Start a guided audit workflow to begin onboarding, evidence requests, testing, review and reporting."
                                action={<Link href="/engagement-overview" className="rounded-md bg-[#002776] px-4 py-2 text-xs font-bold text-white hover:bg-[#001a54]">New Engagement</Link>}
                            />
                        </div>
                    )}
                </section>
            </div>
        </AuditShell>
    )
}

function CommandMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <div className="rounded-md bg-white p-3 ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-slate-400" />
                <div className="text-xl font-black text-slate-950">{value}</div>
            </div>
            <div className="mt-2 text-[10px] font-black uppercase text-slate-400">{label}</div>
        </div>
    )
}

function PanelHeader({
    icon: Icon,
    title,
    subtitle,
    action,
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    subtitle: string
    action?: React.ReactNode
}) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#002776]" />
                    <h2 className="font-black text-slate-950">{title}</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            </div>
            {action}
        </div>
    )
}
