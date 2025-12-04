/**
 * RBAC Middleware
 * Purpose: Check user permissions before allowing access to routes
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '@/config/database'
import { ForbiddenError } from '@/utils/errors'
import type { Permission } from '@/constants/permissions'

/**
 * Check if user has specific permission
 * Input: userId, permission name, optional campusId for scope check
 * Output: boolean
 */
export async function hasPermission(
  userId: string,
  permission: Permission | string,
  campusId?: string
): Promise<boolean> {
  const userRoles: any = await prisma.userRole.findMany({
    where: {
      userId,
      ...(campusId && { campusId }), // Campus-scoped check
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  })

  for (const userRole of userRoles) {
    // SuperAdmin (GLOBAL scope) has all permissions
    if (userRole.role.scope === 'GLOBAL') {
      return true
    }

    // Check if role has the specific permission
    const hasPermission = userRole.role.permissions.some(
      (rp: any) => rp.permission.name === permission
    )

    if (hasPermission) {
      return true
    }
  }

  return false
}

/**
 * Require permission middleware factory
 * Input: permission name or array of permission names
 * Output: Middleware function that checks permission
 */
export function requirePermission(permission: Permission | string | Array<Permission | string>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any

    if (!user || !user.userId) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const permissions = Array.isArray(permission) ? permission : [permission]
    
    // Check if user has at least one of the required permissions
    for (const perm of permissions) {
      const has = await hasPermission(user.userId || user.id, perm)
      if (has) {
        return // User has at least one required permission
      }
    }

    return reply.code(403).send({ error: 'Forbidden: Insufficient permissions' })
  }
}

/**
 * Check if user can access resource (own or has permission)
 * Input: permission name
 * Output: Middleware function
 */
export function canAccessResource(permission: Permission | string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any
    const params = request.params as any

    if (!user || !user.userId) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    // If accessing own resource, allow
    if (params.id === user.userId || params.userId === user.userId) {
      return
    }

    // Otherwise check if user has the permission
    const has = await hasPermission(user.userId || user.id, permission)

    if (!has) {
      return reply.code(403).send({ error: 'Forbidden: Cannot access this resource' })
    }
  }
}

/**
 * Require specific user type
 */
export function requireUserType(...allowedTypes: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.user as any

    if (!user || !user.userType) {
      throw new ForbiddenError('Authentication required')
    }

    if (!allowedTypes.includes(user.userType)) {
      throw new ForbiddenError('Insufficient permissions')
    }
  }
}
