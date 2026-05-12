'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import { useEffect, useState } from 'react'
import {
    Calendar, Users, FileText, Plus, CheckCircle2, Clock, AlertCircle,
    ChevronRight, X, Loader2, Target
} from 'lucide-react'
import {
    getEngagements, EngagementResponse,
    listPhases, createPhase, PhaseOut, PhaseCreate,
    listTeamMembers, addTeamMember, TeamMemberOut, type PhaseStatus,
    getApiErrorMessage,
} from '@/lib/api'

const PHASE_STATUS_CONFIG = {
    COMPLETED: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', label: 'Completed' },
    IN_PROGRESS: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'In Progress' },
    UPCOMING: { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-500', label: 'Upcoming' },
}

const TEAM_COLORS = ['bg-[#002776]', 'bg-indigo-600', 'bg-purple-600', 'bg-teal-600', 'bg-rose-600', 'bg-amber-600']

const CA_ROLES = [
    'Engagement Partner (EP)',
    'EQCR Partner',
    'Senior Manager',
    'Audit Manager',
    'In-Charge / Supervisor',
    'Senior Auditor',
    'Article Clerk',
    'IT Auditor',
    'Tax Specialist',
    'Forensic Expert',
]

const DEFAULT_PHASES: PhaseCreate[] = [
    { name: 'Risk Assessment & Scoping', status: 'IN_PROGRESS', owner: 'Engagement Partner', progress: 40 },
    { name: 'Substantive Testing', status: 'UPCOMING', owner: 'Senior Auditor', progress: 0 },
    { name: 'Analytical Procedures', status: 'UPCOMING', owner: 'Audit Manager', progress: 0 },
    { name: 'Independent Review', status: 'UPCOMING', owner: 'EQCR Partner', progress: 0 },
    { name: 'Report Issuance & Sign-off', status: 'UPCOMING', owner: 'Engagement Partner', progress: 0 },
]

// Common financial audit scope areas
const SCOPE_AREAS = [
    { area: 'Revenue & Trade Receivables', threshold: 'Set after materiality', included: false },
    { area: 'Fixed Assets & Depreciation', threshold: 'Set after materiality', included: false },
    { area: 'Inventory Valuation', threshold: 'Set after materiality', included: false },
    { area: 'Payroll & Benefits', threshold: 'Set after materiality', included: false },
    { area: 'Related Party Transactions', threshold: 'Set after materiality', included: false },
    { area: 'Borrowings & Finance Costs', threshold: 'Set after materiality', included: false },
    { area: 'Tax Provisions (Current & Deferred)', threshold: 'Set after materiality', included: false },
    { area: 'Bank & Cash Reconciliations', threshold: 'Set after materiality', included: false },
]

