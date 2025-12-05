/**
 * Location API
 * Purpose: API functions for location CRUD operations
 */

import { apiClient } from './client'

/**
 * Get all locations with pagination
 * Purpose: Fetch paginated list of locations
 * Input: page, limit, buildingId (optional), campusId (optional)
 * Output: Paginated locations
 */
export async function getLocations(page = 1, limit = 12, buildingId?: string, campusId?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  
  if (buildingId) {
    params.append('buildingId', buildingId)
  }
  
  if (campusId) {
    params.append('campusId', campusId)
  }
  
  return apiClient.get(`/locations?${params.toString()}`)
}

/**
 * Get location by ID
 * Purpose: Fetch single location with all details
 * Input: Location ID
 * Output: Location object
 */
export async function getLocationById(id: string) {
  return apiClient.get(`/locations/${id}`)
}

/**
 * Create new location
 * Purpose: Create a new location
 * Input: Location data
 * Output: Created location
 */
export async function createLocation(data: any) {
  return apiClient.post('/locations', data)
}

/**
 * Update location
 * Purpose: Update existing location
 * Input: Location ID and update data
 * Output: Updated location
 */
export async function updateLocation(id: string, data: any) {
  return apiClient.put(`/locations/${id}`, data)
}

/**
 * Delete location
 * Purpose: Delete a location
 * Input: Location ID
 * Output: Success message
 */
export async function deleteLocation(id: string) {
  return apiClient.delete(`/locations/${id}`)
}

/**
 * Toggle location reservable status
 * Purpose: Activate/deactivate location
 * Input: Location ID
 * Output: Updated location
 */
export async function toggleLocationReservable(id: string) {
  return apiClient.put(`/locations/${id}/toggle-reservable`, {})
}
