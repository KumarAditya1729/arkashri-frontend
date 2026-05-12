'use client'

import { useState, useRef, use } from 'react'
import { AlertTriangle, CheckCircle2, DatabaseZap, FileSpreadsheet, FileText, Loader2, ScanText, Upload, Wand2 } from 'lucide-react'
import { AlertBanner, LoadingPanel, MetricCard, PageHeader, SectionCard, StatusPill } from '@/components/ui/enterprise'

import {
    DataRefineryPreview,
    DataRefinerySourceType,
    ExcelRefineryPreview,
    PdfBankStatementIntake,
    extractBankStatementPdf,
    getApiErrorMessage,
    ingestDataRefineryCsv,
    previewBankStatementPdf,
    previewDataRefineryCsv,
    previewDataRefineryExcel,
} from '@/lib/api'
import { getUuid } from '@/lib/engagementRegistry'

type FileMode = 'csv' | 'excel' | 'pdf'

const SOURCE_OPTIONS: { value: DataRefinerySourceType; label: string }[] = [
    { value: 'books_ledger', label: 'Books ledger' },
    { value: 'bank_statement', label: 'Bank statement' },
    { value: 'sales_register', label: 'Sales register' },
    { value: 'purchase_register', label: 'Purchase register' },
    { value: 'generic_ledger', label: 'Generic ledger' },
]

const FIELD_LABELS: Record<string, string> = {
    date: 'Date',
    reference: 'Reference',
    description: 'Narration',
    debit: 'Debit',
    credit: 'Credit',
    amount: 'Amount',
    account_name: 'Ledger',
    counterparty: 'Party',
    gstin: 'GSTIN',
    tax_amount: 'Tax',
    currency: 'Currency',
}

