/**
 * Arkashri API Client — Phase 1 complete
 *
 * All calls include:
 *   - X-Arkashri-Tenant  (required for Postgres RLS)
 *   - X-Arkashri-Key     (when token is present in localStorage)
 *
 * Token lifecycle:
 *   - Obtained from POST /api/v1/token (sign-in)
 *   - Stored in localStorage as 'arkashri_token'
 *   - Cleared on sign-out
 */

import { getAppBaseUrl } from './env'

function getBaseUrl() {
    if (typeof window !== 'undefined') return '/api/proxy'
    return `${getAppBaseUrl()}/api/proxy`
}
// Intentionally no top-level BASE_URL constant — evaluated lazily per call to prevent SSR/client split-brain
const TENANT = process.env.NEXT_PUBLIC_API_TENANT ?? 'default_tenant'

// Secure token management is handled server-side in /app/api/auth/login/route.ts

// Token is now managed securely via HttpOnly cookies in the Next.js proxy.
// No client-side token access required.
function buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'X-Arkashri-Tenant': TENANT,
        ...extra,
    }
}

// ── Retry helper ─────────────────────────────────────────────────────────────
const RETRY_DELAYS_MS = [500, 1000, 2000] // 3 attempts, exponential backoff

export async function apiFetch<T>(path: string, init?: RequestInit, _attempt = 0): Promise<T> {
    const BASE_URL = getBaseUrl()
    const isFormData = init?.body instanceof FormData
    const h = isFormData
        ? { 'X-Arkashri-Tenant': TENANT }
        : buildHeaders()
    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            ...init,
            headers: { ...h, ...(init?.headers as Record<string, string> | undefined ?? {}) },
        })
        if (!res.ok) {
            const text = await res.text().catch(() => res.statusText)
            // Only retry on server errors (5xx), not client errors (4xx)
            if (res.status >= 500 && _attempt < RETRY_DELAYS_MS.length) {
                await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[_attempt]))
                return apiFetch<T>(path, init, _attempt + 1)
            }
            throw new ApiError(res.status, text)
        }
        if (res.status === 204) return undefined as T
        return res.json() as Promise<T>
    } catch (err) {
        if (err instanceof ApiError) throw err
        // Network error — retry with backoff
        if (_attempt < RETRY_DELAYS_MS.length) {
            await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[_attempt]))
            return apiFetch<T>(path, init, _attempt + 1)
        }
        throw err
    }
}

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message)
        this.name = 'ApiError'
    }
}

function isEmptyListStatus(err: unknown): boolean {
    return err instanceof ApiError && err.status === 404
}

export function getApiErrorMessage(err: unknown, fallback = 'Unable to load live data. Please try again.'): string {
    if (err instanceof ApiError) {
        try {
            const parsed = JSON.parse(err.message)
            if (typeof parsed?.detail === 'string') return parsed.detail
            if (typeof parsed?.message === 'string') return parsed.message
        } catch {
            // Use the raw server message below when it is not JSON.
        }
        if (err.status === 401) return 'Authentication required. Please sign in again.'
        if (err.status === 403) return 'Access denied for this workspace or role.'
        return err.message || fallback
    }
    return err instanceof Error ? err.message : fallback
}

