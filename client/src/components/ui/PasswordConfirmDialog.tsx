/**
 * PasswordConfirmDialog Component
 * Purpose: Password confirmation dialog for dangerous operations
 * Inputs: isOpen, title, message, onConfirm, onCancel
 * Outputs: User confirmation with password
 */

import { useState } from 'react'
import { AlertTriangle, Lock, X } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'

interface PasswordConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  itemName?: string
  onConfirm: (password: string) => void
  onCancel: () => void
}

export function PasswordConfirmDialog({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
}: PasswordConfirmDialogProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      setError('Password is required')
      return
    }

    setError('')
    onConfirm(password)
    setPassword('')
  }

  const handleCancel = () => {
    setPassword('')
    setError('')
    onCancel()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      <Card 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-red-600">{title}</CardTitle>
                <CardDescription className="mt-2">{message}</CardDescription>
                {itemName && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-sm font-semibold">Item to delete:</p>
                    <p className="text-sm text-muted-foreground mt-1">{itemName}</p>
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ Warning: This action cannot be undone!
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                All related data (buildings, users, events, etc.) will be permanently deleted.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Enter your password to confirm
              </label>
              <input
                type="password"
                className={`w-full px-3 py-2 border rounded-md ${
                  error ? 'border-red-500' : ''
                }`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="Enter your password"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Delete Permanently
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
