/**
 * Backup API
 * Purpose: Handle backup API requests
 * Inputs: Backup data and queries
 * Outputs: API responses
 */

import { apiClient } from './client'

export interface Backup {
  id: string
  filename: string
  filepath: string
  size: number
  type: 'manual' | 'automatic'
  createdAt: string
}

export interface BackupStats {
  totalBackups: number
  totalSize: number
  lastBackup: string | null
}

/**
 * Create backup
 * Purpose: Create new database backup
 * Inputs: backup type
 * Outputs: backup record
 */
export async function createBackup(type: 'manual' | 'automatic' = 'manual') {
  return apiClient.post('/backups', { type })
}

/**
 * Get all backups
 * Purpose: Fetch paginated backups
 * Inputs: page and limit
 * Outputs: backup list
 */
export async function getAllBackups(page: number = 1, limit: number = 10) {
  return apiClient.get(`/backups?page=${page}&limit=${limit}`)
}

/**
 * Get backup by ID
 * Purpose: Fetch single backup
 * Inputs: backup ID
 * Outputs: backup record
 */
export async function getBackupById(id: string) {
  return apiClient.get(`/backups/${id}`)
}

/**
 * Download backup
 * Purpose: Download backup file
 * Inputs: backup ID
 * Outputs: file download
 */
export async function downloadBackup(id: string, filename: string) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/backups/${id}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to download backup')
  }
  
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

/**
 * Delete backup
 * Purpose: Remove backup
 * Inputs: backup ID
 * Outputs: success response
 */
export async function deleteBackup(id: string) {
  return apiClient.delete(`/backups/${id}`)
}

/**
 * Restore backup
 * Purpose: Restore database from backup
 * Inputs: backup ID
 * Outputs: success response
 */
export async function restoreBackup(id: string) {
  return apiClient.post(`/backups/${id}/restore`, {})
}

/**
 * Get backup statistics
 * Purpose: Get backup stats
 * Inputs: none
 * Outputs: stats object
 */
export async function getBackupStats() {
  return apiClient.get('/backups/stats')
}
