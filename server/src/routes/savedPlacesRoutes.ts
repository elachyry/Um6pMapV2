/**
 * Saved Places Routes
 * Purpose: Handle saving/unsaving buildings, locations, and open spaces
 */

import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { savedPlacesService } from '../services/savedPlacesService'

export async function savedPlacesRoutes(fastify: FastifyInstance) {
  // Check if a place is saved
  fastify.get('/check', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { userId, placeId, placeType } = request.query as {
        userId: string
        placeId: string
        placeType: string
      }

      const isSaved = await savedPlacesService.isSaved(userId, placeId, placeType)

      return reply.send({
        success: true,
        isSaved
      })
    } catch (error: any) {
      request.log.error({ error: error.message }, 'Failed to check saved status')
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to check saved status'
      })
    }
  })

  // Save a place
  fastify.post('/', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { userId, placeId, placeType, placeName } = request.body as {
        userId: string
        placeId: string
        placeType: string
        placeName: string
      }

      const savedPlace = await savedPlacesService.savePlace({
        userId,
        placeId,
        placeType,
        placeName
      })

      return reply.send({
        success: true,
        data: savedPlace
      })
    } catch (error: any) {
      request.log.error({ error: error.message }, 'Failed to save place')
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to save place'
      })
    }
  })

  // Unsave a place
  fastify.delete('/', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { userId, placeId, placeType } = request.body as {
        userId: string
        placeId: string
        placeType: string
      }

      await savedPlacesService.unsavePlace(userId, placeId, placeType)

      return reply.send({
        success: true,
        message: 'Place unsaved successfully'
      })
    } catch (error: any) {
      request.log.error({ error: error.message }, 'Failed to unsave place')
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to unsave place'
      })
    }
  })

  // Get all saved places for a user
  fastify.get('/user/:userId', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string }

      const savedPlaces = await savedPlacesService.getUserSavedPlaces(userId)

      return reply.send({
        success: true,
        data: savedPlaces
      })
    } catch (error: any) {
      request.log.error({ error: error.message }, 'Failed to get saved places')
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get saved places'
      })
    }
  })
}
