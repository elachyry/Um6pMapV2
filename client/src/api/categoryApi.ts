import { apiClient } from './client'

/**
 * Get all categories
 * Purpose: Fetch all building categories
 * Output: List of categories
 */
export async function getAllCategories() {
  const response = await apiClient.get('/categories')
  return response
}
