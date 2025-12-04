/**
 * Role DTOs
 * Purpose: Validate role and permission requests
 */

import { z } from 'zod'

// Create Role DTO
export const CreateRoleSchema = z.object({
  name: z.string().min(2),
  displayName: z.string().min(2),
  description: z.string().optional(),
  isCampusSpecific: z.boolean().optional().default(false),
  priority: z.number().int().optional().default(0),
  permissions: z.array(z.string()).optional(), // Array of permission IDs
})

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>

// Update Role DTO
export const UpdateRoleSchema = z.object({
  displayName: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.number().int().optional(),
  permissions: z.array(z.string()).optional(),
})

export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>

// Create Permission DTO
export const CreatePermissionSchema = z.object({
  resource: z.string().min(2),
  action: z.enum(['create', 'read', 'update', 'delete', 'approve', 'manage']),
  scope: z.enum(['own', 'campus', 'all']).optional().default('own'),
  description: z.string().optional(),
})

export type CreatePermissionDto = z.infer<typeof CreatePermissionSchema>
