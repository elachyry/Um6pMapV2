/**
 * Role Repository
 * Purpose: Data access layer for roles
 * Inputs: Role queries and data
 * Outputs: Role data from database
 */

import { prisma } from '@/config/database'
import { Prisma } from '@prisma/client'

export class RoleRepository {
  /**
   * Find all roles with permissions and counts
   */
  async findAll() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    })
  }

  /**
   * Find role by ID
   */
  async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    })
  }

  /**
   * Find role by name
   */
  async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
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
   * Create new role
   */
  async create(data: Prisma.RoleCreateInput) {
    return prisma.role.create({
      data,
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
  async update(id: string, data: Prisma.RoleUpdateInput) {
    return prisma.role.update({
      where: { id },
      data,
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
  async delete(id: string) {
    return prisma.role.delete({
      where: { id },
    })
  }

  /**
   * Assign permission to role
   */
  async assignPermission(roleId: string, permissionId: string) {
    return prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    })
  }

  /**
   * Remove permission from role
   */
  async removePermission(roleId: string, permissionId: string) {
    return prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    })
  }
}

export const roleRepository = new RoleRepository()
