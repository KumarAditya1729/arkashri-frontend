'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plug, Database, CheckCircle, AlertCircle, Settings, RefreshCw, Activity, Link2, ShieldCheck, HardDrive } from 'lucide-react'
import { AuditShell } from '@/components/layout/AuditShell'

const erpSystems = [
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Cloud accounting for SMBs',
    status: 'connected',
    lastSync: '2024-01-15 14:30',
    features: ['Invoicing', 'Bank Feeds', 'Financial Reports', 'Tax'],
    icon: '📊'
  },
  {
    id: 'zoho',
    name: 'Zoho Books',
    description: 'Cloud financial platform',
    status: 'disconnected',
    lastSync: null,
    features: ['Banking', 'Project Accounting', 'Multi-currency'],
    icon: '📚'
  },
  {
    id: 'tally',
    name: 'Tally Prime',
    description: 'On-premise enterprise accounting',
    status: 'connected',
    lastSync: '2024-01-15 12:15',
    features: ['GST Compliance', 'Inventory', 'Payroll'],
    icon: '📈'
  },
  {
    id: 'sap',
    name: 'SAP S/4HANA',
    description: 'Global enterprise operations',
    status: 'disconnected',
    lastSync: null,
    features: ['FI/CO', 'Supply Chain', 'HR Analytics'],
    icon: '🏢'
  },
  {
    id: 'oracle',
    name: 'Oracle NetSuite',
    description: 'Cloud ERP platform',
    status: 'disconnected',
    lastSync: null,
    features: ['ERP/Financials', 'CRM', 'E-commerce'],
    icon: '☁️'
  }
]

