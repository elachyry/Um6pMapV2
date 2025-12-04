/**
 * Toast Hook
 * Purpose: Manage toast notifications throughout the app
 * Inputs: None
 * Outputs: Toast functions (success, error, warning, info)
 */

import { createContext, useContext, useState, ReactNode } from 'react'
import { Toast, ToastType } from '@/components/ui/Toast'

interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = (message: string, type: ToastType, duration = 5000) => {
    const id = Date.now().toString() + Math.random().toString(36)
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message: string, duration?: number) => showToast(message, 'success', duration)
  const error = (message: string, duration?: number) => showToast(message, 'error', duration)
  const warning = (message: string, duration?: number) => showToast(message, 'warning', duration)
  const info = (message: string, duration?: number) => showToast(message, 'info', duration)

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
