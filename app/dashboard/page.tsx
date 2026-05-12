'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import { AutomationScoreWidget } from '@/components/audit/AutomationScoreWidget'
import { AlertBanner, EmptyState, LoadingPanel, MetricCard, PageHeader, SectionCard, StatusPill } from '@/components/ui/enterprise'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Activity, Users, FileWarning, TrendingUp, ClipboardCheck, FileText, FolderOpen, CheckCircle2, ListChecks, Sparkles, Briefcase, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAutomationScore, AutomationScoreResponse, getEngagements, ApiError, getApiErrorMessage, type AuditSlaApiStatus, type WorkflowReportStatus, type WorkflowReviewStatus } from '@/lib/api'
import { AUDIT_TYPE_DEFINITIONS, getSlaStatus, normalizeAuditTypeTitle, SLA_STATUS_STYLES, toDisplaySlaStatus, type AuditSlaStatus } from '@/lib/audit-types'

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
    const critical = ENGAGEMENTS.filter(e => e.risk === 'Critical').length
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

    return (
        <AuditShell>
            <PageHeader
                icon={Briefcase}
                title="Audit Command Center"
                description="A CA-first operating desk for engagement launch, evidence readiness, review pressure, report status and automation depth."
                meta={
                    <>
                        <StatusPill tone={hasEngagements ? 'green' : 'amber'}>{hasEngagements ? 'Live workspace' : 'Setup needed'}</StatusPill>
                        <StatusPill tone="blue">ICAI workflow ready</StatusPill>
                    </>
                }
                actions={
                    <Link href="/engagement-overview" className="inline-flex items-center gap-2 rounded-lg bg-[#002776] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#001a54]">
                        New Engagement <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                }
            />
            {engagementLoadError && (
                <div className="mb-4"><AlertBanner tone="red">{engagementLoadError}</AlertBanner></div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard label="Active engagements" value={ENGAGEMENTS.length} detail={hasEngagements ? 'Assigned audits' : 'Create first workflow'} icon={Activity} />
                <MetricCard label="In progress" value={inProgress} detail="Actively running" icon={TrendingUp} tone="blue" />
                <MetricCard label="Pending review" value={reviewPending || pending} detail="Awaiting partner action" icon={Users} tone="amber" />
                <MetricCard label="Critical risk" value={critical} detail="Require escalation" icon={FileWarning} tone="red" />
            </div>

            <div className="mb-8 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
                <SectionCard
                    title="Start a Guided Audit Workflow"
                    description="Choose the CA workflow first, then Arkashri guides documents, checklist, review and final reporting."
                    icon={ListChecks}
                    action={<Link href="/engagement-overview" className="rounded-lg bg-[#002776] px-3 py-2 text-xs font-bold text-white hover:bg-[#001a54]">New Engagement</Link>}
                >
                    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {AUDIT_TYPE_DEFINITIONS.map(auditType => (
                            <Link href="/engagement-overview" key={auditType.slug} className="group rounded-lg border border-slate-100 bg-slate-50 p-4 transition-all hover:border-[#002776] hover:bg-blue-50">
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
                </SectionCard>

                <SectionCard title="Audit Progress Summary" description="Evidence gaps, review pressure and report readiness across active audits." icon={ShieldCheck}>
                    <div className="p-4">
                    {!hasEngagements ? (
                        <EmptyState icon={Sparkles} title="No engagements yet" description="Start your first guided audit workflow to see evidence pending, review readiness and report status here." action={<Link href="/engagement-overview" className="rounded-lg bg-[#002776] px-3 py-2 text-xs font-bold text-white hover:bg-[#001a54]">New Engagement</Link>} />
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
                </SectionCard>
            </div>

            <div className="mb-8">
                {scoreLoading ? (
                    <LoadingPanel label="Loading automation score" />
                ) : !automationData || !isLiveScore ? (
                    <SectionCard>
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
                    </SectionCard>
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
                            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 hover:border-[#002776] hover:shadow-md transition-all h-full cursor-pointer">
                                <div className="flex items-start justify-between mb-3">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[e.status]}`}>{e.status}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#002776] transition-colors" />
                                </div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <FileText className="h-4 w-4 text-[#002776]" />
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
            ) : (
                <EmptyState icon={FolderOpen} title="No engagements yet. Start your first guided audit workflow." description="Create an engagement to begin client onboarding, document requests, checklist progress, evidence linking, review and report readiness tracking." action={<Link href="/engagement-overview" className="rounded-lg bg-[#002776] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#001a54]">New Engagement</Link>} />
            )}
        </AuditShell>
    )
}
