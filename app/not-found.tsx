'use client'

import { AuditShell } from '@/components/layout/AuditShell'
import { FileQuestion, Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <AuditShell>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 border border-blue-100">
            <FileQuestion className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">System Module Not Found</h2>
        <p className="mt-4 text-gray-500 max-w-md mx-auto">
          The requested audit module, engagement page, or artifact link does not exist. It may have been removed or securely archived.
        </p>
        <Link 
            href="/dashboard" 
            className="mt-8 flex items-center gap-2 bg-[#002776] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#001a54] transition-colors shadow-md"
        >
            <Home className="w-4 h-4" />
            Return to Command Center
        </Link>
      </div>
    </AuditShell>
  )
}
