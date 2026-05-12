import { AIBox } from '@/components/core/AIBox'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AuditShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#f7f9fc] flex flex-col font-sans text-slate-900">
            <Topbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
                    <div className="mx-auto max-w-[1440px]">
                        {children}
                    </div>
                </main>

                <aside className="w-80 border-l border-slate-200 bg-white h-[calc(100vh-3.5rem)] sticky top-14 hidden 2xl:block overflow-hidden shadow-sm">
                    <AIBox />
                </aside>
            </div>
        </div>
    )
}
