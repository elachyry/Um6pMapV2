/**
 * Boundary Routes
 * Purpose: Define API endpoints for boundary operations
 */

import { FastifyInstance } from 'fastify'
import {
  getBoundaries,
  getBoundaryById,
  createBoundary,
  updateBoundary,
  deleteBoundary,
  toggleBoundaryActive,
  importBoundaries
} from '../controllers/boundaryController'

export default async function boundaryRoutes(fastify: FastifyInstance) {
  // Get all boundaries
  fastify.get('/', getBoundaries)

  // Get boundary by ID
  fastify.get('/:id', getBoundaryById)

  // Create boundary
  fastify.post('/', createBoundary)

  // Update boundary
  fastify.put('/:id', updateBoundary)

  // Delete boundary
  fastify.delete('/:id', deleteBoundary)

  // Toggle boundary active status
  fastify.put('/:id/toggle-active', toggleBoundaryActive)

  // Import boundaries from GeoJSON
  fastify.post('/import', importBoundaries)
}
