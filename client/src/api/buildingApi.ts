/**
 * Building API
 * Purpose: API functions for building management
 * Inputs: Building data and GeoJSON files
 * Outputs: Building records and import results
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
 * Import buildings from GeoJSON file
 * Purpose: Upload and import GeoJSON file
 * Input: GeoJSON file or object
 * Output: Import results with statistics
 */
export async function importBuildings(geojsonData: any): Promise<ImportResult> {
  const response = await apiClient.post<ApiResponse<ImportResult>>('/buildings/import', geojsonData)
  return response.data
}

/**
 * Get all buildings with pagination
 * Purpose: Fetch paginated building list
 * Input: page, limit, search query, campusId
 * Output: Paginated buildings with metadata
 */
export async function getAllBuildings(page: number = 1, limit: number = 12, search: string = '', campusId?: string, categoryId?: string) {
  const params = new URLSearchParams({ 
    page: page.toString(), 
    limit: limit.toString(),
    ...(search && { search }),
    ...(campusId && { campusId }),
    ...(categoryId && { categoryId })
  })
  const response = await apiClient.get<ApiResponse<any>>(`/buildings?${params}`)
  return response
}

/**
 * Get building by ID
 */
export async function getBuildingById(id: string) {
  const response = await apiClient.get<ApiResponse<any>>(`/buildings/${id}`)
  return response.data
}

/**
 * Create building
 */
export async function createBuilding(data: any) {
  const response = await apiClient.post<ApiResponse<any>>('/buildings', data)
  return response.data
}

/**
 * Update building
 */
export async function updateBuilding(id: string, data: any) {
  const response = await apiClient.put<ApiResponse<any>>(`/buildings/${id}`, data)
  return response.data
}

/**
 * Delete building
 */
export async function deleteBuilding(id: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/buildings/${id}`)
  return response
}
