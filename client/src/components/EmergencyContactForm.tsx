/**
 * EmergencyContactForm Component
 * Purpose: Form for creating and editing emergency contacts
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface EmergencyContactFormData {
  name: string
  title: string
  department: string
  phone: string
  email: string
  description: string
  isActive: boolean
  displayOrder: number
}

interface EmergencyContactFormProps {
  contact?: any
  onSubmit: (data: EmergencyContactFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function EmergencyContactForm({ contact, onSubmit, onCancel, isLoading = false }: EmergencyContactFormProps) {
  const [formData, setFormData] = useState<EmergencyContactFormData>({
    name: '',
    title: '',
    department: '',
    phone: '',
    email: '',
    description: '',
    isActive: true,
    displayOrder: 0
  })

  // Auto-fill form when editing
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        title: contact.title || '',
        department: contact.department || '',
        phone: contact.phone || '',
        email: contact.email || '',
        description: contact.description || '',
        isActive: contact.isActive ?? true,
        displayOrder: contact.displayOrder || 0
      })
    }
  }, [contact])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>{contact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g., Campus Security"
                  required
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g., Security Office"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g., Campus Safety"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g., +212 5XX-XXXXXX"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g., security@um6p.ma"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background min-h-[100px]"
                  placeholder="Additional information..."
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower numbers appear first
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </label>
              </div>
            </div>
          </CardContent>

          {/* Form Actions */}
          <div className="border-t p-4 flex justify-end gap-3 flex-shrink-0">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                contact ? 'Update Contact' : 'Create Contact'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
