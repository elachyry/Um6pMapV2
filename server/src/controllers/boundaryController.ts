/**
 * Boundary Controller
 * Purpose: Handle HTTP requests for boundary operations
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import * as boundaryService from '../services/boundaryService'

/**
 * Get all boundaries
 * Purpose: Handle GET /boundaries request
 * Input: Query parameters (page, limit, search, campusId)
 * Output: Paginated boundaries with metadata
 */
export const getBoundaries = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 12
    const { search, campusId } = query

    const filters = { search, campusId }
    
    const result = await boundaryService.getAll(page, limit, filters)
    reply.send({
      success: true,
      data: result.boundaries,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total
      }
    })
  } catch (error: any) {
    request.log.error('Get boundaries error:', error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Get boundary by ID
 * Purpose: Handle GET /boundaries/:id request
 * Input: Boundary ID
 * Output: Boundary data
 */
export const getBoundaryById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    const boundary = await boundaryService.getById(id)
    reply.send({ success: true, data: boundary })
  } catch (error: any) {
    request.log.error('Get boundary by ID error:', error)
    if (error.message === 'Boundary not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Create boundary
 * Purpose: Handle POST /boundaries request
 * Input: Boundary data
 * Output: Created boundary
 */
export const createBoundary = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const boundary = await boundaryService.create(request.body)
    reply.status(201).send({ success: true, data: boundary })
  } catch (error: any) {
    request.log.error('Create boundary error:', error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Update boundary
 * Purpose: Handle PUT /boundaries/:id request
 * Input: Boundary ID and updated data
 * Output: Updated boundary
 */
export const updateBoundary = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    const boundary = await boundaryService.update(id, request.body)
    reply.send({ success: true, data: boundary })
  } catch (error: any) {
    request.log.error('Update boundary error:', error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Delete boundary
 * Purpose: Handle DELETE /boundaries/:id request
 * Input: Boundary ID
 * Output: Success message
 */
export const deleteBoundary = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    await boundaryService.remove(id)
    reply.send({ success: true, message: 'Boundary deleted successfully' })
  } catch (error: any) {
    request.log.error('Delete boundary error:', error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Toggle boundary active status
 * Purpose: Handle PUT /boundaries/:id/toggle-active request
 * Input: Boundary ID
 * Output: Updated boundary
 */
export const toggleBoundaryActive = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    const boundary = await boundaryService.toggleActive(id)
    reply.send({ success: true, data: boundary })
  } catch (error: any) {
    request.log.error('Toggle boundary active error:', error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Import boundaries from GeoJSON
 * Purpose: Handle POST /boundaries/import request
 * Input: GeoJSON data and campusId
 * Output: Import statistics
 */
export const importBoundaries = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { geojson, campusId } = request.body as any

    if (!geojson) {
      return reply.status(400).send({
        success: false,
        error: 'GeoJSON data is required'
      })
    }

    if (!campusId) {
      return reply.status(400).send({
        success: false,
        error: 'Campus ID is required'
      })
    }

    const result = await boundaryService.importFromGeoJSON(campusId, geojson)
    reply.send(result)
  } catch (error: any) {
    request.log.error('Import boundaries error:', error)
    reply.status(500).send({
      success: false,
      error: error.message || 'Failed to import boundaries'
    })
  }
}
