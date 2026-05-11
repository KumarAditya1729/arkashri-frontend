'use client'

import { Cookie, Construction, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#002776] px-8 py-10 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    <Cookie className="w-12 h-12 mb-4 text-[#92d400] relative z-10" />
                    <h1 className="text-3xl font-black tracking-tight relative z-10">Cookies Policy</h1>
                    <p className="mt-2 text-blue-100 font-medium relative z-10">Strictly Essential Functional Cookies Only</p>
                </div>
                
                <div className="p-8 prose prose-slate max-w-none prose-h2:text-[#002776] text-sm">
                    <p className="text-base text-gray-700 leading-relaxed">
                        Arkashri’s website and portal use cookies for essential functionality only. <strong>No tracking or advertising cookies are used.</strong> We do not engage in any marketing, analytics, cross-site tracking, or digital fingerprinting operations on your secure workspace.
                    </p>

                    <h2 className="mt-8 flex items-center gap-2"><Construction className="w-5 h-5"/> Required Infrastructure Cookies</h2>
                    
                    <div className="grid gap-4 mt-6">
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-5 flex gap-4 items-start">
                            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="font-bold text-slate-800 m-0">Authentication Token Cookie</h3>
                                <p className="text-slate-600 mt-1 mb-0">Maintains your secure login session. Configured strictly as an <code>HttpOnly</code>, <code>Secure</code>, and <code>SameSite=Strict</code> cookie to prevent cross-site scripting (XSS) interception.</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-5 flex gap-4 items-start">
                            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="font-bold text-slate-800 m-0">CSRF Anti-Forgery Token</h3>
                                <p className="text-slate-600 mt-1 mb-0">Protects API requests and backend form submissions from unauthorized cross-site request forgery attacks.</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-5 flex gap-4 items-start">
                            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="font-bold text-slate-800 m-0">UI Preference Mapping</h3>
                                <p className="text-slate-600 mt-1 mb-0">Stores interface configuration (such as Theme layout choice or Sidebar toggle state) to persist through page navigation.</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-5 flex gap-4 items-start">
                            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="font-bold text-slate-800 m-0">Consent Tracker</h3>
                                <p className="text-slate-600 mt-1 mb-0">A boolean value recording if you have acknowledged our Terms of Service and Privacy Policy, suppressing future banner pop-ups.</p>
                            </div>
                        </div>
                    </div>

                    <p className="mt-8 text-gray-500 italic text-xs">
                        By continuing to use the Arkashri dashboard, you acknowledge the necessity of these core infrastructure elements as detailed in the DPDP Act provisions regarding &quot;necessary technical processing&quot;.
                    </p>

                    <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4 justify-end">
                        <Link href="/terms" className="text-gray-500 hover:text-[#002776] px-4 py-2 font-medium transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="text-gray-500 hover:text-[#002776] px-4 py-2 font-medium transition-colors">Privacy Notice</Link>
                        <Link href="/dashboard" className="bg-[#002776] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#001a54] transition-colors shadow-md">
                            Acknowledge
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
