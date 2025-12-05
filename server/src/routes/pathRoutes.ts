/**
 * Path Routes
 * Purpose: Define API endpoints for path operations
 */

import { FastifyInstance } from 'fastify'
import {
  getPaths,
  getPathById,
  createPath,
  updatePath,
  deletePath,
  togglePathActive,
  importPaths
} from '../controllers/pathController'

export default async function pathRoutes(fastify: FastifyInstance) {
  // Get all paths
  fastify.get('/paths', getPaths)

  // Get path by ID
  fastify.get('/paths/:id', getPathById)

  // Create path
  fastify.post('/paths', createPath)

  // Update path
  fastify.put('/paths/:id', updatePath)

  // Delete path
  fastify.delete('/paths/:id', deletePath)

  // Toggle path active status
  fastify.put('/paths/:id/toggle-active', togglePathActive)

  // Import paths from GeoJSON
  fastify.post('/paths/import', importPaths)
}
