/**
 * Cache Routes
 * Purpose: Handle cache invalidation requests
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { broadcastCacheInvalidation } from '@/services/websocketService'
import { authenticate } from '@/middleware/auth'

export async function cacheRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/cache/invalidate
   * Purpose: Trigger cache invalidation broadcast
   * Access: Admin only
   */
  fastify.post(
    '/invalidate',
    {
      preHandler: authenticate as any
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { entityType, campusId } = request.body as any
        
        // Broadcast cache invalidation to all connected WebSocket clients
        broadcastCacheInvalidation(entityType, campusId)
        
        return reply.status(200).send({
          success: true,
          message: 'Cache invalidation broadcast sent'
        })
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          message: error.message || 'Failed to broadcast cache invalidation'
        })
      }
    }
  )
}
