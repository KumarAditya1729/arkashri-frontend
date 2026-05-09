'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    CheckCircle2,
    ClipboardList,
    FileSearch,
    Loader2,
    RefreshCcw,
    Send,
    ShieldAlert,
    Sparkles,
} from 'lucide-react'
import {
    BooksHealthIssue,
    BooksHealthRunResponse,
    getApiErrorMessage,
    listBooksHealthChecks,
    runBooksHealthCheck,
} from '@/lib/api'

type Props = {
    engagementId: string
}

const CATEGORY_LABELS: Record<string, { label: string; icon: typeof Banknote }> = {
    bank_reconciliation: { label: 'Bank Reconciliation', icon: Banknote },
    gst_reconciliation: { label: 'GST Reconciliation', icon: ClipboardList },
    ledger_hygiene: { label: 'Ledger Hygiene', icon: FileSearch },
    evidence_readiness: { label: 'Evidence Readiness', icon: ShieldAlert },
}

const STATUS_COPY = {
    READY: {
        label: 'Ready for 7-day sprint',
        className: 'bg-green-50 text-green-800 border-green-200',
        tone: 'text-green-700',
    },
    AT_RISK: {
        label: 'At risk',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
        tone: 'text-amber-700',
    },
    BLOCKED: {
        label: 'Blocked',
        className: 'bg-red-50 text-red-800 border-red-200',
        tone: 'text-red-700',
    },
}

const SEVERITY_CLASS: Record<string, string> = {
    CRITICAL: 'bg-red-50 text-red-800 border-red-200',
    HIGH: 'bg-orange-50 text-orange-800 border-orange-200',
    MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
    LOW: 'bg-slate-50 text-slate-700 border-slate-200',
}

export function BooksHealthDashboard({ engagementId }: Props) {
    const [latest, setLatest] = useState<BooksHealthRunResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [creatingQueries, setCreatingQueries] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true)
        listBooksHealthChecks(engagementId)
            .then((checks) => {
                if (!mounted) return
                setLatest(checks.at(-1) ?? null)
                setError(null)
            })
            .catch((err) => {
                if (!mounted) return
                setError(getApiErrorMessage(err, 'Unable to load books health checks.'))
            })
            .finally(() => {
                if (mounted) setLoading(false)
            })
        return () => {
            mounted = false
        }
    }, [engagementId])

    const runCheck = async (createQueries: boolean) => {
        setRunning(true)
        setCreatingQueries(createQueries)
        setError(null)
        try {
            const result = await runBooksHealthCheck(engagementId, createQueries)
            setLatest(result)
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to run books health check.'))
        } finally {
            setRunning(false)
            setCreatingQueries(false)
        }
    }

    const topIssues = useMemo(() => {
        if (!latest) return []
        const rank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        return [...latest.issues].sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 5)
    }, [latest])

    const status = latest ? STATUS_COPY[latest.seven_day_sprint_status] : null

    return (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">
                            <Sparkles className="h-3.5 w-3.5" />
                            7-Day Audit Sprint
                        </span>
                        {status && (
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}>
                                {latest?.seven_day_sprint_status === 'READY' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                                {status.label}
                            </span>
                        )}
                    </div>
                    <h3 className="mt-3 text-lg font-black tracking-tight text-slate-950">Books Health Command Center</h3>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                        Arkashri turns messy books into blockers, client queries, CA review actions, and a sprint readiness score before report drafting.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => runCheck(false)}
                        disabled={running}
                        className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        {running && !creatingQueries ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        Run Check
                    </button>
                    <button
                        type="button"
                        onClick={() => runCheck(true)}
                        disabled={running}
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-[#002776] px-4 text-sm font-bold text-white hover:bg-[#001f5f] disabled:opacity-60"
                    >
                        {creatingQueries ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Create Client Queries
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm font-semibold text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading books health history
                </div>
            ) : error ? (
                <div className="m-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <div className="font-bold">Books health check unavailable</div>
                    <div className="mt-1">{error}</div>
                </div>
            ) : !latest ? (
                <div className="grid gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div>
                        <div className="text-sm font-bold text-slate-950">No books health check has been run yet.</div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Run this before planning. A CA should know on day one whether books, GST, bank, and evidence are ready for a seven-day audit sprint.
                        </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        First run can be blocked if Tally/ERP, GST portal, bank statement, or evidence data is missing.
                    </div>
                </div>
            ) : (
                <div className="space-y-5 p-5">
                    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Readiness Score</div>
                            <div className={`mt-3 text-5xl font-black tracking-tight ${status?.tone ?? 'text-slate-950'}`}>
                                {latest.readiness_score}
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className={`h-full rounded-full ${latest.seven_day_sprint_status === 'READY' ? 'bg-green-600' : latest.seven_day_sprint_status === 'AT_RISK' ? 'bg-amber-500' : 'bg-red-600'}`}
                                    style={{ width: `${Math.max(0, Math.min(100, latest.readiness_score))}%` }}
                                />
                            </div>
                            <div className="mt-3 text-xs leading-5 text-slate-500">
                                Last checked {new Date(latest.checked_at).toLocaleString()}
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {Object.entries(latest.categories).map(([key, category]) => {
                                const meta = CATEGORY_LABELS[key] ?? { label: key.replaceAll('_', ' '), icon: ClipboardList }
                                const Icon = meta.icon
                                const issueCount = category.issues?.length ?? 0
                                return (
                                    <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-50 text-[#002776]">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-black ${category.score >= 85 ? 'bg-green-50 text-green-700' : category.score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                                {category.score}
                                            </span>
                                        </div>
                                        <div className="mt-3 text-sm font-bold capitalize text-slate-950">{meta.label}</div>
                                        <div className="mt-1 text-xs text-slate-500">{issueCount} blocker{issueCount === 1 ? '' : 's'} or review item{issueCount === 1 ? '' : 's'}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="rounded-lg border border-slate-200">
                            <div className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-950">
                                Highest Priority Blockers
                            </div>
                            <div className="divide-y divide-slate-100">
                                {topIssues.length === 0 ? (
                                    <div className="flex items-center gap-2 px-4 py-5 text-sm font-semibold text-green-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        No open books-health blockers were found.
                                    </div>
                                ) : topIssues.map((issue) => (
                                    <IssueRow key={issue.id} issue={issue} />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="text-sm font-black text-slate-950">Next CA Actions</div>
                            <div className="mt-3 space-y-3">
                                {latest.next_actions.map((action) => (
                                    <div key={action} className="flex gap-2 text-sm leading-5 text-slate-700">
                                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#002776]" />
                                        <span>{action}</span>
                                    </div>
                                ))}
                            </div>
                            {latest.client_query_count_created > 0 && (
                                <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
                                    Created {latest.client_query_count_created} client quer{latest.client_query_count_created === 1 ? 'y' : 'ies'}.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

function IssueRow({ issue }: { issue: BooksHealthIssue }) {
    return (
        <div className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${SEVERITY_CLASS[issue.severity] ?? SEVERITY_CLASS.LOW}`}>
                    {issue.severity}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                    {issue.category}
                </span>
                {typeof issue.amount === 'number' && (
                    <span className="text-xs font-semibold text-slate-500">INR {issue.amount.toLocaleString('en-IN')}</span>
                )}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-950">{issue.title}</div>
            <p className="mt-1 text-sm leading-5 text-slate-600">{issue.description}</p>
            <p className="mt-1 text-sm leading-5 text-slate-800">
                <span className="font-bold">Action:</span> {issue.recommended_action}
            </p>
        </div>
    )
}