export interface EvidenceLedgerEntry {
    id: number
    tenant_id: string
    jurisdiction: string
    window_start_event_id: number
    window_end_event_id: number
    merkle_root: string
    anchor_provider: string
    external_reference: string | null
    created_at: string
    attestations: {
        id: number
        adapter_key: string
        network: string
        tx_reference: string
        attestation_hash: string
        provider_payload: Record<string, unknown>
        created_at: string
    }[]
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthSessionResponse {
    expires_in?: number
    user: {
        email: string
        full_name: string
        role: string
        tenant_id: string
        initials: string
    }
}

// ─── Engagement Types ─────────────────────────────────────────────────────────

export type EngagementStatus = 'ACCEPTED' | 'UNDER_REVIEW' | 'REJECTED' | 'PLANNING' | 'FIELD_WORK' | 'REVIEW' | 'COMPLETED' | 'SEALED'
export type AuditWorkflowType = 'statutory_audit' | 'tax_audit' | 'gst_audit' | 'internal_audit' | 'stock_audit' | 'bank_loan_audit'
export type AuditSlaApiStatus = 'on_track' | 'at_risk' | 'delayed' | 'completed'
export type WorkflowReviewStatus = 'pending' | 'in_review' | 'changes_requested' | 'approved'
export type WorkflowReportStatus = 'not_started' | 'draft' | 'ready_for_review' | 'generated' | 'sealed'

export interface EngagementResponse {
    id: string
    tenant_id: string
    jurisdiction: string
    standards_framework: string
    client_name: string
    engagement_type: string
    auditType?: AuditWorkflowType | string
    targetCompletionDays?: number
    startDate?: string
    dueDate?: string
    currentDay?: number
    slaStatus?: AuditSlaApiStatus
    checklistProgress?: Record<string, unknown>
    documentProgress?: Record<string, unknown>
    reviewStatus?: WorkflowReviewStatus
    reportStatus?: WorkflowReportStatus
    status: EngagementStatus
    independence_cleared: boolean
    kyc_cleared: boolean
    conflict_check_notes: string | null
    sealed_at: string | null
    seal_hash: string | null
    created_at: string
}

export interface EngagementCreate {
    tenant_id: string
    jurisdiction: string
    client_name: string
    engagement_type: string
    auditType?: AuditWorkflowType | string
    targetCompletionDays?: number
    startDate?: string
    dueDate?: string
    independence_cleared?: boolean
    kyc_cleared?: boolean
    conflict_check_notes?: string | null
}

export interface EngagementWorkflowUpdate {
    auditType?: AuditWorkflowType | string
    targetCompletionDays?: number
    startDate?: string
    dueDate?: string
    currentDay?: number
    slaStatus?: AuditSlaApiStatus
    checklistProgress?: Record<string, unknown>
    documentProgress?: Record<string, unknown>
    reviewStatus?: WorkflowReviewStatus
    reportStatus?: WorkflowReportStatus
}

// ─── Seal Types ───────────────────────────────────────────────────────────────

export interface SealResponse {
    status: string
    message: string
    seal: {
        payload: {
            metadata: {
                seal_timestamp_utc: string
                engagement_id: string
                system_version: string
                tenant_id: string
                jurisdiction: string
            }
            opinion: { type: string; basis: string; is_signed: boolean }
            engine_state: { rule_snapshot_hash: string; weight_set_version: number; regulation_version_tag: string }
            cryptographic_anchors: { audit_event_merkle_root: string | null; decision_hash_tree_root: string }
        }
        hash: string
        signature: string
        signer: string
    }
}

// ─── Risk Types ───────────────────────────────────────────────────────────────

export type RiskLikelihood = 'High' | 'Medium' | 'Low'
export type RiskImpact = 'Critical' | 'High' | 'Medium' | 'Low'
export type RiskStatus = 'Open' | 'In Review' | 'Mitigated' | 'Accepted'

export interface RiskResponse {
    id: string
    engagement_id: string
    risk_ref: string
    title: string
    area: string
    likelihood: RiskLikelihood
    impact: RiskImpact
    risk_score: number
    owner: string
    control_ref: string | null
    risk_status: RiskStatus
    created_at: string
    updated_at: string
}

export interface RiskCreate {
    title: string
    area: string
    likelihood: RiskLikelihood
    impact: RiskImpact
    owner: string
    control_ref?: string
}

// ─── Evidence Types ───────────────────────────────────────────────────────────

export interface EvidenceResponse {
    id: string
    engagement_id: string
    evd_ref: string
    file_name: string
    file_path: string
    file_size_kb: string | null
    evidence_type: string
    test_ref: string | null
    uploaded_by: string
    ev_status: string
    uploaded_at: string
}

// ─── Approval Types ───────────────────────────────────────────────────────────

export interface ApprovalAction {
    id: string
    action_type: string
    actor_id: string
    notes: string | null
    created_at: string
}

export interface ApprovalResponse {
    id: string
    tenant_id: string
    jurisdiction: string
    request_type: string
    reference_type: string
    reference_id: string
    requested_by: string
    reason: string | null
    status: string
    current_level: number
    required_level: number
    opened_at: string
    closed_at: string | null
    decision_notes: string | null
    actions: ApprovalAction[]
}

// ─── Regulatory Types ─────────────────────────────────────────────────────────

export interface RegulatoryDoc {
    id: number
    jurisdiction: string
    title: string
    issuer: string
    source_url: string | null
    is_promoted: boolean
    ingested_at: string
    content: string | null
}

export interface RegulatoryDiffResponse {
    doc1_id: number
    doc2_id: number
    diff_lines: string[]
    diff_text: string
}

export interface AIGovernanceLogCreate {
    tenant_id: string
    jurisdiction: string
    decision_id: string
    model_used: string
    decision_rationale: string
    human_override: boolean
    override_reason?: string | null
}

// ─── Books Health / 7-Day Sprint Types ───────────────────────────────────────

export type BooksHealthSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type SevenDaySprintStatus = 'READY' | 'AT_RISK' | 'BLOCKED'

export interface BooksHealthIssue {
    id: string
    category: 'BANK' | 'GST' | 'LEDGER' | 'EVIDENCE' | string
    severity: BooksHealthSeverity
    title: string
    description: string
    recommended_action: string
    amount: number | null
    source_refs: string[]
}

export interface BooksHealthCategory {
    score: number
    issues: BooksHealthIssue[]
    [key: string]: unknown
}

export interface BooksHealthRunResponse {
    engagement_id: string
    tenant_id: string
    checked_at: string
    readiness_score: number
    seven_day_sprint_status: SevenDaySprintStatus
    critical_blocker_count: number
    high_risk_item_count: number
    client_query_count_created: number
    categories: Record<string, BooksHealthCategory>
    issues: BooksHealthIssue[]
    created_queries: Array<Record<string, unknown>>
    next_actions: string[]
}

export interface BooksHealthListResponse {
    health_checks: BooksHealthRunResponse[]
}

// ─── API Functions ────────────────────────────────────────────────────────────

// Auth - Now uses Next.js Route Handlers for HttpOnly cookies
export async function signIn(email: string, password: string): Promise<AuthSessionResponse> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
        const text = await res.text()
        throw new ApiError(res.status, text)
    }
    return res.json()
}

