'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import { useState, useEffect, useRef } from 'react'
import { Upload, Link as LinkIcon, FileText, Image, Trash2, Plus, CheckCircle2, Clock, Loader2, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { listEvidence, uploadEvidence, deleteEvidence, anchorMultiChainEvidence, EvidenceResponse, getApiErrorMessage } from '@/lib/api'
import { ENGAGEMENT_REGISTRY } from '@/lib/engagementRegistry'

const getActiveEngagementUuid = () => ENGAGEMENT_REGISTRY[0]?.uuid ?? null

const typeIcon: Record<string, LucideIcon> = { Document: FileText, Screenshot: Image, Confirmation: CheckCircle2, Workpaper: FileText, 'External Link': LinkIcon }
const typeColor: Record<string, string> = { Document: 'text-blue-600 bg-blue-50', Screenshot: 'text-purple-600 bg-purple-50', Confirmation: 'text-green-600 bg-green-50', Workpaper: 'text-orange-600 bg-orange-50', 'External Link': 'text-gray-600 bg-gray-50' }
const statusConfig: Record<string, { color: string; icon: LucideIcon }> = {
    Reviewed: { color: 'text-green-700 bg-green-100', icon: CheckCircle2 },
    'Pending Review': { color: 'text-orange-700 bg-orange-100', icon: Clock },
    Rejected: { color: 'text-red-700 bg-red-100', icon: Trash2 },
}

const EMPTY_EVIDENCE: EvidenceResponse[] = []

export default function EvidencePage() {
    const uuid = getActiveEngagementUuid()
    const [evidence, setEvidence] = useState<EvidenceResponse[]>(EMPTY_EVIDENCE)
    const [isLive, setIsLive] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [filter, setFilter] = useState<string>('All')
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    // Evidex state mirrors backend-confirmed anchoring only.
    const [anchoringIds, setAnchoringIds] = useState<Set<string>>(new Set())
    const [anchoredIds, setAnchoredIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!uuid) return
        let cancelled = false
        const loadEvidence = async () => {
            setLoading(true)
            try {
                const data = await listEvidence(uuid)
                if (!cancelled && data.length > 0) { setEvidence(data); setIsLive(true) }
                if (!cancelled) setError(null)
            } catch (err) {
                if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load evidence from the backend.'))
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        void loadEvidence()
        return () => { cancelled = true }
    }, [uuid])

    const handleFiles = async (files: FileList | File[]) => {
        if (!uuid) {
            setError('Evidence upload requires a production engagement UUID. No client-side evidence records are created.')
            return
        }
        const arr = Array.from(files)
        setUploading(true)
        for (const file of arr) {
            try {
                const created = await uploadEvidence(uuid, file)
                setEvidence(ev => [created, ...ev])
                setIsLive(true)
                setError(null)
            } catch {
                setError('Evidence upload failed because the production backend is unavailable.')
            }
        }
        setUploading(false)
    }

    const handleDelete = async (item: EvidenceResponse) => {
        if (uuid && item.id) {
            try {
                await deleteEvidence(uuid, item.id)
            } catch {
                setError('Evidence deletion failed because the production backend is unavailable.')
                return
            }
        } else {
            setError('Evidence deletion requires a production backend record.')
            return
        }
        setEvidence(ev => ev.filter(e => e.id !== item.id))
    }

    const handleAnchor = async (item: EvidenceResponse) => {
        setAnchoringIds(prev => new Set(prev).add(item.id))
        try {
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${item.file_name}:${item.id}`))
            const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')

            await anchorMultiChainEvidence(hash, { fileName: item.file_name })
            setAnchoredIds(prev => new Set(prev).add(item.id))
        } catch {
            setError('Evidence anchoring failed because the production backend is unavailable.')
        }

        setAnchoringIds(prev => {
            const next = new Set(prev)
            next.delete(item.id)
            return next
        })
    }

    const filtered = filter === 'All' ? evidence : evidence.filter(e => e.evidence_type === filter)

    return (
        <AuditShell>
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Audit Workflow</div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-3xl font-black text-[#002776] tracking-tight">Evidence</h1>
                        {isLive ? (
                            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />LIVE
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />NO LIVE DATA
                            </span>
                        )}
                        {(loading || uploading) && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </div>
                    <p className="text-gray-500 text-sm">Upload, link, and manage all audit evidence and working papers.</p>
                    {error && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</p>}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-[#002776] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#001a54] transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Add Evidence
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Items', value: evidence.length },
                    { label: 'Reviewed', value: evidence.filter(e => e.ev_status === 'Reviewed').length },
                    { label: 'Pending Review', value: evidence.filter(e => e.ev_status === 'Pending Review').length },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                        <div className="text-3xl font-black text-gray-900">{s.value}</div>
                        <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()}
                className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-[#002776] bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
            >
                {uploading ? (
                    <><Loader2 className="w-8 h-8 text-[#002776] mx-auto mb-2 animate-spin" /><p className="text-sm font-medium text-[#002776]">Uploading…</p></>
                ) : (
                    <><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm font-medium text-gray-600">Drag & drop files here, or <span className="text-[#002776] hover:underline">browse</span></p><p className="text-xs text-gray-400 mt-1">PDF, XLSX, PNG, JPG — max 50MB per file{uuid ? ' · Saved to production backend' : ' · Production engagement required'}</p></>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {['All', 'Document', 'Workpaper', 'Screenshot', 'Confirmation', 'External Link'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${filter === f ? 'bg-[#002776] text-white border-[#002776]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{f}</button>
                ))}
            </div>

            {/* Evidence Hub Data Table (High Density) */}
            <div className="bg-white border border-slate-200 text-sm max-w-full overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f8fafc] text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="py-2.5 px-4 font-semibold text-xs tracking-wider uppercase w-12 border-r border-slate-100/50"></th>
                            <th className="py-2.5 px-4 font-semibold text-xs tracking-wider uppercase border-r border-slate-100/50">File Name</th>
                            <th className="py-2.5 px-4 font-semibold text-xs tracking-wider uppercase whitespace-nowrap border-r border-slate-100/50">Details</th>
                            <th className="py-2.5 px-4 font-semibold text-xs tracking-wider uppercase whitespace-nowrap text-right border-r border-slate-100/50">Immutability</th>
                            <th className="py-2.5 px-4 font-semibold text-xs tracking-wider uppercase whitespace-nowrap text-right border-r border-slate-100/50">Review Status</th>
                            <th className="py-2.5 px-4 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(item => {
                            const Icon = typeIcon[item.evidence_type] ?? FileText
                            const statusCfg = statusConfig[item.ev_status] ?? statusConfig['Pending Review']
                            const colorClass = typeColor[item.evidence_type] ?? typeColor.Document
                            const isAnchoring = anchoringIds.has(item.id)
                            const isAnchored = anchoredIds.has(item.id)
                            return (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="py-2.5 px-4 flex items-center justify-center">
                                        <div className={`w-7 h-7 rounded border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-4 font-medium text-slate-800 text-[13px] border-l-2 border-transparent group-hover:border-blue-500">
                                        {item.file_name}
                                    </td>
                                    <td className="py-2.5 px-4 text-[11px] font-medium text-slate-500 min-w-[200px]">
                                        <span className="text-slate-700 font-bold">{item.evd_ref}</span> • {item.uploaded_by} • {item.uploaded_at?.slice(0, 10)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right">
                                        {isAnchored ? (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white uppercase tracking-wider shadow-sm">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Anchored
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => handleAnchor(item)} 
                                                disabled={isAnchoring}
                                                className="text-[10px] font-bold px-2 py-1 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-900 uppercase disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
                                                title="Anchor to Blockchain"
                                            >
                                                {isAnchoring ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Anchor Hash'}
                                            </button>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-4 text-right">
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${statusCfg.color}`}>
                                            {item.ev_status}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-right">
                                        <button onClick={() => handleDelete(item)} className="text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </AuditShell>
    )
}
