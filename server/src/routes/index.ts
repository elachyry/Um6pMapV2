/**
 * Routes Index
 * Purpose: Register all API routes with rate limiting
 */

import { FastifyInstance } from 'fastify'
import { authRoutes } from './authRoutes'
import { roleRoutes } from './roleRoutes'
import { userRoutes } from './userRoutes'
import buildingRoutes from './buildingRoutes'
import locationRoutes from './locationRoutes'
import openSpaceRoutes from './openSpaceRoutes'
import { campusRoutes } from './campusRoutes'
import uploadRoutes from './uploadRoutes'
import categoryRoutes from './categoryRoutes'

export async function registerRoutes(fastify: FastifyInstance) {
  // API prefix
  fastify.register(async (instance: FastifyInstance) => {
    // Health check - no auth required
    instance.get('/health', {
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute'
        }
      }
    }, async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }))

    // Register route modules with default rate limiting
    instance.register(authRoutes, { 
      prefix: '/auth',
      config: {
        rateLimit: {
          max: 50,
          timeWindow: '1 minute'
        }
      }
    })
    
    instance.register(roleRoutes, { 
      prefix: '/roles',
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute'
        }
      }
    })
    
    instance.register(userRoutes, { 
      prefix: '/users',
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute'
        }
      }
    })
    
    instance.register(buildingRoutes, { 
      prefix: '/buildings',
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute'
        }
      }
    })
    
    instance.register(campusRoutes, { 
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute'
        }
      }
    })
    
    instance.register(uploadRoutes, { 
      prefix: '/uploads',
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute'
        }
      }
    })
    
    instance.register(categoryRoutes, { 
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute'
        }
      }
    })
    
    instance.register(locationRoutes, { 
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute'
        }
      }
    })
    
    instance.register(openSpaceRoutes, { 
      prefix: '/open-spaces',
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute'
        }
      }
    })
    
    // TODO: Add more routes:
    // instance.register(eventRoutes, { prefix: '/events' })
    // instance.register(reservationRoutes, { prefix: '/reservations' })
    // instance.register(accessRequestRoutes, { prefix: '/access-requests' })
    
  }, { prefix: '/api' })
}
