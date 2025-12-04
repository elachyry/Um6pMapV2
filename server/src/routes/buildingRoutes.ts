import { FastifyInstance } from 'fastify'
import {
  importFromGeoJSON,
  getAll,
  getById,
  create,
  update,
  deleteBuilding
} from '../controllers/buildingController.js'

/**
 * Building routes
 * Purpose: Define all building-related endpoints
 */
export default async function buildingRoutes(fastify: FastifyInstance) {
  // Import buildings from GeoJSON
  fastify.post('/import', importFromGeoJSON)

  // Get all buildings
  fastify.get('/', getAll)

  // Get building by ID
  fastify.get('/:id', getById)

  // Create building
  fastify.post('/', create)

  // Update building
  fastify.put('/:id', update)

  // Delete building
  fastify.delete('/:id', deleteBuilding)
}
