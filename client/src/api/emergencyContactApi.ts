/**
 * Emergency Contact API
 * Purpose: API functions for emergency contact operations
 */

import { apiClient } from './client'

interface ApiResponse<T> {
  success: boolean
  data?: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  message?: string
  error?: string
}

/**
 * Get all emergency contacts with pagination
 */
export async function getAllEmergencyContacts(page = 1, limit = 12, search = '', campusId?: string) {
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
  
  return apiClient.get<ApiResponse<any>>(`/emergency-contacts?${params.toString()}`)
}

/**
 * Get emergency contact by ID
 */
export async function getEmergencyContactById(id: string) {
  const response = await apiClient.get<ApiResponse<any>>(`/emergency-contacts/${id}`)
  return response.data
}

/**
 * Create emergency contact
 */
export async function createEmergencyContact(data: any) {
  const response = await apiClient.post<ApiResponse<any>>('/emergency-contacts', data)
  return response.data
}

/**
 * Update emergency contact
 */
export async function updateEmergencyContact(id: string, data: any) {
  const response = await apiClient.put<ApiResponse<any>>(`/emergency-contacts/${id}`, data)
  return response.data
}

/**
 * Delete emergency contact
 */
export async function deleteEmergencyContact(id: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/emergency-contacts/${id}`)
  return response.data
}

/**
 * Toggle emergency contact active status
 */
export async function toggleEmergencyContactActive(id: string) {
  const response = await apiClient.put<ApiResponse<any>>(`/emergency-contacts/${id}/toggle-active`)
  return response.data
}
