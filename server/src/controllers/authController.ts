/**
 * Authentication Controller
 * Purpose: Handle authentication HTTP requests
 * Inputs: HTTP requests with user credentials
 * Outputs: HTTP responses with tokens and user data
 */

import { FastifyReply, FastifyRequest } from 'fastify'
import { authService } from '@/services/authService'
import { auditService } from '@/services/auditService'
import { ValidationError } from '@/utils/errors'
import crypto from 'crypto'

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

    // Log successful login
    await auditService.logLogin(user.id, request, true)

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
   * Self-signup for UM6P users
   * POST /api/auth/signup
   */
  async signup(
    request: FastifyRequest<{
      Body: {
        email: string
        password: string
        firstName: string
        lastName: string
        phone?: string
        campusId: string
        userCategory: 'STUDENT' | 'STAFF'
        department?: string
      }
    }>,
    reply: FastifyReply
  ) {
    const { email, password, firstName, lastName, phone, campusId, userCategory, department } = request.body

    // Validate UM6P email
    const um6pEmailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*um6p\.ma$/i
    if (!um6pEmailRegex.test(email)) {
      throw new ValidationError('Only UM6P email addresses (@um6p.ma) are allowed')
    }

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !campusId || !userCategory) {
      throw new ValidationError('All required fields must be provided')
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters')
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await authService.signup({
      email,
      password,
      firstName,
      lastName,
      phone,
      campusId,
      userCategory,
      department,
      verificationToken,
      verificationTokenExpiry
    })

    return reply.status(201).send({
      message: 'Account created successfully. Please check your email to verify your account.',
    })
  }

  /**
   * Verify email address
   * POST /api/auth/verify-email
   */
  async verifyEmail(
    request: FastifyRequest<{
      Body: {
        token: string
      }
    }>,
    reply: FastifyReply
  ) {
    const { token } = request.body

    if (!token) {
      throw new ValidationError('Verification token is required')
    }

    await authService.verifyEmail(token)

    return reply.send({
      message: 'Email verified successfully. You can now log in.',
    })
  }

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  async resendVerification(
    request: FastifyRequest<{
      Body: {
        email: string
      }
    }>,
    reply: FastifyReply
  ) {
    const { email } = request.body

    if (!email) {
      throw new ValidationError('Email is required')
    }

    await authService.resendVerification(email)

    return reply.send({
      message: 'Verification email sent successfully.',
    })
  }

  /**
   * Magic link login for temporary users
   * POST /api/auth/magic-login
   */
  async magicLogin(
    request: FastifyRequest<{
      Body: {
        token: string
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const { token } = request.body

      if (!token) {
        throw new ValidationError('Magic link token is required')
      }

      console.log('🔗 Magic login attempt with token:', token.substring(0, 10) + '...')

      // Authenticate with magic link
      const user = await authService.magicLogin(token)
      
      console.log('✅ Magic login successful for user:', user.email)

      // Log successful magic link login
      await auditService.log({
        userId: user.id,
        action: 'MAGIC_LOGIN',
        resource: 'auth',
        method: 'POST',
        endpoint: '/api/auth/magic-login',
        ip: request.ip,
        userAgent: request.headers['user-agent'] || '',
        level: 'info',
        metadata: {
          email: user.email,
          userType: user.userType
        }
      })

      // Generate JWT token
      const jwtToken = request.server.jwt.sign({
        userId: user.id,
        email: user.email,
        userType: user.userType,
      })

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user

      return reply.send({
        user: userWithoutPassword,
        token: jwtToken,
      })
    } catch (error: any) {
      console.error('❌ Magic login error:', error.message)
      throw error
    }
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
