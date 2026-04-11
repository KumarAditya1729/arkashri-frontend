'use client'

import { useAuditStore } from '../../store/auditStore'
import { Bot, Info, Crosshair, ExternalLink, Activity, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DisclaimerBadge } from './DisclaimerBadge'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

interface ContextInsight {
    suggestion: string;
    confidence: number;
    regulatory_bindings: string[];
}

export function AIBox() {
    const currentStage = useAuditStore((state) => state.currentStage)
    const auditType = useAuditStore((state) => state.auditType)
    const engagementId = useAuditStore((state) => state.engagementId)

    const [insight, setInsight] = useState<ContextInsight | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!engagementId) return;

        let isMounted = true;
        const fetchInsight = async () => {
            setLoading(true);
            try {
                const data = await apiFetch<ContextInsight>(`/api/v1/analytics/contextual-lens?engagement_id=${engagementId}&current_stage=${currentStage}`)
                if (isMounted) setInsight(data)
            } catch (err) {
                console.error("Failed to load contextual insight", err)
                if (isMounted) {
                    setInsight({
                        suggestion: "AI Assistant encountered an error generating context.",
                        confidence: 0,
                        regulatory_bindings: []
                    })
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        
        fetchInsight()
        return () => { isMounted = false }
    }, [engagementId, currentStage])

    // Fallback or static text when no engagement is selected
    const contextTopic = currentStage === 'Dashboard' ? 'Engagement Overview' : 
                         currentStage === 'Risks' ? 'Risk Assessment' : 'Process Execution'
    
    const displaySuggestion = insight ? insight.suggestion : "Please select or create an engagement to receive live contextual insights."
    const displayConfidence = insight ? Math.round(insight.confidence) : 0
    const displayBindings = insight ? insight.regulatory_bindings : []

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 border-b bg-[#002776] text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#92d400]" />
                <h2 className="font-semibold text-sm">Contextual AI Assistant</h2>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-5 flex flex-col gap-6">
                    {/* Active Context */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Crosshair className="w-3.5 h-3.5 text-blue-500" /> Contextual Lens
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg text-sm shadow-[inset_0_1px_2px_rgba(255,255,255,1)]">
                            <div className="relative flex-shrink-0 flex items-center justify-center w-2 h-2">
                                <div className="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-75"></div>
                                <div className="relative w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                            </div>
                            <span className="font-semibold text-blue-900 truncate text-[13px]">{contextTopic}</span>
                            <span className="text-blue-300 flex-shrink-0 text-xs">•</span>
                            <span className="text-blue-700 truncate text-[13px]">{auditType || 'Generic'}</span>
                        </div>
                    </div>

                    {/* Suggestion Card */}
                    <div className="border border-indigo-100 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 px-4 py-3 border-b border-indigo-100 flex flex-col gap-2.5">
                            <div className="flex justify-between items-center w-full">
                                <span className="text-[11px] font-black tracking-wider text-indigo-900 uppercase flex items-center gap-1.5">
                                    <Bot className="w-3.5 h-3.5 text-indigo-500" />
                                    Grounded Suggestion
                                </span>
                                <Badge variant="outline" className="text-[9px] font-bold text-indigo-600 bg-white border-indigo-200 uppercase tracking-widest px-1.5 py-0 shadow-sm">
                                    GPT-4o
                                </Badge>
                            </div>
                            <div className="w-full flex">
                                <DisclaimerBadge aiConfidence={displayConfidence} />
                            </div>
                        </div>
                        <div className="p-4 bg-white">
                            {loading ? (
                                <div className="flex items-center justify-center p-6 text-indigo-500">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    <span className="text-sm font-medium">Analyzing Context...</span>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-800 mb-4 leading-relaxed">
                                        {displaySuggestion}
                                    </p>

                                    {engagementId && (
                                        <div className="flex justify-between items-center bg-white p-2 rounded border text-xs">
                                            <span className="text-gray-500 flex items-center">
                                                <Activity className="w-3 h-3 mr-1" /> Confidence
                                            </span>
                                            <span className="font-bold text-indigo-700">{displayConfidence}%</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="bg-white px-4 py-3 border-t flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-500" disabled={loading || !insight} onClick={() => console.log('AI suggestion dismissed')}>Dismiss</Button>
                            <Button size="sm" className="bg-[#002776] hover:bg-[#001f5c]" disabled={loading || !insight} onClick={() => console.log('AI action applied')}>Apply Action</Button>
                        </div>
                    </div>

                    {/* Compliance Source */}
                    {displayBindings.length > 0 && typeof displayBindings === 'object' && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center">
                                <Info className="w-3 h-3 mr-1" /> Regulatory Binding
                            </h3>
                            <ul className="space-y-2">
                                {displayBindings.map((binding, idx) => (
                                    <li key={idx} className="text-sm p-2 border rounded bg-white flex justify-between items-center cursor-pointer hover:border-gray-400">
                                        <span className="truncate mr-2">{binding}</span>
                                        <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>
            </ScrollArea>
        </div>
    )
}
