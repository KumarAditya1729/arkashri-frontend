'use client'

import { Activity, Cpu, Database, HardDrive, MemoryStick, Network, Server, ShieldCheck } from 'lucide-react'

import { AuditShell } from '@/components/layout/AuditShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const monitoringSignals = [
  { label: 'API Service', icon: Server },
  { label: 'Database', icon: Database },
  { label: 'CPU Usage', icon: Cpu },
  { label: 'Memory Usage', icon: MemoryStick },
  { label: 'Disk Usage', icon: HardDrive },
  { label: 'Network I/O', icon: Network },
]

export default function MonitoringPage() {
  return (
    <AuditShell>
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Production Monitoring</h1>
            <p className="text-muted-foreground">
              Live observability for deployed Arkashri infrastructure. No non-production pod, service or metric data is shown.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Activity className="mr-2 h-4 w-4" />
            Refresh Live Status
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-60" />
            <h2 className="text-lg font-semibold">No production monitoring source connected</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              Connect a real observability provider such as CloudWatch, Grafana, Prometheus or Sentry
              before showing infrastructure status, uptime, request rates or resource usage.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {monitoringSignals.map(item => {
            const Icon = item.icon
            return (
              <Card key={item.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Not connected</div>
                  <p className="text-xs text-muted-foreground">Awaiting production telemetry.</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {['Request rate', 'Error rate', 'Resource usage trend', 'Service health'].map(title => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Shown only after a live monitoring integration is configured.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-56 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  No live telemetry connected.
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AuditShell>
  )
}
