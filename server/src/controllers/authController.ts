/**
 * Authentication Controller
 * Purpose: Handle authentication HTTP requests
 * Inputs: HTTP requests with user credentials
 * Outputs: HTTP responses with tokens and user data
 */

import { FastifyReply, FastifyRequest } from 'fastify'
import { authService } from '@/services/authService'
import { ValidationError } from '@/utils/errors'

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(
    request: FastifyRequest<{
      Body: {
        email: string
        password: string
        firstName?: string
        lastName?: string
        userType?: string
        campusId?: string
      }
    }>,
    reply: FastifyReply
  ) {
    const { email, password, firstName, lastName, userType, campusId } = request.body

    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required')
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters')
    }

    // Register user
    const user = await authService.register({
      email,
      password,
      firstName,
      lastName,
      userType,
      campusId,
    })

    // Generate JWT token
    const token = request.server.jwt.sign({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    })

    return reply.code(201).send({
      user,
      token,
    })
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(
    request: FastifyRequest<{
      Body: {
        email: string
        password: string
      }
    }>,
    reply: FastifyReply
  ) {
    const { email, password } = request.body

    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required')
    }

    // Login user
    const user = await authService.login(email, password)

    // Generate JWT token
    const token = request.server.jwt.sign({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return reply.send({
      user: userWithoutPassword,
      token,
    })
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any

    if (!user) {
      throw new ValidationError('User not authenticated')
    }

    const fullUser = await authService.validateUser(user.userId)

    if (!fullUser) {
      throw new ValidationError('User not found')
    }

    // Remove password
    const { password, ...userWithoutPassword } = fullUser

    return reply.send({
      user: userWithoutPassword,
    })
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(
    request: FastifyRequest<{
      Body: {
        oldPassword: string
        newPassword: string
      }
    }>,
    reply: FastifyReply
  ) {
    const user = request.user as any
    const { oldPassword, newPassword } = request.body

    // Validate input
    if (!oldPassword || !newPassword) {
      throw new ValidationError('Old and new passwords are required')
    }

    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters')
    }

    await authService.changePassword(user.userId, oldPassword, newPassword)

    return reply.send({
      message: 'Password changed successfully',
    })
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(request: FastifyRequest, reply: FastifyReply) {
    // In a stateless JWT setup, logout is handled client-side
    // But we can invalidate the token server-side if needed

    return reply.send({
      message: 'Logged out successfully',
    })
  }
}

export const authController = new AuthController()
