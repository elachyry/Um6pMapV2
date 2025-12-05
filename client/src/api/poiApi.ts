/**
 * POI API
 * Purpose: API functions for POI operations
 */

import { apiClient } from './client'

export interface ImportResult {
  success: boolean
  total: number
  imported: number
  duplicates: number
  errors: number
  details: {
    imported: string[]
    duplicates: string[]
    errors: Array<{ name: string; error: string }>
  }
}

/**
 * Get all POIs with pagination
 * Purpose: Fetch paginated list of POIs
 * Input: page, limit, campusId, search (all optional except page/limit)
 * Output: Paginated POIs
 */
export async function getPOIs(page = 1, limit = 12, campusId?: string, search?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  
  if (campusId) {
    params.append('campusId', campusId)
  }
  
  if (search) {
    params.append('search', search)
  }
  
  return apiClient.get(`/pois?${params.toString()}`)
}

/**
 * Import POIs from GeoJSON file
 * Purpose: Upload and process a GeoJSON file containing POIs
 * Input: campusId, file
 * Output: ImportResult
 */
export async function importPOIs(campusId: string, file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('campusId', campusId)

  const result = await apiClient.post<ImportResult>('/pois/import', formData)
  return result
}

/**
 * Delete POI
 * Purpose: Remove POI from database
 * Input: POI ID
 * Output: Success message
 */
export async function deletePOI(id: string) {
  return apiClient.delete(`/pois/${id}`)
}

/**
 * Toggle POI active status
 * Purpose: Activate/deactivate POI
 * Input: POI ID
 * Output: Updated POI
 */
export async function togglePOIActive(id: string) {
  return apiClient.put(`/pois/${id}/toggle-active`, {})
}

/**
 * Get POI by ID
 * Purpose: Fetch single POI
 * Input: POI ID
 * Output: POI data
 */
export async function getPOIById(id: string) {
  return apiClient.get(`/pois/${id}`)
}

/**
 * Create POI
 * Purpose: Create new POI
 * Input: POI data
 * Output: Created POI
 */
export async function createPOI(data: any) {
  return apiClient.post('/pois', data)
}

/**
 * Update POI
 * Purpose: Update existing POI
 * Input: POI ID and updated data
 * Output: Updated POI
 */
export async function updatePOI(id: string, data: any) {
  return apiClient.put(`/pois/${id}`, data)
}
