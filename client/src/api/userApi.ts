/**
 * User API
 * Purpose: Handle all user-related API calls
 */

import { apiClient } from './client'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * Get all users with pagination
 */
export async function getAllUsers(page = 1, limit = 12, search = '', userType = '', status = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  
  if (search) params.append('search', search)
  if (userType) params.append('userType', userType)
  if (status) params.append('status', status)
  
  return apiClient.get<ApiResponse<any>>(`/users?${params.toString()}`)
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  const response = await apiClient.get<ApiResponse<any>>(`/users/${id}`)
  return response.data
}

/**
 * Create user
 */
export async function createUser(data: any) {
  const response = await apiClient.post<ApiResponse<any>>('/users', data)
  return response.data
}

/**
 * Update user
 */
export async function updateUser(id: string, data: any) {
  const response = await apiClient.put<ApiResponse<any>>(`/users/${id}`, data)
  return response.data
}

/**
 * Delete user
 */
export async function deleteUser(id: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/users/${id}`)
  return response.data
}

/**
 * Toggle user status
 */
export async function toggleUserStatus(id: string) {
  const response = await apiClient.patch<ApiResponse<any>>(`/users/${id}/toggle-status`)
  return response.data
}

/**
 * Update user password
 */
export async function updateUserPassword(id: string, password: string) {
  const response = await apiClient.patch<ApiResponse<any>>(`/users/${id}/password`, { password })
  return response.data
}

/**
 * Reset user password
 * Purpose: Generate new password, send email, and require password change on next login
 */
export async function resetUserPassword(id: string) {
  const response = await apiClient.post<ApiResponse<any>>(`/users/${id}/reset-password`)
  return response.data
}
