import { PhaseApprovalGateway } from '@/components/audit/PhaseApprovalGateway'
import { WidgetErrorBoundary } from '@/components/layout/WidgetErrorBoundary'
import { AuditCompletionEstimator } from '@/components/audit/AuditCompletionEstimator'
import { BooksHealthDashboard } from '@/components/audit/BooksHealthDashboard'
import PartnerSignOff from '@/components/audit/PartnerSignOff'
import { AuditTypeWorkflow } from '@/components/audit/AuditTypeWorkflow'
import { registryByShortId } from '@/lib/engagementRegistry'
import { getBackendBaseUrl } from '@/lib/env'
import { normalizeAuditTypeTitle } from '@/lib/audit-types'
import type { AuditSlaApiStatus, WorkflowReportStatus, WorkflowReviewStatus } from '@/lib/api'
import { AlertTriangle, CheckCircle2, Database, FileCheck2, LockKeyhole, RefreshCcw, ShieldCheck } from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'

const TYPE_BADGE_COLORS: Record<string, string> = {
    'Forensic Audit': 'bg-red-100 text-red-800',
    'Financial Audit': 'bg-blue-100 text-blue-800',
    'ESG Audit': 'bg-green-100 text-green-800',
    'Internal Audit': 'bg-indigo-100 text-indigo-800',
    'External Audit': 'bg-purple-100 text-purple-800',
    'Statutory Audit': 'bg-teal-100 text-teal-800',
    'Tax Audit': 'bg-orange-100 text-orange-800',
    'GST Audit / GST Reconciliation': 'bg-cyan-100 text-cyan-800',
    'Compliance Audit': 'bg-cyan-100 text-cyan-800',
    'Operational Audit': 'bg-amber-100 text-amber-800',
    'IT Audit': 'bg-sky-100 text-sky-800',
    'Payroll Audit': 'bg-pink-100 text-pink-800',
    'Performance Audit': 'bg-lime-100 text-lime-800',
    'Quality Audit': 'bg-rose-100 text-rose-800',
    'Environmental Audit': 'bg-emerald-100 text-emerald-800',
    'Stock Audit': 'bg-lime-100 text-lime-800',
    'Bank / Loan Audit': 'bg-slate-100 text-slate-800',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EngagementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: shortId } = await params

    // 1. Look up UUID from registry
    const registryEntry = registryByShortId(shortId)
    const uuid = registryEntry?.uuid ?? (shortId.includes('-') && shortId.length >= 32 ? shortId : null)

    // 2. Try to fetch live data from the backend
    type LiveData = {
        auditType: string
        clientName: string
        status: string
        sealHash: string | null
        sealedAt: string | null
        jurisdiction: string
        standardsFramework: string
        createdAt: string | null
        startDate: string | null
        currentDay?: number | null
        slaStatus?: AuditSlaApiStatus | null
        checklistProgress?: Record<string, unknown> | null
        documentProgress?: Record<string, unknown> | null
        reviewStatus?: WorkflowReviewStatus | null
        reportStatus?: WorkflowReportStatus | null
        isLive: true
    }
    type UnavailableData = {
        auditType: string
        clientName: string
        status: string
        sealHash: null
        sealedAt: null
        jurisdiction: string
        standardsFramework: string
        createdAt: null
        startDate: null
        currentDay: null
        slaStatus: null
        checklistProgress: null
        documentProgress: null
        reviewStatus: null
        reportStatus: null
        isLive: false
    }
    type EngagementData = LiveData | UnavailableData

    let engagementData: EngagementData
    let fetchError: string | null = null

    if (uuid) {
        try {
            const cookieStore = await cookies()
            const token = cookieStore.get('arkashri_token')?.value

            const baseUrl = getBackendBaseUrl()

            const res = await fetch(`${baseUrl}/api/v1/engagements/engagements/${uuid}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'X-Arkashri-Tenant': process.env.NEXT_PUBLIC_API_TENANT ?? 'default_tenant'
                }
            })

            if (res.ok) {
                const liveEng = await res.json()
                engagementData = {
                    auditType: normalizeAuditTypeTitle(liveEng.auditType ?? liveEng.engagement_type),
                    clientName: liveEng.client_name,
                    status: liveEng.status,
                    sealHash: liveEng.seal_hash,
                    sealedAt: liveEng.sealed_at,
                    jurisdiction: liveEng.jurisdiction,
                    standardsFramework: liveEng.standards_framework,
                    createdAt: liveEng.created_at,
                    startDate: liveEng.startDate ?? liveEng.created_at,
                    currentDay: liveEng.currentDay ?? null,
                    slaStatus: liveEng.slaStatus ?? null,
                    checklistProgress: liveEng.checklistProgress ?? null,
                    documentProgress: liveEng.documentProgress ?? null,
                    reviewStatus: liveEng.reviewStatus ?? null,
                    reportStatus: liveEng.reportStatus ?? null,
                    isLive: true,
                }
            } else {
                fetchError = 'Engagement not found in the production backend.'
                engagementData = buildUnavailableEngagement(shortId, registryEntry)
            }
        } catch (error) {
            fetchError = error instanceof Error ? error.message : 'Backend unreachable. Live engagement data is unavailable.'
            engagementData = buildUnavailableEngagement(shortId, registryEntry)
        }
    } else {
        fetchError = 'This engagement link is not mapped to a production backend UUID.'
        engagementData = buildUnavailableEngagement(shortId, registryEntry)
    }

    const badgeClass = TYPE_BADGE_COLORS[engagementData.auditType] ?? 'bg-gray-100 text-gray-800'
    const displayId = shortId.includes('-') ? shortId.substring(0, 8) : shortId
    const readinessItems = engagementData.isLive
        ? [
            { label: 'Client master', value: engagementData.clientName, state: 'Ready' },
            { label: 'Framework', value: `${engagementData.jurisdiction} / ${engagementData.standardsFramework}`, state: 'Ready' },
            { label: 'Evidence status', value: engagementData.documentProgress ? 'Documents linked' : 'Awaiting evidence index', state: engagementData.documentProgress ? 'Ready' : 'Pending' },
            { label: 'Review status', value: engagementData.reviewStatus ?? 'Not started', state: engagementData.reviewStatus === 'approved' ? 'Ready' : 'Pending' },
        ]
        : [
            { label: 'Client master', value: 'Backend record not available', state: 'Blocked' },
            { label: 'Framework', value: `${engagementData.jurisdiction} / ${engagementData.standardsFramework}`, state: 'Reference only' },
            { label: 'Evidence status', value: 'Evidence cannot be trusted until the live engagement loads', state: 'Blocked' },
            { label: 'Sign-off', value: 'Partner sign-off is disabled until the backend record is reachable', state: 'Blocked' },
        ]

    return (
        <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}`}>
                            {engagementData.auditType}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${engagementData.isLive ? 'bg-green-50 text-green-800 border-green-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                            {engagementData.isLive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                            {engagementData.isLive ? 'Live audit file' : 'Live record required'}
                        </span>
                        {engagementData.sealedAt && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                <LockKeyhole className="h-3.5 w-3.5" />
                                Sealed
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">
                        Audit readiness and file control
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                        Engagement {displayId} is shown with production controls only. Client facts, workpapers,
                        review evidence, and partner sign-off remain gated until the live backend record is available.
                    </p>
                    {fetchError && (
                        <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                                <div className="font-bold">Live engagement record could not be loaded</div>
                                <div className="mt-1 text-amber-800">{fetchError}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">File Status</div>
                    <div className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${engagementData.isLive ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
                        {engagementData.isLive ? <ShieldCheck className="h-3.5 w-3.5" /> : <Database className="h-3.5 w-3.5" />}
                        {engagementData.status}
                    </div>
                    <div className="mt-4 text-xs leading-5 text-slate-500">
                        No synthetic audit conclusions are displayed. This protects the file from unsupported CA sign-off.
                    </div>
                </div>
            </section>

            {!engagementData.isLive && (
                <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                                <FileCheck2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-950">Production engagement data required</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    A CA should not see invented client information, audit procedures, or conclusions.
                                    Sync this UUID with the backend engagement table, or open an engagement from the
                                    overview after the authenticated session is restored.
                                </p>
                            </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                href="/engagement-overview"
                                className="inline-flex items-center gap-2 rounded-md bg-[#002776] px-4 py-2 text-sm font-bold text-white hover:bg-[#001f5f]"
                            >
                                <Database className="h-4 w-4" />
                                Open Engagement Register
                            </Link>
                            <Link
                                href={`/engagement/${shortId}`}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Retry Live Load
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">CA Guardrail</div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Evidence, review, and seal actions are intentionally locked until the source engagement
                            record is reachable.
                        </p>
                    </div>
                </section>
            )}

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {readinessItems.map((item) => (
                    <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.label}</div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.state === 'Ready' ? 'bg-green-50 text-green-700' : item.state === 'Blocked' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                {item.state}
                            </span>
                        </div>
                        <div className="mt-3 text-sm font-semibold leading-5 text-slate-900">{item.value}</div>
                    </div>
                ))}
            </section>

            {engagementData.isLive && uuid && (
                <BooksHealthDashboard engagementId={uuid} />
            )}

            {engagementData.isLive && (
                <AuditTypeWorkflow
                    auditType={engagementData.auditType}
                    status={engagementData.status}
                    startDate={engagementData.startDate}
                    currentDay={engagementData.currentDay}
                    slaStatus={engagementData.slaStatus}
                    checklistProgress={engagementData.checklistProgress}
                    documentProgress={engagementData.documentProgress}
                    reviewStatus={engagementData.reviewStatus}
                    reportStatus={engagementData.reportStatus}
                />
            )}

            {engagementData.isLive && (
                <WidgetErrorBoundary fallback={<div className="font-mono text-red-500 bg-red-50 p-4 border border-red-200">System Error: Gateway offline.</div>}>
                    <PhaseApprovalGateway
                        currentPhase={
                            engagementData.status === 'ACCEPTED' ? 'Planning & Risk Assessment' :
                            engagementData.status === 'IN_PROGRESS' ? 'Evidence Collection' :
                            engagementData.status === 'UNDER_REVIEW' ? 'Independent Review' :
                            engagementData.status === 'SEALED' ? 'Report Issuance & Sign-off' :
                            'Evidence Collection'
                        }
                        onApprove={async () => {
                            console.log("Phase advanced")
                        }}
                    />
                </WidgetErrorBoundary>
            )}

            {/* ── Completion Estimator ── */}
            {engagementData.isLive && (
                <AuditCompletionEstimator
                    auditType={engagementData.auditType}
                    status={engagementData.status}
                    startDate={engagementData.createdAt ?? undefined}
                />
            )}

            {/* Multi-Partner Sign-Off & Seal */}
            {engagementData.isLive && uuid ? (
                <PartnerSignOff
                    engagementId={uuid}
                    currentUserId="partner_001"
                    currentUserEmail=""
                    isPartner={true}
                    onSealed={(hash) => console.log('Sealed:', hash)}
                />
            ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                    <span className="font-bold text-slate-800">Partner Sign-Off & Seal</span> becomes available once
                    this engagement exists in the production backend.
                </div>
            )}
        </div>
    )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUnavailableEngagement(
    shortId: string,
    entry: ReturnType<typeof registryByShortId>,
): { auditType: string; clientName: string; status: string; sealHash: null; sealedAt: null; jurisdiction: string; standardsFramework: string; createdAt: null; startDate: null; currentDay: null; slaStatus: null; checklistProgress: null; documentProgress: null; reviewStatus: null; reportStatus: null; isLive: false } {
    return {
        auditType: 'Audit Engagement',
        clientName: entry?.client ?? `Engagement ${shortId}`,
        status: 'Live Data Required',
        sealHash: null,
        sealedAt: null,
        jurisdiction: entry?.jurisdiction ?? 'IN',
        standardsFramework: 'ICAI_SA',
        createdAt: null,
        startDate: null,
        currentDay: null,
        slaStatus: null,
        checklistProgress: null,
        documentProgress: null,
        reviewStatus: null,
        reportStatus: null,
        isLive: false,
    }
}
