'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Search, LogOut, ChevronDown, Shield, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '../../store/authStore'
import { useState } from 'react'

export function Topbar() {
    const { user, logout } = useAuthStore()
    const router = useRouter()
    const [showUserMenu, setShowUserMenu] = useState(false)

    const handleLogout = () => {
        logout()
        router.push('/sign-in')
    }

    return (
        <header className="h-14 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-[#eef5ff]">
                        <Shield className="h-5 w-5 text-[#002776]" />
                    </span>
                    <div className="flex flex-col">
                        <h1 className="font-bold tracking-tight text-lg leading-tight">Arkashri</h1>
                        <span className="text-[10px] text-slate-500 tracking-wider uppercase">AI Audit OS</span>
                    </div>
                </Link>
            </div>

            <div className="mx-4 hidden max-w-md flex-1 md:block lg:mx-8 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                    placeholder="Global Search (Entities, Risks, Evidence)..."
                    className="h-9 pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[#002776]"
                />
            </div>

            <div className="flex items-center gap-2">
                <Link href="/engagement-overview" className="hidden lg:inline-flex">
                    <Button size="sm" className="h-9 bg-[#002776] text-white hover:bg-[#001a54] text-xs font-bold">
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        New Engagement
                    </Button>
                </Link>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={() => console.log('Notification clicked')}>
                    <Bell className="w-5 h-5" />
                </Button>

                {user ? (
                    <div className="relative ml-4 pl-4 border-l border-slate-200">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1 transition-colors"
                        >
                            <div className="w-8 h-8 bg-[#eef5ff] text-[#002776] rounded-full flex items-center justify-center text-sm font-bold border border-blue-100">
                                {user.avatarInitials}
                            </div>
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-semibold leading-tight">{user.fullName}</div>
                                <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                            </div>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                                <div className="px-4 py-3 border-b border-gray-50">
                                    <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    <p className="text-xs text-gray-400">{user.organisation}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="ml-4 pl-4 border-l border-slate-200 flex gap-2">
                        <Link href="/sign-in">
                            <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-slate-100 text-xs">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="sm" className="bg-[#002776] text-white hover:bg-[#001a54] text-xs font-semibold">
                                Register
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    )
}
