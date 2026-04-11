'use client'

import { useEffect } from 'react'
import { AuditShell } from '@/components/layout/AuditShell'
import { AlertOctagon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Arkashri Global Error Caught:', error)
  }, [error])

  return (
    <AuditShell>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
            <AlertOctagon className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Subsystem Failure</h2>
        <p className="mt-4 text-gray-500 max-w-md mx-auto">
          A critical error occurred while attempting to render this interface or fetch data from the backend cluster. 
        </p>
        <div className="mt-8 flex gap-4">
            <Button 
                onClick={() => reset()}
                className="bg-[#002776] hover:bg-[#001a54] text-white font-bold px-6 shadow-md h-12 rounded-xl"
            >
                <RefreshCw className="w-4 h-4 mr-2" />
                Attempt Recovery
            </Button>
        </div>
      </div>
    </AuditShell>
  )
}
