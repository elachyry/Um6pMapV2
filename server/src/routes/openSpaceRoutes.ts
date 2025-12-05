/**
 * OpenSpace Routes
 * Purpose: Define API endpoints for open spaces
 */

import { FastifyInstance } from 'fastify'
import * as openSpaceController from '../controllers/openSpaceController'

export default async function openSpaceRoutes(fastify: FastifyInstance) {
  // Import open spaces from GeoJSON - MUST be before /:id route
  fastify.post('/import', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute'
      }
    }
  }, openSpaceController.importOpenSpaces)

  // Get all open spaces
  fastify.get('/', {
    config: {
      rateLimit: {
        max: 100,
        timeWindow: '1 minute'
      }
    }
  }, openSpaceController.getAllOpenSpaces)

  // Create open space
  fastify.post('/', {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute'
      }
    }
  }, openSpaceController.createOpenSpace)

  // Toggle active status - MUST be before /:id route
  fastify.put('/:id/toggle-active', {
    config: {
      rateLimit: {
        max: 50,
        timeWindow: '1 minute'
      }
    }
  }, openSpaceController.toggleActiveStatus)

  // Get open space by ID
  fastify.get('/:id', {
    config: {
      rateLimit: {
        max: 100,
        timeWindow: '1 minute'
      }
    }
  }, openSpaceController.getOpenSpaceById)

  // Update open space
  fastify.put('/:id', {
    config: {
      rateLimit: {
        max: 50,
        timeWindow: '1 minute'
      }
    }
  }, openSpaceController.updateOpenSpace)

  // Delete open space
  fastify.delete('/:id', {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute'
      }
    }
  }, openSpaceController.deleteOpenSpace)
}
