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
  fastify.get('/boundaries', getBoundaries)

  // Get boundary by ID
  fastify.get('/boundaries/:id', getBoundaryById)

  // Create boundary
  fastify.post('/boundaries', createBoundary)

  // Update boundary
  fastify.put('/boundaries/:id', updateBoundary)

  // Delete boundary
  fastify.delete('/boundaries/:id', deleteBoundary)

  // Toggle boundary active status
  fastify.put('/boundaries/:id/toggle-active', toggleBoundaryActive)

  // Import boundaries from GeoJSON
  fastify.post('/boundaries/import', importBoundaries)
}
