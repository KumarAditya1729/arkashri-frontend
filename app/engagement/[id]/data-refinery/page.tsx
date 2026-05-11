'use client'

import { useState, useRef, use } from 'react'
import { AlertTriangle, CheckCircle2, DatabaseZap, FileSpreadsheet, Loader2, Upload } from 'lucide-react'

import {
    DataRefineryPreview,
    DataRefinerySourceType,
    getApiErrorMessage,
    ingestDataRefineryCsv,
    previewDataRefineryCsv,
} from '@/lib/api'
import { getUuid } from '@/lib/engagementRegistry'

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
    const [preview, setPreview] = useState<DataRefineryPreview | null>(null)
    const [mapping, setMapping] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [ingesting, setIngesting] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const runPreview = async (selectedFile: File, currentMapping?: Record<string, string>) => {
        setLoading(true)
        setError(null)
        setMessage(null)
        try {
            const result = await previewDataRefineryCsv(selectedFile, sourceType, currentMapping)
            setPreview(result)
            setMapping(result.suggested_mapping)
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to preview raw data.'))
        } finally {
            setLoading(false)
        }
    }

    const handleFile = async (selected: File | undefined) => {
        if (!selected) return
        setFile(selected)
        await runPreview(selected)
    }

    const updateMapping = async (field: string, value: string) => {
        const next = { ...mapping, [field]: value }
        setMapping(next)
        if (file) await runPreview(file, next)
    }

    const ingest = async () => {
        if (!uuid || !file) {
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

    const headers = preview?.headers ?? []
    const topIssues = preview?.issues.slice(0, 8) ?? []
    const rows = preview?.normalized_preview.slice(0, 8) ?? []

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <DatabaseZap className="h-5 w-5 text-[#002776]" />
                        <h1 className="text-xl font-bold text-[#002776] tracking-tight">Audit Data Refinery</h1>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Convert messy CSV exports into clean, classified, audit-ready transaction rows.</p>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#002776] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#001a54]"
                >
                    <Upload className="h-4 w-4" /> Upload CSV
                </button>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={event => handleFile(event.target.files?.[0])} />
            </div>

            {(error || message) && (
                <div className={`rounded-lg border px-3 py-2 text-xs ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                    {error ?? message}
                </div>
            )}

            <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="space-y-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Source type</label>
                        <select
                            value={sourceType}
                            onChange={event => {
                                const next = event.target.value as DataRefinerySourceType
                                setSourceType(next)
                                if (file) void previewDataRefineryCsv(file, next, mapping).then(setPreview).catch(err => setError(getApiErrorMessage(err)))
                            }}
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            {SOURCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </div>

                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
                        <FileSpreadsheet className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-xs font-semibold text-gray-700">{file?.name ?? 'No CSV selected'}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">Excel exports should be saved as CSV first</p>
                    </div>

                    {preview && (
                        <>
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <Metric label="Rows" value={preview.total_rows} />
                                <Metric label="Ready" value={preview.audit_ready_rows} />
                                <Metric label="Score" value={preview.readiness_score} />
                                <Metric label="Issues" value={preview.issues.length} />
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2 text-[10px] text-gray-500 break-all">
                                Source hash: {preview.source_file_hash}
                            </div>
                        </>
                    )}

                    <button
                        onClick={ingest}
                        disabled={!preview?.can_ingest || !uuid || !file || ingesting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Ingest Audit-Ready Rows
                    </button>
                </div>

                <div className="space-y-4">
                    {loading && (
                        <div className="rounded-lg border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
                            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Reading and classifying raw data...
                        </div>
                    )}

                    {preview && (
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

                            {topIssues.length > 0 && (
                                <div className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm">
                                    <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900"><AlertTriangle className="h-4 w-4 text-amber-500" /> Data Quality Issues</h2>
                                    <div className="mt-3 divide-y divide-gray-100">
                                        {topIssues.map((issue, index) => (
                                            <div key={`${issue.title}-${index}`} className="py-2 text-xs">
                                                <span className="font-bold text-gray-900">{issue.severity}</span>
                                                <span className="text-gray-500"> · {issue.row_number ? `Row ${issue.row_number}` : 'Mapping'} · {issue.title}</span>
                                                <p className="mt-1 text-gray-500">{issue.recommended_action}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                        </>
                    )}
                </div>
            </section>
        </div>
    )
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-gray-100 bg-white p-3">
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
        </div>
    )
}
