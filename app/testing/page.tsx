'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import { useState, useEffect } from 'react'
import {
    Plus, CheckCircle2, XCircle, Clock, FlaskConical, Loader2, X, Target
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getEngagements, EngagementResponse, getRisks, RiskResponse, getApiErrorMessage } from '@/lib/api'

type TestStatus = 'Pass' | 'Fail' | 'In Progress' | 'Pending'

interface TestProcedure {
    id: string
    procedure: string
    area: string
    controlRef: string
    assignee: string
    status: TestStatus
    sampleSize: number
    exceptions: number
    dueDate: string
    notes: string
}

const statusConfig: Record<TestStatus, { icon: LucideIcon; color: string; bg: string }> = {
    Pass:        { icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-100' },
    Fail:        { icon: XCircle,     color: 'text-red-700',   bg: 'bg-red-100' },
    'In Progress':{ icon: Clock,      color: 'text-blue-700',  bg: 'bg-blue-100' },
    Pending:     { icon: Clock,       color: 'text-gray-500',  bg: 'bg-gray-100' },
}

export default function TestingPage() {
    const [engagements, setEngagements] = useState<EngagementResponse[]>([])
    const [selectedId, setSelectedId] = useState('')
    const [, setRisks] = useState<RiskResponse[]>([])
    const [tests, setTests]   = useState<TestProcedure[]>([])
    const [selected, setSelected] = useState<TestProcedure | null>(null)
    const [loading, setLoading] = useState(true)

    const [showAdd, setShowAdd] = useState(false)
    const [form, setForm] = useState({ procedure: '', area: '', controlRef: '', assignee: '', sampleSize: 25, dueDate: '' })
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getEngagements().then(data => {
            setEngagements(data)
            if (data.length > 0) setSelectedId(data[0].id)
            setError(null)
        }).catch(err => {
            setEngagements([])
            setError(getApiErrorMessage(err, 'Unable to load engagements from the backend.'))
        }).finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!selectedId) return
        getRisks(selectedId).then(data => {
            setRisks(data)
            setError(null)
        }).catch(err => {
            setRisks([])
            setError(getApiErrorMessage(err, 'Unable to load risks from the backend.'))
        })
    }, [selectedId])

    const handleAdd = () => {
        if (!form.procedure.trim()) return
        setError('Testing procedure persistence is not connected to a backend API yet. No client-side test record was created.')
    }

    const updateStatus = (id: string, status: TestStatus) => {
        setTests(ts => ts.map(t => t.id === id ? { ...t, status } : t))
        setSelected(s => s?.id === id ? { ...s, status } : s)
    }

    const addException = (id: string) => {
        setTests(ts => ts.map(t => t.id === id ? { ...t, exceptions: t.exceptions + 1, status: 'Fail' } : t))
        setSelected(s => s?.id === id ? { ...s, exceptions: s.exceptions + 1, status: 'Fail' } : s)
    }

    const pass   = tests.filter(t => t.status === 'Pass').length
    const fail   = tests.filter(t => t.status === 'Fail').length
    const totalExceptions = tests.reduce((sum, t) => sum + t.exceptions, 0)

    return (
        <AuditShell>
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Audit Workflow</div>
                    <h1 className="text-3xl font-black text-[#002776] tracking-tight">Testing</h1>
                    <p className="text-gray-500 mt-1 text-sm">Execute audit test procedures and record results and exceptions (SA 330 / ISA 330).</p>
                    {error && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</p>}
                </div>
                <button id="add-test-btn" onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 bg-[#002776] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#001a54] transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Add Test
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
            ) : engagements.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No engagements found. Create one first from Engagement Overview.</p>
                </div>
            ) : (
                <>
                    <div className="mb-5 flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-500 whitespace-nowrap">Active Engagement:</label>
                        <select id="engagement-selector" value={selectedId} onChange={e => { setSelectedId(e.target.value); setTests([]) }}
                            className="flex-1 max-w-sm h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002776]/30 font-medium">
                            {engagements.map(en => <option key={en.id} value={en.id}>{en.client_name} — {en.engagement_type}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Tests', value: tests.length, color: 'text-[#002776]' },
                            { label: 'Passed', value: pass, color: 'text-green-600' },
                            { label: 'Failed', value: fail, color: 'text-red-600' },
                            { label: 'Exceptions', value: totalExceptions, color: 'text-orange-500' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                                <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {tests.length === 0 ? (
                        <div className="text-center py-14 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            <FlaskConical className="w-9 h-9 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold text-gray-500 mb-3">No test procedures defined yet.</p>
                            <p className="text-xs text-gray-400">Testing procedures will appear after they are saved by the backend workflow.</p>
                        </div>
                    ) : (
                        <div className="flex gap-5">
                            <div className="flex-1 space-y-3">
                                {tests.map(test => {
                                    const cfg = statusConfig[test.status]
                                    const Icon = cfg.icon
                                    return (
                                        <div key={test.id} onClick={() => setSelected(test === selected ? null : test)}
                                            className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${selected?.id === test.id ? 'border-blue-300 shadow-md' : 'border-gray-100'} ${test.exceptions > 0 ? 'border-l-4 border-l-red-400' : ''}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm">{test.procedure}</div>
                                                        <div className="text-xs text-gray-400 mt-0.5">{test.id} · {test.area} · Ctrl: {test.controlRef} · Due {test.dueDate}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    {test.sampleSize > 0 && (
                                                        <div className="text-right">
                                                            <div className="text-xs text-gray-400">Sample / Exc</div>
                                                            <div className="text-sm font-bold text-gray-700">
                                                                {test.sampleSize} / <span className={test.exceptions > 0 ? 'text-red-600' : 'text-green-600'}>{test.exceptions}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                                                        <Icon className="w-3 h-3" />{test.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-400">Assigned to <span className="text-gray-600 font-medium">{test.assignee}</span></div>
                                        </div>
                                    )
                                })}
                            </div>

                            {selected && (
                                <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-blue-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <FlaskConical className="w-5 h-5 text-[#002776]" />
                                            <span className="font-bold text-gray-900 text-sm">{selected.id}</span>
                                        </div>
                                        <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                                    </div>
                                    <p className="text-sm text-gray-800 font-medium mb-4 leading-snug">{selected.procedure}</p>
                                    <div className="space-y-2 text-xs mb-4">
                                        {[
                                            ['Area', selected.area],
                                            ['Control', selected.controlRef],
                                            ['Assignee', selected.assignee],
                                            ['Due Date', selected.dueDate],
                                            ['Sample Size', selected.sampleSize],
                                            ['Exceptions', selected.exceptions],
                                        ].map(([k, v]) => (
                                            <div key={String(k)} className="flex justify-between">
                                                <span className="text-gray-400">{k}</span>
                                                <span className={`font-semibold ${k === 'Exceptions' && Number(v) > 0 ? 'text-red-600' : 'text-gray-800'}`}>{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <textarea value={notes[selected.id] || ''} onChange={e => setNotes(n => ({ ...n, [selected.id]: e.target.value }))}
                                        placeholder="Working notes (SA 230 — audit documentation)…"
                                        className="w-full text-xs border border-gray-200 rounded-lg p-2 min-h-[72px] resize-none focus:outline-none focus:ring-1 focus:ring-[#002776]/30 mb-3" />
                                    <div className="space-y-2">
                                        <button onClick={() => updateStatus(selected.id, 'Pass')} className="w-full text-xs font-semibold bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">✓ Mark Pass</button>
                                        <button onClick={() => { addException(selected.id) }} className="w-full text-xs font-semibold border border-red-300 text-red-700 py-2 rounded-lg hover:bg-red-50">+ Log Exception</button>
                                        <button onClick={() => updateStatus(selected.id, 'In Progress')} className="w-full text-xs font-semibold border border-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-50">⏵ Start Testing</button>
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
                            <h2 className="text-xl font-black text-[#002776]">Add Test Procedure</h2>
                            <button onClick={() => setShowAdd(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Procedure *</label>
                                <textarea required value={form.procedure} onChange={e => setForm(f => ({ ...f, procedure: e.target.value }))}
                                    placeholder="Describe the audit test procedure…" rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Area</label>
                                    <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Revenue"
                                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Control Ref</label>
                                    <input value={form.controlRef} onChange={e => setForm(f => ({ ...f, controlRef: e.target.value }))} placeholder="CTL-001"
                                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assignee</label>
                                    <input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder="Auditor name"
                                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sample Size</label>
                                    <input type="number" min={1} value={form.sampleSize} onChange={e => setForm(f => ({ ...f, sampleSize: +e.target.value }))}
                                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
                                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002776]/30" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 h-10 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">Cancel</button>
                            <button id="add-test-submit" onClick={handleAdd} disabled={!form.procedure.trim()}
                                className="flex-1 h-10 bg-[#002776] text-white text-sm font-semibold rounded-lg flex items-center justify-center hover:bg-[#001a54] disabled:opacity-70">
                                Add Test
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuditShell>
    )
}
