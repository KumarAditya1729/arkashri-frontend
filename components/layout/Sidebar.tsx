'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, FileSearch, ShieldAlert, CheckSquare, Microscope, FileCheck, Eye, ScrollText, Brain, Network, Activity, BarChart3, Database, Plug } from 'lucide-react'
import { APP_VERSION, APP_EDITION } from '@/lib/version'

const navSections = [
    {
        label: 'Core workflow',
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/engagement-overview', label: 'Engagements', icon: Briefcase },
            { href: '/evidence', label: 'Client Documents', icon: Database },
            { href: '/planning', label: 'Planning', icon: FileSearch },
            { href: '/risks', label: 'Risks', icon: ShieldAlert },
            { href: '/controls', label: 'Controls', icon: CheckSquare },
            { href: '/testing', label: 'Testing', icon: Microscope },
            { href: '/review', label: 'Review', icon: Eye },
            { href: '/report', label: 'Reports', icon: FileCheck },
        ],
    },
    {
        label: 'Integrations & updates',
        items: [
            { href: '/erp', label: 'ERP / Tally Integration', icon: Plug },
            { href: '/regulatory-updates', label: 'Regulatory Updates', icon: ScrollText },
        ],
    },
    {
        label: 'Advanced',
        items: [
            { href: '/analytics', label: 'Analytics', icon: BarChart3 },
            { href: '/blockchain', label: 'Blockchain Anchoring', icon: Network },
            { href: '/monitoring', label: 'Monitoring', icon: Activity },
            { href: '/demo', label: 'AI Demo Lab', icon: Brain },
        ],
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 border-r bg-slate-50 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 overflow-hidden">
            <div className="p-4 border-b">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workspace Navigation</div>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                {navSections.map(section => (
                    <div key={section.label}>
                        <div className="mb-1 px-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{section.label}</div>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href || (pathname.startsWith('/engagement') && item.href.includes('engagement'))
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#e5f6ff] text-[#002776]' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#002776]' : 'text-gray-500'}`} />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="p-4 border-t bg-gray-100">
                <div className="text-xs text-gray-500 text-center">{APP_EDITION} v{APP_VERSION} ✅</div>
            </div>
        </aside>
    )
}
