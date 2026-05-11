'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileCheck2, Loader2, Microscope, Play, ShieldCheck } from 'lucide-react'

import {
    SpecialistAuditCatalog,
    SpecialistWorkprogram,
    getApiErrorMessage,
    getSpecialistAuditCatalog,
    getSpecialistWorkprogram,
    runSpecialistAudit,
} from '@/lib/api'
import { getUuid } from '@/lib/engagementRegistry'

const DEFAULT_CONTEXT = {
    scope: 'Engagement-specific specialist audit scope to be confirmed by the auditor.',
    systems: 'Primary systems, applications, ledgers, users, and third parties under review.',
    period: 'Current engagement period.',
    authorization: 'Written authorization and management owner required before execution.',
}

export default function SpecialistAuditsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const uuid = getUuid(id)
    const [catalog, setCatalog] = useState<SpecialistAuditCatalog | null>(null)
    const [selectedType, setSelectedType] = useState('')
    const [workprogram, setWorkprogram] = useState<SpecialistWorkprogram | null>(null)
    const [contextJson, setContextJson] = useState(JSON.stringify(DEFAULT_CONTEXT, null, 2))
    const [loadingCatalog, setLoadingCatalog] = useState(true)
    const [loadingWorkprogram, setLoadingWorkprogram] = useState(false)
    const [running, setRunning] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        async function loadCatalog() {
            setLoadingCatalog(true)
            setError(null)
            try {
                const result = await getSpecialistAuditCatalog()
                if (cancelled) return
                setCatalog(result)
                const firstType = result.audit_types[0]?.audit_type ?? ''
                setSelectedType(firstType)
            } catch (err) {
                if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load specialist audit catalog.'))
            } finally {
                if (!cancelled) setLoadingCatalog(false)
            }
        }
        void loadCatalog()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!selectedType) return
        let cancelled = false
        async function loadWorkprogram() {
            setLoadingWorkprogram(true)
            setError(null)
            setMessage(null)
            try {
                const result = await getSpecialistWorkprogram(selectedType)
                if (!cancelled) setWorkprogram(result)
            } catch (err) {
                if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load specialist workprogram.'))
            } finally {
                if (!cancelled) setLoadingWorkprogram(false)
            }
        }
        void loadWorkprogram()
        return () => {
            cancelled = true
        }
    }, [selectedType])

    const selectedEngine = useMemo(
        () => catalog?.audit_types.find(item => item.audit_type === selectedType) ?? null,
        [catalog, selectedType],
    )

    const runWorkprogram = async () => {
        if (!uuid || !selectedType) return
        setRunning(true)
        setError(null)
        setMessage(null)
        try {
            const parsedContext = parseContext(contextJson)
            const result = await runSpecialistAudit(uuid, selectedType, parsedContext)
            setWorkprogram(result.workprogram)
            setMessage(`Specialist workprogram ${result.run_id.slice(0, 8)} recorded in the audit trail.`)
        } catch (err) {
            setError(getApiErrorMessage(err, err instanceof SyntaxError ? 'Context JSON is invalid.' : 'Unable to run specialist audit workprogram.'))
        } finally {
            setRunning(false)
        }
    }

    const workprogramRows = workprogram?.test_program ?? []
    const risks = workprogram?.risk_register ?? []

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Microscope className="h-5 w-5 text-[#002776]" />
                        <h1 className="text-xl font-bold tracking-tight text-[#002776]">Specialist Audit Execution Engine</h1>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Plan and record specialist workprograms for cyber, forensic, AI, blockchain and autonomous control audits.</p>
                </div>
                <button
                    onClick={runWorkprogram}
                    disabled={running || loadingWorkprogram || !uuid || !selectedType}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#002776] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#001a54] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Run & Record Workprogram
                </button>
            </div>

            {(error || message) && (
                <div className={`rounded-lg border px-3 py-2 text-xs ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                    {error ?? message}
                </div>
            )}

            {loadingCatalog && (
                <div className="rounded-lg border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading specialist audit catalog...
                </div>
            )}

            {catalog && (
                <>
                    <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="space-y-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Audit type</label>
                                <select
                                    value={selectedType}
                                    onChange={event => setSelectedType(event.target.value)}
                                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                >
                                    {catalog.audit_types.map(engine => <option key={engine.audit_type} value={engine.audit_type}>{engine.name}</option>)}
                                </select>
                            </div>

                            {selectedEngine && (
                                <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                                    <div className="mb-1 flex items-center gap-2 font-bold text-gray-900">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                        Safe execution policy
                                    </div>
                                    <p>{selectedEngine.objective}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Scope context JSON</label>
                                <textarea
                                    value={contextJson}
                                    onChange={event => setContextJson(event.target.value)}
                                    className="mt-2 min-h-48 w-full rounded-lg border border-gray-200 p-3 font-mono text-xs"
                                    spellCheck={false}
                                />
                            </div>

                            <div className="rounded-lg border border-dashed border-gray-200 p-3 text-[11px] text-gray-500">
                                {catalog.safe_execution_policy}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {loadingWorkprogram && (
                                <div className="rounded-lg border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
                                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                                    Building workprogram preview...
                                </div>
                            )}

                            {workprogram && !loadingWorkprogram && (
                                <>
                                    <section className="grid gap-3 md:grid-cols-4">
                                        <Metric label="Tests" value={workprogram.test_program.length} />
                                        <Metric label="Evidence" value={workprogram.evidence_checklist.length} />
                                        <Metric label="Risks" value={workprogram.risk_register.length} />
                                        <Metric label="Review" value={workprogram.human_review_required ? 'Human' : 'Auto'} />
                                    </section>

                                    <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
                                        <div className="border-b border-gray-100 px-4 py-3">
                                            <h2 className="text-sm font-bold text-gray-900">{workprogram.name}</h2>
                                            <p className="mt-1 text-xs text-gray-500">{workprogram.objective}</p>
                                        </div>
                                        <div className="grid gap-4 p-4 md:grid-cols-2">
                                            <Checklist title="Specialist Roles" items={workprogram.specialist_roles} icon="role" />
                                            <Checklist title="Closure Gates" items={workprogram.closure_gates} icon="gate" />
                                        </div>
                                    </section>

                                    <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
                                        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                                            <FileCheck2 className="h-4 w-4 text-[#002776]" />
                                            <h2 className="text-sm font-bold text-gray-900">Test Program</h2>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-left text-xs">
                                                <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500">
                                                    <tr>
                                                        <th className="px-3 py-2">Ref</th>
                                                        <th className="px-3 py-2">Procedure</th>
                                                        <th className="px-3 py-2">Pass Condition</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {workprogramRows.map(row => (
                                                        <tr key={row.test_ref}>
                                                            <td className="px-3 py-2 font-mono">{row.test_ref}</td>
                                                            <td className="px-3 py-2">{row.procedure}</td>
                                                            <td className="px-3 py-2 text-gray-500">{row.pass_condition}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>

                                    <section className="rounded-lg border border-amber-100 bg-white shadow-sm">
                                        <div className="flex items-center gap-2 border-b border-amber-100 px-4 py-3">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            <h2 className="text-sm font-bold text-gray-900">Specialist Risk Register</h2>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {risks.map(risk => (
                                                <div key={risk.risk_ref} className="px-4 py-3 text-xs">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="font-bold text-gray-900">{risk.risk_ref} · {risk.title}</span>
                                                        <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-700">{risk.severity}</span>
                                                    </div>
                                                    <p className="mt-1 text-gray-500">{risk.recommended_response}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}

function parseContext(value: string): Record<string, unknown> {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new SyntaxError('Context must be a JSON object.')
    }
    return parsed as Record<string, unknown>
}

function Metric({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-lg font-black text-gray-900">{value}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
        </div>
    )
}

function Checklist({ title, items, icon }: { title: string; items: string[]; icon: 'role' | 'gate' }) {
    return (
        <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h3>
            <div className="space-y-2">
                {items.map(item => (
                    <div key={item} className="flex items-start gap-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                        {icon === 'gate' ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> : <ShieldCheck className="mt-0.5 h-4 w-4 text-[#002776]" />}
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
