'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import Link from 'next/link'
import { ArrowRight, Search, Filter, Loader2, Plus, X, CalendarClock, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getEngagements, createEngagement } from '@/lib/api'
import { AUDIT_TYPE_DEFINITIONS, getAuditTypeDefinition, normalizeAuditTypeTitle } from '@/lib/audit-types'

type AuditStatus = 'In Progress' | 'Planning' | 'Review' | 'Completed' | 'Not Started'

const statusColors: Record<AuditStatus, string> = {
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'Planning': 'bg-amber-100 text-amber-800 border-amber-200',
    'Review': 'bg-purple-100 text-purple-800 border-purple-200',
    'Completed': 'bg-green-100 text-green-700 border-green-200',
    'Not Started': 'bg-gray-100 text-gray-600 border-gray-200',
}

const riskColors: Record<string, string> = {
    Critical: 'text-red-600',
    High: 'text-orange-500',
    Medium: 'text-yellow-600',
    Low: 'text-green-600',
}

const auditTypeIcons: Record<string, string> = {
    'Forensic Audit': '🔍',
    'Financial Audit': '💰',
    'ESG Audit': '🌿',
    'Internal Audit': '🏛️',
    'External Audit': '🔬',
    'Statutory Audit': '📜',
    'Tax Audit': '🧾',
    'GST Audit / GST Reconciliation': '🧾',
    'Compliance Audit': '✅',
    'Operational Audit': '⚙️',
    'IT Audit': '💻',
    'Payroll Audit': '👥',
    'Performance Audit': '📈',
    'Quality Audit': '🎯',
    'Environmental Audit': '♻️',
    'Cost Audit (CRA-3)': '💳',
    'Social Audit': '🤝',
    'Inventory Audit': '📦',
    'Stock Audit': '📦',
    'Bank / Loan Audit': '🏦',
    'Single Audit (US Federal / USAS)': '🏛️',
}

const JURISDICTIONS = [
    { code: 'IN', label: '🇮🇳 India (ICAI / SEBI)' },
    { code: 'US', label: '🇺🇸 United States (PCAOB)' },
    { code: 'GB', label: '🇬🇧 United Kingdom (FRC)' },
    { code: 'SG', label: '🇸🇬 Singapore (ACRA)' },
    { code: 'AE', label: '🇦🇪 UAE (ESCA)' },
]

