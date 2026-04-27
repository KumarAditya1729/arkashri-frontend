import {
    getAuditDay,
    getAuditTypeDefinition,
    getSlaStatus,
    SLA_STATUS_STYLES,
} from '@/lib/audit-types'
import { CheckCircle2, Circle, Clock, FileCheck2, FolderOpen, ListChecks } from 'lucide-react'

interface AuditTypeWorkflowProps {
    auditType: string
    status?: string | null
    startDate?: string | null
    compact?: boolean
}

export function AuditTypeWorkflow({ auditType, status, startDate, compact = false }: AuditTypeWorkflowProps) {
    const definition = getAuditTypeDefinition(auditType)
    const currentDay = getAuditDay(startDate)
    const slaStatus = getSlaStatus({ status, startDate })
    const visibleDocuments = compact ? definition.requiredDocuments.slice(0, 4) : definition.requiredDocuments
    const visibleChecklist = compact ? definition.checklistItems.slice(0, 5) : definition.checklistItems

    return (
        <section className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gradient-to-r from-[#002776] to-[#0057b8] px-6 py-5 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">7-day target audit workflow</div>
                        <h2 className="mt-1 text-2xl font-black tracking-tight">{definition.title}</h2>
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-blue-50">{definition.shortDescription}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-3 text-right backdrop-blur">
                        <div className="text-xs font-semibold text-blue-100">Target completion</div>
                        <div className="text-2xl font-black">{definition.expectedCompletionDays} days</div>
                        <div className={`mt-2 rounded-full border px-2.5 py-1 text-xs font-bold ${SLA_STATUS_STYLES[slaStatus]} bg-white`}>
                            {slaStatus}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#002776]" />
                            <h3 className="font-black text-gray-900">Audit Progress Tracker</h3>
                        </div>
                        <span className="text-xs font-bold text-gray-500">Day {currentDay} of 7</span>
                    </div>

                    <div className="space-y-3">
                        {definition.timeline.map(stage => {
                            const isComplete = stage.day < currentDay || slaStatus === 'Completed'
                            const isActive = stage.day === currentDay && slaStatus !== 'Completed'
                            return (
                                <div
                                    key={stage.day}
                                    className={`rounded-xl border p-3 transition-colors ${isActive ? 'border-[#002776] bg-blue-50' : isComplete ? 'border-green-100 bg-green-50/60' : 'border-gray-100 bg-gray-50/70'}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${isComplete ? 'bg-green-500 text-white' : isActive ? 'bg-[#002776] text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>
                                            {isComplete ? <CheckCircle2 className="h-4 w-4" /> : stage.day}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-bold text-gray-900">Day {stage.day}: {stage.title}</p>
                                                {isActive && <span className="rounded-full bg-[#002776] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">Active</span>}
                                            </div>
                                            <p className="mt-0.5 text-xs leading-5 text-gray-500">{stage.description}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-[#002776]" />
                            <h3 className="font-black text-gray-900">Client Documents</h3>
                        </div>
                        <div className="space-y-2">
                            {visibleDocuments.map((document, index) => (
                                <div key={document} className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-600">
                                    {index < 2 ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> : <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />}
                                    <span>{document}</span>
                                </div>
                            ))}
                        </div>
                        {compact && definition.requiredDocuments.length > visibleDocuments.length && (
                            <p className="mt-2 text-xs font-semibold text-gray-400">+{definition.requiredDocuments.length - visibleDocuments.length} more documents in engagement detail</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-[#002776]" />
                            <h3 className="font-black text-gray-900">Audit Checklist</h3>
                        </div>
                        <div className="space-y-2">
                            {visibleChecklist.map((item, index) => (
                                <div key={item} className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-600">
                                    {index < 3 ? <FileCheck2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" /> : <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />}
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
