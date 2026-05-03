import { AuditShell } from '@/components/layout/AuditShell'
import { PhaseApprovalGateway } from '@/components/audit/PhaseApprovalGateway'
import { WidgetErrorBoundary } from '@/components/layout/WidgetErrorBoundary'
import { AuditCompletionEstimator } from '@/components/audit/AuditCompletionEstimator'
import PartnerSignOff from '@/components/audit/PartnerSignOff'
import { AuditTypeWorkflow } from '@/components/audit/AuditTypeWorkflow'
import { registryByShortId } from '@/lib/engagementRegistry'
import { getBackendBaseUrl } from '@/lib/env'
import { normalizeAuditTypeTitle } from '@/lib/audit-types'
import type { AuditSlaApiStatus, WorkflowReportStatus, WorkflowReviewStatus } from '@/lib/api'
import { cookies } from 'next/headers'

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
        } catch {
            fetchError = 'Backend unreachable. Live engagement data is unavailable.'
            engagementData = buildUnavailableEngagement(shortId, registryEntry)
        }
    } else {
        fetchError = 'This engagement link is not mapped to a production backend UUID.'
        engagementData = buildUnavailableEngagement(shortId, registryEntry)
    }

    const badgeClass = TYPE_BADGE_COLORS[engagementData.auditType] ?? 'bg-gray-100 text-gray-800'

    return (
        <AuditShell>
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <div className="text-sm font-semibold text-gray-500 mb-2">ENGAGEMENT COMMAND CENTER</div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}`}>
                            {engagementData.auditType}
                        </span>

                        {/* LIVE / UNAVAILABLE data source badge */}
                        {engagementData.isLive ? (
                            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                LIVE
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                NO LIVE DATA
                            </span>
                        )}

                        {engagementData.sealedAt && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                🔒 SEALED
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-[#002776] tracking-tight">
                        {engagementData.clientName}
                        <span className="text-gray-400 font-mono text-xl ml-3">ENG-{shortId}</span>
                    </h1>
                    {engagementData.isLive && (
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                                🌍 {engagementData.jurisdiction} ({engagementData.standardsFramework})
                            </span>
                            <span>· Status: <span className="font-semibold text-gray-700">{engagementData.status}</span></span>
                        </p>
                    )}

                    {/* Non-blocking fetch warning */}
                    {fetchError && (
                        <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                            ⚠️ {fetchError}
                        </div>
                    )}
                </div>

                <div className="text-right shrink-0">
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {engagementData.status ?? 'Active Collection'}
                    </div>
                </div>
            </div>

            {!engagementData.isLive && (
                <div className="mb-8 rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-600">
                    <div className="font-bold text-gray-900">Production engagement data required</div>
                    <p className="mt-2">
                        Arkashri will not render fabricated playbooks or client facts. Create or sync this engagement
                        from the backend, then reopen the production UUID-based engagement page.
                    </p>
                </div>
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
                <div className="mt-8 border-t pt-6">
                    <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4">
                        <span className="font-semibold text-gray-600">Partner Sign-Off & Seal</span> becomes available once
                        this engagement exists in the production backend.
                    </div>
                </div>
            )}
        </AuditShell>
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