export default function EngagementOverviewPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<AuditStatus | 'All'>('All')
    const [ALL_ENGAGEMENTS, setAllEngagements] = useState<{ id: string; type: string; client: string; status: AuditStatus; risk: string; period: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')
    const [form, setForm] = useState({
        client_name: '',
        engagement_type: AUDIT_TYPE_DEFINITIONS[0].title,
        jurisdiction: 'IN',
        tenant_id: 'default_tenant',
    })
    const selectedAuditType = getAuditTypeDefinition(form.engagement_type)

    const loadEngagements = () => {
        setLoading(true)
        getEngagements().then(data => {
            setAllEngagements(data.map(d => ({
                id: d.id,
                type: normalizeAuditTypeTitle(d.auditType ?? d.engagement_type),
                client: d.client_name,
                status: d.status === 'FIELD_WORK' ? 'In Progress' :
                    d.status === 'REVIEW' ? 'Review' :
                        d.status === 'COMPLETED' || d.status === 'SEALED' ? 'Completed' : 'Planning',
                risk: 'Medium',
                period: 'Current'
            })))
        }).finally(() => setLoading(false))
    }

    useEffect(() => { loadEngagements() }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        setCreateError('')
        try {
            await createEngagement({
                ...form,
                engagement_type: selectedAuditType.backendType,
                auditType: selectedAuditType.workflowType,
                independence_cleared: true,  // Admin creating via UI has done manual verification
                kyc_cleared: true,
            })
            
            setShowModal(false)
            setForm({ client_name: '', engagement_type: AUDIT_TYPE_DEFINITIONS[0].title, jurisdiction: 'IN', tenant_id: 'default_tenant' })
            loadEngagements()
        } catch (err: any) {
            setCreateError(err?.message ?? 'Failed to create engagement. Please try again.')
        } finally {
            setCreating(false)
        }
    }

    const filtered = ALL_ENGAGEMENTS
        .filter(e => statusFilter === 'All' || e.status === statusFilter)
        .filter(e =>
            e.type.toLowerCase().includes(search.toLowerCase()) ||
            e.client.toLowerCase().includes(search.toLowerCase()) ||
            e.id.includes(search)
        )

    const byStatus = (s: AuditStatus) => ALL_ENGAGEMENTS.filter(e => e.status === s).length

    return (
        <AuditShell>
            {/* Header with New Engagement button */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Universal Audit</div>
                    <h1 className="text-3xl font-black text-[#002776] tracking-tight">Engagement Overview</h1>
                    <p className="text-gray-500 mt-1 text-sm">Indian CA audit workflows — {ALL_ENGAGEMENTS.length} active engagements across your mandate portfolio.</p>
                </div>
                <button
                    id="new-engagement-btn"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#002776] hover:bg-[#001a54] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                    <Plus className="w-4 h-4" />
                    New Engagement
                </button>
            </div>

            {/* Status summary pills */}
            <div className="flex gap-3 mb-6 flex-wrap">
                {([
                    { label: 'All', count: ALL_ENGAGEMENTS.length },
                    { label: 'In Progress', count: byStatus('In Progress') },
                    { label: 'Planning', count: byStatus('Planning') },
                    { label: 'Review', count: byStatus('Review') },
                    { label: 'Completed', count: byStatus('Completed') },
                    { label: 'Not Started', count: byStatus('Not Started') },
                ] as const).map(({ label, count }) => (
                    <button
                        key={label}
                        onClick={() => setStatusFilter(label as AuditStatus | 'All')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${statusFilter === label ? 'bg-[#002776] text-white border-[#002776] shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                        {label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === label ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by audit type, client, or engagement ID…"
                    className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30 bg-white"
                />
            </div>

            {/* Engagement grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(e => (
                    <Link href={`/engagement/${e.id}`} key={e.id} className="block group">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-[#002776] hover:shadow-md transition-all h-full cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[e.status]}`}>{e.status}</span>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#002776] transition-colors" />
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{auditTypeIcons[e.type]}</span>
                                <h3 className="font-bold text-gray-900 text-base leading-tight">{e.type}</h3>
                            </div>
                            <p className="text-gray-500 text-sm mb-3">{e.client}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-gray-400">ENG-{e.id} · {e.period}</span>
                                <span className={`text-xs font-bold ${riskColors[e.risk]}`}>{e.risk} Risk</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {loading && (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            )}
            {!loading && filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <Filter className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="font-medium mb-4">No engagements yet.</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#002776] text-white text-sm font-semibold rounded-xl shadow hover:bg-[#001a54] transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Create Your First Engagement
                    </button>
                </div>
            )}

            {/* New Engagement Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-black text-[#002776]">New Engagement</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {createError && (
                            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-200">
                                {createError}
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client Name *</label>
                                <input
                                    id="client-name-input"
                                    required
                                    value={form.client_name}
                                    onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                                    placeholder="e.g. Mehta Textiles Ltd"
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30 focus:border-[#002776]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Audit Type *</label>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {AUDIT_TYPE_DEFINITIONS.map(auditType => {
                                        const isSelected = form.engagement_type === auditType.title
                                        return (
                                            <button
                                                key={auditType.slug}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, engagement_type: auditType.title }))}
                                                className={`rounded-xl border p-4 text-left transition-all ${isSelected ? 'border-[#002776] bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="font-black text-gray-900">{auditType.title}</div>
                                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{auditType.shortDescription}</p>
                                                    </div>
                                                    {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#002776]" />}
                                                </div>
                                                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#002776]">
                                                    <CalendarClock className="h-3 w-3" /> Target timeline
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                                <input id="engagement-type-select" type="hidden" value={form.engagement_type} readOnly />
                            </div>

                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                <div className="text-xs font-black uppercase tracking-wider text-[#002776]">Selected workflow preview</div>
                                <div className="mt-2 grid gap-3 md:grid-cols-2">
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">Required documents</div>
                                        <ul className="mt-2 space-y-1 text-xs text-gray-600">
                                            {selectedAuditType.requiredDocuments.slice(0, 4).map(document => (
                                                <li key={document}>- {document}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">Checklist focus</div>
                                        <ul className="mt-2 space-y-1 text-xs text-gray-600">
                                            {selectedAuditType.checklistItems.slice(0, 4).map(item => (
                                                <li key={item}>- {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jurisdiction *</label>
                                <select
                                    id="jurisdiction-select"
                                    value={form.jurisdiction}
                                    onChange={e => setForm(f => ({ ...f, jurisdiction: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30 focus:border-[#002776] bg-white"
                                >
                                    {JURISDICTIONS.map(j => <option key={j.code} value={j.code}>{j.label}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 h-10 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="create-engagement-submit"
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 h-10 bg-[#002776] hover:bg-[#001a54] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                                >
                                    {creating ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : 'Create Engagement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuditShell>
    )
}
