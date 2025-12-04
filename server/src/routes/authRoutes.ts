/**
 * Authentication Routes
 * Purpose: Define authentication API endpoints
 */

import { FastifyInstance } from 'fastify'
import { authController } from '@/controllers/authController'
import { authenticate } from '@/middleware/auth'

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', authController.register.bind(authController))
  fastify.post('/login', authController.login.bind(authController))

  // Protected routes
  fastify.get('/me', { preHandler: authenticate }, authController.me.bind(authController))
  fastify.post('/change-password', { preHandler: authenticate }, authController.changePassword.bind(authController))
  fastify.post('/logout', { preHandler: authenticate }, authController.logout.bind(authController))
}
