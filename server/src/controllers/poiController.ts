/**
 * POI Controller
 * Purpose: Handle API requests for POIs
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import * as poiService from '../services/poiService'

/**
 * Get all POIs
 * Purpose: Handle GET /pois request
 * Input: Query params (page, limit, campusId, search)
 * Output: Paginated POIs
 */
export const getPOIs = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page = '1', limit = '12', campusId, search } = request.query as any
    
    const result = await poiService.getAll(
      parseInt(page),
      parseInt(limit),
      campusId,
      search
    )
    
    reply.send(result)
  } catch (error: any) {
    request.log.error('Get POIs error:', error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Import POIs from GeoJSON
 * Purpose: Handle POST /pois/import request
 * Input: GeoJSON file and campusId
 * Output: Import result
 */
export const importPOIs = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    request.log.info('POI import request received')
    
    const data = await request.file()
    
    if (!data) {
      request.log.error('No file provided in request')
      return reply.status(400).send({ error: 'No file provided' })
    }

    request.log.info('File received, checking for campusId')
    
    const campusId = (data.fields.campusId as any)?.value
    if (!campusId) {
      request.log.error('Campus ID is missing from request fields')
      return reply.status(400).send({ error: 'Campus ID is required' })
    }

    request.log.info(`Processing POI import for campus: ${campusId}`)

    // Parse GeoJSON
    const fileBuffer = await data.toBuffer()
    const geojson = JSON.parse(fileBuffer.toString('utf-8'))

    request.log.info(`GeoJSON parsed, found ${geojson.features?.length || 0} features`)

    // Import
    const result = await poiService.importFromGeoJSON(campusId, geojson)

    request.log.info(`Import completed: ${result.imported} imported, ${result.duplicates} duplicates, ${result.errors} errors`)

    reply.send(result)
  } catch (error: any) {
    request.log.error('POI import error:', error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Delete POI
 * Purpose: Handle DELETE /pois/:id request
 * Input: POI ID
 * Output: Success message
 */
export const deletePOI = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    await poiService.remove(id)
    reply.send({ message: 'POI deleted successfully' })
  } catch (error: any) {
    request.log.error('Delete POI error:', error)
    if (error.message === 'POI not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Toggle POI active status
 * Purpose: Handle PUT /pois/:id/toggle-active request
 * Input: POI ID
 * Output: Updated POI
 */
export const togglePOIActive = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    const poi = await poiService.toggleActive(id)
    reply.send(poi)
  } catch (error: any) {
    request.log.error('Toggle POI active error:', error)
    if (error.message === 'POI not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Get POI by ID
 * Purpose: Handle GET /pois/:id request
 * Input: POI ID
 * Output: POI data
 */
export const getPOIById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    const poi = await poiService.getById(id)
    reply.send(poi)
  } catch (error: any) {
    request.log.error('Get POI by ID error:', error)
    if (error.message === 'POI not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Create POI
 * Purpose: Handle POST /pois request
 * Input: POI data
 * Output: Created POI
 */
export const createPOI = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const poi = await poiService.create(request.body)
    reply.status(201).send(poi)
  } catch (error: any) {
    request.log.error('Create POI error:', error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Update POI
 * Purpose: Handle PUT /pois/:id request
 * Input: POI ID and updated data
 * Output: Updated POI
 */
export const updatePOI = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any
    const poi = await poiService.update(id, request.body)
    reply.send(poi)
  } catch (error: any) {
    request.log.error('Update POI error:', error)
    if (error.message === 'POI not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}