export default function PlanningPage() {
    const [activeTab, setActiveTab] = useState<'timeline' | 'scope' | 'team'>('timeline')
    const [materiality, setMateriality] = useState('2500000')
    const [engagements, setEngagements] = useState<EngagementResponse[]>([])
    const [selectedId, setSelectedId] = useState<string>('')
    const [phases, setPhases] = useState<PhaseOut[]>([])
    const [team, setTeam] = useState<TeamMemberOut[]>([])
    const [loading, setLoading] = useState(true)

    // Phase modal
    const [showPhaseModal, setShowPhaseModal] = useState(false)
    const [creatingPhase, setCreatingPhase] = useState(false)
    const [phaseForm, setPhaseForm] = useState<PhaseCreate>({ name: '', status: 'UPCOMING', owner: '', progress: 0 })
    const [phaseError, setPhaseError] = useState('')
    const [bootstrapping, setBootstrapping] = useState(false)

    // Team modal
    const [showTeamModal, setShowTeamModal] = useState(false)
    const [creatingMember, setCreatingMember] = useState(false)
    const [memberForm, setMemberForm] = useState({ name: '', role: CA_ROLES[0] })
    const [memberError, setMemberError] = useState('')

    useEffect(() => {
        getEngagements().then(data => {
            setEngagements(data)
            if (data.length > 0) setSelectedId(data[0].id)
            setPhaseError('')
        }).catch(err => {
            setEngagements([])
            setPhaseError(getApiErrorMessage(err, 'Unable to load engagements from the backend.'))
        }).finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!selectedId) return
        Promise.all([listPhases(selectedId), listTeamMembers(selectedId)]).then(([p, t]) => {
            setPhases(p)
            setTeam(t)
            setPhaseError('')
        }).catch(err => {
            setPhases([])
            setTeam([])
            setPhaseError(getApiErrorMessage(err, 'Unable to load planning data from the backend.'))
        })
    }, [selectedId])

    const handleBootstrapPhases = async () => {
        if (!selectedId) return
        setBootstrapping(true)
        for (const phase of DEFAULT_PHASES) {
            await createPhase(selectedId, phase)
        }
        const updated = await listPhases(selectedId)
        setPhases(updated)
        setBootstrapping(false)
    }

    const handleCreatePhase = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedId) return
        setCreatingPhase(true)
        setPhaseError('')
        try {
            await createPhase(selectedId, phaseForm)
            const updated = await listPhases(selectedId)
            setPhases(updated)
            setShowPhaseModal(false)
            setPhaseForm({ name: '', status: 'UPCOMING', owner: '', progress: 0 })
        } catch (err: unknown) {
            setPhaseError(err instanceof Error ? err.message : 'Failed to create phase')
        } finally {
            setCreatingPhase(false)
        }
    }

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedId) return
        setCreatingMember(true)
        setMemberError('')
        try {
            const initials = memberForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            const color = TEAM_COLORS[team.length % TEAM_COLORS.length]
            await addTeamMember(selectedId, { ...memberForm, initials, color })
            const updated = await listTeamMembers(selectedId)
            setTeam(updated)
            setShowTeamModal(false)
            setMemberForm({ name: '', role: CA_ROLES[0] })
        } catch (err: unknown) {
            setMemberError(err instanceof Error ? err.message : 'Failed to add team member')
        } finally {
            setCreatingMember(false)
        }
    }

    const overallProgress = phases.length > 0 ? Math.round((phases.reduce((sum, p) => sum + (p.progress ?? 0), 0)) / phases.length) : 0

    return (
        <AuditShell>
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Audit Workflow</div>
                    <h1 className="text-3xl font-black text-[#002776] tracking-tight">Planning</h1>
                    <p className="text-gray-500 mt-1 text-sm">Define audit strategy, scope, timeline, and team assignments.</p>
                    {phaseError && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{phaseError}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {activeTab === 'timeline' && (
                        <button
                            id="add-phase-btn"
                            onClick={() => setShowPhaseModal(true)}
                            className="flex items-center gap-2 bg-[#002776] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#001a54] transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Add Phase
                        </button>
                    )}
                    {activeTab === 'team' && (
                        <button
                            id="add-member-btn"
                            onClick={() => setShowTeamModal(true)}
                            className="flex items-center gap-2 bg-[#002776] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#001a54] transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Add Member
                        </button>
                    )}
                </div>
            </div>

            {/* Engagement selector */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
            ) : engagements.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold mb-2">No engagements found.</p>
                    <p className="text-sm">Create an engagement from Engagement Overview first.</p>
                </div>
            ) : (
                <>
                    <div className="mb-5 flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-500 whitespace-nowrap">Active Engagement:</label>
                        <select
                            id="engagement-selector"
                            value={selectedId}
                            onChange={e => setSelectedId(e.target.value)}
                            className="flex-1 max-w-sm h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002776]/30 font-medium text-gray-800"
                        >
                            {engagements.map(en => (
                                <option key={en.id} value={en.id}>{en.client_name} — {en.engagement_type}</option>
                            ))}
                        </select>
                    </div>

                    {/* KPI stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Total Phases', value: phases.length.toString(), icon: FileText, color: 'text-[#002776]' },
                            { label: 'Overall Progress', value: `${overallProgress}%`, icon: Calendar, color: 'text-orange-500' },
                            { label: 'Team Members', value: team.length.toString(), icon: Users, color: 'text-green-600' },
                        ].map(s => (
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
                        {(['timeline', 'scope', 'team'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white shadow-sm text-[#002776]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* ── TIMELINE TAB ── */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-3">
                            {phases.length === 0 ? (
                                <div className="text-center py-14 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                                    <FileText className="w-9 h-9 mx-auto mb-3 opacity-30" />
                                    <p className="font-semibold text-gray-500 mb-3">No audit phases defined yet.</p>
                                    <button
                                        onClick={handleBootstrapPhases}
                                        disabled={bootstrapping}
                                        className="inline-flex items-center gap-2 px-5 py-2 bg-[#002776] text-white text-sm font-semibold rounded-lg hover:bg-[#001a54] transition-all disabled:opacity-70"
                                    >
                                        {bootstrapping ? <><Loader2 className="w-4 h-4 animate-spin" />Seeding…</> : <><Plus className="w-4 h-4" />Seed Standard CA Audit Phases</>}
                                    </button>
                                </div>
                            ) : phases.map(phase => {
                                const cfg = PHASE_STATUS_CONFIG[phase.status] ?? PHASE_STATUS_CONFIG.UPCOMING
                                const Icon = cfg.icon
                                return (
                                    <div key={phase.id} className={`bg-white rounded-xl border p-5 ${cfg.bg} transition-all hover:shadow-md`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.color}`} />
                                                <div>
                                                    <div className="font-bold text-gray-900">{phase.name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {phase.owner && <span>Owner: {phase.owner}</span>}
                                                        {phase.start_date && <span> · {new Date(phase.start_date).toLocaleDateString('en-IN')}</span>}
                                                        {phase.end_date && <span> → {new Date(phase.end_date).toLocaleDateString('en-IN')}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
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

                    {/* ── SCOPE TAB ── */}
                    {activeTab === 'scope' && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-gray-900">Materiality Threshold</div>
                                    <div className="text-xs text-gray-400">Performance materiality applied across all audit areas</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        value={materiality}
                                        onChange={e => setMateriality(e.target.value)}
                                        className="w-36 h-9 px-3 border border-gray-200 rounded-lg text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-[#002776]/30"
                                    />
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
                                    {SCOPE_AREAS.map(s => (
                                        <tr key={s.area} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 font-medium text-gray-900">{s.area}</td>
                                            <td className="px-5 py-3.5 text-center">
                                                {s.included
                                                    ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                                                    : <span className="text-gray-300">—</span>
                                                }
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono text-gray-700">{s.threshold}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-5 py-3 border-t border-gray-50 bg-amber-50 text-xs text-amber-700 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                Materiality set at ₹{parseInt(materiality).toLocaleString('en-IN')} — Compliant with SA 320 (ICAI) / ISA 320 (IAASB)
                            </div>
                        </div>
                    )}

                    {/* ── TEAM TAB ── */}
                    {activeTab === 'team' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {team.map(member => (
                                <div key={member.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                                    <div className={`w-12 h-12 rounded-full ${member.color ?? 'bg-[#002776]'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                        {member.initials ?? member.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{member.name}</div>
                                        <div className="text-sm text-gray-500">{member.role}</div>
                                    </div>
                                </div>
                            ))}
                            {team.length === 0 && (
                                <div className="col-span-2 text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="font-medium text-sm">No team members assigned yet. Click &quot;Add Member&quot; to get started.</p>
                                </div>
                            )}
                            <button
                                onClick={() => setShowTeamModal(true)}
                                className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:border-[#002776] hover:bg-blue-50 transition-colors text-gray-400 hover:text-[#002776]"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-sm">Add Team Member</span>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── Add Phase Modal ── */}
            {showPhaseModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-black text-[#002776]">Add Audit Phase</h2>
                            <button onClick={() => setShowPhaseModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {phaseError && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-200">{phaseError}</div>}
                        <form onSubmit={handleCreatePhase} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phase Name *</label>
                                <input required value={phaseForm.name} onChange={e => setPhaseForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Substantive Testing" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Owner</label>
                                <input value={phaseForm.owner ?? ''} onChange={e => setPhaseForm(f => ({ ...f, owner: e.target.value }))}
                                    placeholder="e.g. Senior Auditor" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                                <select value={phaseForm.status} onChange={e => setPhaseForm(f => ({ ...f, status: e.target.value as PhaseStatus }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002776]/30">
                                    <option value="UPCOMING">Upcoming</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Progress ({phaseForm.progress}%)</label>
                                <input type="range" min={0} max={100} step={5} value={phaseForm.progress}
                                    onChange={e => setPhaseForm(f => ({ ...f, progress: +e.target.value }))}
                                    className="w-full accent-[#002776]" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowPhaseModal(false)} className="flex-1 h-10 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={creatingPhase} className="flex-1 h-10 bg-[#002776] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#001a54] disabled:opacity-70">
                                    {creatingPhase ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : 'Add Phase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Add Team Member Modal ── */}
            {showTeamModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-black text-[#002776]">Add Team Member</h2>
                            <button onClick={() => setShowTeamModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {memberError && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-200">{memberError}</div>}
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                                <input required value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Aditya Kumar" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role *</label>
                                <select value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002776]/30">
                                    {CA_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowTeamModal(false)} className="flex-1 h-10 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={creatingMember} className="flex-1 h-10 bg-[#002776] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#001a54] disabled:opacity-70">
                                    {creatingMember ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuditShell>
    )
}
