/**
 * UserForm Component
 * Purpose: Form for creating and editing users (both permanent and temporary)
 */

import { useState, useEffect } from 'react'
import { X, KeyRound } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface UserFormData {
  email: string
  password?: string
  firstName: string
  lastName: string
  phone: string
  department: string
  userCategory?: string
  userType: string
  status: string
  campusId?: string
  startDate?: string
  endDate?: string
  purpose?: string
}

interface UserFormProps {
  user?: any
  userType: 'PERMANENT' | 'TEMPORARY'
  onSubmit: (data: UserFormData) => void
  onCancel: () => void
  onResetPassword?: (userId: string, userName: string) => void
  isLoading?: boolean
  campuses?: any[]
}

export function UserForm({ user, userType, onSubmit, onCancel, onResetPassword, isLoading = false }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    userCategory: 'STUDENT',
    userType: userType,
    status: 'ACTIVE',
    campusId: '',
    startDate: '',
    endDate: '',
    purpose: ''
  })


  // Auto-fill form when editing
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        department: user.department || '',
        userCategory: user.userCategory || user.department || 'STUDENT',
        userType: user.userType || userType,
        status: user.status || 'ACTIVE',
        campusId: user.campusId || '',
        startDate: user.startDate ? new Date(user.startDate).toISOString().split('T')[0] : '',
        endDate: user.endDate ? new Date(user.endDate).toISOString().split('T')[0] : '',
        purpose: user.purpose || ''
      })
    }
  }, [user, userType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate dates for temporary users
    if (userType === 'TEMPORARY') {
      if (!formData.startDate || !formData.endDate) {
        alert('Start date and end date are required for temporary users')
        return
      }
      
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (startDate < today) {
        alert('Start date cannot be in the past')
        return
      }
      
      if (endDate <= startDate) {
        alert('End date must be after start date')
        return
      }
    }
    
    // Convert dates to ISO format if they exist
    const submitData = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined
    }
    
    // Remove password field when editing (password reset is handled separately)
    if (user) {
      delete submitData.password
    }
    
    onSubmit(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-card z-10 border-b">
          <CardTitle>
            {user ? 'Edit' : 'Add'} {userType === 'TEMPORARY' ? 'Temporary' : 'Permanent'} User
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="Enter last name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="user@example.com"
                  disabled={!!user} // Disable email editing
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>

              {/* User Category - Only for PERMANENT users */}
              {userType === 'PERMANENT' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    User Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={formData.userCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, userCategory: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>
              )}

              {/* Department - Only for PERMANENT users */}
              {userType === 'PERMANENT' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Department/Faculty</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g., Computer Science, Engineering"
                  />
                </div>
              )}

              {/* Campus is auto-selected from the current selected campus in the store */}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              {/* Reset Password - Only show when editing existing user */}
              {user && onResetPassword && (
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onResetPassword(user.id, `${user.firstName} ${user.lastName}`)}
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                </div>
              )}

              {/* Info message for new users */}
              {!user && (
                <div className="col-span-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>ℹ️ Auto-Generated Password:</strong> A secure password will be automatically generated and sent to the user's email address. The user will be required to change it upon first login.
                  </p>
                </div>
              )}
            </div>

            {/* Temporary User Fields */}
            {userType === 'TEMPORARY' && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-4">Temporary Access Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Start Date <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Cannot select past dates
                      </p>
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        End Date <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be after start date
                      </p>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Purpose</label>
                    <textarea
                      value={formData.purpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background min-h-[80px]"
                      placeholder="Reason for temporary access..."
                    />
                  </div>
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : user ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
