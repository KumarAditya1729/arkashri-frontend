import React from 'react'
import { AuditShell } from '@/components/layout/AuditShell'
import { EngagementStepper } from '@/components/audit/EngagementStepper'
import { registryByShortId } from '@/lib/engagementRegistry'
import { getBackendBaseUrl } from '@/lib/env'
import { EngagementStateInitializer } from '@/components/audit/EngagementStateInitializer'
import { cookies } from 'next/headers'
import { normalizeAuditTypeTitle } from '@/lib/audit-types'

export default async function EngagementLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    let meta = registryByShortId(id)

    if (!meta && id.includes('-')) {
        try {
            const cookieStore = await cookies()
            const token = cookieStore.get('arkashri_token')?.value

            const baseUrl = getBackendBaseUrl()

            const res = await fetch(`${baseUrl}/api/v1/engagements/engagements/${id}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'X-Arkashri-Tenant': process.env.NEXT_PUBLIC_API_TENANT ?? 'default_tenant'
                }
            })

            if (res.ok) {
                const liveEng = await res.json()
                meta = {
                    shortId: id.substring(0, 8),
                    uuid: id,
                    auditType: normalizeAuditTypeTitle(liveEng.auditType ?? liveEng.engagement_type),
                    client: liveEng.client_name,
                    jurisdiction: liveEng.jurisdiction,
                    period: 'LIVE RECORD'
                }
            }
        } catch (e) {
            console.error('Layout SSR Fetch Error:', e)
        }
    }

    if (!meta && id.includes('-')) {
        meta = {
            shortId: id.substring(0, 8),
            uuid: id,
            auditType: 'Audit Engagement',
            client: 'Live engagement data unavailable',
            jurisdiction: 'Backend required',
            period: 'NO LIVE DATA'
        }
    }

    if (!meta) {
        meta = {
            shortId: id,
            uuid: null,
            auditType: 'Audit Engagement',
            client: 'Engagement not found',
            jurisdiction: 'Backend required',
            period: 'NO LIVE DATA'
        }
    }

    const resolvedMeta = meta

    const TYPE_BADGE_COLORS: Record<string, string> = {
        'Forensic Audit': 'bg-red-100 text-red-800',
        'Financial Audit': 'bg-blue-100 text-blue-800',
        'ESG Audit': 'bg-green-100 text-green-800',
        'Internal Audit': 'bg-indigo-100 text-indigo-800',
        'External Audit': 'bg-purple-100 text-purple-800',
        'Statutory Audit': 'bg-teal-100 text-teal-800',
        'Tax Audit': 'bg-orange-100 text-orange-800',
        'GST Audit / GST Reconciliation': 'bg-cyan-100 text-cyan-800',
        'Compliance Audit': 'bg-cyan-100 text-cyan-800',
        'Operational Audit': 'bg-amber-100 text-amber-800',
        'IT Audit': 'bg-sky-100 text-sky-800',
        'Payroll Audit': 'bg-pink-100 text-pink-800',
        'Performance Audit': 'bg-lime-100 text-lime-800',
        'Quality Audit': 'bg-rose-100 text-rose-800',
        'Environmental Audit': 'bg-emerald-100 text-emerald-800',
        'Stock Audit': 'bg-lime-100 text-lime-800',
        'Bank / Loan Audit': 'bg-slate-100 text-slate-800',
    }

    const badgeClass = TYPE_BADGE_COLORS[resolvedMeta.auditType] ?? 'bg-gray-100 text-gray-800'

    return (
        <AuditShell>
            <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}`}>
                                {resolvedMeta.auditType}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 uppercase tracking-wider">
                                {resolvedMeta.jurisdiction}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-[#002776] tracking-tight">
                            {resolvedMeta.client}
                            <span className="text-gray-300 font-mono text-lg ml-3">ENG-{id}</span>
                        </h1>
                        <p className="text-xs text-gray-500 mt-1 uppercase font-semibold tracking-widest">{resolvedMeta.period}</p>
                    </div>
                </div>

                <EngagementStateInitializer engagementId={resolvedMeta.uuid ?? id} auditType={resolvedMeta.auditType} />
                <EngagementStepper engagementId={id} />
            </div>

            <main>
                {children}
            </main>
        </AuditShell>
    )
}
