import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AuditShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#f6f7f9] flex flex-col font-sans text-slate-900">
            <Topbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 relative">
                    <div className="mx-auto max-w-[1560px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
