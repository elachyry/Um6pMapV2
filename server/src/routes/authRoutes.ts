/**
 * Authentication Routes
 * Purpose: Define authentication API endpoints
 */

import { FastifyInstance } from 'fastify'
import { authController } from '@/controllers/authController'
import { authenticate } from '@/middleware/auth'
import { requireUserType } from '@/middleware/rbac'

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes (no authentication required)
  fastify.post('/login', authController.login.bind(authController))
  fastify.post('/signup', authController.signup.bind(authController)) // Self-registration for UM6P users
  fastify.post('/magic-login', authController.magicLogin.bind(authController)) // Magic link login for temporary users
  fastify.post('/verify-email', authController.verifyEmail.bind(authController))
  fastify.post('/resend-verification', authController.resendVerification.bind(authController))
  fastify.post('/forgot-password', authController.forgotPassword.bind(authController))
  fastify.post('/validate-reset-token', authController.validateResetToken.bind(authController))
  fastify.post('/reset-password', authController.resetPassword.bind(authController))

  // Admin-only routes (creating users manually)
  fastify.post('/register', { 
    preHandler: [authenticate, requireUserType('ADMIN', 'SUPER_ADMIN')] as any
  }, authController.register.bind(authController))

  // Protected routes (authenticated users)
  fastify.get('/me', { preHandler: authenticate as any }, authController.me.bind(authController))
  fastify.post('/change-password', { preHandler: authenticate as any }, authController.changePassword.bind(authController))
  fastify.post('/logout', { preHandler: authenticate as any }, authController.logout.bind(authController))
}
