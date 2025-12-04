/**
 * Campus Routes
 * Purpose: Define API endpoints for campus management
 * Inputs: Fastify instance
 * Outputs: Registered routes
 */

import { FastifyInstance } from 'fastify'
import { campusController } from '@/controllers/campusController'
import { authenticate } from '@/middleware/auth'

export async function campusRoutes(fastify: FastifyInstance) {
  // Public routes - no authentication required
  // Get all campuses (paginated)
  fastify.get('/campuses', campusController.getAll.bind(campusController))

  // Get active campuses only
  fastify.get('/campuses/active', campusController.getActive.bind(campusController))

  // Get campus by ID
  fastify.get('/campuses/:id', campusController.getById.bind(campusController))

  // Protected routes - authentication required
  // Create new campus
  fastify.post('/campuses', { preHandler: authenticate }, campusController.create.bind(campusController))

  // Update campus
  fastify.put('/campuses/:id', { preHandler: authenticate }, campusController.update.bind(campusController))

  // Delete campus
  fastify.delete('/campuses/:id', { preHandler: authenticate }, campusController.delete.bind(campusController))
  
  // Map Settings
  // Get campus map settings
  fastify.get('/campuses/:id/map-settings', campusController.getById.bind(campusController))
  
  // Update campus map settings
  fastify.put('/campuses/:id/map-settings', { preHandler: authenticate }, campusController.update.bind(campusController))
  
  // Calculate map center from boundary
  fastify.post('/campuses/:id/calculate-center', { preHandler: authenticate }, async (request, reply) => {
    try {
      const campusResponse: any = await campusController.getById(request, reply)
      const mapData = campusResponse.mapData ? JSON.parse(campusResponse.mapData) : null
      
      if (!mapData?.boundary) {
        return reply.status(400).send({
          success: false,
          error: 'No boundary polygon found for campus'
        })
      }
      
      // Calculate centroid from polygon coordinates
      const coords = mapData.boundary.geometry.coordinates[0]
      let latSum = 0, lngSum = 0
      coords.forEach(([lng, lat]: [number, number]) => {
        latSum += lat
        lngSum += lng
      })
      
      const center = {
        lat: latSum / coords.length,
        lng: lngSum / coords.length
      }
      
      return reply.send({ success: true, center })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to calculate center'
      })
    }
  })
}
