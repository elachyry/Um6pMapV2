/**
 * OpenSpace Controller
 * Purpose: Handle HTTP requests for open spaces
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import * as openSpaceService from '../services/openSpaceService'

/**
 * Get all open spaces
 * Purpose: Handle GET /open-spaces request
 * Input: Query params (page, limit, search, campusId, openSpaceType)
 * Output: Open spaces list with pagination
 */
export const getAllOpenSpaces = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page = 1, limit = 10, search = '', campusId, openSpaceType } = request.query as any

    const result = await openSpaceService.getAll(
      parseInt(page),
      parseInt(limit),
      { search, campusId, openSpaceType }
    )

    reply.send(result)
  } catch (error: any) {
    request.log.error(error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Get open space by ID
 * Purpose: Handle GET /open-spaces/:id request
 * Input: Open space ID
 * Output: Open space object
 */
export const getOpenSpaceById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const openSpace = await openSpaceService.getById(id)
    reply.send(openSpace)
  } catch (error: any) {
    request.log.error(error)
    if (error.message === 'Open space not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Create open space
 * Purpose: Handle POST /open-spaces request
 * Input: Open space data in body
 * Output: Created open space
 */
export const createOpenSpace = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const openSpace = await openSpaceService.create(request.body)
    reply.status(201).send(openSpace)
  } catch (error: any) {
    request.log.error(error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Update open space
 * Purpose: Handle PUT /open-spaces/:id request
 * Input: Open space ID and update data
 * Output: Updated open space
 */
export const updateOpenSpace = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const openSpace = await openSpaceService.update(id, request.body)
    reply.send(openSpace)
  } catch (error: any) {
    request.log.error(error)
    if (error.message === 'Open space not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Delete open space
 * Purpose: Handle DELETE /open-spaces/:id request
 * Input: Open space ID
 * Output: Success message
 */
export const deleteOpenSpace = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    await openSpaceService.remove(id)
    reply.send({ message: 'Open space deleted successfully' })
  } catch (error: any) {
    request.log.error(error)
    if (error.message === 'Open space not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Toggle active status
 * Purpose: Handle PUT /open-spaces/:id/toggle-active request
 * Input: Open space ID
 * Output: Updated open space
 */
export const toggleActiveStatus = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const openSpace = await openSpaceService.toggleActive(id)
    reply.send(openSpace)
  } catch (error: any) {
    request.log.error(error)
    if (error.message === 'Open space not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Import open spaces from GeoJSON
 * Purpose: Handle POST /open-spaces/import request
 * Input: GeoJSON file and campusId
 * Output: Import result
 */
export const importOpenSpaces = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await request.file()
    
    if (!data) {
      return reply.status(400).send({ error: 'No file provided' })
    }

    const campusId = (data.fields.campusId as any)?.value
    if (!campusId) {
      return reply.status(400).send({ error: 'Campus ID is required' })
    }

    // Parse GeoJSON
    const fileBuffer = await data.toBuffer()
    const geojson = JSON.parse(fileBuffer.toString('utf-8'))

    // Import
    const result = await openSpaceService.importFromGeoJSON(campusId, geojson)

    reply.send(result)
  } catch (error: any) {
    request.log.error(error)
    reply.status(500).send({ error: error.message })
  }
}
