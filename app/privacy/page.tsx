'use client'

import { Shield, EyeOff, Server, Clock, Lock } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#002776] px-8 py-10 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    <Shield className="w-12 h-12 mb-4 text-[#92d400] relative z-10" />
                    <h1 className="text-3xl font-black tracking-tight relative z-10">Privacy Notice</h1>
                    <p className="mt-2 text-blue-100 font-medium relative z-10">Compliance with the Digital Personal Data Protection Act, 2023</p>
                </div>
                
                <div className="p-8 prose prose-slate max-w-none prose-h2:text-[#002776] prose-li:my-0.5 text-sm">
                    <p><strong>Applicability:</strong> This Privacy Notice applies to how Arkashri collects, uses, shares, and protects personal data in India. It reflects requirements of the Digital Personal Data Protection Act, 2023 (DPDP Act) and the DPDP Rules, 2025.</p>

                    <h2 className="flex items-center gap-2"><Server className="w-5 h-5"/> 1. Data Role & Collected Data</h2>
                    <p>Arkashri is a <strong>Data Processor</strong> for any personal data in Audit Data uploaded by Users (processed strictly per User instructions), and a <strong>Data Fiduciary</strong> only for Arkashri’s own operational and account data. The User (or its client entity) is the Data Fiduciary for all client audit records and must have lawful basis (consent or other) to upload it.</p>
                    <p>Arkashri collects only data necessary to operate the Platform and support Users: e.g., account info (email, contact), authentication logs, support communications, and any Audit Data the User uploads. We do <strong>not</strong> monetize or sell data.</p>

                    <h2 className="flex items-center gap-2 mt-8"><EyeOff className="w-5 h-5"/> 2. Purpose & No AI Training</h2>
                    <p>Data is used to provide the Platform services (e.g., analysis, reporting), maintain accounts, secure the system, comply with legal obligations, and support Users. Audit Data is processed only to facilitate the User’s audit/compliance tasks.</p>
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-900 rounded-r">
                        <strong>No AI Training:</strong> Arkashri does <em>not</em> use customer-uploaded Audit Data to train or fine-tune its AI models or to improve other services. Customer data remains confidential and is used solely for the contracted processing tasks.
                    </div>

                    <h2 className="mt-8">3. User Rights (DPDP Act)</h2>
                    <p>Under the DPDP Act, data principals (end-users) have rights to access, correction, erasure, and objection. Users (as Data Fiduciaries) must handle such requests. Arkashri will assist Users to comply with valid requests concerning Audit Data, subject to retention obligations. Note: if data must be retained by law, erasure requests may be limited.</p>

                    <h2 className="flex items-center gap-2 mt-8"><Lock className="w-5 h-5"/> 4. Security & Breach Notification</h2>
                    <p>Arkashri implements robust security: encryption of data in transit and at rest, strong access controls, multi-factor authentication, least‑privilege practices, and continuous monitoring. Logs of all changes are kept in WORM storage (write‑once) and cryptographically hashed.</p>
                    
                    <p><strong>Breach Notification Pipeline (DPDP Rules 2025):</strong></p>
                    <ul className="list-none pl-0 space-y-2 font-medium">
                        <li className="flex gap-3 bg-red-50 text-red-900 p-3 rounded border border-red-100">
                            <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-xs">0 Hours</span> Notify affected data principals (concise notice)
                        </li>
                        <li className="flex gap-3 bg-red-50 text-red-900 p-3 rounded border border-red-100">
                            <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-xs">0 Hours</span> Notify Data Protection Board (initial report)
                        </li>
                        <li className="flex gap-3 bg-red-100 text-red-900 p-3 rounded border border-red-200">
                            <span className="bg-red-300 text-red-900 px-2 py-0.5 rounded text-xs">72 Hours</span> Submit detailed report to Board (updated facts)
                        </li>
                    </ul>

                    <h2 className="flex items-center gap-2 mt-8"><Clock className="w-5 h-5"/> 5. Retention & Subprocessors</h2>
                    <p>Audit Data is retained for configured limits. All data will be deleted or returned at end of service, subject to legal holds. Hashes and metadata may be retained beyond deletion of personal data, as they no longer identify individuals.</p>
                    
                    <p>We use trusted subprocessors for infrastructure:</p>
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full text-left text-sm border-collapse">
                            <thead className="bg-[#f8fafc] text-slate-600">
                                <tr>
                                    <th className="py-2.5 px-4 rounded-tl">Subprocessor</th>
                                    <th className="py-2.5 px-4">Service</th>
                                    <th className="py-2.5 px-4">Location</th>
                                    <th className="py-2.5 px-4 rounded-tr">Purpose</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-2.5 px-4 font-medium">AWS / Azure</td>
                                    <td className="py-2.5 px-4">Cloud Auth, VM Hosting</td>
                                    <td className="py-2.5 px-4">Mumbai/Global</td>
                                    <td className="py-2.5 px-4">Compute, storage, DB hosting</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-4 font-medium">OpenAI / LLM APIs</td>
                                    <td className="py-2.5 px-4">AI Inference models</td>
                                    <td className="py-2.5 px-4">Varies</td>
                                    <td className="py-2.5 px-4">Generative AI analysis (Zero-Retention)</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-4 font-medium">Cloudflare</td>
                                    <td className="py-2.5 px-4">Network, WAF</td>
                                    <td className="py-2.5 px-4">Global</td>
                                    <td className="py-2.5 px-4">Protects and accelerates platform</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4 justify-end">
                        <Link href="/terms" className="text-gray-500 hover:text-[#002776] px-4 py-2 font-medium transition-colors">Terms of Service</Link>
                        <Link href="/cookies" className="text-gray-500 hover:text-[#002776] px-4 py-2 font-medium transition-colors">Cookies Policy</Link>
                        <Link href="/dashboard" className="bg-[#002776] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#001a54] transition-colors shadow-md">
                            Acknowledge
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
