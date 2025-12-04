/**
 * RBAC Service
 * Purpose: Handle role-based access control logic
 * Inputs: User ID, resource, action
 * Outputs: Boolean permission check results
 */

import { prisma } from '@/config/database'
import { ForbiddenError, NotFoundError } from '@/utils/errors'

export class RBACService {
  /**
   * Check if user has permission
   * Input: userId, resource (e.g., 'building'), action (e.g., 'create'), scope
   * Output: Boolean indicating permission
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    scope: 'own' | 'campus' | 'all' = 'own'
  ): Promise<boolean> {
    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
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
        },
      },
    })

    if (!user) return false

    // Super admin has all permissions
    if (user.userType === 'SUPER_ADMIN') return true

    // Check if user has the specific permission
    for (const userRole of user.roles) {
      const rolePermissions = userRole.role.permissions

      for (const rolePerm of rolePermissions) {
        const perm = rolePerm.permission

        // Match resource and action
        if (perm.resource === resource && perm.action === action) {
          // Check scope hierarchy: all > campus > own
          if (perm.scope === 'all' || perm.scope === scope) {
            return true
          }
        }

        // Special case: 'manage' action grants all CRUD operations
        if (perm.resource === resource && perm.action === 'manage') {
          return true
        }
      }
    }

    return false
  }

  /**
   * Check permission and throw error if denied
   */
  async requirePermission(
    userId: string,
    resource: string,
    action: string,
    scope: 'own' | 'campus' | 'all' = 'own'
  ): Promise<void> {
    const hasAccess = await this.hasPermission(userId, resource, action, scope)
    if (!hasAccess) {
      throw new ForbiddenError(`You don't have permission to ${action} ${resource}`)
    }
  }

  /**
   * Get all user permissions
   */
  async getUserPermissions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
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
        },
      },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Collect all permissions
    const permissions = new Map<string, any>()

    for (const userRole of user.roles) {
      for (const rolePerm of userRole.role.permissions) {
        const perm = rolePerm.permission
        const key = `${perm.resource}:${perm.action}:${perm.scope}`
        permissions.set(key, perm)
      }
    }

    return Array.from(permissions.values())
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleId: string,
    campusId?: string,
    grantedBy?: string,
    expiresAt?: Date
  ) {
    // Check if role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      throw new NotFoundError('Role not found')
    }

    // Check if campus-specific role needs campus
    if (role.isCampusSpecific && !campusId) {
      throw new ForbiddenError('Campus ID is required for campus-specific roles')
    }

    // Create user role assignment
    return prisma.userRole.create({
      data: {
        userId,
        roleId,
        campusId,
        grantedBy,
        expiresAt,
      },
      include: {
        role: true,
        campus: true,
      },
    })
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string, campusId?: string) {
    const where: any = { userId, roleId }
    if (campusId) {
      where.campusId = campusId
    }

    const userRole = await prisma.userRole.findFirst({ where })

    if (!userRole) {
      throw new NotFoundError('User role assignment not found')
    }

    return prisma.userRole.delete({ where: { id: userRole.id } })
  }

  /**
   * Get all roles
   */
  async getRoles() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { priority: 'desc' },
    })
  }

  /**
   * Get role by ID
   */
  async getRole(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!role) {
      throw new NotFoundError('Role not found')
    }

    return role
  }

  /**
   * Create role
   */
  async createRole(data: {
    name: string
    displayName: string
    description?: string
    isCampusSpecific?: boolean
    priority?: number
    permissions?: string[]
  }) {
    return prisma.role.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        isCampusSpecific: data.isCampusSpecific,
        priority: data.priority,
        permissions: data.permissions
          ? {
              create: data.permissions.map((permId) => ({
                permissionId: permId,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
  }

  /**
   * Update role
   */
  async updateRole(
    id: string,
    data: {
      displayName?: string
      description?: string
      priority?: number
      permissions?: string[]
    }
  ) {
    // If permissions are provided, replace all
    if (data.permissions) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } })
    }

    return prisma.role.update({
      where: { id },
      data: {
        displayName: data.displayName,
        description: data.description,
        priority: data.priority,
        permissions: data.permissions
          ? {
              create: data.permissions.map((permId) => ({
                permissionId: permId,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
  }

  /**
   * Delete role
   */
  async deleteRole(id: string) {
    const role = await prisma.role.findUnique({ where: { id } })

    if (!role) {
      throw new NotFoundError('Role not found')
    }

    if (role.isSystem) {
      throw new ForbiddenError('Cannot delete system role')
    }

    return prisma.role.delete({ where: { id } })
  }

  /**
   * Get all permissions
   */
  async getPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    })
  }

  /**
   * Create permission
   */
  async createPermission(data: {
    resource: string
    action: string
    scope?: string
    description?: string
  }) {
    return prisma.permission.create({
      data: {
        resource: data.resource,
        action: data.action,
        scope: data.scope || 'own',
        description: data.description,
      },
    })
  }
}

export const rbacService = new RBACService()
