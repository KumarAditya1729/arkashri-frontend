'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import { useState } from 'react'
import { FileText, Download, CheckCircle2, AlertTriangle, Eye, Printer, Bot, CalendarClock, ShieldCheck } from 'lucide-react'
import { SEVEN_DAY_AUDIT_TIMELINE } from '@/lib/audit-types'

const execContent = `The audit of the entity for the specified period was conducted in accordance with Standards on Auditing (SAs) issued by the ICAI. Based on our procedures, we have identified relevant risks and key findings requiring management attention.

The entity's internal control framework is substantially effective, with one deficiency noted in payroll pre-posting variance analysis. We recommend immediate remediation.`

const findingsContent = `1. Revenue Recognition (RSK-001) — CRITICAL: Timing differences of Rs.18L identified across 3 invoices crossing period end. Management explanation received; adjustment booked.

2. Payroll Cut-Off (RSK-002) — HIGH: 3 out of 20 sampled payroll records showed variances exceeding 5% tolerance. Management to strengthen pre-posting review.

3. Related Party Transactions (RSK-004) — CRITICAL: Disclosure in financial statements is incomplete. 2 subsidiary balances excluded from notes. Immediate rectification required before sign-off.`

const controlsContent = `Internal controls over financial reporting are assessed as substantially effective. One material weakness has been identified in the payroll area (CTL-034). All other tested controls (5 of 6) are operating effectively.

We recommend the company strengthen its payroll pre-posting review procedure and implement mandatory dual approval above Rs.5L payroll adjustments.`

interface Section {
    id: string
    title: string
    content: string
    status: 'complete' | 'in-progress' | 'pending'
    wordCount: number
}

const SECTIONS: Section[] = [
    {
        id: 'exec',
        title: 'Executive Summary',
        content: execContent,
        status: 'complete',
        wordCount: execContent.trim().split(/\s+/).filter(Boolean).length
    },
    {
        id: 'findings',
        title: 'Key Findings',
        content: findingsContent,
        status: 'complete',
        wordCount: findingsContent.trim().split(/\s+/).filter(Boolean).length
    },
    {
        id: 'controls',
        title: 'Internal Controls',
        content: controlsContent,
        status: 'in-progress',
        wordCount: controlsContent.trim().split(/\s+/).filter(Boolean).length
    }
]

const statusConfig = {
    complete: { color: 'text-green-600 bg-green-100', label: 'Complete', icon: CheckCircle2 },
    'in-progress': { color: 'text-blue-600 bg-blue-100', label: 'In Progress', icon: Eye },
    pending: { color: 'text-gray-500 bg-gray-100', label: 'Pending', icon: AlertTriangle },
}

