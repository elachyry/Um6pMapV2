import { apiClient } from './client'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * Get all categories
 * Purpose: Fetch all categories with pagination and type filter
 * Output: List of categories with pagination
 */
export async function getAllCategories(page = 1, limit = 12, search = '', type?: 'building' | 'open_space') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  
  if (search) {
    params.append('search', search)
  }
  
  if (type) {
    params.append('type', type)
  }
  
  return apiClient.get<ApiResponse<any>>(`/categories?${params.toString()}`)
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string) {
  const response = await apiClient.get<ApiResponse<any>>(`/categories/${id}`)
  return response.data
}

/**
 * Create category
 */
export async function createCategory(data: any) {
  const response = await apiClient.post<ApiResponse<any>>('/categories', data)
  return response.data
}

/**
 * Update category
 */
export async function updateCategory(id: string, data: any) {
  const response = await apiClient.put<ApiResponse<any>>(`/categories/${id}`, data)
  return response.data
}

/**
 * Delete category
 */
export async function deleteCategory(id: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/categories/${id}`)
  return response.data
}
