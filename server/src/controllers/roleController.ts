/**
 * Role Controller
 * Purpose: Handle role and permission management HTTP requests
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import { roleService } from '@/services/roleService'

export class RoleController {
  /**
   * Get all roles
   * GET /api/roles
   */
  async getRoles(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const roles = await roleService.getAll()
      return reply.send({
        success: true,
        data: roles,
      })
    } catch (error: any) {
      console.error('Error fetching roles:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch roles',
      })
    }
  }

  /**
   * Get role by ID
   * GET /api/roles/:id
   */
  async getRole(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params as { id: string }
      const role = await roleService.getById(id)
      return reply.send({
        success: true,
        data: role,
      })
    } catch (error: any) {
      console.error('Error fetching role:', error)
      if (error.message === 'Role not found') {
        return reply.code(404).send({
          success: false,
          error: 'Role not found',
        })
      }
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch role',
      })
    }
  }

  /**
   * Create role
   * POST /api/roles
   */
  async createRole(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const role = await roleService.create(request.body as any)
      return reply.code(201).send({
        success: true,
        data: role,
        message: 'Role created successfully',
      })
    } catch (error: any) {
      console.error('Error creating role:', error)
      return reply.code(400).send({
        success: false,
        error: error.message || 'Failed to create role',
      })
    }
  }

  /**
   * Update role
   * PUT /api/roles/:id
   */
  async updateRole(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params as { id: string }
      const role = await roleService.update(id, request.body as any)
      return reply.send({
        success: true,
        data: role,
        message: 'Role updated successfully',
      })
    } catch (error: any) {
      console.error('Error updating role:', error)
      return reply.code(400).send({
        success: false,
        error: error.message || 'Failed to update role',
      })
    }
  }

  /**
   * Delete role
   * DELETE /api/roles/:id
   */
  async deleteRole(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params as { id: string }
      await roleService.delete(id)
      return reply.send({
        success: true,
        message: 'Role deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting role:', error)
      return reply.code(400).send({
        success: false,
        error: error.message || 'Failed to delete role',
      })
    }
  }

  // TODO: Add permission, role assignment, and user permission methods when needed
}

export const roleController = new RoleController()
