"use client";

import { useState, useEffect } from "react";
import type { SVGProps } from "react";
import { useParams } from "next/navigation";
import { Building2, CheckCircle2, Clock, ShieldCheck, Activity, Eye, PlayCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

type PortalData = {
  client_name: string;
  engagement_type: string;
  status: string;
  sealed: boolean;
  sealed_at: string | null;
  kyc_cleared: boolean;
  independence_cleared: boolean;
  recent_activity: Record<string, unknown>[];
  estimates_under_review: Record<string, unknown>[];
};

type TimelineEvent = {
  event: string;
  timestamp: string;
  type: string;
  hash?: string;
};

export default function ClientPortal() {
  const params = useParams();
  const token = params.token as string;

  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortal() {
      try {
        const [dashboardRes, timelineRes] = await Promise.all([
          apiFetch<PortalData>(`/api/v1/portal/dashboard?token=${token}`),
          apiFetch<{ timeline: TimelineEvent[] }>(`/api/v1/portal/timeline?token=${token}`)
        ]);
        
        setPortalData(dashboardRes);
        setTimeline(timelineRes.timeline);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Invalid or expired access token.");
      } finally {
        setLoading(false);
      }
    }

    if (token) loadPortal();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4 text-neutral-400">
        <Activity className="h-8 w-8 animate-spin text-primary" />
        <p>Verifying secure link...</p>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <ShieldCheck className="h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold text-neutral-100">Access Denied</h1>
        <p className="text-neutral-400 max-w-md">
          {error}
        </p>
        <p className="text-sm text-neutral-500">
          Please request a new secure link from your auditor.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-neutral-50 p-4 md:p-8 lg:p-12 selection:bg-primary/30">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-primary">
              <Building2 className="h-5 w-5" />
              <span className="font-semibold text-sm tracking-wider uppercase">Arkashri Client Portal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-light tracking-tight">
              {portalData.client_name}
            </h1>
            <p className="text-neutral-400 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
              Engagement: {portalData.engagement_type}
              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                {portalData.status}
              </Badge>
            </p>
          </div>
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center space-x-2">
            <Eye className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Read-Only View Active</span>
          </div>
        </header>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-neutral-900/40 border-white/5 shadow-2xl backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-widest text-xs">KYC & Independence</CardDescription>
              <CardTitle className="text-2xl font-light flex items-center">
                {portalData.kyc_cleared && portalData.independence_cleared ? (
                  <><CheckCircle2 className="h-6 w-6 text-emerald-500 mr-2" /> Cleared</>
                ) : (
                  <><Clock className="h-6 w-6 text-amber-500 mr-2" /> Pending Verification</>
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-neutral-900/40 border-white/5 shadow-2xl backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-widest text-xs">Complex Estimates</CardDescription>
              <CardTitle className="text-2xl font-light">
                {portalData.estimates_under_review.length} Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-400">
                Awaiting manual CPA sign-off in backend.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/40 border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden">
             {portalData.sealed && (
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
             )}
            <CardHeader className="pb-2 relative z-10">
              <CardDescription className="uppercase tracking-widest text-xs">Audit Seal</CardDescription>
              <CardTitle className="text-2xl font-light flex items-center">
                 {portalData.sealed ? (
                  <><ShieldCheck className="h-6 w-6 text-emerald-400 mr-2" /> Sealed</>
                ) : (
                  <><LockIcon className="h-6 w-6 text-neutral-500 mr-2" /> Pending Signatures</>
                )}
              </CardTitle>
            </CardHeader>
             {portalData.sealed && (
               <CardContent className="relative z-10">
                 <p className="text-xs text-emerald-400/80 font-mono">
                   {new Date(portalData.sealed_at!).toLocaleDateString()}
                 </p>
               </CardContent>
             )}
          </Card>
        </div>

        {/* Timeline */}
        <div className="space-y-6 pt-4">
          <h2 className="text-2xl font-light flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-neutral-500" />
            Engagement Timeline
          </h2>
          
          <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {timeline.map((event, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-neutral-900 bg-emerald-500/20 text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-neutral-900/40 backdrop-blur-sm border border-white/5 p-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-semibold text-emerald-400">{event.event}</div>
                    <time className="font-mono text-xs text-neutral-500">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                  <div className="text-sm text-neutral-400">{event.type}</div>
                  {event.hash && (
                     <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[10px] text-neutral-500 font-mono break-all bg-black/50 p-2 rounded">
                          Proof Hash: {event.hash}
                        </p>
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
