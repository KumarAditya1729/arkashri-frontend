'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plug, Database, CheckCircle, AlertCircle, Settings, RefreshCw, Upload, Link as LinkIcon } from 'lucide-react'

const erpSystems = [
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Small business accounting software',
    status: 'connected',
    lastSync: '2024-01-15 14:30',
    features: ['Invoicing', 'Bank Feeds', 'Financial Reports', 'Tax Management'],
    icon: '📊'
  },
  {
    id: 'zoho',
    name: 'Zoho Books',
    description: 'Cloud-based accounting platform',
    status: 'disconnected',
    lastSync: null,
    features: ['Automated Banking', 'Project Accounting', 'Multi-currency', 'Compliance'],
    icon: '📚'
  },
  {
    id: 'tally',
    name: 'Tally',
    description: 'Traditional accounting software',
    status: 'connected',
    lastSync: '2024-01-15 12:15',
    features: ['GST Compliance', 'Inventory Management', 'Payroll', 'Banking'],
    icon: '📈'
  },
  {
    id: 'sap',
    name: 'SAP',
    description: 'Enterprise ERP system',
    status: 'disconnected',
    lastSync: null,
    features: ['FI/CO', 'Supply Chain', 'HR', 'Analytics'],
    icon: '🏢'
  },
  {
    id: 'oracle',
    name: 'Oracle',
    description: 'Database ERP integration',
    status: 'disconnected',
    lastSync: null,
    features: ['Financials', 'Procurement', 'Risk Management', 'Reporting'],
    icon: '🗄️'
  },
  {
    id: 'netsuite',
    name: 'NetSuite',
    description: 'Cloud ERP platform',
    status: 'disconnected',
    lastSync: null,
    features: ['ERP/Financials', 'CRM', 'E-commerce', 'Professional Services'],
    icon: '☁️'
  }
]

import { AuditShell } from '@/components/layout/AuditShell'

export default function ERPPage() {
  const [selectedSystem, setSelectedSystem] = useState(erpSystems[0])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>
      case 'disconnected':
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" />Disconnected</Badge>
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1" />Syncing</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  return (
    <AuditShell>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ERP Integration</h1>
          <p className="text-gray-600 mt-2">Connect and manage your ERP systems for seamless data synchronization</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plug className="w-4 h-4 mr-2" />
          Add New Integration
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ERP Systems List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                ERP Systems
              </CardTitle>
              <CardDescription>Select a system to configure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {erpSystems.map((system) => (
                <div
                  key={system.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSystem.id === system.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedSystem(system)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{system.icon}</span>
                      <div>
                        <h3 className="font-medium">{system.name}</h3>
                        <p className="text-sm text-gray-600">{system.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    {getStatusBadge(system.status)}
                    {system.lastSync && (
                      <span className="text-xs text-gray-500">Sync: {system.lastSync}</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedSystem.icon}</span>
                  <div>
                    <CardTitle>{selectedSystem.name}</CardTitle>
                    <CardDescription>{selectedSystem.description}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(selectedSystem.status)}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="configuration">Configuration</TabsTrigger>
                  <TabsTrigger value="sync">Sync Settings</TabsTrigger>
                  <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Available Features</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedSystem.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    {selectedSystem.status === 'connected' ? (
                      <>
                        <Button variant="outline">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync Now
                        </Button>
                        <Button variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        <Button variant="outline" className="text-red-600 hover:text-red-700">
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Connect {selectedSystem.name}
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="configuration" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">API Credentials</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Client ID"
                          className="w-full p-2 border rounded-md"
                        />
                        <input
                          type="password"
                          placeholder="Client Secret"
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Connection Settings</label>
                      <div className="space-y-2">
                        <select className="w-full p-2 border rounded-md">
                          <option>Sandbox Environment</option>
                          <option>Production Environment</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Company ID / Realm ID"
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>

                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Test Connection
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="sync" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Sync Frequency</label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Real-time</option>
                        <option>Every 5 minutes</option>
                        <option>Every 15 minutes</option>
                        <option>Every hour</option>
                        <option>Daily</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Data Types to Sync</label>
                      <div className="space-y-2">
                        {['Invoices', 'Payments', 'Bank Transactions', 'Journal Entries', 'Chart of Accounts'].map((type) => (
                          <label key={type} className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Save Sync Settings
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { time: '2024-01-15 14:30', action: 'Sync completed', status: 'success' },
                      { time: '2024-01-15 14:25', action: 'Started sync', status: 'info' },
                      { time: '2024-01-15 10:15', action: 'Connection test', status: 'success' },
                      { time: '2024-01-14 16:45', action: 'Sync failed', status: 'error' },
                    ].map((log, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            log.status === 'success' ? 'bg-green-500' :
                            log.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{log.action}</p>
                            <p className="text-xs text-gray-500">{log.time}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {log.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected Systems</p>
                <p className="text-2xl font-bold">2/6</p>
              </div>
              <Plug className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Sync</p>
                <p className="text-2xl font-bold">2h ago</p>
              </div>
              <RefreshCw className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Records Synced</p>
                <p className="text-2xl font-bold">1.2K</p>
              </div>
              <Database className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sync Status</p>
                <p className="text-2xl font-bold">Active</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AuditShell>
  )
}
