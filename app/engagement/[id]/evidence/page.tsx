'use client'

import { useState, useEffect, useRef, use } from 'react'
import { Upload, Link as LinkIcon, FileText, Image, Trash2, Plus, CheckCircle2, Clock, Loader2, FolderOpen, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { listEvidence, uploadEvidence, deleteEvidence, EvidenceResponse, getApiErrorMessage } from '@/lib/api'
import { getUuid } from '@/lib/engagementRegistry'
import { AlertBanner, EmptyState, MetricCard, PageHeader, SectionCard, StatusPill } from '@/components/ui/enterprise'

const typeIcon: Record<string, LucideIcon> = { Document: FileText, Screenshot: Image, Confirmation: CheckCircle2, Workpaper: FileText, 'External Link': LinkIcon }
const typeColor: Record<string, string> = { Document: 'text-blue-600 bg-blue-50', Screenshot: 'text-purple-600 bg-purple-50', Confirmation: 'text-green-600 bg-green-50', Workpaper: 'text-orange-600 bg-orange-50', 'External Link': 'text-gray-600 bg-gray-50' }
const statusConfig: Record<string, { color: string; icon: LucideIcon }> = {
    Reviewed: { color: 'text-green-700 bg-green-100', icon: CheckCircle2 },
    'Pending Review': { color: 'text-orange-700 bg-orange-100', icon: Clock },
    Rejected: { color: 'text-red-700 bg-red-100', icon: Trash2 },
}

const EMPTY_EVIDENCE: EvidenceResponse[] = []

export default function EvidencePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const uuid = getUuid(id)
    const [evidence, setEvidence] = useState<EvidenceResponse[]>(EMPTY_EVIDENCE)
    const [isLive, setIsLive] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [filter, setFilter] = useState<string>('All')
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const filtered = filter === 'All' ? evidence : evidence.filter(e => e.evidence_type === filter)

    return (
        <>
            <PageHeader
                icon={FolderOpen}
                title="Evidence Vault"
                description={`Upload, link, review and preserve audit evidence for ENG-${id}.`}
                meta={
                    <>
                        <StatusPill tone={isLive ? 'green' : 'slate'}>{isLive ? 'Live evidence' : 'No live data'}</StatusPill>
                        <StatusPill tone="blue">Chain-ready storage</StatusPill>
                        {(loading || uploading) && <StatusPill tone="amber"><Loader2 className="h-3 w-3 animate-spin" /> Syncing</StatusPill>}
                    </>
                }
                actions={
                    <>
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-[#002776] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#001a54]">
                            <Plus className="w-3.5 h-3.5" /> Add Evidence
                        </button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
                    </>
                }
            />
            {error && <div className="mb-4"><AlertBanner tone="amber">{error}</AlertBanner></div>}

            <div className="grid grid-cols-3 gap-4 mb-6">
                <MetricCard label="Total items" value={evidence.length} icon={FileText} />
                <MetricCard label="Reviewed" value={evidence.filter(e => e.ev_status === 'Reviewed').length} icon={CheckCircle2} tone="green" />
                <MetricCard label="Pending review" value={evidence.filter(e => e.ev_status === 'Pending Review').length} icon={Clock} tone="amber" />
            </div>

            <SectionCard title="Upload Intake" description="Evidence is stored against the engagement, then linked to tests and reviewer conclusions." icon={ShieldCheck}>
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`m-4 cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all ${dragOver ? 'border-[#002776] bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                >
                    {uploading ? (
                        <><Loader2 className="w-8 h-8 text-[#002776] mx-auto mb-2 animate-spin" /><p className="text-sm font-medium text-[#002776]">Uploading files</p></>
                    ) : (
                        <><Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm font-medium text-slate-700">Drag files here or browse</p><p className="mt-1 text-xs font-bold uppercase text-slate-400">PDF, XLSX, PNG, JPG · MAX 50MB{uuid ? ' · production sync enabled' : ' · production engagement required'}</p></>
                    )}
                </div>
            </SectionCard>

            <div className="my-4 flex gap-2 flex-wrap">
                {['All', 'Document', 'Workpaper', 'Screenshot', 'Confirmation', 'External Link'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase transition-all ${filter === f ? 'bg-[#002776] text-white border-[#002776]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{f}</button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No evidence in this view"
                    description="Upload source documents, confirmations, screenshots or working papers, then link them to audit tests before review."
                    action={<button onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-[#002776] px-4 py-2 text-xs font-bold text-white hover:bg-[#001a54]">Upload Evidence</button>}
                />
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filtered.map(item => {
                    const Icon = typeIcon[item.evidence_type] ?? FileText
                    const statusCfg = statusConfig[item.ev_status] ?? statusConfig['Pending Review']
                    const StatusIcon = statusCfg.icon
                    const colorClass = typeColor[item.evidence_type] ?? typeColor.Document
                    return (
                        <div key={item.id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 text-xs truncate">{item.file_name}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-tighter">
                                    {item.evd_ref} <span className="mx-1">·</span> {item.test_ref ?? 'NO TEST LINKED'} <span className="mx-1">·</span> {item.uploaded_by} <span className="mx-1">·</span> {item.uploaded_at?.slice(0, 10)}{item.file_size_kb ? ` · ${item.file_size_kb}` : ''}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusCfg.color}`}>
                                    <StatusIcon className="w-3 h-3" />{item.ev_status}
                                </span>
                                <button onClick={() => handleDelete(item)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )
                    })}
                </div>
            )}
        </>
    )
}
