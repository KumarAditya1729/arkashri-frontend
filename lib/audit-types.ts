export type AuditSlaStatus = 'On Track' | 'At Risk' | 'Delayed' | 'Completed'

export interface AuditTimelineStage {
    day: number
    title: string
    description: string
}

export interface AuditTypeDefinition {
    slug: string
    title: string
    backendType: string
    shortDescription: string
    expectedCompletionDays: 7
    requiredDocuments: string[]
    checklistItems: string[]
    timeline: AuditTimelineStage[]
}

export const SEVEN_DAY_AUDIT_TIMELINE: AuditTimelineStage[] = [
    { day: 1, title: 'Client onboarding and document request', description: 'Confirm scope, independence, KYC and request the first evidence pack.' },
    { day: 2, title: 'Tally, Excel or GST data import', description: 'Import trial balance, ledgers, vouchers and available statutory data.' },
    { day: 3, title: 'Ledger mapping and risk checks', description: 'Map ledgers to audit areas and flag material, unusual or incomplete items.' },
    { day: 4, title: 'Evidence collection and audit checklist', description: 'Collect support, link evidence and complete the audit-type checklist.' },
    { day: 5, title: 'Workpaper preparation', description: 'Prepare working papers, schedules, observations and exception summaries.' },
    { day: 6, title: 'Partner review and issue resolution', description: 'Resolve open points, evidence gaps and review comments before reporting.' },
    { day: 7, title: 'Report generation, UDIN, seal and share', description: 'Generate draft report, attach UDIN where applicable, seal and share.' },
]

export const AUDIT_TYPE_DEFINITIONS: AuditTypeDefinition[] = [
    {
        slug: 'statutory-audit',
        title: 'Statutory Audit',
        backendType: 'STATUTORY_AUDIT',
        shortDescription: 'Companies Act audit workflow with SA-aligned planning, evidence, CARO readiness and report sign-off.',
        expectedCompletionDays: 7,
        requiredDocuments: [
            'Audited financial statements draft',
            'Trial balance and general ledger',
            'Board minutes and statutory registers',
            'Bank statements and confirmations',
            'CARO 2020 supporting schedules',
            'Management representation draft',
        ],
        checklistItems: [
            'Engagement acceptance and SA 210 terms documented',
            'Materiality, risk assessment and SA 315 procedures completed',
            'Substantive procedures linked to evidence under SA 500',
            'Analytical review completed under SA 520',
            'Related party procedures completed under SA 550',
            'CARO 2020 clause responses prepared',
            'Audit report draft reviewed with UDIN and seal step ready',
        ],
        timeline: SEVEN_DAY_AUDIT_TIMELINE,
    },
    {
        slug: 'tax-audit',
        title: 'Tax Audit',
        backendType: 'TAX_AUDIT',
        shortDescription: 'Income Tax Act audit flow for Form 3CA/3CB and Form 3CD with reconciliations and disallowance checks.',
        expectedCompletionDays: 7,
        requiredDocuments: [
            'Form 3CA/3CB and 3CD prior year copy',
            'Final trial balance and ledger dump',
            'Tax computation and depreciation schedule',
            'TDS/TCS returns and challans',
            'GST turnover reconciliation',
            'Related party and loan confirmations',
        ],
        checklistItems: [
            'Form 3CA/3CB applicability confirmed',
            'Form 3CD clause-wise data captured',
            'P&L and balance sheet figures reconciled',
            'TDS/TCS compliance and expense disallowance checked',
            'GST turnover reconciled with books',
            'Depreciation and fixed asset additions verified',
            'Related party and loan/deposit disclosures reviewed',
        ],
        timeline: SEVEN_DAY_AUDIT_TIMELINE,
    },
    {
        slug: 'gst-audit-reconciliation',
        title: 'GST Audit / GST Reconciliation',
        backendType: 'COMPLIANCE_AUDIT',
        shortDescription: 'GST books-vs-return reconciliation for sales, ITC, e-way bills, HSN and tax liability mismatches.',
        expectedCompletionDays: 7,
        requiredDocuments: [
            'Sales and purchase ledgers',
            'GSTR-1, GSTR-3B and GSTR-2B/2A downloads',
            'E-way bill reports',
            'HSN/SAC summary',
            'RCM and credit note workings',
            'Vendor GSTIN master',
        ],
        checklistItems: [
            'GSTR-1 reconciled with sales ledger',
            'GSTR-3B reconciled with books and tax ledgers',
            'ITC matched against GSTR-2B/2A',
            'E-way bill exceptions reviewed',
            'HSN/SAC summary checked',
            'Tax liability and credit note mismatches classified',
            'Vendor GSTIN validation exceptions listed',
        ],
        timeline: SEVEN_DAY_AUDIT_TIMELINE,
    },
    {
        slug: 'internal-audit',
        title: 'Internal Audit',
        backendType: 'INTERNAL_AUDIT',
        shortDescription: 'Process, controls and exception testing workflow for recurring internal audit cycles.',
        expectedCompletionDays: 7,
        requiredDocuments: [
            'Process narratives and SOPs',
            'Delegation of authority matrix',
            'Sample transaction population',
            'Prior internal audit report',
            'Management action tracker',
            'Access and approval logs',
        ],
        checklistItems: [
            'Process scope and control owners confirmed',
            'Risk-control matrix prepared',
            'Sample selections documented',
            'Control operating effectiveness tested',
            'Exceptions rated by severity and owner',
            'Management responses captured',
            'Final action tracker prepared for review',
        ],
        timeline: SEVEN_DAY_AUDIT_TIMELINE,
    },
    {
        slug: 'stock-audit',
        title: 'Stock Audit',
        backendType: 'INVENTORY_AUDIT',
        shortDescription: 'Inventory verification and bank drawing-power support with ageing, valuation and damaged-stock checks.',
        expectedCompletionDays: 7,
        requiredDocuments: [
            'Stock statement as submitted to bank',
            'Inventory ledger and item master',
            'Physical verification report',
            'Inventory ageing report',
            'Purchase and sales cut-off samples',
            'Sanction letter and drawing power workings',
        ],
        checklistItems: [
            'Stock statement agreed with books',
            'Physical verification differences reviewed',
            'Inventory ageing and slow-moving items identified',
            'Valuation method and NRV checks completed',
            'Damaged or obsolete stock provision reviewed',
            'Drawing power calculation recomputed',
            'Bank reporting exceptions summarized',
        ],
        timeline: SEVEN_DAY_AUDIT_TIMELINE,
    },
    {
        slug: 'bank-loan-audit',
        title: 'Bank / Loan Audit',
        backendType: 'FINANCIAL_AUDIT',
        shortDescription: 'Loan account, security, covenant and utilization review for lender or borrower audit support.',
        expectedCompletionDays: 7,
        requiredDocuments: [
            'Loan sanction letter and amendments',
            'Bank statements and loan account ledger',
            'Security and collateral documents',
            'Covenant compliance certificate',
            'Stock/debtor statements submitted to bank',
            'Interest and repayment schedules',
        ],
        checklistItems: [
            'Loan terms and facility limits captured',
            'Interest and repayment schedule recomputed',
            'Security documents and insurance checked',
            'Covenant compliance reviewed',
            'End-use and fund-flow exceptions identified',
            'Stock/debtor statements reconciled',
            'Loan audit observations prepared for partner review',
        ],
        timeline: SEVEN_DAY_AUDIT_TIMELINE,
    },
]