export default function DataRefineryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const uuid = getUuid(id)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [sourceType, setSourceType] = useState<DataRefinerySourceType>('books_ledger')
    const [file, setFile] = useState<File | null>(null)
    const [fileMode, setFileMode] = useState<FileMode>('csv')
    const [csvPreview, setCsvPreview] = useState<DataRefineryPreview | null>(null)
    const [excelPreview, setExcelPreview] = useState<ExcelRefineryPreview | null>(null)
    const [pdfPreview, setPdfPreview] = useState<PdfBankStatementIntake | null>(null)
    const [pdfExtraction, setPdfExtraction] = useState<Record<string, unknown> | null>(null)
    const [mapping, setMapping] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [ingesting, setIngesting] = useState(false)
    const [extracting, setExtracting] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const resetPreviews = () => {
        setCsvPreview(null)
        setExcelPreview(null)
        setPdfPreview(null)
        setPdfExtraction(null)
    }

    const detectFileMode = (selectedFile: File): FileMode => {
        const name = selectedFile.name.toLowerCase()
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel'
        if (name.endsWith('.pdf')) return 'pdf'
        return 'csv'
    }

    const runPreview = async (
        selectedFile: File,
        mode: FileMode,
        currentSourceType = sourceType,
        currentMapping?: Record<string, string>,
    ) => {
        setLoading(true)
        setError(null)
        setMessage(null)
        resetPreviews()
        try {
            if (mode === 'excel') {
                const result = await previewDataRefineryExcel(selectedFile, currentSourceType)
                setExcelPreview(result)
            } else if (mode === 'pdf') {
                const result = await previewBankStatementPdf(selectedFile)
                setPdfPreview(result)
                setSourceType('bank_statement')
            } else {
                const result = await previewDataRefineryCsv(selectedFile, currentSourceType, currentMapping)
                setCsvPreview(result)
                setMapping(result.suggested_mapping)
            }
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to preview raw data.'))
        } finally {
            setLoading(false)
        }
    }

    const handleFile = async (selected: File | undefined) => {
        if (!selected) return
        const mode = detectFileMode(selected)
        setFile(selected)
        setFileMode(mode)
        setMapping({})
        await runPreview(selected, mode, mode === 'pdf' ? 'bank_statement' : sourceType)
    }

    const updateSourceType = async (next: DataRefinerySourceType) => {
        setSourceType(next)
        if (file && fileMode !== 'pdf') await runPreview(file, fileMode, next, mapping)
    }

    const updateMapping = async (field: string, value: string) => {
        const next = { ...mapping, [field]: value }
        setMapping(next)
        if (file && fileMode === 'csv') await runPreview(file, 'csv', sourceType, next)
    }

    const ingest = async () => {
        if (!uuid || !file || fileMode !== 'csv') {
            setError('A live engagement and CSV file are required before ingestion.')
            return
        }
        setIngesting(true)
        setError(null)
        setMessage(null)
        try {
            const result = await ingestDataRefineryCsv(uuid, file, sourceType, mapping)
            setMessage(`${result.records_ingested} audit-ready row(s) ingested. Batch ${result.batch_id.slice(0, 8)} recorded with ${result.duplicate_refs.length} duplicate(s) skipped.`)
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to ingest refined data.'))
        } finally {
            setIngesting(false)
        }
    }

    const extractPdf = async () => {
        if (!file || fileMode !== 'pdf') return
        setExtracting(true)
        setError(null)
        setMessage(null)
        try {
            const result = await extractBankStatementPdf(file)
            setPdfExtraction(result)
            setMessage('Bank statement OCR extraction completed and returned for auditor review.')
        } catch (err) {
            setError(getApiErrorMessage(err, 'PDF OCR extraction is not configured on this backend yet.'))
        } finally {
            setExtracting(false)
        }
    }

    const headers = csvPreview?.headers ?? []
    const topIssues = csvPreview?.issues.slice(0, 8) ?? []
    const rows = csvPreview?.normalized_preview.slice(0, 8) ?? []
    const suggestions = csvPreview?.cleaning_suggestions ?? []
    const canIngestCsv = fileMode === 'csv' && !!csvPreview?.can_ingest

    return (
        <div className="space-y-6">
            <PageHeader
                icon={DatabaseZap}
                title="Audit Data Refinery"
                description="Convert messy CSV, Excel and bank statement files into audit-ready rows with mapping, scoring, quality issues and CA review gates."
                meta={
                    <>
                        <StatusPill tone={file ? 'green' : 'amber'}>{file ? fileMode.toUpperCase() : 'No file selected'}</StatusPill>
                        <StatusPill tone="blue">100 MB intake limit</StatusPill>
                    </>
                }
                actions={
                    <>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#002776] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#001a54]"
                        >
                            <Upload className="h-4 w-4" /> Upload File
                        </button>
                        <input ref={fileInputRef} type="file" accept=".csv,text/csv,.xlsx,.xls,.pdf,application/pdf" className="hidden" onChange={event => handleFile(event.target.files?.[0])} />
                    </>
                }
            />

            {(error || message) && (
                <AlertBanner tone={error ? 'red' : 'green'}>{error ?? message}</AlertBanner>
            )}

            <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <SectionCard title="Intake Controls" description="Choose source type, inspect readiness, then ingest only approved CSV rows." icon={Wand2}>
                <div className="space-y-4 p-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Source type</label>
                        <select
                            value={sourceType}
                            onChange={event => void updateSourceType(event.target.value as DataRefinerySourceType)}
                            disabled={fileMode === 'pdf'}
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-100"
                        >
                            {SOURCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </div>

                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
                        {fileMode === 'pdf' ? <FileText className="mx-auto h-8 w-8 text-gray-400" /> : <FileSpreadsheet className="mx-auto h-8 w-8 text-gray-400" />}
                        <p className="mt-2 text-xs font-semibold text-gray-700">{file?.name ?? 'No file selected'}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">CSV ingestion, Excel preview, PDF bank statement OCR gate</p>
                    </div>

                    {csvPreview && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <MetricCard label="Rows" value={csvPreview.total_rows} />
                                <MetricCard label="Ready" value={csvPreview.audit_ready_rows} tone="green" />
                                <MetricCard label="Score" value={csvPreview.readiness_score} />
                                <MetricCard label="Issues" value={csvPreview.issues.length} tone="amber" />
                            </div>
                            <HashBox hash={csvPreview.source_file_hash} />
                        </>
                    )}

                    {excelPreview && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <MetricCard label="Sheets" value={excelPreview.sheet_count} />
                                <MetricCard label="Rows" value={excelPreview.total_rows} />
                                <MetricCard label="Ready" value={excelPreview.audit_ready_rows} tone="green" />
                                <MetricCard label="Score" value={excelPreview.readiness_score} />
                            </div>
                            <HashBox hash={excelPreview.source_file_hash} />
                        </>
                    )}

                    {pdfPreview && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <MetricCard label="Status" value={pdfPreview.status} />
                                <MetricCard label="OCR" value={pdfPreview.ocr_provider ?? 'Pending'} />
                                <MetricCard label="Review" value={pdfPreview.human_review_required ? 'Yes' : 'No'} tone="amber" />
                                <MetricCard label="Ingest" value={pdfPreview.can_ingest ? 'Ready' : 'Gate'} tone={pdfPreview.can_ingest ? 'green' : 'amber'} />
                            </div>
                            <HashBox hash={pdfPreview.source_file_hash} />
                        </>
                    )}

                    <button
                        onClick={ingest}
                        disabled={!canIngestCsv || !uuid || !file || ingesting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Ingest CSV Audit-Ready Rows
                    </button>

                    {fileMode === 'pdf' && (
                        <button
                            onClick={extractPdf}
                            disabled={!file || extracting}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                        >
                            {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
                            Run PDF OCR Extract
                        </button>
                    )}
                </div>
                </SectionCard>

                <div className="space-y-4">
                    {loading && (
                        <LoadingPanel label="Reading and classifying raw data" />
                    )}

                    {csvPreview && (
                        <>
                            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                                <h2 className="text-sm font-bold text-gray-900">Column Mapping</h2>
                                <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(FIELD_LABELS).map(([field, label]) => (
                                        <label key={field} className="text-xs">
                                            <span className="font-semibold text-gray-600">{label}</span>
                                            <select
                                                value={mapping[field] ?? ''}
                                                onChange={event => updateMapping(field, event.target.value)}
                                                className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5"
                                            >
                                                <option value="">Not mapped</option>
                                                {headers.map(header => <option key={header} value={header}>{header}</option>)}
                                            </select>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <IssueList issues={topIssues} />
                            <SuggestionList suggestions={suggestions} />
                            <PreviewTable rows={rows} />
                        </>
                    )}

                    {excelPreview && (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                                Excel workbook preview is connected to backend. Backend ingestion is CSV-only today, so convert the chosen sheet to CSV before final ingestion.
                            </div>
                            {excelPreview.sheets.map(sheet => (
                                <div key={sheet.sheet_name} className="rounded-lg border border-gray-100 bg-white shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                                        <div>
                                            <h2 className="text-sm font-bold text-gray-900">{sheet.sheet_name}</h2>
                                            <p className="text-xs text-gray-500">{sheet.total_rows} rows · {sheet.audit_ready_rows} ready · score {sheet.readiness_score} · header row {sheet.header_row_number ?? 1}</p>
                                        </div>
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase text-gray-600">{sheet.issues.length} issue(s)</span>
                                    </div>
                                    <SuggestionList suggestions={sheet.cleaning_suggestions ?? []} compact />
                                    <PreviewTable rows={sheet.normalized_preview.slice(0, 6)} />
                                </div>
                            ))}
                        </div>
                    )}

                    {pdfPreview && (
                        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900">PDF Bank Statement Intake</h2>
                            <p className="mt-2 text-xs text-gray-500">{pdfPreview.recommended_action}</p>
                            {pdfExtraction && (
                                <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100">
                                    {JSON.stringify(pdfExtraction, null, 2)}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

function SuggestionList({ suggestions, compact = false }: { suggestions: { type: string; title: string; action: string }[]; compact?: boolean }) {
    if (suggestions.length === 0) return null
    return (
        <div className={`${compact ? 'border-b border-gray-100 px-4 py-3' : 'rounded-lg border border-blue-100 bg-white p-4 shadow-sm'}`}>
            <h2 className="text-sm font-bold text-gray-900">Cleaning Suggestions</h2>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
                {suggestions.map((suggestion, index) => (
                    <div key={`${suggestion.title}-${index}`} className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs">
                        <div className="font-bold text-blue-950">{suggestion.title}</div>
                        <p className="mt-1 text-blue-800">{suggestion.action}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function HashBox({ hash }: { hash: string }) {
    return <div className="rounded-lg bg-gray-50 p-2 text-[10px] text-gray-500 break-all">Source hash: {hash}</div>
}

function IssueList({ issues }: { issues: DataRefineryPreview['issues'] }) {
    if (issues.length === 0) return null
    return (
        <div className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900"><AlertTriangle className="h-4 w-4 text-amber-500" /> Data Quality Issues</h2>
            <div className="mt-3 divide-y divide-gray-100">
                {issues.map((issue, index) => (
                    <div key={`${issue.title}-${index}`} className="py-2 text-xs">
                        <span className="font-bold text-gray-900">{issue.severity}</span>
                        <span className="text-gray-500"> · {issue.row_number ? `Row ${issue.row_number}` : 'Mapping'} · {issue.title}</span>
                        <p className="mt-1 text-gray-500">{issue.recommended_action}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function PreviewTable({ rows }: { rows: Record<string, unknown>[] }) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-gray-900">Audit-Ready Preview</div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                    <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500">
                        <tr>
                            {['date', 'ref', 'description', 'signed_amount', 'mapped_category', 'risk_flags'].map(column => <th key={column} className="px-3 py-2">{column}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row, index) => (
                            <tr key={index}>
                                <td className="px-3 py-2">{String(row.date ?? '')}</td>
                                <td className="px-3 py-2 font-mono">{String(row.ref ?? '')}</td>
                                <td className="max-w-xs truncate px-3 py-2">{String(row.description ?? '')}</td>
                                <td className="px-3 py-2">{String(row.signed_amount ?? '')}</td>
                                <td className="px-3 py-2">{String(row.mapped_category ?? '')}</td>
                                <td className="px-3 py-2">{Array.isArray(row.risk_flags) ? row.risk_flags.join(', ') : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
