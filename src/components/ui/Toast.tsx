'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertCircle
  const bgColor =
    type === 'success'
      ? 'bg-success-50 border-success-200 text-success-900'
      : type === 'error'
      ? 'bg-danger-50 border-danger-200 text-danger-900'
      : 'bg-warning-50 border-warning-200 text-warning-900'

  const iconColor =
    type === 'success'
      ? 'text-success-600'
      : type === 'error'
      ? 'text-danger-600'
      : 'text-warning-600'

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColor} max-w-md`}
      >
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