const TITLE_BY_BACKEND_TYPE = new Map(AUDIT_TYPE_DEFINITIONS.map(auditType => [auditType.backendType, auditType.title]))
const DEFINITION_BY_TITLE = new Map(AUDIT_TYPE_DEFINITIONS.map(auditType => [auditType.title, auditType]))
const DEFINITION_BY_BACKEND_TYPE = new Map(AUDIT_TYPE_DEFINITIONS.map(auditType => [auditType.backendType, auditType]))

export function normalizeAuditTypeTitle(rawType: string | null | undefined): string {
    if (!rawType) return AUDIT_TYPE_DEFINITIONS[0].title
    if (DEFINITION_BY_TITLE.has(rawType)) return rawType

    const upper = rawType.toUpperCase()
    const mappedTitle = TITLE_BY_BACKEND_TYPE.get(upper)
    if (mappedTitle) return mappedTitle

    return rawType
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map(word => word[0]?.toUpperCase() + word.slice(1))
        .join(' ')
}

export function getAuditTypeDefinition(rawType: string | null | undefined): AuditTypeDefinition {
    const normalizedTitle = normalizeAuditTypeTitle(rawType)
    return DEFINITION_BY_TITLE.get(normalizedTitle)
        ?? DEFINITION_BY_BACKEND_TYPE.get(rawType?.toUpperCase() ?? '')
        ?? AUDIT_TYPE_DEFINITIONS[0]
}

export function getAuditTypeBySlug(slug: string): AuditTypeDefinition | undefined {
    return AUDIT_TYPE_DEFINITIONS.find(auditType => auditType.slug === slug)
}

export function getAuditDay(startDate?: string | null, now = new Date()): number {
    if (!startDate) return 3

    const startedAt = new Date(startDate)
    if (Number.isNaN(startedAt.getTime())) return 3

    const elapsedMs = now.getTime() - startedAt.getTime()
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1
    return Math.min(7, Math.max(1, elapsedDays))
}

export function getSlaStatus(input: {
    status?: string | null
    startDate?: string | null
    evidencePending?: boolean
    reviewPending?: boolean
    reportGenerated?: boolean
    now?: Date
}): AuditSlaStatus {
    const status = input.status?.toUpperCase()
    if (status === 'COMPLETED' || status === 'SEALED' || input.reportGenerated) return 'Completed'

    const day = getAuditDay(input.startDate, input.now)
    if (day >= 7) return 'Delayed'
    const hasPendingWork = (input.evidencePending ?? true) || (input.reviewPending ?? true)
    if (day >= 6 && hasPendingWork) return 'At Risk'
    return 'On Track'
}

export const SLA_STATUS_STYLES: Record<AuditSlaStatus, string> = {
    'On Track': 'bg-blue-50 text-blue-700 border-blue-200',
    'At Risk': 'bg-amber-50 text-amber-700 border-amber-200',
    Delayed: 'bg-red-50 text-red-700 border-red-200',
    Completed: 'bg-green-50 text-green-700 border-green-200',
}
