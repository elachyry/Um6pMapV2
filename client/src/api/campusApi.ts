/**
 * Campus API
 * Purpose: API functions for campus management
 * Inputs: Campus data and query parameters
 * Outputs: Campus records and API responses
 */

import { apiClient } from './client'

interface ApiResponse<T> {
  success: boolean
  data?: T
  campuses?: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

interface Campus {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  coordinates: string | null
  mapData: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    buildings: number
    users: number
  }
}

/**
 * Get all campuses with pagination
 * Purpose: Fetch paginated campus list
 * Input: page, limit, search query
 * Output: Paginated campuses with metadata
 */
export async function getAllCampuses(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<ApiResponse<Campus[]>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  })

  const response = await apiClient.get<ApiResponse<Campus[]>>(`/campuses?${params}`)
  return response
}

/**
 * Get active campuses
 * Purpose: Fetch only active campuses for dropdowns
 * Output: List of active campuses
 */
export async function getActiveCampuses(): Promise<ApiResponse<Campus[]>> {
  const response = await apiClient.get<ApiResponse<Campus[]>>('/campuses/active')
  return response
}

/**
 * Get campus by ID
 * Purpose: Fetch single campus with full details
 * Input: Campus ID
 * Output: Campus data
 */
export async function getCampusById(id: string): Promise<ApiResponse<Campus>> {
  const response = await apiClient.get<ApiResponse<Campus>>(`/campuses/${id}`)
  return response
}

/**
 * Create new campus
 * Purpose: Add a new campus
 * Input: Campus data
 * Output: Created campus
 */
export async function createCampus(data: Partial<Campus>): Promise<ApiResponse<Campus>> {
  const response = await apiClient.post<ApiResponse<Campus>>('/campuses', data)
  return response
}

/**
 * Update campus
 * Purpose: Update existing campus
 * Input: Campus ID and updated data
 * Output: Updated campus
 */
export async function updateCampus(id: string, data: Partial<Campus>): Promise<ApiResponse<Campus>> {
  const response = await apiClient.put<ApiResponse<Campus>>(`/campuses/${id}`, data)
  return response
}

/**
 * Delete campus
 * Purpose: Delete campus with password confirmation
 * Input: Campus ID and admin password
 * Output: Success response
 */
export async function deleteCampus(id: string, password: string): Promise<ApiResponse<any>> {
  const response = await apiClient.delete<ApiResponse<any>>(`/campuses/${id}`, { password })
  return response
}

/**
 * Get campus map settings
 * Purpose: Fetch map configuration for a campus
 * Input: Campus ID
 * Output: Map settings data
 */
export async function getMapSettings(id: string): Promise<any> {
  const response = await apiClient.get(`/campuses/${id}/map-settings`)
  return response
}

/**
 * Update campus map settings
 * Purpose: Save map configuration changes
 * Input: Campus ID and settings
 * Output: Updated campus
 */
export async function updateMapSettings(id: string, settings: any): Promise<any> {
  const response = await apiClient.put(`/campuses/${id}/map-settings`, settings)
  return response
}

/**
 * Calculate map center from boundary
 * Purpose: Auto-calculate center point from campus boundary polygon
 * Input: Campus ID
 * Output: Calculated center coordinates
 */
export async function calculateMapCenter(id: string): Promise<{ success: boolean; center: { lat: number; lng: number } }> {
  const response = await apiClient.post<{ success: boolean; center: { lat: number; lng: number } }>(`/campuses/${id}/calculate-center`)
  return response
}
