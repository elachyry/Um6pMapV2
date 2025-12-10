/**
 * Campus Controller
 * Purpose: Handle HTTP requests for campus endpoints
 * Inputs: Fastify request/reply objects
 * Outputs: JSON responses
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { campusService } from '@/services/campusService'

export class CampusController {
  /**
   * Get all campuses
   * Purpose: Return paginated list of campuses
   */
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { page, limit, search } = request.query as {
        page?: string
        limit?: string
        search?: string
      }

      const result = await campusService.getAll({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
      })

      return reply.code(200).send({
        success: true,
        ...result,
      })
    } catch (error) {
      console.error('Error fetching campuses:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch campuses',
      })
    }
  }

  /**
   * Get active campuses
   * Purpose: Return list of active campuses for selection
   */
  async getActive(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const campuses = await campusService.getActive()

      return reply.code(200).send({
        success: true,
        data: campuses,
      })
    } catch (error) {
      console.error('Error fetching active campuses:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch active campuses',
      })
    }
  }

  /**
   * Get public campus list (names only)
   * Purpose: Return minimal campus info for public signup page
   * No authentication required
   */
  async getPublicList(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const campuses = await campusService.getPublicList()

      return reply.code(200).send({
        success: true,
        data: campuses,
      })
    } catch (error) {
      console.error('Error fetching public campus list:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch campus list',
      })
    }
  }

  /**
   * Get campus by ID
   * Purpose: Return single campus with details
   */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const campus = await campusService.getById(id)

      if (!campus) {
        return reply.code(404).send({
          success: false,
          error: 'Campus not found',
        })
      }

      return reply.code(200).send({
        success: true,
        data: campus,
      })
    } catch (error) {
      console.error('Error fetching campus:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch campus',
      })
    }
  }

  /**
   * Create new campus
   * Purpose: Add a new campus
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const campus = await campusService.create(request.body as any)

      return reply.code(201).send({
        success: true,
        data: campus,
      })
    } catch (error) {
      console.error('Error creating campus:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to create campus',
      })
    }
  }

  /**
   * Update campus
   * Purpose: Update existing campus
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const campus = await campusService.update(id, request.body as any)

      return reply.code(200).send({
        success: true,
        data: campus,
      })
    } catch (error) {
      console.error('Error updating campus:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to update campus',
      })
    }
  }

  /**
   * Delete campus
   * Purpose: Delete campus with password verification
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const { password } = request.body as { password: string }
      const userId = (request.user as any)?.userId || (request.user as any)?.id

      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'You must be logged in to delete a campus',
        })
      }

      if (!password) {
        return reply.code(400).send({
          success: false,
          error: 'Password is required',
        })
      }

      await campusService.delete(id, userId, password)

      return reply.code(200).send({
        success: true,
        message: 'Campus deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting campus:', error)
      
      if (error.message === 'Invalid password') {
        return reply.code(401).send({
          success: false,
          error: 'Invalid password',
        })
      }

      if (error.message === 'User not found') {
        return reply.code(401).send({
          success: false,
          error: 'User not found',
        })
      }

      return reply.code(500).send({
        success: false,
        error: 'Failed to delete campus',
      })
    }
  }
}

export const campusController = new CampusController()
