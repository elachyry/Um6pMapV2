/**
 * Boundary API
 * Purpose: API functions for boundary management
 * Inputs: Boundary data and GeoJSON files
 * Outputs: Boundary records and import results
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
 * Import boundaries from GeoJSON file
 * Purpose: Upload and import GeoJSON file
 * Input: GeoJSON file or object, campusId
 * Output: Import results with statistics
 */
export async function importBoundaries(geojsonData: any, campusId: string): Promise<ImportResult> {
  const body = { geojson: geojsonData, campusId }
  const response = await apiClient.post<ImportResult>('/boundaries/import', body)
  return response
}

/**
 * Get all boundaries with pagination
 * Purpose: Fetch paginated boundary list
 * Input: page, limit, search query, campusId
 * Output: Paginated boundaries with metadata
 */
export async function getAllBoundaries(page: number = 1, limit: number = 12, search: string = '', campusId?: string) {
  const params = new URLSearchParams({ 
    page: page.toString(), 
    limit: limit.toString(),
    ...(search && { search }),
    ...(campusId && { campusId })
  })
  const response = await apiClient.get<ApiResponse<any>>(`/boundaries?${params}`)
  return response
}

/**
 * Get boundary by ID
 */
export async function getBoundaryById(id: string) {
  const response = await apiClient.get<ApiResponse<any>>(`/boundaries/${id}`)
  return response.data
}

/**
 * Create boundary
 */
export async function createBoundary(data: any) {
  const response = await apiClient.post<ApiResponse<any>>('/boundaries', data)
  return response.data
}

/**
 * Update boundary
 */
export async function updateBoundary(id: string, data: any) {
  const response = await apiClient.put<ApiResponse<any>>(`/boundaries/${id}`, data)
  return response.data
}

/**
 * Delete boundary
 */
export async function deleteBoundary(id: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/boundaries/${id}`)
  return response.data
}

/**
 * Toggle boundary active status
 */
export async function toggleBoundaryActive(id: string) {
  const response = await apiClient.put<ApiResponse<any>>(`/boundaries/${id}/toggle-active`)
  return response.data
}
