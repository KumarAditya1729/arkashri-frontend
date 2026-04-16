'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plug, Database, CheckCircle, AlertCircle, Settings,
  RefreshCw, Activity, Link2, ShieldCheck, HardDrive,
  UploadCloud, Zap, Globe, Lock, TrendingUp, ChevronRight,
  Wifi, WifiOff, Clock, ArrowUpRight, Filter, Search
} from 'lucide-react'
import { AuditShell } from '@/components/layout/AuditShell'

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const erpSystems = [
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    vendor: 'Intuit',
    description: 'Cloud accounting for SMBs',
    status: 'connected',
    lastSync: '2024-01-15 14:30',
    records: '482K',
    features: ['Invoicing', 'Bank Feeds', 'Financial Reports', 'Tax'],
    icon: '📊',
    gradient: 'from-green-500 to-emerald-600',
    accent: '#059669',
  },
  {
    id: 'tally',
    name: 'Tally Prime',
    vendor: 'Tally Solutions',
    description: 'On-premise enterprise accounting',
    status: 'connected',
    lastSync: '2024-01-15 12:15',
    records: '718K',
    features: ['GST Compliance', 'Inventory', 'Payroll'],
    icon: '📈',
    gradient: 'from-violet-500 to-purple-600',
    accent: '#7c3aed',
  },
  {
    id: 'zoho',
    name: 'Zoho Books',
    vendor: 'Zoho Corp.',
    description: 'Cloud financial platform',
    status: 'disconnected',
    lastSync: null,
    records: '—',
    features: ['Banking', 'Project Accounting', 'Multi-currency'],
    icon: '📚',
    gradient: 'from-orange-500 to-amber-500',
    accent: '#d97706',
  },
  {
    id: 'sap',
    name: 'SAP S/4HANA',
    vendor: 'SAP SE',
    description: 'Global enterprise operations',
    status: 'disconnected',
    lastSync: null,
    records: '—',
    features: ['FI/CO', 'Supply Chain', 'HR Analytics'],
    icon: '🏢',
    gradient: 'from-sky-500 to-blue-600',
    accent: '#0284c7',
  },
  {
    id: 'oracle',
    name: 'Oracle NetSuite',
    vendor: 'Oracle Corp.',
    description: 'Cloud ERP platform',
    status: 'disconnected',
    lastSync: null,
    records: '—',
    features: ['ERP/Financials', 'CRM', 'E-commerce'],
    icon: '☁️',
    gradient: 'from-red-500 to-rose-600',
    accent: '#e11d48',
  },
  {
    id: 'datadump',
    name: 'Secure Data Dump',
    vendor: 'Arkashri Internal',
    description: 'CISO-friendly offline ingestion',
    status: 'disconnected',
    lastSync: null,
    records: '—',
    features: ['Air-gapped Upload', 'CSV/XML Parser', 'AES-256 Encrypted'],
    icon: '🔒',
    gradient: 'from-slate-600 to-slate-800',
    accent: '#475569',
  },
]

const analyticsLogs = [
  { time: 'Today, 14:30', status: 'Success', msg: 'Ingested 4,200 general ledger entries', icon: CheckCircle },
  { time: 'Today, 14:00', status: 'Warning', msg: 'Rate limit approached (89%) – Auto-throttled', icon: AlertCircle },
  { time: 'Yesterday, 02:00', status: 'Success', msg: 'Nightly deep scan completed successfully', icon: CheckCircle },
  { time: 'Jan 14, 16:45', status: 'Failed', msg: 'Connection timeout connecting to gateway', icon: AlertCircle },
  { time: 'Jan 14, 09:00', status: 'Success', msg: 'OAuth token refreshed automatically', icon: CheckCircle },
]

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  if (status === 'connected')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse block" />
        LIVE
      </span>
    )
  if (status === 'syncing')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 tracking-wide">
        <RefreshCw className="w-3 h-3 animate-spin" />
        SYNCING
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-500 border border-slate-200 tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 block" />
      OFFLINE
    </span>
  )
}

function LogStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Warning: 'bg-amber-50 text-amber-700 border-amber-200',
    Failed: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${map[status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function ERPPage() {
  const [selected, setSelected] = useState(erpSystems[0])
  const [animateStats, setAnimateStats] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimateStats(true), 100)
    return () => clearTimeout(t)
  }, [])

  const stats = [
    { label: 'Active Pipelines', value: '2', sub: 'of 6 platforms', icon: Plug, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Records Synced', value: '1.2M', sub: 'across all connectors', icon: HardDrive, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'System Uptime', value: '99.9%', sub: 'last 90 days', icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Last Global Sync', value: '14m', sub: 'ago — all healthy', icon: RefreshCw, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  ]

  return (
    <AuditShell>
      {/* Page container */}
      <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-10">

        {/* ── HERO HEADER ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001f5e] via-[#002776] to-[#1a3fa8] p-7 shadow-xl">
          {/* decorative blobs */}
          <div className="absolute -top-14 -right-14 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-black text-blue-300 uppercase tracking-[0.2em] mb-2">
                <Database className="w-3.5 h-3.5" />
                Data Pipelines
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-2">
                ERP Integration Hub
              </h1>
              <p className="text-blue-200 text-sm leading-relaxed max-w-lg">
                Establish secure, continuous data pipelines from client financial systems to Arkashri's AI analytics engine.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/20 transition-all duration-200 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                Audit Trail
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#002776] text-sm font-black hover:bg-blue-50 shadow-lg transition-all duration-200">
                <Link2 className="w-4 h-4" />
                Connect New System
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`relative overflow-hidden bg-white rounded-2xl border ${s.border} shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all duration-300 group`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className={`shrink-0 w-11 h-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className={`text-2xl font-black text-gray-900 leading-none transition-all duration-700 ${animateStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  {s.value}
                </div>
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1 truncate">{s.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 truncate">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN PANEL ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* LEFT: Platforms list */}
          <div className="xl:col-span-4 space-y-3">
            {/* section header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Supported Platforms</span>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full tracking-wide">
                {erpSystems.length} Available
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {erpSystems.map((sys) => {
                const isActive = selected.id === sys.id
                return (
                  <button
                    key={sys.id}
                    onClick={() => setSelected(sys)}
                    className={`w-full text-left relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                      ${isActive
                        ? 'border-transparent shadow-lg scale-[1.01]'
                        : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'
                      }`}
                    style={isActive ? { background: `linear-gradient(135deg, #002776 0%, #1a3fa8 100%)` } : {}}
                  >
                    {/* glow blob */}
                    {isActive && (
                      <div className="absolute inset-0 opacity-30 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 80% 20%, ${sys.accent}66, transparent 70%)` }} />
                    )}

                    <div className="relative z-10 flex items-center gap-3">
                      {/* icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0
                        ${isActive ? 'bg-white/15 backdrop-blur-sm' : 'bg-gray-50 border border-gray-100'}`}>
                        {sys.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm leading-snug truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                          {sys.name}
                        </div>
                        <div className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
                          {sys.vendor}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <StatusPill status={sys.status} />
                        {sys.lastSync && (
                          <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-300' : 'text-gray-400'}`}>
                            {sys.lastSync.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* RIGHT: Detail panel */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">

              {/* Detail header */}
              <div className="relative overflow-hidden px-6 py-5 border-b border-gray-100">
                {/* gradient accent strip */}
                <div
                  className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, ${selected.accent}, ${selected.accent}99)` }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-3xl shadow-sm shrink-0">
                      {selected.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 leading-none">{selected.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">{selected.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusPill status={selected.status} />
                        <span className="text-xs font-semibold text-gray-400">
                          {selected.id === 'datadump' ? 'Manual File Drop' : 'API Gateway'}
                        </span>
                        {selected.records !== '—' && (
                          <>
                            <span className="text-gray-200">·</span>
                            <span className="text-xs font-bold text-gray-600">{selected.records} records</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CTA button */}
                  {selected.status === 'connected' ? (
                    <Button
                      variant="outline"
                      className="shrink-0 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 font-bold gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      Force Sync
                    </Button>
                  ) : selected.id === 'datadump' ? (
                    <Button className="shrink-0 bg-slate-800 hover:bg-slate-900 text-white font-bold shadow-md gap-2">
                      <UploadCloud className="w-4 h-4" />
                      Upload Wizard
                    </Button>
                  ) : (
                    <Button
                      className="shrink-0 text-white font-bold shadow-md gap-2"
                      style={{ background: `linear-gradient(135deg, #002776, #1a3fa8)` }}
                    >
                      <Link2 className="w-4 h-4" />
                      Initialize Connection
                    </Button>
                  )}
                </div>
              </div>

              {/* Tab body */}
              <div className="p-6 flex-1 overflow-y-auto">

                {/* ─── DATADUMP SPECIAL VIEW ─── */}
                {selected.id === 'datadump' ? (
                  <div className="flex flex-col items-center justify-center min-h-64 border-2 border-dashed border-gray-200 rounded-2xl bg-gradient-to-b from-gray-50 to-white p-10 text-center hover:border-blue-300 transition-colors group cursor-pointer">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-9 h-9 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Secure Air-Gapped Ingestion</h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-7">
                      Drag and drop encrypted General Ledger exports (CSV, XLSX, XML) to ingest without API connections.
                      Recommended for CISO-restricted corporate networks.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <button className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-md transition-colors">
                        <HardDrive className="w-4 h-4" />
                        Select Local Files
                      </button>
                      <button className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl border border-gray-200 shadow-sm transition-colors">
                        <Lock className="w-4 h-4 text-slate-500" />
                        AES-256 Encrypted
                      </button>
                    </div>
                    <div className="mt-6 flex items-center gap-6 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                      {['CSV', 'XLSX', 'XML', 'JSON'].map(f => (
                        <span key={f} className="px-2 py-1 bg-gray-100 rounded-md">.{f}</span>
                      ))}
                    </div>
                  </div>
                ) : (

                  /* ─── NORMAL ERP TABS ─── */
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-gray-100/70 backdrop-blur-sm p-1 rounded-xl w-full flex mb-6">
                      {[
                        { label: 'Overview', value: 'overview' },
                        { label: 'Authentication', value: 'authentication' },
                        { label: 'Ingestion Rules', value: 'ingestion' },
                        { label: 'Activity Log', value: 'analytics' },
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="flex-1 rounded-lg text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#002776] data-[state=active]:shadow-sm transition-all"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* ── Overview Tab ── */}
                    <TabsContent value="overview" className="mt-0 space-y-6">
                      <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Zap className="w-3 h-3" />
                          Supported Data Vectors
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selected.features.map((feature, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-150 group"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-semibold text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Connection health strip */}
                      {selected.status === 'connected' ? (
                        <div
                          className="relative overflow-hidden rounded-2xl p-5 flex items-start gap-4"
                          style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-blue-900 mb-1">Continuous Auditing Active</h4>
                            <p className="text-sm text-blue-700 leading-relaxed">
                              Arkashri ML agents are monitoring <strong>{selected.name}</strong> ledgers in real-time for anomalies, unusual patterns, and compliance deviations.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {['Anomaly Detection', 'GST Verification', 'Fraud Signals'].map(t => (
                                <span key={t} className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-lg">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                          <TrendingUp className="absolute -bottom-3 -right-3 w-24 h-24 text-blue-200/60" />
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-5 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <WifiOff className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-700 mb-0.5">Connection Not Established</h4>
                            <p className="text-sm text-gray-500">
                              Initialize the connection above to start AI-powered continuous auditing for {selected.name}.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Sync timeline */}
                      {selected.lastSync && (
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Last Sync Summary
                          </h3>
                          <div className="flex flex-wrap gap-6">
                            <div>
                              <div className="text-xs text-gray-400 font-semibold">Timestamp</div>
                              <div className="text-sm font-bold text-gray-800 mt-0.5">{selected.lastSync}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 font-semibold">Records</div>
                              <div className="text-sm font-bold text-gray-800 mt-0.5">{selected.records}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 font-semibold">Status</div>
                              <div className="text-sm font-bold text-emerald-600 mt-0.5">✓ Completed</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* ── Authentication Tab ── */}
                    <TabsContent value="authentication" className="mt-0">
                      <div className="max-w-lg space-y-5">
                        {/* Warning banner */}
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-amber-800 leading-relaxed">
                            <strong>OAuth 2.0 Recommended:</strong> Use OAuth over static API keys for automated token rotation and reduced credential exposure in enterprise deployments.
                          </p>
                        </div>

                        {/* Form fields */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                              Environment
                            </label>
                            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                              <option>Production (Live Ledger)</option>
                              <option>Sandbox / UAT</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                              Client ID
                            </label>
                            <input
                              type="text"
                              placeholder="Enter API Gateway Client ID"
                              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                              Client Secret
                            </label>
                            <input
                              type="password"
                              placeholder="••••••••••••••••"
                              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                              OAuth Callback URL
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                readOnly
                                value="https://app.arkashri.com/api/oauth/callback"
                                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 font-mono focus:outline-none cursor-default"
                              />
                              <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl border border-gray-200 transition-colors whitespace-nowrap">
                                Copy
                              </button>
                            </div>
                          </div>

                          <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-black text-white text-sm font-black rounded-xl transition-colors mt-2 shadow-md">
                            <ShieldCheck className="w-4 h-4" />
                            Validate Credentials
                          </button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── Ingestion Rules Tab ── */}
                    <TabsContent value="ingestion" className="mt-0 space-y-5">
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Configure how frequently Arkashri's AI fetches and analyzes records from <strong>{selected.name}</strong>.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { title: 'Real-time Webhooks', desc: 'Instant anomaly detection on each transaction', icon: Zap, active: selected.status === 'connected' },
                          { title: 'Hourly Batch Sync', desc: 'High-volume standard ledger pulls', icon: RefreshCw, active: false },
                          { title: 'Nightly Deep Scan', desc: 'Complex cross-account reconciliation at 02:00', icon: Globe, active: selected.status === 'connected' },
                          { title: 'On-demand Pull', desc: 'Manual trigger for ad-hoc audit requests', icon: Settings, active: false },
                        ].map((rule, idx) => (
                          <button
                            key={idx}
                            className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all duration-150 group
                              ${rule.active
                                ? 'border-blue-300 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                              }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                              ${rule.active ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-100'}`}>
                              <rule.icon className={`w-4 h-4 ${rule.active ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'}`} />
                            </div>
                            <div className="flex-1">
                              <div className={`font-bold text-sm ${rule.active ? 'text-blue-900' : 'text-gray-800'}`}>{rule.title}</div>
                              <div className={`text-xs mt-0.5 ${rule.active ? 'text-blue-600' : 'text-gray-500'}`}>{rule.desc}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors
                              ${rule.active ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                              {rule.active && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </button>
                        ))}
                      </div>

                      <button
                        className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-black rounded-xl shadow-md transition-all"
                        style={{ background: 'linear-gradient(135deg, #002776, #1a3fa8)' }}
                      >
                        Save Ingestion Rules
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </TabsContent>

                    {/* ── Activity Log Tab ── */}
                    <TabsContent value="analytics" className="mt-0 space-y-3">
                      {/* Filter bar */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Filter logs..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                          <Filter className="w-4 h-4" />
                          Filter
                        </button>
                      </div>

                      {analyticsLogs.map((log, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-white transition-all duration-150 group"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${
                              log.status === 'Success' ? 'bg-emerald-500' :
                              log.status === 'Warning' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-900 truncate">{log.msg}</div>
                              <div className="text-xs font-medium text-gray-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.time}
                              </div>
                            </div>
                          </div>
                          <LogStatusBadge status={log.status} />
                        </div>
                      ))}

                      <button className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-800 py-3 border border-dashed border-blue-200 hover:border-blue-400 rounded-xl bg-blue-50/40 hover:bg-blue-50 transition-all">
                        Load More Logs
                      </button>
                    </TabsContent>

                  </Tabs>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </AuditShell>
  )
}
