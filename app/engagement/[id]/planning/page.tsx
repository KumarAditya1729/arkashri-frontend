'use client'

import { useState, use, useEffect } from 'react'
import { Calendar, Users, ChevronRight, Plus, CheckCircle2, Clock, AlertCircle, FileText, Loader2, X } from 'lucide-react'
import { listPhases, createPhase, listTeamMembers, addTeamMember, PhaseOut, TeamMemberOut, PhaseCreate, TeamMemberCreate } from '@/lib/api'

const PHASE_STATUS_CONFIG = {
    COMPLETED:   { icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50 border-green-200',  label: 'Completed'  },
    IN_PROGRESS: { icon: Clock,         color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',    label: 'In Progress' },
    UPCOMING:    { icon: AlertCircle,   color: 'text-gray-400',   bg: 'bg-gray-50 border-gray-200',    label: 'Upcoming'   },
}

const TEAM_COLORS = ['bg-[#002776]', 'bg-indigo-600', 'bg-purple-600', 'bg-teal-600', 'bg-rose-600']

const CA_ROLES = [
    'Engagement Partner (EP)', 'EQCR Partner', 'Senior Manager',
    'Audit Manager', 'In-Charge / Supervisor', 'Senior Auditor',
    'Article Clerk', 'IT Auditor', 'Tax Specialist',
]

const DEFAULT_PHASES: PhaseCreate[] = [
    { name: 'Risk Assessment & Scoping',   status: 'IN_PROGRESS', owner: 'Engagement Partner', progress: 40 },
    { name: 'Substantive Testing',         status: 'UPCOMING',    owner: 'Senior Auditor',      progress: 0  },
    { name: 'Analytical Procedures',       status: 'UPCOMING',    owner: 'Audit Manager',       progress: 0  },
    { name: 'Independent Review',          status: 'UPCOMING',    owner: 'EQCR Partner',        progress: 0  },
    { name: 'Report Issuance & Sign-off',  status: 'UPCOMING',    owner: 'Engagement Partner',  progress: 0  },
]

const SCOPE_AREAS = [
    { area: 'Revenue & Trade Receivables',       threshold: '₹12,50,000', included: true  },
    { area: 'Fixed Assets & Depreciation',        threshold: '₹8,00,000',  included: true  },
    { area: 'Inventory Valuation',               threshold: '₹10,00,000', included: true  },
    { area: 'Payroll & Benefits',                threshold: '₹5,00,000',  included: true  },
    { area: 'Related Party Transactions',        threshold: '₹2,50,000',  included: true  },
    { area: 'Borrowings & Finance Costs',        threshold: '₹4,00,000',  included: true  },
    { area: 'Tax Provisions',                    threshold: '₹3,00,000',  included: true  },
    { area: 'Bank & Cash Reconciliations',       threshold: '₹1,50,000',  included: true  },
]

export default function PlanningPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [activeTab, setActiveTab] = useState<'timeline' | 'scope' | 'team'>('timeline')
    const [materiality, setMateriality] = useState('2500000')
    const [phases, setPhases] = useState<PhaseOut[]>([])
    const [team, setTeam] = useState<TeamMemberOut[]>([])
    const [loading, setLoading] = useState(true)
    const [bootstrapping, setBootstrapping] = useState(false)

    // Phase modal
    const [showPhaseModal, setShowPhaseModal] = useState(false)
    const [phaseForm, setPhaseForm] = useState<PhaseCreate>({ name: '', status: 'UPCOMING', owner: '', progress: 0 })
    const [phaseError, setPhaseError] = useState('')
    const [savingPhase, setSavingPhase] = useState(false)

    // Team modal
    const [showTeamModal, setShowTeamModal] = useState(false)
    const [memberForm, setMemberForm] = useState({ name: '', role: CA_ROLES[0] })
    const [memberError, setMemberError] = useState('')
    const [savingMember, setSavingMember] = useState(false)

    useEffect(() => {
        if (!id) return
        setLoading(true)
        Promise.all([
            listPhases(id).catch(() => [] as PhaseOut[]),
            listTeamMembers(id).catch(() => [] as TeamMemberOut[]),
        ]).then(([p, t]) => {
            setPhases(p)
            setTeam(t)
        }).finally(() => setLoading(false))
    }, [id])

    const refresh = async () => {
        const [p, t] = await Promise.all([
            listPhases(id).catch(() => [] as PhaseOut[]),
            listTeamMembers(id).catch(() => [] as TeamMemberOut[]),
        ])
        setPhases(p)
        setTeam(t)
    }

    const handleBootstrap = async () => {
        setBootstrapping(true)
        for (const ph of DEFAULT_PHASES) {
            await createPhase(id, ph).catch(() => null)
        }
        await refresh()
        setBootstrapping(false)
    }

    const handleCreatePhase = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingPhase(true)
        setPhaseError('')
        try {
            await createPhase(id, phaseForm)
            await refresh()
            setShowPhaseModal(false)
            setPhaseForm({ name: '', status: 'UPCOMING', owner: '', progress: 0 })
        } catch (err: unknown) {
            setPhaseError(err instanceof Error ? err.message : 'Failed to create phase')
        } finally {
            setSavingPhase(false)
        }
    }

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingMember(true)
        setMemberError('')
        try {
            const initials = memberForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            const color = TEAM_COLORS[team.length % TEAM_COLORS.length]
            await addTeamMember(id, { ...memberForm, initials, color } as TeamMemberCreate)
            await refresh()
            setShowTeamModal(false)
            setMemberForm({ name: '', role: CA_ROLES[0] })
        } catch (err: unknown) {
            setMemberError(err instanceof Error ? err.message : 'Failed to add team member')
        } finally {
            setSavingMember(false)
        }
    }

    const overallProgress = phases.length > 0
        ? Math.round(phases.reduce((s, p) => s + (p.progress ?? 0), 0) / phases.length)
        : 0

    return (
        <>
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#002776] tracking-tight">Phase 1: Planning</h1>
                    <p className="text-gray-500 mt-1 text-xs">Define audit strategy, scope, timeline, and team assignments for ENG-{id}.</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'timeline' && (
                        <button onClick={() => setShowPhaseModal(true)} className="flex items-center gap-2 bg-[#002776] text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-[#001a54] transition-colors shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> New Phase
                        </button>
                    )}
                    {activeTab === 'team' && (
                        <button onClick={() => setShowTeamModal(true)} className="flex items-center gap-2 bg-[#002776] text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-[#001a54] transition-colors shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> Add Member
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Phases', value: phases.length.toString(), icon: FileText, color: 'text-[#002776]' },
                    { label: 'Overall Progress', value: `${overallProgress}%`, icon: Calendar, color: 'text-orange-500' },
                    { label: 'Team Members', value: team.length.toString(), icon: Users, color: 'text-green-600' },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ${s.color}`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-gray-900">{s.value}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
                {(['timeline', 'scope', 'team'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1 rounded-md text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white shadow-sm text-[#002776]' : 'text-gray-500 hover:text-gray-700'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            {activeTab === 'timeline' && (
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-14"><Loader2 className="w-7 h-7 animate-spin text-blue-400" /></div>
                    ) : phases.length === 0 ? (
                        <div className="text-center py-14 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            <FileText className="w-9 h-9 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold text-gray-500 mb-3">No audit phases defined yet.</p>
                            <button onClick={handleBootstrap} disabled={bootstrapping}
                                className="inline-flex items-center gap-2 px-5 py-2 bg-[#002776] text-white text-sm font-semibold rounded-lg hover:bg-[#001a54] transition-all disabled:opacity-70">
                                {bootstrapping ? <><Loader2 className="w-4 h-4 animate-spin" />Seeding…</> : <><Plus className="w-4 h-4" />Seed Standard CA Audit Phases</>}
                            </button>
                        </div>
                    ) : phases.map((phase) => {
                        const cfg = PHASE_STATUS_CONFIG[phase.status as keyof typeof PHASE_STATUS_CONFIG] ?? PHASE_STATUS_CONFIG.UPCOMING
                        const Icon = cfg.icon
                        return (
                            <div key={phase.id} className={`bg-white rounded-xl border p-5 ${cfg.bg} transition-all hover:shadow-md cursor-pointer`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                                        <div>
                                            <div className="font-semibold text-gray-900">{phase.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{phase.owner ?? 'Unassigned'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color} bg-white/60`}>{cfg.label}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                                {(phase.progress ?? 0) > 0 && (
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress</span><span>{phase.progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#002776] rounded-full transition-all" style={{ width: `${phase.progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Scope */}
            {activeTab === 'scope' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-gray-900">Materiality Threshold</div>
                            <div className="text-xs text-gray-400">Performance materiality applied to all areas below</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">₹</span>
                            <input type="number" value={materiality} onChange={(e) => setMateriality(e.target.value)}
                                className="w-36 h-9 px-3 border border-gray-200 rounded-lg text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="text-left px-5 py-3">Audit Area</th>
                                <th className="text-center px-5 py-3">Included</th>
                                <th className="text-right px-5 py-3">Materiality Floor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {SCOPE_AREAS.map((s) => (
                                <tr key={s.area} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3.5 font-medium text-gray-900">{s.area}</td>
                                    <td className="px-5 py-3.5 text-center">
                                        {s.included ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-mono text-gray-700">{s.threshold}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Team */}
            {activeTab === 'team' && (
                <div className="grid grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-2 flex justify-center py-14"><Loader2 className="w-7 h-7 animate-spin text-blue-400" /></div>
                    ) : team.map((member) => (
                        <div key={member.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div className={`w-12 h-12 rounded-full ${member.color ?? 'bg-[#002776]'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                {member.initials ?? member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-500">{member.role}</div>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setShowTeamModal(true)} className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:border-[#002776] hover:bg-blue-50 transition-colors text-gray-400 hover:text-[#002776]">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-sm">Add Team Member</span>
                    </button>
                </div>
            )}

            {/* Phase Modal */}
            {showPhaseModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="font-bold text-[#002776]">New Audit Phase</h2>
                            <button onClick={() => setShowPhaseModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleCreatePhase} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Phase Name *</label>
                                <input required value={phaseForm.name} onChange={e => setPhaseForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                                <select value={phaseForm.status} onChange={e => setPhaseForm(f => ({ ...f, status: e.target.value as PhaseCreate['status'] }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002776]/30">
                                    <option value="UPCOMING">Upcoming</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Owner</label>
                                <input value={phaseForm.owner ?? ''} onChange={e => setPhaseForm(f => ({ ...f, owner: e.target.value }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Progress %</label>
                                <input type="number" min={0} max={100} value={phaseForm.progress} onChange={e => setPhaseForm(f => ({ ...f, progress: Number(e.target.value) }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                            </div>
                            {phaseError && <p className="text-xs text-red-500">{phaseError}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowPhaseModal(false)} className="flex-1 h-9 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={savingPhase} className="flex-1 h-9 bg-[#002776] text-white rounded-lg text-sm font-semibold hover:bg-[#001a54] disabled:opacity-70 flex items-center justify-center gap-2">
                                    {savingPhase ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Create Phase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Team Modal */}
            {showTeamModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="font-bold text-[#002776]">Add Team Member</h2>
                            <button onClick={() => setShowTeamModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAddMember} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name *</label>
                                <input required value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Role</label>
                                <select value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002776]/30">
                                    {CA_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            {memberError && <p className="text-xs text-red-500">{memberError}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowTeamModal(false)} className="flex-1 h-9 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={savingMember} className="flex-1 h-9 bg-[#002776] text-white rounded-lg text-sm font-semibold hover:bg-[#001a54] disabled:opacity-70 flex items-center justify-center gap-2">
                                    {savingMember ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
