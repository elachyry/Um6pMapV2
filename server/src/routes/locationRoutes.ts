/**
 * Location Routes
 * Purpose: Define API endpoints for locations
 */

import { FastifyInstance } from 'fastify'
import * as locationController from '../controllers/locationController'

/**
 * Register location routes
 * Purpose: Set up all location endpoints
 * Input: Fastify instance
 * Output: Registered routes
 */
export default async function locationRoutes(fastify: FastifyInstance) {
  // Get all locations
  fastify.get('/locations', locationController.getAllLocations)

  // Get location by ID
  fastify.get('/locations/:id', locationController.getLocationById)

  // Create location
  fastify.post('/locations', locationController.createLocation)

  // Update location
  fastify.put('/locations/:id', locationController.updateLocation)

  // Delete location
  fastify.delete('/locations/:id', locationController.deleteLocation)

  // Toggle reservable status
  fastify.put('/locations/:id/toggle-reservable', locationController.toggleReservable)
}
