'use client'

import { use, useEffect, useState } from 'react'
import { Building2, Database, FileInput, Landmark, Loader2, Plug, RefreshCw, ShieldCheck } from 'lucide-react'

import {
    GSTReconciliationList,
    MCASnapshot,
    TallySummary,
    enrichMcaCompanyMaster,
    getApiErrorMessage,
    getGstReconciliations,
    getMcaCompanyMaster,
    getTallySummary,
    importTallyTrialBalance,
    importTallyVouchers,
    runGstReconciliation,
} from '@/lib/api'
import { getUuid } from '@/lib/engagementRegistry'

const SAMPLE_GST_RECORDS = JSON.stringify([
    {
        invoice_no: 'INV-001',
        gstin: '27ABCDE1234F1Z5',
        taxable_value: 100000,
        tax_amount: 18000,
        period: '2026-04',
    },
], null, 2)

export default function EngagementIntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const uuid = getUuid(id)
    const [tallySummary, setTallySummary] = useState<TallySummary | null>(null)
    const [gstList, setGstList] = useState<GSTReconciliationList | null>(null)
    const [mcaSnapshot, setMcaSnapshot] = useState<MCASnapshot | null>(null)
    const [rawXml, setRawXml] = useState('')
    const [gstJson, setGstJson] = useState(SAMPLE_GST_RECORDS)
    const [gstType, setGstType] = useState<'gstr1-vs-books' | 'gstr2b-vs-itc'>('gstr1-vs-books')
    const [cin, setCin] = useState('')
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const loadSnapshots = async () => {
        if (!uuid) {
            setError('Live engagement UUID is required.')
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        const [tally, gst, mca] = await Promise.allSettled([
            getTallySummary(uuid),
            getGstReconciliations(uuid),
            getMcaCompanyMaster(uuid),
        ])
        if (tally.status === 'fulfilled') setTallySummary(tally.value)
        if (gst.status === 'fulfilled') setGstList(gst.value)
        if (mca.status === 'fulfilled') setMcaSnapshot(mca.value)
        setLoading(false)
    }

    useEffect(() => {
        void loadSnapshots()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uuid])

    const runTallyImport = async (kind: 'trial-balance' | 'vouchers') => {
        if (!uuid) return
        setBusy(kind)
        setError(null)
        setMessage(null)
        try {
            const payload = rawXml.trim() ? { raw_xml: rawXml.trim() } : {}
            const result = kind === 'trial-balance'
                ? await importTallyTrialBalance(uuid, payload)
                : await importTallyVouchers(uuid, payload)
            setMessage(`${result.import_type} import completed from ${result.source}.`)
            await loadSnapshots()
        } catch (err) {
            setError(getApiErrorMessage(err, `Unable to import Tally ${kind}.`))
        } finally {
            setBusy(null)
        }
    }

    const reconcileGst = async () => {
        if (!uuid) return
        setBusy('gst')
        setError(null)
        setMessage(null)
        try {
            const parsed = JSON.parse(gstJson)
            if (!Array.isArray(parsed)) throw new SyntaxError('GST portal records must be an array.')
            const result = await runGstReconciliation(uuid, gstType, parsed as Record<string, unknown>[])
            setMessage(`${result.recon_type} completed with ${result.mismatches.length} mismatch(es).`)
            await loadSnapshots()
        } catch (err) {
            setError(getApiErrorMessage(err, err instanceof SyntaxError ? 'GST JSON must be a valid array of portal records.' : 'Unable to run GST reconciliation.'))
        } finally {
            setBusy(null)
        }
    }

    const enrichMca = async () => {
        if (!uuid) return
        setBusy('mca')
        setError(null)
        setMessage(null)
        try {
            const result = await enrichMcaCompanyMaster(uuid, { cin: cin.trim() })
            setMcaSnapshot(result)
            setMessage('MCA company master snapshot linked to engagement.')
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to enrich MCA company master.'))
        } finally {
            setBusy(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Plug className="h-5 w-5 text-[#002776]" />
                        <h1 className="text-xl font-bold tracking-tight text-[#002776]">ERP, GST & MCA Integrations</h1>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Bring Tally data, GST portal records and MCA company master checks into this engagement.</p>
                </div>
                <button
                    onClick={() => void loadSnapshots()}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:bg-gray-100"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </button>
            </div>

            {(error || message) && (
                <div className={`rounded-lg border px-3 py-2 text-xs ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                    {error ?? message}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-[#002776]" />
                        <h2 className="text-sm font-bold text-gray-900">Tally Import</h2>
                    </div>
                    <textarea
                        value={rawXml}
                        onChange={event => setRawXml(event.target.value)}
                        placeholder="Paste Tally XML payload, or leave blank to use configured connection."
                        className="mt-3 min-h-44 w-full rounded-lg border border-gray-200 p-3 font-mono text-xs"
                        spellCheck={false}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                        <ActionButton label="Import Trial Balance" busy={busy === 'trial-balance'} icon="file" onClick={() => runTallyImport('trial-balance')} />
                        <ActionButton label="Import Vouchers" busy={busy === 'vouchers'} icon="file" onClick={() => runTallyImport('vouchers')} />
                    </div>
                    <Snapshot title="Latest Tally Summary" data={tallySummary?.imports} />
                </div>

                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-[#002776]" />
                        <h2 className="text-sm font-bold text-gray-900">GST Reconciliation</h2>
                    </div>
                    <select
                        value={gstType}
                        onChange={event => setGstType(event.target.value as 'gstr1-vs-books' | 'gstr2b-vs-itc')}
                        className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                        <option value="gstr1-vs-books">GSTR-1 vs Books</option>
                        <option value="gstr2b-vs-itc">GSTR-2B vs ITC</option>
                    </select>
                    <textarea
                        value={gstJson}
                        onChange={event => setGstJson(event.target.value)}
                        className="mt-3 min-h-44 w-full rounded-lg border border-gray-200 p-3 font-mono text-xs"
                        spellCheck={false}
                    />
                    <div className="mt-3">
                        <ActionButton label="Run GST Reconciliation" busy={busy === 'gst'} icon="shield" onClick={reconcileGst} />
                    </div>
                    <Snapshot title="GST Reconciliation History" data={gstList?.reconciliations} />
                </div>

                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#002776]" />
                        <h2 className="text-sm font-bold text-gray-900">MCA Company Master</h2>
                    </div>
                    <label className="mt-3 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Corporate Identification Number</label>
                    <input
                        value={cin}
                        onChange={event => setCin(event.target.value.toUpperCase())}
                        placeholder="21-character CIN"
                        maxLength={21}
                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm"
                    />
                    <div className="mt-3">
                        <ActionButton label="Fetch MCA Master" busy={busy === 'mca'} icon="shield" onClick={enrichMca} disabled={cin.trim().length !== 21} />
                    </div>
                    <Snapshot title="MCA Snapshot" data={mcaSnapshot?.mca_company_master} />
                </div>
            </section>
        </div>
    )
}

function ActionButton({
    label,
    busy,
    onClick,
    disabled = false,
    icon,
}: {
    label: string
    busy: boolean
    onClick: () => void
    disabled?: boolean
    icon: 'file' | 'shield'
}) {
    const Icon = icon === 'file' ? FileInput : ShieldCheck
    return (
        <button
            onClick={onClick}
            disabled={busy || disabled}
            className="inline-flex items-center gap-2 rounded-lg bg-[#002776] px-3 py-2 text-xs font-bold text-white hover:bg-[#001a54] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {label}
        </button>
    )
}

function Snapshot({ title, data }: { title: string; data: Record<string, unknown> | undefined }) {
    return (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</div>
            {data ? (
                <pre className="max-h-64 overflow-auto text-xs text-gray-700">{JSON.stringify(data, null, 2)}</pre>
            ) : (
                <p className="text-xs text-gray-400">No live snapshot returned yet.</p>
            )}
        </div>
    )
}
