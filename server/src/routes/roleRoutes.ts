/**
 * Role Routes
 * Purpose: Define role and permission management endpoints
 */

import { FastifyInstance } from 'fastify'
import { roleController } from '@/controllers/roleController'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSIONS } from '@/constants/permissions'

export async function roleRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate)

  // Roles - GET routes (accessible to all authenticated users)
  // This allows users to view available roles even if they don't have ROLE_VIEW permission
  fastify.get(
    '/',
    roleController.getRoles.bind(roleController)
  )

  fastify.get(
    '/:id',
    roleController.getRole.bind(roleController)
  )

  fastify.post(
    '/',
    {
      preHandler: requirePermission(PERMISSIONS.ROLE_CREATE),
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    roleController.createRole.bind(roleController)
  )

  fastify.put(
    '/:id',
    {
      preHandler: requirePermission(PERMISSIONS.ROLE_UPDATE),
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    roleController.updateRole.bind(roleController)
  )

  fastify.delete(
    '/:id',
    {
      preHandler: requirePermission(PERMISSIONS.ROLE_DELETE),
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    roleController.deleteRole.bind(roleController)
  )
}
