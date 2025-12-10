/**
 * BulkTemporaryUserImport Component
 * Purpose: Import multiple temporary users from CSV/Excel
 * Required fields: firstName, lastName, email
 * After import, admin selects start/end dates for the session
 */

import { useState } from 'react'
import { X, Upload, FileSpreadsheet, Download, AlertCircle, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { apiClient } from '@/api/client'
import { useToast } from '@/hooks/useToast'

interface BulkTemporaryUserImportProps {
  onClose: () => void
  onSuccess: () => void
}

interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; email: string; error: string }>
}

export function BulkTemporaryUserImport({ onClose, onSuccess }: BulkTemporaryUserImportProps) {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [showDateSelection, setShowDateSelection] = useState(false)
  const [sessionDates, setSessionDates] = useState({
    startDate: '',
    endDate: '',
    purpose: ''
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type - CSV and Excel
      const validTypes = [
        'text/csv',
        'application/csv',
        'text/comma-separated-values',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      
      const fileName = selectedFile.name.toLowerCase()
      const isValid = fileName.endsWith('.csv') || 
                      fileName.endsWith('.xlsx') || 
                      fileName.endsWith('.xls') ||
                      validTypes.includes(selectedFile.type)
      
      if (!isValid) {
        toast.error('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
        return
      }

      setFile(selectedFile)
      setResult(null)
      setShowDateSelection(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    // Show date selection form
    setShowDateSelection(true)
  }

  const handleImport = async () => {
    if (!file) return

    // Validate dates
    if (!sessionDates.startDate || !sessionDates.endDate) {
      toast.error('Please select start and end dates for the session')
      return
    }

    const startDate = new Date(sessionDates.startDate)
    const endDate = new Date(sessionDates.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      toast.error('Start date cannot be in the past')
      return
    }

    if (endDate <= startDate) {
      toast.error('End date must be after start date')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('startDate', new Date(sessionDates.startDate).toISOString())
      formData.append('endDate', new Date(sessionDates.endDate).toISOString())
      if (sessionDates.purpose) {
        formData.append('purpose', sessionDates.purpose)
      }

      const response: any = await apiClient.post('/users/bulk-import-temporary', formData)

      setResult(response)
      
      if (response.success > 0) {
        toast.success(`Successfully imported ${response.success} temporary user(s)`)
        if (response.failed === 0) {
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 2000)
        }
      }
      
      if (response.failed > 0) {
        toast.error(`Failed to import ${response.failed} user(s)`)
      }
    } catch (error: any) {
      console.error('Bulk import failed:', error)
      toast.error(error.message || 'Failed to import users')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'firstName,lastName,email\nJohn,Doe,john.doe@example.com\nJane,Smith,jane.smith@example.com'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'temporary_users_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12 text-muted-foreground" />
    return <FileSpreadsheet className="w-12 h-12 text-primary" />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">Bulk Import Temporary Users</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Import Instructions</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
                  <li>Download the template to see the required format</li>
                  <li>Required fields: <strong>firstName, lastName, email</strong></li>
                  <li>Email must be a valid email address (any domain accepted)</li>
                  <li><strong>Supported formats: Excel (.xlsx, .xls) or CSV (.csv)</strong></li>
                  <li>After uploading, you'll select the session dates for all users</li>
                  <li>All imported users will receive a magic link to access the map</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Download Template */}
          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          {/* File Upload */}
          {!showDateSelection && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  {getFileIcon()}
                  <p className="mt-4 text-sm font-medium">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Excel (.xlsx, .xls) or CSV files
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Date Selection Form */}
          {showDateSelection && file && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="w-4 h-4" />
                <h3>Session Details for All Users</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionDates.startDate}
                    onChange={(e) => setSessionDates(prev => ({ ...prev, startDate: e.target.value }))}
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
                    value={sessionDates.endDate}
                    onChange={(e) => setSessionDates(prev => ({ ...prev, endDate: e.target.value }))}
                    min={sessionDates.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be after start date
                  </p>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium mb-2">Purpose (Optional)</label>
                <textarea
                  value={sessionDates.purpose}
                  onChange={(e) => setSessionDates(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="e.g., Workshop attendees, Conference participants"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background min-h-[60px]"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <p>These dates will apply to all {file.name} users</p>
              </div>
            </div>
          )}

          {/* Upload/Import Button */}
          {file && !result && (
            <Button 
              onClick={showDateSelection ? handleImport : handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Importing...' : showDateSelection ? 'Import Users' : 'Next: Set Session Dates'}
            </Button>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-600 dark:text-green-400">Successful</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{result.success}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{result.failed}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Errors:</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {result.errors.map((error, index) => (
                      <div key={index} className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3 text-sm">
                        <p className="font-medium text-red-900 dark:text-red-100">Row {error.row}: {error.email}</p>
                        <p className="text-red-700 dark:text-red-300">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
