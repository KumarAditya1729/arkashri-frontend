'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import { useState, useEffect } from 'react'
import {
    Plus, CheckCircle2, XCircle, Clock, Shield, AlertTriangle, Loader2, X
} from 'lucide-react'
import {
    getEngagements, EngagementResponse,
    listControls, createControl, updateControlStatus,
    ControlOut, ControlCreate, ControlStatus, ControlType,
    getRisks, RiskResponse
} from '@/lib/api'

type DisplayStatus = 'Effective' | 'Deficient' | 'Not Tested' | 'Compensating'
type DisplayType = 'Preventive' | 'Detective' | 'Corrective'

const statusMap: Record<ControlStatus, DisplayStatus> = {
    EFFECTIVE: 'Effective',
    DEFICIENT: 'Deficient',
    NOT_TESTED: 'Not Tested',
    COMPENSATING: 'Compensating',
}

const statusConfig: Record<DisplayStatus, { icon: any; color: string; bg: string; api: ControlStatus }> = {
    Effective:    { icon: CheckCircle2,   color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   api: 'EFFECTIVE' },
    Deficient:    { icon: XCircle,        color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       api: 'DEFICIENT' },
    'Not Tested': { icon: Clock,          color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',     api: 'NOT_TESTED' },
    Compensating: { icon: AlertTriangle,  color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', api: 'COMPENSATING' },
}

const typeOptions: { label: DisplayType; api: ControlType; color: string }[] = [
    { label: 'Preventive', api: 'PREVENTIVE', color: 'bg-blue-100 text-blue-700' },
    { label: 'Detective',  api: 'DETECTIVE',  color: 'bg-purple-100 text-purple-700' },
    { label: 'Corrective', api: 'CORRECTIVE', color: 'bg-amber-100 text-amber-800' },
]

const typeLabel = (t: ControlType): DisplayType => {
    const m: Record<ControlType, DisplayType> = { PREVENTIVE: 'Preventive', DETECTIVE: 'Detective', CORRECTIVE: 'Corrective' }
    return m[t]
}

export default function ControlsPage() {
    const [engagements, setEngagements] = useState<EngagementResponse[]>([])
    const [selectedId, setSelectedId] = useState('')
    const [controls, setControls] = useState<ControlOut[]>([])
    const [risks, setRisks] = useState<RiskResponse[]>([])
    const [selected, setSelected] = useState<ControlOut | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    const [showAdd, setShowAdd] = useState(false)
    const [adding, setAdding] = useState(false)
    const [addError, setAddError] = useState('')
    const [form, setForm] = useState<ControlCreate>({
        title: '', area: '', control_type: 'PREVENTIVE', frequency: 'Monthly', owner: '', risk_id: undefined
    })

    useEffect(() => {
        getEngagements().then(data => {
            setEngagements(data)
            if (data.length > 0) setSelectedId(data[0].id)
        }).finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!selectedId) return
        Promise.all([listControls(selectedId), getRisks(selectedId)]).then(([c, r]) => {
            setControls(c)
            setRisks(r)
        })
    }, [selectedId])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedId) return
        setAdding(true)
        setAddError('')
        try {
            await createControl(selectedId, form)
            const updated = await listControls(selectedId)
            setControls(updated)
            setShowAdd(false)
            setForm({ title: '', area: '', control_type: 'PREVENTIVE', frequency: 'Monthly', owner: '' })
        } catch (err: any) {
            setAddError(err?.message ?? 'Failed to create control')
        } finally {
            setAdding(false)
        }
    }

    const handleStatusUpdate = async (ctrl: ControlOut, newStatus: ControlStatus) => {
        if (!selectedId) return
        setUpdating(true)
        try {
            const updated = await updateControlStatus(selectedId, ctrl.id, { status: newStatus })
            setControls(cs => cs.map(c => c.id === updated.id ? updated : c))
            setSelected(updated)
        } catch {}
        setUpdating(false)
    }

    const effective   = controls.filter(c => c.status === 'EFFECTIVE').length
    const deficient   = controls.filter(c => c.status === 'DEFICIENT').length
    const coveragePct = controls.length > 0 ? Math.round((effective / controls.length) * 100) : 0

    return (
        <AuditShell>
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Audit Workflow</div>
                    <h1 className="text-3xl font-black text-[#002776] tracking-tight">Controls Matrix</h1>
                    <p className="text-gray-500 mt-1 text-sm">Evaluate design and operating effectiveness of internal controls.</p>
                </div>
                <button id="add-control-btn" onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 bg-[#002776] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#001a54] transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Add Control
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
            ) : engagements.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No engagements found. Create one first from Engagement Overview.</p>
                </div>
            ) : (
                <>
                    <div className="mb-5 flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-500 whitespace-nowrap">Active Engagement:</label>
                        <select id="engagement-selector" value={selectedId} onChange={e => setSelectedId(e.target.value)}
                            className="flex-1 max-w-sm h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002776]/30 font-medium">
                            {engagements.map(en => <option key={en.id} value={en.id}>{en.client_name} — {en.engagement_type}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Controls', value: controls.length, color: 'text-[#002776]' },
                            { label: 'Effective', value: effective, color: 'text-green-600' },
                            { label: 'Deficient', value: deficient, color: 'text-red-600' },
                            { label: 'Coverage', value: `${coveragePct}%`, color: 'text-blue-600' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                                <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {controls.length === 0 ? (
                        <div className="text-center py-14 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            <Shield className="w-9 h-9 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold text-gray-500 mb-3">No controls defined yet.</p>
                            <button onClick={() => setShowAdd(true)}
                                className="inline-flex items-center gap-2 px-5 py-2 bg-[#002776] text-white text-sm font-semibold rounded-lg hover:bg-[#001a54]">
                                <Plus className="w-4 h-4" />Add First Control
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-5">
                            <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                        <tr>
                                            <th className="text-left px-5 py-3">Control</th>
                                            <th className="text-left px-5 py-3">Type</th>
                                            <th className="text-left px-5 py-3">Frequency</th>
                                            <th className="text-left px-5 py-3">Status</th>
                                            <th className="text-left px-5 py-3">Last Tested</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {controls.map(ctrl => {
                                            const disp = statusMap[ctrl.status]
                                            const cfg = statusConfig[disp]
                                            const Icon = cfg.icon
                                            const tc = typeOptions.find(t => t.api === ctrl.control_type)
                                            return (
                                                <tr key={ctrl.id} onClick={() => setSelected(ctrl === selected ? null : ctrl)}
                                                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected?.id === ctrl.id ? 'bg-blue-50' : ''}`}>
                                                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-xs">
                                                        <div>{ctrl.title}</div>
                                                        <div className="text-xs text-gray-400">{ctrl.area} {ctrl.owner && '· ' + ctrl.owner}</div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tc?.color ?? 'bg-gray-100 text-gray-600'}`}>
                                                            {typeLabel(ctrl.control_type)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-gray-500 text-xs">{ctrl.frequency ?? '—'}</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                                                            <Icon className="w-3 h-3" />{disp}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">
                                                        {ctrl.last_tested ? new Date(ctrl.last_tested).toLocaleDateString('en-IN') : '—'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {selected && (
                                <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-blue-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-[#002776]" />
                                            <span className="font-bold text-gray-900 text-sm">Control Detail</span>
                                        </div>
                                        <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 text-sm mb-4 leading-snug">{selected.title}</h3>
                                    <div className="space-y-2 text-xs mb-5">
                                        {[
                                            ['Area', selected.area],
                                            ['Type', typeLabel(selected.control_type)],
                                            ['Frequency', selected.frequency ?? '—'],
                                            ['Owner', selected.owner ?? '—'],
                                            ['Linked Risk', selected.risk_id ? selected.risk_id.slice(0, 8) + '…' : '—'],
                                            ['Last Tested', selected.last_tested ? new Date(selected.last_tested).toLocaleDateString('en-IN') : '—'],
                                        ].map(([k, v]) => (
                                            <div key={String(k)} className="flex justify-between">
                                                <span className="text-gray-400">{k}</span>
                                                <span className="font-medium text-gray-800">{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                        <button disabled={updating} onClick={() => handleStatusUpdate(selected, 'EFFECTIVE')}
                                            className="w-full text-xs font-semibold bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-1">
                                            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}Mark Effective
                                        </button>
                                        <button disabled={updating} onClick={() => handleStatusUpdate(selected, 'DEFICIENT')}
                                            className="w-full text-xs font-semibold border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 disabled:opacity-60">
                                            Flag as Deficient
                                        </button>
                                        <button disabled={updating} onClick={() => handleStatusUpdate(selected, 'COMPENSATING')}
                                            className="w-full text-xs font-semibold border border-orange-200 text-orange-600 py-2 rounded-lg hover:bg-orange-50 disabled:opacity-60">
                                            Mark Compensating
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {showAdd && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-black text-[#002776]">Add Control</h2>
                            <button onClick={() => setShowAdd(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        {addError && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-200">{addError}</div>}
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Control Title *</label>
                                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Bank Reconciliation Review" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Area *</label>
                                    <input required value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                                        placeholder="e.g. Revenue" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type *</label>
                                    <select value={form.control_type} onChange={e => setForm(f => ({ ...f, control_type: e.target.value as ControlType }))}
                                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002776]/30">
                                        {typeOptions.map(t => <option key={t.api} value={t.api}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Frequency</label>
                                    <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002776]/30">
                                        {['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'Ad-hoc'].map(fr => <option key={fr}>{fr}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Owner</label>
                                    <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                                        placeholder="Control owner" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                                </div>
                            </div>
                            {risks.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link to Risk (optional)</label>
                                    <select value={form.risk_id ?? ''} onChange={e => setForm(f => ({ ...f, risk_id: e.target.value || undefined }))}
                                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002776]/30">
                                        <option value="">— None —</option>
                                        {risks.map(r => <option key={r.id} value={r.id}>{r.risk_ref}: {r.title}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 h-10 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">Cancel</button>
                                <button id="add-control-submit" type="submit" disabled={adding}
                                    className="flex-1 h-10 bg-[#002776] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#001a54] disabled:opacity-70">
                                    {adding ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : 'Add Control'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuditShell>
    )
}
