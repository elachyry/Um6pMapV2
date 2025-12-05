/**
 * Path API
 * Purpose: API functions for path management
 * Inputs: Path data and GeoJSON files
 * Outputs: Path records and import results
 */

import { apiClient } from './client'

export interface ImportResult {
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

interface ApiResponse<T> {
  success: boolean
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Import paths from GeoJSON file
 * Purpose: Upload and import GeoJSON file
 * Input: GeoJSON file or object, optional campusId
 * Output: Import results with statistics
 */
export async function importPaths(geojsonData: any, campusId?: string): Promise<ImportResult> {
  const body = campusId ? { geojson: geojsonData, campusId } : { geojson: geojsonData }
  const response = await apiClient.post<ApiResponse<ImportResult>>('/paths/import', body)
  return response.data
}

/**
 * Get all paths with pagination
 * Purpose: Fetch paginated path list
 * Input: page, limit, search query, campusId
 * Output: Paginated paths with metadata
 */
export async function getAllPaths(page: number = 1, limit: number = 12, search: string = '', campusId?: string) {
  const params = new URLSearchParams({ 
    page: page.toString(), 
    limit: limit.toString(),
    ...(search && { search }),
    ...(campusId && { campusId })
  })
  const response = await apiClient.get<ApiResponse<any>>(`/paths?${params}`)
  return response
}

/**
 * Get path by ID
 */
export async function getPathById(id: string) {
  const response = await apiClient.get<ApiResponse<any>>(`/paths/${id}`)
  return response.data
}

/**
 * Create path
 */
export async function createPath(data: any) {
  const response = await apiClient.post<ApiResponse<any>>('/paths', data)
  return response.data
}

/**
 * Update path
 */
export async function updatePath(id: string, data: any) {
  const response = await apiClient.put<ApiResponse<any>>(`/paths/${id}`, data)
  return response.data
}

/**
 * Delete path
 */
export async function deletePath(id: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/paths/${id}`)
  return response
}

/**
 * Toggle path active status
 */
export async function togglePathActive(id: string) {
  const response = await apiClient.put<ApiResponse<any>>(`/paths/${id}/toggle-active`, {})
  return response.data
}