export async function verifySession(): Promise<AuthSessionResponse> {
    const res = await fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
    })
    if (!res.ok) {
        const text = await res.text()
        throw new ApiError(res.status, text)
    }
    return res.json()
}

export async function clearAuth(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' })
}

// Engagements
export async function getEngagement(uuid: string): Promise<EngagementResponse | null> {
    try {
        return await apiFetch<EngagementResponse>(`/api/v1/engagements/engagements/${uuid}`)
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
    }
}

export async function getEngagements(): Promise<EngagementResponse[]> {
    try {
        return await apiFetch<EngagementResponse[]>('/api/v1/engagements/engagements')
    } catch (err) {
        if (isEmptyListStatus(err)) return []
        throw err
    }
}

export async function createEngagement(payload: EngagementCreate): Promise<EngagementResponse> {
    return apiFetch<EngagementResponse>('/api/v1/engagements/engagements', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateEngagementWorkflow(engagementId: string, payload: EngagementWorkflowUpdate): Promise<EngagementResponse> {
    return apiFetch<EngagementResponse>(`/api/v1/engagements/engagements/${engagementId}/workflow`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    })
}

export async function sealEngagement(uuid: string): Promise<SealResponse> {
    return apiFetch<SealResponse>(`/api/v1/engagements/engagements/${uuid}/seal`, { method: 'POST' })
}

// Risks
export async function getRisks(engagementUuid: string): Promise<RiskResponse[]> {
    try {
        return await apiFetch<RiskResponse[]>(`/api/v1/engagements/${engagementUuid}/risks`)
    } catch (err) {
        if (isEmptyListStatus(err)) return []
        throw err
    }
}

export async function createRisk(engagementUuid: string, payload: RiskCreate): Promise<RiskResponse> {
    const backendPayload = {
        ...payload,
        likelihood: payload.likelihood.toUpperCase(),
        impact: payload.impact.toUpperCase(),
    }
    return apiFetch<RiskResponse>(`/api/v1/engagements/${engagementUuid}/risks`, {
        method: 'POST',
        body: JSON.stringify(backendPayload),
    })
}

export async function updateRiskStatus(engagementUuid: string, riskId: string, status: RiskStatus): Promise<RiskResponse> {
    let backendStatus = status
    if (status === 'In Review') backendStatus = 'IN_REVIEW' as RiskStatus
    else backendStatus = status.toUpperCase() as RiskStatus

    return apiFetch<RiskResponse>(`/api/v1/engagements/${engagementUuid}/risks/${riskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: backendStatus }),
    })
}

// Evidence
export async function listEvidence(engagementUuid: string): Promise<EvidenceResponse[]> {
    try {
        return await apiFetch<EvidenceResponse[]>(`/api/v1/engagements/${engagementUuid}/evidence`)
    } catch (err) {
        if (isEmptyListStatus(err)) return []
        throw err
    }
}

export async function uploadEvidence(engagementUuid: string, file: File, testRef?: string): Promise<EvidenceResponse> {
    const fd = new FormData()
    fd.append('file', file)
    if (testRef) fd.append('test_ref', testRef)
    return apiFetch<EvidenceResponse>(`/api/v1/engagements/${engagementUuid}/evidence`, {
        method: 'POST',
        body: fd,
    })
}

export async function deleteEvidence(engagementUuid: string, evidenceId: string): Promise<void> {
    return apiFetch<void>(`/api/v1/engagements/${engagementUuid}/evidence/${evidenceId}`, { method: 'DELETE' })
}

// Data Refinery
export type DataRefinerySourceType = 'bank_statement' | 'books_ledger' | 'sales_register' | 'purchase_register' | 'generic_ledger'

export interface DataRefineryIssue {
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    row_number: number | null
    field: string | null
    title: string
    recommended_action: string
}

export interface DataRefineryPreview {
    source_type: string
    source_file_hash: string
    headers: string[]
    suggested_mapping: Record<string, string>
    total_rows: number
    audit_ready_rows: number
    readiness_score: number
    can_ingest: boolean
    issues: DataRefineryIssue[]
    normalized_preview: Record<string, unknown>[]
    category_breakdown: Record<string, number>
    risk_flag_breakdown: Record<string, number>
}

export interface ExcelRefinerySheetPreview {
    sheet_name: string
    headers: string[]
    total_rows: number
    audit_ready_rows: number
    readiness_score: number
    can_ingest: boolean
    issues: DataRefineryIssue[]
    normalized_preview: Record<string, unknown>[]
    suggested_mapping?: Record<string, string>
    category_breakdown?: Record<string, number>
    risk_flag_breakdown?: Record<string, number>
}

export interface ExcelRefineryPreview {
    source_type: string
    source_file_hash: string
    sheet_count: number
    total_rows: number
    audit_ready_rows: number
    readiness_score: number
    can_ingest: boolean
    sheets: ExcelRefinerySheetPreview[]
}

export interface PdfBankStatementIntake {
    source_type: string
    source_file_hash: string
    status: string
    ocr_provider: string | null
    can_ingest: boolean
    recommended_action: string
    human_review_required: boolean
}

export interface DataRefineryIngestResult {
    batch_id: string
    engagement_id: string
    source_type: string
    source_file_hash: string
    records_submitted: number
    records_ingested: number
    duplicate_refs: string[]
    issues: DataRefineryIssue[]
    category_breakdown: Record<string, number>
    risk_flag_breakdown: Record<string, number>
}

function refineryFormData(file: File, sourceType: DataRefinerySourceType, mapping?: Record<string, string>) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('source_type', sourceType)
    if (mapping) fd.append('column_mapping_json', JSON.stringify(mapping))
    return fd
}

export async function previewDataRefineryCsv(
    file: File,
    sourceType: DataRefinerySourceType,
    mapping?: Record<string, string>,
): Promise<DataRefineryPreview> {
    return apiFetch<DataRefineryPreview>('/api/v1/data-refinery/preview', {
        method: 'POST',
        body: refineryFormData(file, sourceType, mapping),
    })
}

export async function previewDataRefineryExcel(
    file: File,
    sourceType: DataRefinerySourceType,
): Promise<ExcelRefineryPreview> {
    return apiFetch<ExcelRefineryPreview>('/api/v1/data-refinery/preview-excel', {
        method: 'POST',
        body: refineryFormData(file, sourceType),
    })
}

export async function previewBankStatementPdf(file: File): Promise<PdfBankStatementIntake> {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch<PdfBankStatementIntake>('/api/v1/data-refinery/preview-bank-pdf', {
        method: 'POST',
        body: fd,
    })
}

export async function extractBankStatementPdf(file: File): Promise<Record<string, unknown>> {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch<Record<string, unknown>>('/api/v1/data-refinery/extract-bank-pdf', {
        method: 'POST',
        body: fd,
    })
}

export async function ingestDataRefineryCsv(
    engagementUuid: string,
    file: File,
    sourceType: DataRefinerySourceType,
    mapping?: Record<string, string>,
): Promise<DataRefineryIngestResult> {
    return apiFetch<DataRefineryIngestResult>(`/api/v1/data-refinery/engagements/${engagementUuid}/ingest-csv`, {
        method: 'POST',
        body: refineryFormData(file, sourceType, mapping),
    })
}

// Specialist Audit Execution Engine
export interface SpecialistAuditTypeInfo {
    audit_type: string
    name: string
    safe_mode: boolean
    objective: string
    specialist_roles: string[]
    evidence: string[]
    procedures: string[]
    red_flags: string[]
}

export interface SpecialistAuditCatalog {
    engine_id: string
    version: string
    safe_execution_policy: string
    audit_types: SpecialistAuditTypeInfo[]
}

export interface SpecialistEvidenceChecklistItem {
    id: string
    description: string
    required: boolean
}

export interface SpecialistTestProgramItem {
    test_ref: string
    procedure: string
    evidence_required: string[]
    pass_condition: string
}

export interface SpecialistRiskRegisterItem {
    risk_ref: string
    title: string
    severity: string
    recommended_response: string
}

export interface SpecialistWorkprogram {
    audit_type: string
    name: string
    safe_mode: boolean
    objective: string
    specialist_roles: string[]
    scope_context: Record<string, unknown>
    evidence_checklist: SpecialistEvidenceChecklistItem[]
    test_program: SpecialistTestProgramItem[]
    risk_register: SpecialistRiskRegisterItem[]
    report_sections: string[]
    closure_gates: string[]
    human_review_required: boolean
    workprogram_hash: string
}

export interface SpecialistRunResult {
    run_id: string
    workprogram: SpecialistWorkprogram
}

export async function getSpecialistAuditCatalog(): Promise<SpecialistAuditCatalog> {
    return apiFetch<SpecialistAuditCatalog>('/api/v1/specialist-audits/catalog')
}

export async function getSpecialistWorkprogram(auditType: string): Promise<SpecialistWorkprogram> {
    return apiFetch<SpecialistWorkprogram>(`/api/v1/specialist-audits/${auditType}/workprogram`)
}

export async function runSpecialistAudit(
    engagementUuid: string,
    auditType: string,
    context: Record<string, unknown> = {},
): Promise<SpecialistRunResult> {
    return apiFetch<SpecialistRunResult>(`/api/v1/specialist-audits/engagements/${engagementUuid}/run`, {
        method: 'POST',
        body: JSON.stringify({ audit_type: auditType, context }),
    })
}

// Engagement Integrations: Tally, GST, MCA
export interface TallyImportResult {
    import_type: string
    source: string
    imported_at: string
    summary: Record<string, unknown>
}

export interface TallySummary {
    imports: Record<string, unknown>
}

export interface GSTReconciliationResult {
    recon_type: string
    reconciled_at: string
    summary: Record<string, unknown>
    mismatches: Record<string, unknown>[]
}

export interface GSTReconciliationList {
    reconciliations: Record<string, unknown>
}

export interface MCASnapshot {
    engagement_id: string
    mca_company_master: Record<string, unknown>
}

export async function getTallySummary(engagementUuid: string): Promise<TallySummary> {
    return apiFetch<TallySummary>(`/api/v1/erp/engagements/${engagementUuid}/tally/summary`)
}

export async function importTallyTrialBalance(
    engagementUuid: string,
    payload: { raw_xml?: string; connection_id?: string; from_date?: string; to_date?: string },
): Promise<TallyImportResult> {
    return apiFetch<TallyImportResult>(`/api/v1/erp/engagements/${engagementUuid}/tally/trial-balance/import`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export async function importTallyVouchers(
    engagementUuid: string,
    payload: { raw_xml?: string; connection_id?: string; from_date?: string; to_date?: string },
): Promise<TallyImportResult> {
    return apiFetch<TallyImportResult>(`/api/v1/erp/engagements/${engagementUuid}/tally/vouchers/import`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export async function runGstReconciliation(
    engagementUuid: string,
    reconType: 'gstr1-vs-books' | 'gstr2b-vs-itc',
    portalRecords: Record<string, unknown>[],
): Promise<GSTReconciliationResult> {
    return apiFetch<GSTReconciliationResult>(`/api/v1/gst/engagements/${engagementUuid}/reconcile/${reconType}`, {
        method: 'POST',
        body: JSON.stringify({ portal_records: portalRecords }),
    })
}

export async function getGstReconciliations(engagementUuid: string): Promise<GSTReconciliationList> {
    return apiFetch<GSTReconciliationList>(`/api/v1/gst/engagements/${engagementUuid}/reconciliations`)
}

export async function getMcaCompanyMaster(engagementUuid: string): Promise<MCASnapshot> {
    return apiFetch<MCASnapshot>(`/api/v1/mca/engagements/${engagementUuid}/company-master`)
}

export async function enrichMcaCompanyMaster(
    engagementUuid: string,
    payload: { cin: string; manual_master_data?: Record<string, unknown> | null },
): Promise<MCASnapshot> {
    return apiFetch<MCASnapshot>(`/api/v1/mca/engagements/${engagementUuid}/company-master`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

// Big 4 Automation Engine
export interface AuditAutomationPack {
    engagement_id: string
    client_name: string
    audit_type: string
    standards_framework: string
    risk_intelligence: {
        transaction_count: number
        total_value: number
        materiality_proxy: number
        category_breakdown: Record<string, number>
        risk_flag_breakdown: Record<string, number>
        findings: Record<string, unknown>[]
    }
    working_papers: {
        pack_id: string
        client_name: string
        standards_framework: string
        generated_at: string
        sections: Record<string, unknown>[]
        schedules: Record<string, unknown>[]
        top_findings: Record<string, unknown>[]
        evidence_count: number
        open_risk_count: number
        untested_control_count: number
    }
    report_readiness: {
        score: number
        checks: { code: string; passed: boolean; message: string }[]
        open_high_risk_count: number
        high_ai_finding_count: number
        suggested_opinion_type: string
        human_review_required: boolean
        basis: string
    }
}

export interface AuditAutomationRunResult {
    created_risk_count: number
    created_control_count: number
    report_job_id: string | null
    pack: AuditAutomationPack
}

export async function getAuditAutomationPack(engagementUuid: string): Promise<AuditAutomationPack> {
    return apiFetch<AuditAutomationPack>(`/api/v1/audit-automation/engagements/${engagementUuid}/pack`)
}

export async function runAuditAutomationPack(engagementUuid: string): Promise<AuditAutomationRunResult> {
    return apiFetch<AuditAutomationRunResult>(`/api/v1/audit-automation/engagements/${engagementUuid}/run`, {
        method: 'POST',
        body: JSON.stringify({ create_risks: true, create_controls: true, persist_report: true }),
    })
}

export async function createAuditSamplingPlan(engagementUuid: string, sampleSize = 25): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>(`/api/v1/audit-automation/engagements/${engagementUuid}/sampling-plan`, {
        method: 'POST',
        body: JSON.stringify({ sample_size: sampleSize }),
    })
}

export async function runAuditAgents(engagementUuid: string): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>(`/api/v1/audit-automation/engagements/${engagementUuid}/agents/run`, {
        method: 'POST',
    })
}

export async function createConfirmationRequest(
    engagementUuid: string,
    payload: { counterparty: string; confirmation_type?: string; amount?: number; due_date?: string; contact_email?: string },
): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>(`/api/v1/audit-automation/engagements/${engagementUuid}/confirmations`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export async function recordManagementResponse(
    engagementUuid: string,
    payload: { finding_code: string; response_text: string; owner?: string; target_date?: string; status?: string },
): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>(`/api/v1/audit-automation/engagements/${engagementUuid}/management-responses`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

// Approvals
export async function getApprovals(tenant: string = TENANT, jurisdiction: string = 'IN'): Promise<ApprovalResponse[]> {
    try {
        return await apiFetch<ApprovalResponse[]>(`/api/v1/approvals/${tenant}/${jurisdiction}`)
    } catch (err) {
        if (isEmptyListStatus(err)) return []
        throw err
    }
}

export async function actionApproval(requestId: string, actionType: 'APPROVED' | 'REJECTED' | 'COMMENTED', notes?: string): Promise<ApprovalResponse> {
    return apiFetch<ApprovalResponse>(`/api/v1/approvals/requests/${requestId}/actions`, {
        method: 'POST',
        body: JSON.stringify({ action_type: actionType, notes: notes ?? null, action_payload: {} }),
    })
}

// Regulatory
export async function getRegulatoryDocuments(jurisdiction: string = 'IN'): Promise<RegulatoryDoc[]> {
    try {
        return await apiFetch<RegulatoryDoc[]>(`/api/v1/regulatory/documents/${jurisdiction}`)
    } catch (err) {
        if (isEmptyListStatus(err)) return []
        throw err
    }
}

export async function promoteRegulatoryDoc(docId: number): Promise<void> {
    await apiFetch(`/api/v1/regulatory/documents/${docId}/promote`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Acknowledged via UI' }),
    })
}

export async function diffRegulatoryDocs(docId1: number, docId2: number): Promise<RegulatoryDiffResponse> {
    return apiFetch<RegulatoryDiffResponse>(`/api/v1/regulatory/updates/diff/${docId1}/${docId2}`)
}

export async function recordAIGovernanceLog(payload: AIGovernanceLogCreate): Promise<void> {
    await apiFetch('/api/v1/usas/ai-governance-logs', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export async function runBooksHealthCheck(
    engagementUuid: string,
    createClientQueries = false,
): Promise<BooksHealthRunResponse> {
    return apiFetch<BooksHealthRunResponse>(`/api/v1/readiness/engagements/${engagementUuid}/books-health`, {
        method: 'POST',
        body: JSON.stringify({ create_client_queries: createClientQueries }),
    })
}

export async function listBooksHealthChecks(engagementUuid: string): Promise<BooksHealthRunResponse[]> {
    try {
        const response = await apiFetch<BooksHealthListResponse>(`/api/v1/readiness/engagements/${engagementUuid}/books-health`)
        return response.health_checks ?? []
    } catch (err) {
        if (isEmptyListStatus(err)) return []
        throw err
    }
}

// ─── Automation Score Types ───────────────────────────────────────────────────

export interface AutomationDimension {
    label: string
    score: number    // 0–100
    weight: number    // relative weight
    automated: number
    total: number
    description: string
}

export interface AutomationScoreResponse {
    overall_score: number
    grade: string    // A+, A, A−, B+, B, C
    tenant_id: string
    jurisdiction: string
    dimensions: AutomationDimension[]
    computed_at: string
    insight: string
}

// Baseline removed to ensure all data is live from backend

export async function getAutomationScore(
    tenant: string = TENANT,
    jurisdiction: string = 'IN',
): Promise<AutomationScoreResponse | null> {
    try {
        return await apiFetch<AutomationScoreResponse>(
            `/api/v1/reporting/metrics/automation-score?tenant_id=${tenant}&jurisdiction=${jurisdiction}`
        )
    } catch (err) {
        console.warn('Backend metrics unreachable. UI should handle stale state.', err)
        return null // Return null to allow UI to show stale vs live status
    }
}

// ─── Multi-Partner Seal Session Types ────────────────────────────────────────

export type SealSessionStatus = 'PENDING' | 'PARTIALLY_SIGNED' | 'FULLY_SIGNED' | 'WITHDRAWN'
export enum PartnerRole {
    ENGAGEMENT_PARTNER = 'ENGAGEMENT_PARTNER',
    EQCR_PARTNER = 'EQCR_PARTNER',
    COMPONENT_AUDITOR = 'COMPONENT_AUDITOR',
    JOINT_AUDITOR = 'JOINT_AUDITOR',
    REGULATORY_COSIGN = 'REGULATORY_COSIGN'
}

export interface SealSignatureOut {
    id: string
    partner_user_id: string
    partner_email: string
    role: PartnerRole
    jurisdiction: string
    override_count_acknowledged: number
    override_ack_confirmed: boolean
    signature_hash: string
    signed_at: string
    withdrawn_at: string | null
}

export interface SealSessionOut {
    id: string
    engagement_id: string
    required_signatures: number
    current_signature_count: number
    status: SealSessionStatus
    frozen_at: string | null
    created_by: string
    created_at: string
    signatures: SealSignatureOut[]
    can_seal: boolean
}

export interface PreSignSummary {
    engagement_id: string
    client_name: string
    engagement_type: string
    jurisdiction: string
    final_opinion_type: string
    basis_for_opinion: string
    weight_set_version: number | null
    rule_snapshot_hash: string | null
    system_version: string
    total_transactions_evaluated: number
    total_decisions: number
    open_exceptions: number
    resolved_exceptions: number
    total_ai_overrides: number
    session_id: string
    required_signatures: number
    current_signature_count: number
    status: SealSessionStatus
    signatures: SealSignatureOut[]
}

// ─── Seal Session API Functions ───────────────────────────────────────────────

export async function createSealSession(
    engagementUuid: string,
    requiredSignatures = 2,
    createdBy = 'system',
): Promise<SealSessionOut> {
    return apiFetch<SealSessionOut>(`/api/v1/engagements/${engagementUuid}/seal-session`, {
        method: 'POST',
        body: JSON.stringify({ required_signatures: requiredSignatures, created_by: createdBy }),
    })
}

export async function getSealSession(engagementUuid: string): Promise<SealSessionOut | null> {
    try {
        return await apiFetch<SealSessionOut>(`/api/v1/engagements/${engagementUuid}/seal-session`)
    } catch (err) {
        if (isEmptyListStatus(err)) return null
        throw err
    }
}

export async function getPreSignSummary(sessionId: string): Promise<PreSignSummary | null> {
    try {
        return await apiFetch<PreSignSummary>(`/api/v1/seal-sessions/${sessionId}/pre-sign-summary`)
    } catch (err) {
        if (isEmptyListStatus(err)) return null
        throw err
    }
}

export async function signSealSession(
    sessionId: string,
    partnerUserId: string,
    partnerEmail: string,
    role: PartnerRole,
    overrideAckConfirmed: boolean,
    overrideCountAcknowledged = 0,
    jurisdiction = 'IN',
): Promise<SealSessionOut> {
    return apiFetch<SealSessionOut>(`/api/v1/seal-sessions/${sessionId}/sign`, {
        method: 'POST',
        body: JSON.stringify({
            partner_user_id: partnerUserId,
            partner_email: partnerEmail,
            role,
            jurisdiction,
            override_count_acknowledged: overrideCountAcknowledged,
            override_ack_confirmed: overrideAckConfirmed,
        }),
    })
}

export async function withdrawSignature(
    sessionId: string,
    signatureId: string,
    withdrawalReason: string,
): Promise<SealSessionOut> {
    return apiFetch<SealSessionOut>(`/api/v1/seal-sessions/${sessionId}/signatures/${signatureId}`, {
        method: 'DELETE',
        body: JSON.stringify({ withdrawal_reason: withdrawalReason }),
    })
}
export async function getAdminEvidenceLedger(): Promise<EvidenceLedgerEntry[]> {
    return apiFetch<EvidenceLedgerEntry[]>("/api/v1/admin/evidence-ledger");
}

// ─── Planning Types ───────────────────────────────────────────────────────────

export type PhaseStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED'

export interface PhaseOut {
    id: string
    engagement_id: string
    name: string
    status: PhaseStatus
    start_date: string | null
    end_date: string | null
    owner: string | null
    progress: number
}

export interface PhaseCreate {
    name: string
    status?: PhaseStatus
    start_date?: string | null
    end_date?: string | null
    owner?: string | null
    progress?: number
}

export interface TeamMemberOut {
    id: string
    engagement_id: string
    name: string
    role: string
    initials: string | null
    color: string | null
}

export interface TeamMemberCreate {
    name: string
    role: string
    initials?: string
    color?: string
}

// Planning API
export async function listPhases(engagementId: string): Promise<PhaseOut[]> {
    try {
        return await apiFetch<PhaseOut[]>(`/api/v1/engagements/${engagementId}/phases`)
    } catch (err) {
        if (isEmptyListStatus(err)) return []
        throw err
    }
}

export async function createPhase(engagementId: string, payload: PhaseCreate): Promise<PhaseOut> {
    return apiFetch<PhaseOut>(`/api/v1/engagements/${engagementId}/phases`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export async function listTeamMembers(engagementId: string): Promise<TeamMemberOut[]> {
    try {
        return await apiFetch<TeamMemberOut[]>(`/api/v1/engagements/${engagementId}/team`)
    } catch (err) {
        if (isEmptyListStatus(err)) return []
        throw err
    }
}

export interface AuditRunOut {
    id: string
    engagement_id: string
    audit_type: string
    status: string
    tenant_id: string
    jurisdiction: string
    created_at: string
}

export async function listAuditRuns(engagementId: string): Promise<AuditRunOut[]> {
    try {
        return await apiFetch<AuditRunOut[]>(`/api/v1/orchestration/engagements/${engagementId}/runs`)
    } catch (err) {
        if (isEmptyListStatus(err)) return []
        throw err
    }
}

export async function addTeamMember(engagementId: string, payload: TeamMemberCreate): Promise<TeamMemberOut> {
    return apiFetch<TeamMemberOut>(`/api/v1/engagements/${engagementId}/team`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

// ─── Controls Types & API ─────────────────────────────────────────────────────

export type ControlStatus = 'NOT_TESTED' | 'EFFECTIVE' | 'DEFICIENT' | 'COMPENSATING'
export type ControlType = 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE'

export interface ControlOut {
    id: string
    engagement_id: string
    risk_id: string | null
    title: string
    area: string
    control_type: ControlType
    frequency: string | null
    owner: string | null
    status: ControlStatus
    last_tested: string | null
}

export interface ControlCreate {
    title: string
    area: string
    control_type: ControlType
    frequency?: string
    owner?: string
    risk_id?: string
}

export interface ControlStatusUpdate {
    status: ControlStatus
}

export async function listControls(engagementId: string): Promise<ControlOut[]> {
    try {
        return await apiFetch<ControlOut[]>(`/api/v1/engagements/${engagementId}/controls`)
    } catch { return [] }
}

export async function createControl(engagementId: string, payload: ControlCreate): Promise<ControlOut> {
    return apiFetch<ControlOut>(`/api/v1/engagements/${engagementId}/controls`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export async function updateControlStatus(engagementId: string, controlId: string, payload: ControlStatusUpdate): Promise<ControlOut> {
    return apiFetch<ControlOut>(`/api/v1/engagements/${engagementId}/controls/${controlId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    })
}

// ─── Multi-Chain Blockchain ──────────────────────────────────────────────────

export interface NetworkStatus {
    connected: boolean
    network: string
    block_number?: number
    gas_price?: string
    network_id?: number
    latest_block_hash?: string
    error?: string
}

export interface AnchoredEvidence {
    id?: string
    evidence_hash: string
    networks_anchored: string[]
    timestamp?: string
    anchoring_timestamp?: string
    verification_urls?: Record<string, string>
    multi_chain_hash: string
}

export async function getMultiChainStatus(): Promise<Record<string, NetworkStatus>> {
    try {
        return await apiFetch<Record<string, NetworkStatus>>(`/api/v1/multi-chain/networks/status`)
    } catch {
        return {}
    }
}

export async function getAnchoredEvidence(): Promise<{ anchored_evidence: AnchoredEvidence[] }> {
    try {
        return await apiFetch<{ anchored_evidence: AnchoredEvidence[] }>(`/api/v1/multi-chain/anchored/evidence`)
    } catch {
        return { anchored_evidence: [] }
    }
}

export async function anchorMultiChainEvidence(hash: string, metadata: Record<string, unknown> = {}): Promise<AnchoredEvidence> {
    return apiFetch<AnchoredEvidence>(`/api/v1/multi-chain/anchor`, {
        method: 'POST',
        body: JSON.stringify({ evidence_hash: hash, metadata }),
    })
}

export async function verifyMultiChainEvidence(hash: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/v1/multi-chain/verify/${hash}`)
}
