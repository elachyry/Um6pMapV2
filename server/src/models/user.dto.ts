/**
 * User DTOs (Data Transfer Objects)
 * Purpose: Validate and type user-related requests/responses
 */

import { z } from 'zod'

// Create User DTO
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  studentId: z.string().optional(),
  userType: z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'STUDENT', 'GUEST', 'TEMPORARY']).optional(),
  campusId: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  maxSessions: z.number().int().positive().optional(),
})

export type CreateUserDto = z.infer<typeof CreateUserSchema>

// Update User DTO
export const UpdateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  department: z.string().optional(),
  studentId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'PENDING']).optional(),
  campusId: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
})

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>

// Query Users DTO
export const QueryUsersSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  userType: z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'STUDENT', 'GUEST', 'TEMPORARY']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'PENDING']).optional(),
  campusId: z.string().optional(),
  search: z.string().optional(),
})

export type QueryUsersDto = z.infer<typeof QueryUsersSchema>

// Assign Role DTO
export const AssignRoleSchema = z.object({
  roleId: z.string(),
  campusId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

export type AssignRoleDto = z.infer<typeof AssignRoleSchema>
