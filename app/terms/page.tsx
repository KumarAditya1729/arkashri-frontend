'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import { FileText, Shield, Scale } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#002776] px-8 py-10 text-white">
                    <Scale className="w-12 h-12 mb-4 text-[#92d400]" />
                    <h1 className="text-3xl font-black tracking-tight">Terms of Service & AI Use Policy</h1>
                    <p className="mt-2 text-blue-100 font-medium">Effective Date: April 2026 | Enterprise Edition</p>
                </div>
                
                <div className="p-8 prose prose-slate max-w-none">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-600"/> 1. AI Output Liability</h2>
                    <p className="text-sm text-gray-600">
                        Arkashri is an AI-assisted decision support system. It is designed to aid, not replace, professional auditors. By using this platform, you acknowledge that all AI-generated preliminary findings, risk assessments, and executive summaries must undergo strict human review by a certified professional before final client submission.
                    </p>
                    
                    <h2 className="text-xl font-bold flex items-center gap-2 mt-8"><FileText className="w-5 h-5 text-indigo-600"/> 2. Data Anonymization</h2>
                    <p className="text-sm text-gray-600">
                        Client ERP ledger entries processed through Arkashri's Machine Learning models are logically isolated per tenant. All models adhere to standard compliance matrices preventing cross-tenant data leakage. PII data ingested through the Evidence hub is encrypted at rest using AES-256.
                    </p>

                    <h2 className="text-xl font-bold flex items-center gap-2 mt-8"><Scale className="w-5 h-5 text-indigo-600"/> 3. Blockchain Anchoring</h2>
                    <p className="text-sm text-gray-600">
                        By utilizing the Multi-Chain Evidex module, you consent to the cryptographic hashing of your artifacts on public ledgers (Ethereum, Polkadot, Polygon) for immutability verification. Raw data is never persisted on-chain.
                    </p>

                    <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                        <Link href="/sign-in" className="bg-[#002776] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#001a54] transition-colors shadow-md">
                            Acknowledge & Return
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
