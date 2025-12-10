/**
 * BulkUserImport Component
 * Purpose: Import multiple users from Excel, PDF, or images
 */

import { useState } from 'react'
import { X, Upload, FileSpreadsheet, FileText, Image as ImageIcon, Download, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { apiClient } from '@/api/client'
import { useToast } from '@/hooks/useToast'

interface BulkUserImportProps {
  onClose: () => void
  onSuccess: () => void
}

interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; email: string; error: string }>
}

export function BulkUserImport({ onClose, onSuccess }: BulkUserImportProps) {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

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
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await apiClient.post('/users/bulk-import', formData)

      const data = response as any
      setResult(data)
      
      if (data.success > 0) {
        toast.success(`Successfully imported ${data.success} users`)
        if (data.failed === 0) {
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 2000)
        }
      }
      
      if (data.failed > 0) {
        toast.warning(`${data.failed} users failed to import`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import users')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Create CSV template
    const headers = ['firstName', 'lastName', 'email', 'phone', 'department', 'userCategory']
    const example = ['John', 'Doe', 'john.doe@um6p.ma', '+212600000000', 'Computer Science', 'STUDENT']
    
    const csv = [headers.join(','), example.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'user_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getFileIcon = () => {
    if (!file) return <Upload className="w-8 h-8" />
    
    if (file.type.includes('sheet') || file.type.includes('excel')) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />
    }
    if (file.type.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-600" />
    }
    if (file.type.includes('image')) {
      return <ImageIcon className="w-8 h-8 text-blue-600" />
    }
    return <Upload className="w-8 h-8" />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Bulk User Import</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Import multiple permanent users from Excel, PDF, or image files
          </p>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6 overflow-y-auto flex-1">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📋 Instructions
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
              <li>Download the template to see the required format</li>
              <li>Fill in user details: firstName, lastName, email, phone, department, userCategory</li>
              <li>userCategory must be either "STUDENT" or "STAFF"</li>
              <li>Email must be a valid email address (any domain accepted)</li>
              <li><strong>Supported formats: Excel (.xlsx, .xls) or CSV (.csv)</strong></li>
              <li>You can use the template in Excel or any spreadsheet software</li>
            </ul>
          </div>

          {/* Download Template */}
          <div className="mb-6">
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-6">
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

          {/* Upload Button */}
          {file && !result && (
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Importing...' : 'Import Users'}
            </Button>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.success}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Successfully Imported
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.failed}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Failed
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Import Errors
                  </h4>
                  <div className="space-y-2">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm bg-red-50 dark:bg-red-950 p-2 rounded">
                        <p className="font-medium">Row {error.row}: {error.email}</p>
                        <p className="text-red-600 dark:text-red-400">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setFile(null)
                  setResult(null)
                }} className="flex-1">
                  Import Another File
                </Button>
                <Button onClick={() => {
                  onSuccess()
                  onClose()
                }} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