export default function ERPPage() {
  const [selectedSystem, setSelectedSystem] = useState(erpSystems[0])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE</span>
      case 'disconnected':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> OFFLINE</span>
      case 'syncing':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200"><RefreshCw className="w-3 h-3 animate-spin"/> SYNCING</span>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <AuditShell>
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div>
              <div className="text-xs font-black text-blue-600 mb-1 uppercase tracking-widest flex items-center gap-1.5">
                  <Database className="w-4 h-4" /> Data Pipelines
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">ERP Integration Hub</h1>
              <p className="text-gray-500 mt-1 max-w-xl text-sm leading-relaxed">Establish secure, continuous data pipelines from client financial systems to Arkashri's AI analytics engine.</p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="border-gray-200 shadow-sm font-semibold">
                <ShieldCheck className="w-4 h-4 mr-2 text-indigo-600" />
                Audit Trail
              </Button>
              <Button className="bg-[#002776] hover:bg-[#001a54] text-white shadow-md font-semibold">
                <Link2 className="w-4 h-4 mr-2" />
                Connect New System
              </Button>
            </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Pipelines', value: '2/5', icon: Plug, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Records Synced', value: '1.2M', icon: HardDrive, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'System Uptime', value: '99.9%', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Last Global Sync', value: '14 mins ago', icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900 leading-none">{stat.value}</div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column: Systems Navigator */}
          <div className="xl:col-span-4 space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 px-1 flex items-center justify-between">
              Supported Platforms
              <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full">5 Available</span>
            </h3>
            
            <div className="flex flex-col gap-3">
              {erpSystems.map((system) => (
                <div
                  key={system.id}
                  onClick={() => setSelectedSystem(system)}
                  className={`relative group cursor-pointer overflow-hidden rounded-xl border p-4 transition-all duration-200
                    ${selectedSystem.id === system.id 
                      ? 'bg-blue-600 border-blue-600 shadow-md text-white' 
                      : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-sm text-gray-900'
                    }`}
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-white/20 backdrop-blur-sm ${selectedSystem.id !== system.id && 'bg-gray-50'}`}>
                        {system.icon}
                      </div>
                      <div>
                        <h4 className="font-bold">{system.name}</h4>
                        <p className={`text-xs ${selectedSystem.id === system.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          {system.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between relative z-10">
                    {getStatusBadge(system.status)}
                    {system.lastSync && (
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${selectedSystem.id === system.id ? 'text-blue-200' : 'text-gray-400'}`}>
                        Sync: {system.lastSync.split(' ')[0]}
                      </span>
                    )}
                  </div>
                  
                  {/* Active highlight glow */}
                  {selectedSystem.id === system.id && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Configuration & Data */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
              
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-3xl">
                    {selectedSystem.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedSystem.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedSystem.status)}
                      <span className="text-sm font-medium text-gray-500">API Gateway</span>
                    </div>
                  </div>
                </div>
                
                {selectedSystem.status === 'connected' ? (
                  <Button variant="outline" className="text-[#002776] border-[#002776] hover:bg-blue-50 font-bold">
                    <RefreshCw className="w-4 h-4 mr-2" /> Force Sync
                  </Button>
                ) : (
                  <Button className="bg-[#002776] hover:bg-[#001a54] text-white font-bold shadow-md">
                    Initialize Connection
                  </Button>
                )}
              </div>

              {/* Tabs */}
              <div className="p-8 flex-1">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="bg-gray-100/80 p-1 rounded-xl w-full flex mb-8">
                    {['Overview', 'Authentication', 'Ingestion Rules', 'Analytics Logs'].map((tab, i) => (
                      <TabsTrigger 
                        key={i} 
                        value={tab.split(' ')[0].toLowerCase()} 
                        className="flex-1 rounded-lg text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#002776] data-[state=active]:shadow-sm"
                      >
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="overview">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Supported Data Vectors</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {selectedSystem.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm font-semibold text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedSystem.status === 'connected' && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 relative overflow-hidden">
                          <div className="relative z-10">
                            <h3 className="text-lg font-black text-blue-900 mb-2">Continuous Auditing Active</h3>
                            <p className="text-sm text-blue-700 max-w-md">Arkashri's Machine Learning agents are currently monitoring {selectedSystem.name} ledgers in real-time for anomalies.</p>
                          </div>
                          <Activity className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-200 opacity-50" />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="authentication">
                    <div className="max-w-xl space-y-6">
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-amber-800">
                          <strong>OAuth 2.0 Recommended:</strong> For enterprise deployments, use OAuth rather than static API keys to ensure automated token rotation.
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Environment</label>
                          <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Production (Live Ledger)</option>
                            <option>Sandbox / UAT</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client ID</label>
                          <input type="text" placeholder="Enter API Gateway Client ID" className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client Secret</label>
                          <input type="password" placeholder="••••••••••••••••" className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <Button className="w-full bg-gray-900 text-white hover:bg-black font-bold h-12 rounded-lg mt-2">
                          Validate Credentials
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ingestion">
                    <div className="space-y-6">
                      <p className="text-sm text-gray-500">Configure how frequently the AI fetches and analyzes records.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { title: 'Real-time Webhooks', desc: 'Instant anomaly detection', active: selectedSystem.status === 'connected' },
                          { title: 'Hourly Batch Sync', desc: 'High volume standard ledger pulls', active: false },
                          { title: 'Nightly Deep Scan', desc: 'Complex cross-account reconciliations', active: selectedSystem.status === 'connected' },
                        ].map((rule, idx) => (
                           <div key={idx} className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer ${rule.active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                             <div>
                               <div className="font-bold text-gray-900">{rule.title}</div>
                               <div className="text-xs text-gray-500 mt-1">{rule.desc}</div>
                             </div>
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${rule.active ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                {rule.active && <div className="w-2 h-2 rounded-full bg-white" />}
                             </div>
                           </div>
                        ))}
                      </div>
                      <Button className="bg-[#002776] text-white font-bold h-10 px-6 rounded-lg">Save Ingestion Rules</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics">
                    <div className="space-y-3">
                      {[
                        { time: 'Today, 14:30', status: 'Success', msg: 'Ingested 4,200 general ledger entries', color: 'bg-emerald-500' },
                        { time: 'Today, 14:00', status: 'Warning', msg: 'Rate limit approached (89%) - Auto-throttled', color: 'bg-amber-500' },
                        { time: 'Yesterday, 02:00', status: 'Success', msg: 'Nightly deep scan completed successfully', color: 'bg-emerald-500' },
                        { time: 'Jan 14, 16:45', status: 'Failed', msg: 'Connection timeout connecting to gateway', color: 'bg-red-500' },
                      ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                           <div className="flex items-center gap-3">
                             <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${log.color}`} />
                             <div>
                               <div className="text-sm font-bold text-gray-900">{log.msg}</div>
                               <div className="text-xs font-medium text-gray-500 mt-0.5">{log.time}</div>
                             </div>
                           </div>
                           <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${
                              log.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              log.status === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                              'bg-red-50 text-red-700 border-red-200'
                           }`}>
                             {log.status}
                           </span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AuditShell>
  )
}
