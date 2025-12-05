/**
 * Path Controller
 * Purpose: Handle HTTP requests for path operations
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import * as pathService from '../services/pathService'

/**
 * Get all paths
 * Purpose: Handle GET /paths request
 * Input: Query parameters (page, limit, search, campusId)
 * Output: Paginated paths with metadata
 */
export const getPaths = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 12
    const { search, campusId } = query

    const filters = { search, campusId }
    
    const result = await pathService.getAll(page, limit, filters)
    reply.send({
      success: true,
      data: result.paths,
      pagination: result.pagination
    })
  } catch (error: any) {
    request.log.error('Get paths error:', error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Get path by ID
 * Purpose: Handle GET /paths/:id request
 * Input: Path ID
 * Output: Path data
 */
export const getPathById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    const path = await pathService.getById(id)
    reply.send({ success: true, data: path })
  } catch (error: any) {
    request.log.error('Get path by ID error:', error)
    if (error.message === 'Path not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Create path
 * Purpose: Handle POST /paths request
 * Input: Path data
 * Output: Created path
 */
export const createPath = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const path = await pathService.create(request.body)
    reply.status(201).send(path)
  } catch (error: any) {
    request.log.error('Create path error:', error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Update path
 * Purpose: Handle PUT /paths/:id request
 * Input: Path ID and updated data
 * Output: Updated path
 */
export const updatePath = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    const path = await pathService.update(id, request.body)
    reply.send(path)
  } catch (error: any) {
    request.log.error('Update path error:', error)
    if (error.message === 'Path not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Delete path
 * Purpose: Handle DELETE /paths/:id request
 * Input: Path ID
 * Output: Success message
 */
export const deletePath = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    await pathService.deleteById(id)
    reply.send({ message: 'Path deleted successfully' })
  } catch (error: any) {
    request.log.error('Delete path error:', error)
    if (error.message === 'Path not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Toggle path active status
 * Purpose: Handle PUT /paths/:id/toggle-active request
 * Input: Path ID
 * Output: Updated path
 */
export const togglePathActive = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    const path = await pathService.toggleActive(id)
    reply.send(path)
  } catch (error: any) {
    request.log.error('Toggle path active error:', error)
    if (error.message === 'Path not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Import paths from GeoJSON
 * Purpose: Handle POST /paths/import request
 * Input: GeoJSON file and campusId
 * Output: Import result statistics
 */
export const importPaths = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { geojson, campusId } = request.body as any
    
    if (!geojson) {
      reply.status(400).send({ error: 'GeoJSON data is required' })
      return
    }

    const result = await pathService.importFromGeoJSON(geojson, campusId)
    reply.send({ success: true, data: result })
  } catch (error: any) {
    request.log.error('Import paths error:', error)
    reply.status(500).send({ error: error.message })
  }
}
