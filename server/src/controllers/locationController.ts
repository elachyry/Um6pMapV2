/**
 * Location Controller
 * Purpose: Handle HTTP requests for locations
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import * as locationService from '../services/locationService'

/**
 * Get all locations
 * Purpose: Handle GET /locations request
 * Input: Query params (page, limit, buildingId, campusId)
 * Output: Locations list with pagination
 */
export const getAllLocations = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page = 1, limit = 10, buildingId, campusId } = request.query as any

    const result = await locationService.getAll(
      parseInt(page),
      parseInt(limit),
      buildingId,
      campusId
    )

    reply.send(result)
  } catch (error: any) {
    request.log.error(error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Get location by ID
 * Purpose: Handle GET /locations/:id request
 * Input: Location ID in params
 * Output: Location object
 */
export const getLocationById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }

    const location = await locationService.getById(id)

    reply.send(location)
  } catch (error: any) {
    request.log.error(error)
    if (error.message === 'Location not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Create location
 * Purpose: Handle POST /locations request
 * Input: Location data in body
 * Output: Created location
 */
export const createLocation = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = request.body

    const location = await locationService.create(data)

    reply.status(201).send(location)
  } catch (error: any) {
    request.log.error(error)
    reply.status(500).send({ error: error.message })
  }
}

/**
 * Update location
 * Purpose: Handle PUT /locations/:id request
 * Input: Location ID in params, update data in body
 * Output: Updated location
 */
export const updateLocation = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    const data = request.body

    const location = await locationService.update(id, data)

    reply.send(location)
  } catch (error: any) {
    request.log.error(error)
    if (error.message === 'Location not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Delete location
 * Purpose: Handle DELETE /locations/:id request
 * Input: Location ID in params
 * Output: Success message
 */
export const deleteLocation = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }

    const result = await locationService.deleteLocation(id)

    reply.send(result)
  } catch (error: any) {
    request.log.error(error)
    if (error.message === 'Location not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}

/**
 * Toggle reservable status
 * Purpose: Handle PUT /locations/:id/toggle-reservable request
 * Input: Location ID in params
 * Output: Updated location
 */
export const toggleReservable = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }

    const location = await locationService.toggleReservable(id)

    reply.send(location)
  } catch (error: any) {
    request.log.error(error)
    if (error.message === 'Location not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}
