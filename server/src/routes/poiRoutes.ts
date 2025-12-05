/**
 * POI Routes
 * Purpose: Define API routes for POIs
 */

import { FastifyInstance } from 'fastify'
import * as poiController from '../controllers/poiController'

export default async function poiRoutes(fastify: FastifyInstance) {
  // Get all POIs
  fastify.get('/', poiController.getPOIs)
  
  // Import POIs
  fastify.post('/import', poiController.importPOIs)
  
  // Create POI
  fastify.post('/', poiController.createPOI)
  
  // Get POI by ID
  fastify.get('/:id', poiController.getPOIById)
  
  // Update POI
  fastify.put('/:id', poiController.updatePOI)
  
  // Toggle POI active status
  fastify.put('/:id/toggle-active', poiController.togglePOIActive)
  
  // Delete POI
  fastify.delete('/:id', poiController.deletePOI)
}
