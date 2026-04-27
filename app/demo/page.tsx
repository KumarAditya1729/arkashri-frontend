import Link from "next/link"
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  FileCheck2,
  FileText,
  Landmark,
  MessageSquareText,
  QrCode,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const flowSteps = [
  { label: "Engagement", detail: "FY 2025-26 statutory audit opened", icon: Building2, status: "Done" },
  { label: "Tally", detail: "Trial balance and vouchers imported", icon: DatabaseZap, status: "Done" },
  { label: "MCA", detail: "CIN, directors, capital and office attached", icon: Landmark, status: "Done" },
  { label: "GST", detail: "GSTR-1 and 2B reconciliations completed", icon: RefreshCw, status: "Review" },
  { label: "SA/CARO", detail: "Checklist and working papers reviewed", icon: ClipboardCheck, status: "Done" },
  { label: "Report", detail: "UDIN, QR verification and artifact ready", icon: QrCode, status: "Ready" },
]

const readinessGates: Array<[string, number, LucideIcon]> = [
  ["SA/CARO checklist", 92, CheckCircle2],
  ["Working papers", 81, FileCheck2],
  ["Client approvals", 67, MessageSquareText],
  ["Integrity seal", 100, BadgeCheck],
]

const exceptions = [
  ["INV-0048", "GSTR-1 taxable value mismatch", "High", "₹84,200"],
  ["PUR-0192", "2B ITC not reflected in books", "Medium", "₹18,900"],
  ["JRN-2231", "Round-number March entry", "Medium", "₹5,00,000"],
]

const outputs = [
  ["Statutory Audit Report", "Final artifact generated", "Ready"],
  ["CARO 2020 Annexure", "21 clause responses populated", "Ready"],
  ["Management Representation Letter", "Client approval requested", "Pending"],
  ["Verification Seal", "Report hash and QR code attached", "Ready"],
]

export default function FullAuditDemoPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f2] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-700 text-white">Pilot demo</Badge>
              <Badge variant="outline">ABC Manufacturing Pvt Ltd</Badge>
              <Badge variant="outline">FY 2025-26</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal lg:text-3xl">
              Tally to signed audit report
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              A complete statutory audit workspace for an Indian CA firm: import books, reconcile GST,
              complete SA/CARO work, send client approvals, generate UDIN and seal the final report.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <FileText />
                Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/engagement-overview">
                <ShieldCheck />
                Open engagement
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-5 md:grid-cols-4">
        {[
          ["Overall readiness", "86%", "14 checklist items remain"],
          ["Workflow support", "Active", "Based on import and review automation"],
          ["GST variance", "₹1.03L", "3 exceptions need manager review"],
          ["Client actions", "2", "MRL approval and bank confirmation"],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Full audit flow</h2>
              <p className="text-sm text-slate-500">One screen for the pilot walkthrough.</p>
            </div>
            <Badge variant="outline">6 stages</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {flowSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.label} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md border border-slate-100 bg-slate-50 p-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-white text-emerald-700 shadow-sm">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{index + 1}. {step.label}</p>
                    <p className="text-xs text-slate-500">{step.detail}</p>
                  </div>
                  <Badge variant={step.status === "Review" ? "outline" : "secondary"}>{step.status}</Badge>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Readiness gates</h2>
              <p className="text-sm text-slate-500">Partner can see exactly what blocks issuance.</p>
            </div>
            <Badge className="bg-slate-900 text-white">Report ready</Badge>
          </div>
          <div className="mt-5 space-y-5">
            {readinessGates.map(([label, value, Icon]) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className="size-4 text-emerald-700" />
                    {label}
                  </span>
                  <span>{value}%</span>
                </div>
                <Progress value={value} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            <h2 className="text-lg font-semibold">Exceptions for manager review</h2>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Ref</th>
                <th className="py-2">Issue</th>
                <th className="py-2">Risk</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(([ref, issue, risk, amount]) => (
                <tr key={ref} className="border-b border-slate-100">
                  <td className="py-3 font-medium">{ref}</td>
                  <td className="py-3 text-slate-600">{issue}</td>
                  <td className="py-3"><Badge variant="outline">{risk}</Badge></td>
                  <td className="py-3 text-right font-medium">{amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileCheck2 className="size-5 text-emerald-700" />
            <h2 className="text-lg font-semibold">Generated outputs</h2>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {outputs.map(([title, detail, status]) => (
              <div key={title} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-slate-500">{detail}</p>
                </div>
                <Badge variant={status === "Pending" ? "outline" : "secondary"}>{status}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            Final artifact includes UDIN, MCA facts, CARO responses, GST highlights, report hash and QR verification.
          </div>
        </div>
      </section>
    </main>
  )
}
