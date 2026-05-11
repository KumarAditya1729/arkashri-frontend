'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

interface Step {
    name: string
    path: string
}

const STEPS: Step[] = [
    { name: 'Planning', path: 'planning' },
    { name: 'Data', path: 'data-refinery' },
    { name: 'ERP/GST', path: 'integrations' },
    { name: 'Automation', path: 'automation' },
    { name: 'Specialist', path: 'specialist-audits' },
    { name: 'Risks', path: 'risks' },
    { name: 'Controls', path: 'controls' },
    { name: 'Evidence', path: 'evidence' },
    { name: 'Testing', path: 'testing' },
    { name: 'Review', path: 'review' },
    { name: 'Report', path: 'report' },
]

export function EngagementStepper({ engagementId }: { engagementId: string }) {
    const pathname = usePathname()
    const currentIndex = STEPS.findIndex(step => pathname.includes(`/${step.path}`))
    const effectiveIndex = currentIndex === -1 ? 0 : currentIndex
    const activeStep = STEPS[effectiveIndex]
    const previousStep = STEPS[effectiveIndex - 1]
    const nextStep = STEPS[effectiveIndex + 1]

    return (
        <div className="mb-8 space-y-4">
            <nav aria-label="Audit workflow progress" className="overflow-x-auto pb-2">
                <ol role="list" className="flex min-w-[920px] items-center justify-between">
                    {STEPS.map((step, index) => {
                        const isCompleted = index < effectiveIndex
                        const isActive = index === effectiveIndex
                        const href = `/engagement/${engagementId}/${step.path}`

                        return (
                            <li key={step.name} className="relative flex-1">
                                {index !== 0 && (
                                    <div className="absolute inset-0 -left-1/2 flex items-center" aria-hidden="true">
                                        <div className={`h-0.5 w-full ${isCompleted || isActive ? 'bg-[#002776]' : 'bg-gray-200'}`} />
                                    </div>
                                )}

                                <Link
                                    href={href}
                                    className="group relative flex flex-col items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002776]"
                                    aria-current={isActive ? 'step' : undefined}
                                >
                                    <span className="flex h-9 items-center" aria-hidden="true">
                                        {isCompleted ? (
                                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#002776] shadow-sm transition-colors group-hover:bg-[#001a54]">
                                                <Check className="h-5 w-5 text-white" aria-hidden="true" />
                                            </span>
                                        ) : isActive ? (
                                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#002776] bg-white shadow-md">
                                                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#002776]" />
                                            </span>
                                        ) : (
                                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-white transition-colors group-hover:border-gray-300">
                                                <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-200" />
                                            </span>
                                        )}
                                    </span>
                                    <span className={`mt-2 min-w-max text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-[#002776]' : isCompleted ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                        {step.name}
                                    </span>
                                </Link>
                            </li>
                        )
                    })}
                </ol>
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current workflow stage</div>
                    <div className="mt-0.5 text-sm font-bold text-gray-900">{activeStep?.name ?? 'Overview'}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {previousStep && (
                        <Link
                            href={`/engagement/${engagementId}/${previousStep.path}`}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            {previousStep.name}
                        </Link>
                    )}
                    {nextStep ? (
                        <Link
                            href={`/engagement/${engagementId}/${nextStep.path}`}
                            className="inline-flex items-center gap-2 rounded-md bg-[#002776] px-3 py-2 text-xs font-bold text-white hover:bg-[#001a54]"
                        >
                            Continue to {nextStep.name}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    ) : (
                        <Link
                            href={`/engagement/${engagementId}/report`}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                        >
                            Final report
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
