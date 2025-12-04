/**
 * Server Entry Point
 * Purpose: Initialize and start the Fastify server
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'

import { env } from '@/config/env'
import { prisma } from '@/config/database'
import { logger } from '@/utils/logger'
import { errorHandler } from '@/middleware/errorHandler'
import { registerRoutes } from '@/routes'

/**
 * Build Fastify server
 */
async function buildServer() {
  const server = Fastify({
    logger: env.NODE_ENV === 'development' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    } : false,
    bodyLimit: env.MAX_FILE_SIZE,
  })

  // Register plugins
  await server.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  })

  await server.register(cors, {
    origin: (origin, callback) => {
      // Allow any localhost port in development
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        env.CORS_ORIGIN,
      ].filter(Boolean)
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })

  await server.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  })

  await server.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIMEWINDOW,
  })

  await server.register(cookie, {
    secret: env.CSRF_SECRET,
  })

  await server.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE,
    },
  })

  // Register WebSocket
  await server.register(websocket)

  // WebSocket route for real-time connection
  server.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (connection) => {
      logger.info('WebSocket client connected')
      
      // Send initial connection message
      connection.socket.send(JSON.stringify({ 
        type: 'connected', 
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString()
      }))

      // Heartbeat every 10 seconds
      const heartbeat = setInterval(() => {
        if (connection.socket.readyState === 1) { // OPEN
          connection.socket.send(JSON.stringify({ 
            type: 'heartbeat', 
            timestamp: new Date().toISOString()
          }))
        }
      }, 10000)

      // Handle incoming messages
      connection.socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString())
          logger.info('WebSocket message received:', data)
          
          // Echo back for ping/pong
          if (data.type === 'ping') {
            connection.socket.send(JSON.stringify({ 
              type: 'pong', 
              timestamp: new Date().toISOString()
            }))
          }
        } catch (error: any) {
          logger.error('WebSocket message error:', error.message)
        }
      })

      // Handle disconnection
      connection.socket.on('close', () => {
        logger.info('WebSocket client disconnected')
        clearInterval(heartbeat)
      })

      connection.socket.on('error', (error: any) => {
        logger.error('WebSocket error:', error.message)
        clearInterval(heartbeat)
      })
    })
  })

  // Set error handler
  server.setErrorHandler(errorHandler)

  // Register routes
  await registerRoutes(server)

  // Root endpoint
  server.get('/', async () => ({
    name: 'UM6P Campus Map API',
    version: '1.0.0',
    status: 'running',
    environment: env.NODE_ENV,
  }))

  return server
}

/**
 * Start server
 */
async function start() {
  try {
    logger.info(`🚀 Starting server in ${env.NODE_ENV} mode...`)

    // Test database connection
    try {
      await prisma.$connect()
      logger.info('✅ Database connected successfully')
    } catch (dbError: any) {
      logger.error('❌ Database connection failed:', dbError.message)
      logger.info('💡 Trying to connect without explicit $connect...')
      // Continue anyway - Prisma will connect on first query
    }

    // Build and start server
    const server = await buildServer()
    await server.listen({
      port: env.PORT,
      host: env.HOST,
    })

    logger.info(`✅ Server listening on http://${env.HOST}:${env.PORT}`)
    logger.info(`📚 API Documentation: http://${env.HOST}:${env.PORT}/api/health`)

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM']
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`)
        await server.close()
        await prisma.$disconnect()
        process.exit(0)
      })
    })
  } catch (error: any) {
    logger.error('Failed to start server')
    console.error('Full error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    process.exit(1)
  }
}

// Start the server
start()
