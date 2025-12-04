/**
 * Common DTOs
 * Purpose: Shared validation schemas
 */

import { z } from 'zod'

// Pagination Query DTO
export const PaginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

export type PaginationDto = z.infer<typeof PaginationSchema>

// ID Param DTO
export const IdParamSchema = z.object({
  id: z.string().min(1),
})

export type IdParamDto = z.infer<typeof IdParamSchema>

// Slug Param DTO
export const SlugParamSchema = z.object({
  slug: z.string().min(1),
})

export type SlugParamDto = z.infer<typeof SlugParamSchema>

// Status Response DTO
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Create standard API response
export function createResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  }
}

// Create paginated response
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
