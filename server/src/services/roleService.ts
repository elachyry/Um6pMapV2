/**
 * Role Service
 * Purpose: Business logic for role management
 * Inputs: Role data and queries
 * Outputs: Processed role data
 */

import { roleRepository } from '@/repositories/roleRepository'
import { Prisma } from '@prisma/client'

export class RoleService {
  /**
   * Get all roles with permissions
   * Purpose: Fetch all roles with their permissions and user counts
   */
  async getAll() {
    const roles = await roleRepository.findAll()
    
    // Format permissions for easier frontend consumption
    return roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      scope: role.scope,
      isSystem: role.isSystem,
      userCount: role._count.userRoles,
      permissions: role.permissions.map((rp: any) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }))
  }

  /**
   * Get role by ID
   */
  async getById(id: string) {
    const role: any = await roleRepository.findById(id)
    
    if (!role) {
      throw new Error('Role not found')
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      scope: role.scope,
      isSystem: role.isSystem,
      userCount: role._count.userRoles,
      permissions: role.permissions.map((rp: any) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }
  }

  /**
   * Create new role
   */
  async create(data: Prisma.RoleCreateInput) {
    // Check if role name already exists
    const existing = await roleRepository.findByName(data.name)
    if (existing) {
      throw new Error('Role with this name already exists')
    }

    return roleRepository.create(data)
  }

  /**
   * Update role
   */
  async update(id: string, data: Prisma.RoleUpdateInput) {
    const role = await roleRepository.findById(id)
    
    if (!role) {
      throw new Error('Role not found')
    }

    // Prevent updating system roles
    if (role.isSystem) {
      throw new Error('Cannot modify system roles')
    }

    return roleRepository.update(id, data)
  }

  /**
   * Delete role
   */
  async delete(id: string) {
    const role = await roleRepository.findById(id)
    
    if (!role) {
      throw new Error('Role not found')
    }

    // Prevent deleting system roles
    if (role.isSystem) {
      throw new Error('Cannot delete system roles')
    }

    // Prevent deleting roles with active users
    if (role._count.userRoles > 0) {
      throw new Error(`Cannot delete role with ${role._count.userRoles} active users`)
    }

    return roleRepository.delete(id)
  }

  /**
   * Assign permission to role
   */
  async assignPermission(roleId: string, permissionId: string) {
    const role = await roleRepository.findById(roleId)
    
    if (!role) {
      throw new Error('Role not found')
    }

    if (role.isSystem) {
      throw new Error('Cannot modify system role permissions')
    }

    return roleRepository.assignPermission(roleId, permissionId)
  }

  /**
   * Remove permission from role
   */
  async removePermission(roleId: string, permissionId: string) {
    const role = await roleRepository.findById(roleId)
    
    if (!role) {
      throw new Error('Role not found')
    }

    if (role.isSystem) {
      throw new Error('Cannot modify system role permissions')
    }

    return roleRepository.removePermission(roleId, permissionId)
  }
}

export const roleService = new RoleService()
