'use client'

import { use, useEffect, useState } from 'react'
import { AlertTriangle, BrainCircuit, CheckCircle2, FileCheck, Loader2, Play, ShieldCheck } from 'lucide-react'
import { AlertBanner, EmptyState, LoadingPanel, MetricCard, PageHeader, SectionCard, StatusPill } from '@/components/ui/enterprise'

import {
    AuditAutomationPack,
    createConfirmationRequest,
    createAuditSamplingPlan,
    getApiErrorMessage,
    getAuditAutomationPack,
    recordManagementResponse,
    runAuditAgents,
    runAuditAutomationPack,
} from '@/lib/api'
import { getUuid } from '@/lib/engagementRegistry'

export default function AutomationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const uuid = getUuid(id)
    const [pack, setPack] = useState<AuditAutomationPack | null>(null)
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [auxRunning, setAuxRunning] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        async function loadPack() {
            if (!uuid) {
                setError('Live engagement UUID is required.')
                setLoading(false)
                return
            }
            setLoading(true)
            setError(null)
            try {
                const result = await getAuditAutomationPack(uuid)
                if (!cancelled) setPack(result)
            } catch (err) {
                if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load automation pack.'))
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        void loadPack()
        return () => {
            cancelled = true
        }
    }, [uuid])

    const runAutomation = async () => {
        if (!uuid) return
        setRunning(true)
        setError(null)
        setMessage(null)
        try {
            const result = await runAuditAutomationPack(uuid)
            setPack(result.pack)
            setMessage(`${result.created_risk_count} risk(s), ${result.created_control_count} control(s), and draft report pack generated.`)
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to run automation pack.'))
        } finally {
            setRunning(false)
        }
    }

    const runAuxiliaryAction = async (action: 'sampling' | 'agents' | 'confirmation' | 'response') => {
        if (!uuid) return
        setAuxRunning(action)
        setError(null)
        setMessage(null)
        try {
            if (action === 'sampling') {
                const result = await createAuditSamplingPlan(uuid, 25)
                setMessage(`${String(result.sample_size ?? 0)} sample(s) selected for testing.`)
            } else if (action === 'agents') {
                const result = await runAuditAgents(uuid)
                setMessage(`${String(Array.isArray(result.agents) ? result.agents.length : 0)} audit agent(s) ran and recorded review output.`)
            } else if (action === 'confirmation') {
                const counterparty = String(findings[0]?.area ?? 'Primary counterparty')
                await createConfirmationRequest(uuid, { counterparty, confirmation_type: 'BALANCE_CONFIRMATION' })
                setMessage('Confirmation request recorded in the audit chain.')
            } else {
                const findingCode = String(findings[0]?.code ?? 'GENERAL_FINDING')
                await recordManagementResponse(uuid, {
                    finding_code: findingCode,
                    response_text: 'Management response pending detailed supporting evidence.',
                    owner: 'Management',
                    status: 'OPEN',
                })
                setMessage('Management response placeholder recorded for follow-up.')
            }
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to run automation action.'))
        } finally {
            setAuxRunning(null)
        }
    }

    const findings = pack?.risk_intelligence.findings.slice(0, 6) ?? []
    const schedules = pack?.working_papers.schedules.slice(0, 6) ?? []
    const checks = pack?.report_readiness.checks ?? []

    return (
        <div className="space-y-6">
            <PageHeader
                icon={BrainCircuit}
                title="Big 4 Automation Engine"
                description="Run risk intelligence, sampling, agent checks, confirmations, management responses and working-paper outputs from one controlled surface."
                meta={
                    <>
                        <StatusPill tone={pack ? 'green' : 'amber'}>{pack ? 'Pack loaded' : 'Awaiting pack'}</StatusPill>
                        <StatusPill tone="blue">Human review required</StatusPill>
                    </>
                }
                actions={
                    <>
                <button
                    onClick={runAutomation}
                    disabled={running || loading || !uuid}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#002776] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#001a54] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Run Automation Pack
                </button>
                    </>
                }
            />
            <SectionCard title="Execution Actions" description="Each action writes structured audit output and keeps partner review in the loop." icon={ShieldCheck}>
                <div className="flex flex-wrap gap-2 p-4">
                <button
                    onClick={() => runAuxiliaryAction('confirmation')}
                    disabled={!!auxRunning || loading || !uuid}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                    {auxRunning === 'confirmation' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Record Confirmation
                </button>
                <button
                    onClick={() => runAuxiliaryAction('response')}
                    disabled={!!auxRunning || loading || !uuid}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                    {auxRunning === 'response' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Record Management Response
                </button>
                {uuid && (
                    <a
                        href={`/api/proxy/api/v1/audit-automation/engagements/${uuid}/working-papers/export`}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        <FileCheck className="h-4 w-4" />
                    Export Working Papers
                    </a>
                )}
                <button
                    onClick={() => runAuxiliaryAction('sampling')}
                    disabled={!!auxRunning || loading || !uuid}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                    {auxRunning === 'sampling' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                    Generate Sampling Plan
                </button>
                <button
                    onClick={() => runAuxiliaryAction('agents')}
                    disabled={!!auxRunning || loading || !uuid}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                    {auxRunning === 'agents' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                    Run Audit Agents
                </button>
                </div>
            </SectionCard>

            {(error || message) && (
                <AlertBanner tone={error ? 'red' : 'green'}>{error ?? message}</AlertBanner>
            )}

            {loading && (
                <LoadingPanel label="Building automation snapshot" />
            )}

            {!pack && !loading && !error && (
                <EmptyState
                    icon={BrainCircuit}
                    title="Automation pack is waiting for engagement data"
                    description="Import transactions, upload evidence and run readiness checks before generating a deeper automation pack."
                />
            )}

            {pack && !loading && (
                <>
                    <section className="grid gap-3 md:grid-cols-4">
                        <MetricCard label="Readiness" value={`${pack.report_readiness.score}%`} icon={CheckCircle2} tone="green" />
                        <MetricCard label="Transactions" value={String(pack.risk_intelligence.transaction_count)} icon={FileCheck} />
                        <MetricCard label="Findings" value={String(pack.risk_intelligence.findings.length)} icon={AlertTriangle} tone="amber" />
                        <MetricCard label="Opinion" value={pack.report_readiness.suggested_opinion_type} icon={ShieldCheck} tone="blue" />
                    </section>

                    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                        <SectionCard title="Risk Intelligence" icon={ShieldCheck}>
                            <div className="divide-y divide-gray-100">
                                {findings.length === 0 ? (
                                    <div className="px-4 py-6 text-sm text-gray-500">No automated findings yet.</div>
                                ) : findings.map((finding, index) => (
                                    <div key={`${String(finding.code)}-${index}`} className="px-4 py-3 text-xs">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-bold text-gray-900">{String(finding.title)}</span>
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase text-gray-600">{String(finding.band)} · {String(finding.score)}</span>
                                        </div>
                                        <p className="mt-1 text-gray-500">{String(finding.recommended_control ?? '')}</p>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Report Gate" icon={AlertTriangle}>
                            <div className="space-y-2 p-4">
                                {checks.map(check => (
                                    <div key={check.code} className="flex items-start gap-2 rounded-md bg-gray-50 p-2 text-xs">
                                        <CheckCircle2 className={`mt-0.5 h-4 w-4 ${check.passed ? 'text-emerald-600' : 'text-gray-300'}`} />
                                        <div>
                                            <div className="font-bold text-gray-900">{check.code.replaceAll('_', ' ')}</div>
                                            <div className="text-gray-500">{check.message}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </section>

                    <SectionCard title="Working Paper Schedules" icon={FileCheck}>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-xs">
                                <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500">
                                    <tr>
                                        <th className="px-3 py-2">WP Ref</th>
                                        <th className="px-3 py-2">Area</th>
                                        <th className="px-3 py-2">Rows</th>
                                        <th className="px-3 py-2">Value</th>
                                        <th className="px-3 py-2">Procedure</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {schedules.map(schedule => (
                                        <tr key={String(schedule.wp_ref)}>
                                            <td className="px-3 py-2 font-mono">{String(schedule.wp_ref)}</td>
                                            <td className="px-3 py-2 font-semibold text-gray-800">{String(schedule.area)}</td>
                                            <td className="px-3 py-2">{String(schedule.population_count)}</td>
                                            <td className="px-3 py-2">{String(schedule.population_value)}</td>
                                            <td className="px-3 py-2 text-gray-500">{String(schedule.suggested_procedure)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </>
            )}
        </div>
    )
}
