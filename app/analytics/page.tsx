'use client'

import { Activity, AlertTriangle, Brain, Shield, TrendingUp } from 'lucide-react'

import { AuditShell } from '@/components/layout/AuditShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const productionSignals = [
  {
    label: 'Anomalies Detected',
    value: '0',
    detail: 'No production anomaly feed connected',
    icon: AlertTriangle,
  },
  {
    label: 'Risk Predictions',
    value: '0',
    detail: 'No production forecast series connected',
    icon: TrendingUp,
  },
  {
    label: 'Document Sentiment',
    value: 'Not connected',
    detail: 'Connect reviewed client correspondence',
    icon: Brain,
  },
  {
    label: 'Model Signal',
    value: 'Not connected',
    detail: 'Only live model outputs are shown',
    icon: Shield,
  },
]

export default function AnalyticsPage() {
  return (
    <AuditShell>
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Production-only analytics from live engagement events, reviewed model outputs and audit evidence.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Activity className="mr-2 h-4 w-4" />
            Refresh Live Data
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-60" />
            <h2 className="text-lg font-semibold">No live analytics data available</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              Arkashri does not display fabricated analytics. Connect production engagement events,
              anomaly outputs, and reviewed model results to populate this dashboard.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {productionSignals.map(item => {
            const Icon = item.icon
            return (
              <Card key={item.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {['Risk prediction trend', 'Risk distribution', 'Detected anomalies', 'Pattern analysis'].map(title => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Shown only after production data is available.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-56 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  No live data connected.
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AuditShell>
  )
}
