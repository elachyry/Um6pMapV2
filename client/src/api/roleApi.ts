/**
 * Role API Client
 * Purpose: Frontend API functions for role management
 * Inputs: Role data and queries
 * Outputs: API responses
 */

import { apiClient } from './client'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string | null
}

interface Role {
  id: string
  name: string
  description: string | null
  scope: string
  isSystem: boolean
  userCount: number
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

/**
 * Get all roles
 * Purpose: Fetch all roles with their permissions
 * Output: List of roles
 */
export async function getAllRoles(): Promise<ApiResponse<Role[]>> {
  const response = await apiClient.get<ApiResponse<Role[]>>('/roles')
  return response
}

/**
 * Get role by ID
 * Purpose: Fetch single role with details
 * Input: Role ID
 * Output: Role data
 */
export async function getRoleById(id: string): Promise<ApiResponse<Role>> {
  const response = await apiClient.get<ApiResponse<Role>>(`/roles/${id}`)
  return response
}

/**
 * Create new role
 * Purpose: Add a new role
 * Input: Role data
 * Output: Created role
 */
export async function createRole(data: Partial<Role>): Promise<ApiResponse<Role>> {
  const response = await apiClient.post<ApiResponse<Role>>('/roles', data)
  return response
}

/**
 * Update role
 * Purpose: Update existing role
 * Input: Role ID and updated data
 * Output: Updated role
 */
export async function updateRole(id: string, data: Partial<Role>): Promise<ApiResponse<Role>> {
  const response = await apiClient.put<ApiResponse<Role>>(`/roles/${id}`, data)
  return response
}

/**
 * Delete role
 * Purpose: Delete role
 * Input: Role ID
 * Output: Success response
 */
export async function deleteRole(id: string): Promise<ApiResponse<null>> {
  const response = await apiClient.delete<ApiResponse<null>>(`/roles/${id}`)
  return response
}
