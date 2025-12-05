/**
 * OpenSpace API
 * Purpose: API functions for open space CRUD operations
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
 * Get all open spaces with pagination
 * Purpose: Fetch paginated list of open spaces
 * Input: page, limit, search, campusId, openSpaceType (all optional except page/limit)
 * Output: Paginated open spaces
 */
export async function getOpenSpaces(page = 1, limit = 12, search = '', campusId?: string, openSpaceType?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  
  if (search) {
    params.append('search', search)
  }
  
  if (campusId) {
    params.append('campusId', campusId)
  }
  
  if (openSpaceType) {
    params.append('openSpaceType', openSpaceType)
  }
  
  return apiClient.get(`/open-spaces?${params.toString()}`)
}

/**
 * Get open space by ID
 * Purpose: Fetch single open space with all details
 * Input: OpenSpace ID
 * Output: OpenSpace object
 */
export async function getOpenSpaceById(id: string) {
  return apiClient.get(`/open-spaces/${id}`)
}

/**
 * Create new open space
 * Purpose: Create a new open space
 * Input: OpenSpace data
 * Output: Created open space
 */
export async function createOpenSpace(data: any) {
  return apiClient.post('/open-spaces', data)
}

/**
 * Update open space
 * Purpose: Update existing open space
 * Input: OpenSpace ID and update data
 * Output: Updated open space
 */
export async function updateOpenSpace(id: string, data: any) {
  return apiClient.put(`/open-spaces/${id}`, data)
}

/**
 * Delete open space
 * Purpose: Delete an open space
 * Input: OpenSpace ID
 * Output: Success message
 */
export async function deleteOpenSpace(id: string) {
  return apiClient.delete(`/open-spaces/${id}`)
}

/**
 * Toggle open space active status
 * Purpose: Activate/deactivate open space
 * Input: OpenSpace ID
 * Output: Updated open space
 */
export async function toggleOpenSpaceActive(id: string) {
  return apiClient.put(`/open-spaces/${id}/toggle-active`, {})
}

/**
 * Import open spaces from GeoJSON
 * Purpose: Bulk import open spaces with duplicate detection
 * Input: campusId, GeoJSON file
 * Output: Import result with counts
 */
export async function importOpenSpaces(campusId: string, file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('campusId', campusId)

  const result = await apiClient.post<ImportResult>('/open-spaces/import', formData)
  return result
}
