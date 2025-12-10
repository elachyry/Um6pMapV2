/**
 * Campus Routes
 * Purpose: Define API endpoints for campus management
 * Inputs: Fastify instance
 * Outputs: Registered routes
 */

import { FastifyInstance } from 'fastify'
import { CampusController } from '@/controllers/campusController'
import { authenticate } from '@/middleware/auth'
import { prisma } from '@/config/database'

const campusController = new CampusController()

export async function campusRoutes(fastify: FastifyInstance) {
  // Public routes - no authentication required
  // Get public campus list (names only) for signup
  fastify.get('/campuses/public', campusController.getPublicList.bind(campusController))

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
      const { id } = request.params as { id: string }
      const { boundaryId } = request.body as { boundaryId?: string }
      
      // Fetch boundaries for this campus
      const boundaries = await prisma.boundary.findMany({
        where: {
          campusId: id,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          coordinates: true
        }
      })
      
      if (boundaries.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'No active boundaries found for this campus'
        })
      }
      
      // If multiple boundaries and no boundaryId specified, return list
      if (boundaries.length > 1 && !boundaryId) {
        return reply.send({
          success: false,
          multipleBoundaries: true,
          boundaries: boundaries.map((b: any) => ({
            id: b.id,
            name: b.name
          })),
          message: 'Multiple boundaries found. Please select one.'
        })
      }
      
      // Get the boundary to use
      const boundary = boundaryId 
        ? boundaries.find((b: any) => b.id === boundaryId)
        : boundaries[0]
      
      if (!boundary || !boundary.coordinates) {
        return reply.status(400).send({
          success: false,
          error: 'Boundary coordinates not found'
        })
      }
      
      // Parse coordinates
      const coords = typeof boundary.coordinates === 'string' 
        ? JSON.parse(boundary.coordinates)
        : boundary.coordinates
      
      // Calculate centroid from polygon coordinates
      const polygonCoords = coords.coordinates?.[0] || coords[0]
      if (!polygonCoords || polygonCoords.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid boundary coordinates'
        })
      }
      
      let latSum = 0, lngSum = 0
      polygonCoords.forEach(([lng, lat]: [number, number]) => {
        latSum += lat
        lngSum += lng
      })
      
      const center = {
        lat: latSum / polygonCoords.length,
        lng: lngSum / polygonCoords.length
      }
      
      return reply.send({ 
        success: true, 
        center,
        boundaryName: boundary.name
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to calculate center'
      })
    }
  })
}