export default function ReportPage() {
    const [active, setActive] = useState('exec')
    const [sections, setSections] = useState<Section[]>(SECTIONS)
    const [content, setContent] = useState<Record<string, string>>(
        Object.fromEntries(SECTIONS.map(s => [s.id, s.content]))
    )

    const activeSection = sections.find(s => s.id === active) || {
        id: 'exec',
        title: 'Executive Summary',
        content: execContent,
        status: 'complete' as const,
        wordCount: execContent.trim().split(/\s+/).filter(Boolean).length
    }
    const totalWords = Object.values(content).reduce((sum, c) => sum + (c.trim() ? c.trim().split(/\s+/).length : 0), 0)
    const complete = sections.filter(s => s.status === 'complete').length

    return (
        <AuditShell>
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Audit Workflow</div>
                    <h1 className="text-3xl font-black text-[#002776] tracking-tight">Audit Report</h1>
                    <p className="text-gray-500 mt-1 text-sm">Draft, review and finalise the audit opinion and report.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            // Generate preview of the report
                            const previewContent = Object.values(content).join('\n\n---\n\n')
                            const blob = new Blob([previewContent], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            window.open(url, '_blank')
                        }} 
                        className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Printer className="w-4 h-4" /> Preview
                    </button>
                    <button 
                        onClick={() => {
                            // Generate and download a universally readable text/markdown report
                            const reportText = sections.map(s => {
                                const sectionStatus = s.status.toUpperCase();
                                return `=== ${s.title} [${sectionStatus}] ===\n\n${content[s.id] || ''}\n`;
                            }).join('\n\n');
                            
                            const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `audit-report-${new Date().toISOString().split('T')[0]}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }} 
                        className="flex items-center gap-2 bg-[#002776] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#001a54] transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>

            {/* Progress summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Sections Complete', value: `${complete} / ${sections.length}` },
                    { label: 'Total Word Count', value: totalWords.toLocaleString() },
                    { label: 'Findings Documented', value: '3' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                        <div className="text-2xl font-black text-gray-900">{s.value}</div>
                        <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#002776]">
                            <CalendarClock className="h-4 w-4" /> Day 7 report readiness
                        </div>
                        <h2 className="mt-1 text-xl font-black text-gray-900">Generate, attach UDIN, seal and share</h2>
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                            This report workspace represents the final Day 7 target step. Arkashri can prepare the draft artifact,
                            but the CA/partner still reviews, signs, enters UDIN where applicable and approves the final seal.
                        </p>
                    </div>
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                        <div className="flex items-center gap-2 text-sm font-black">
                            <ShieldCheck className="h-4 w-4" /> Human sign-off required
                        </div>
                        <div className="mt-1 text-xs">No automatic legal completion is claimed.</div>
                    </div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-7">
                    {SEVEN_DAY_AUDIT_TIMELINE.map(stage => (
                        <div key={stage.day} className={`rounded-xl border p-3 ${stage.day === 7 ? 'border-[#002776] bg-white shadow-sm' : 'border-gray-100 bg-white/60'}`}>
                            <div className="text-xs font-black text-[#002776]">Day {stage.day}</div>
                            <div className="mt-1 text-xs font-semibold leading-5 text-gray-700">{stage.title}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-5">
                {/* Section nav */}
                <div className="w-56 flex-shrink-0 space-y-2">
                    {sections.map(s => {
                        const cfg = statusConfig[s.status as keyof typeof statusConfig]
                        const Icon = cfg.icon
                        return (
                            <button
                                key={s.id}
                                onClick={() => setActive(s.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${active === s.id ? 'bg-[#002776] text-white border-[#002776] shadow-md' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200 hover:shadow-sm'}`}
                            >
                                <div className="font-semibold leading-tight">{s.title}</div>
                                <div className={`text-xs mt-1 flex items-center gap-1 ${active === s.id ? 'text-blue-200' : cfg.color.split(' ')[0]}`}>
                                    <Icon className="w-3 h-3" />{cfg.label}
                                    {s.wordCount > 0 && <span className="ml-auto">{content[s.id]?.trim().split(/\s+/).filter(Boolean).length || 0}w</span>}
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Editor */}
                <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="font-bold text-gray-900">{activeSection.title}</h2>
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 uppercase tracking-wider shadow-sm">
                                    <Bot className="w-3.5 h-3.5 text-indigo-500" /> Grounded Zero-Draft
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Generated from Phase 4 Human Justification logs. {content[active]?.trim().split(/\s+/).filter(Boolean).length || 0} words total.
                            </div>
                        </div>
                        {activeSection.status === 'complete' && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                <CheckCircle2 className="w-3 h-3" /> Signed off
                            </span>
                        )}
                    </div>

                    {activeSection.status === 'pending' ? (
                        <div className="flex-1 flex items-center justify-center text-center p-12">
                            <div>
                                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm font-medium">This section has not been started yet.</p>
                                <p className="text-gray-300 text-xs mt-1">Complete prior sections before drafting this one.</p>
                            </div>
                        </div>
                    ) : (
                        <textarea
                            value={content[active]}
                            onChange={e => setContent(c => ({ ...c, [active]: e.target.value }))}
                            placeholder="Start drafting this section..."
                            className="flex-1 p-6 text-sm text-gray-800 leading-relaxed resize-none focus:outline-none font-serif min-h-[420px]"
                        />
                    )}

                    <div className="px-6 py-3 border-t border-gray-50 flex justify-end gap-2">
                        <button 
                            onClick={() => setSections(prev => prev.map(s => s.id === active ? { ...s, status: 'in-progress' } : s))} 
                            className="text-xs font-semibold border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                        >
                            Save Draft
                        </button>
                        <button 
                            onClick={() => setSections(prev => prev.map(s => s.id === active ? { ...s, status: 'complete' } : s))} 
                            className="text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                        >
                            Mark Complete
                        </button>
                    </div>
                </div>
            </div>
        </AuditShell>
    )
}
