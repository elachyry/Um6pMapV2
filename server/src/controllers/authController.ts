/**
 * Authentication Controller
 * Purpose: Handle authentication HTTP requests
 * Inputs: HTTP requests with user credentials
 * Outputs: HTTP responses with tokens and user data
 */

import { FastifyReply, FastifyRequest } from 'fastify'
import { authService } from '@/services/authService'
import { auditService } from '@/services/auditService'
import { userRepository } from '@/repositories/userRepository'
import { sendEmail } from '@/services/emailService'
import { ValidationError } from '@/utils/errors'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

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

  /**
   * Forgot password - send reset email
   * POST /api/auth/forgot-password
   */
  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email } = request.body as { email: string }

      // Find user by email
      const user = await userRepository.findByEmail(email)
      
      // Tell user if email doesn't exist
      if (!user) {
        return reply.status(404).send({
          error: 'No account found with that email address',
        })
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

      // Save token to database
      await userRepository.update(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpiry: resetTokenExpiry,
      })

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
      
      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Reset Request - UM6P Map',
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - UM6P Map</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #EA3B15 0%, #C02D0F 100%); padding: 30px 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Reset Your Password</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px;">
      <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0;">Hello ${user.firstName || 'User'} ${user.lastName || ''},</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        You requested to reset your password for your UM6P Map account. Click the button below to create a new password:
      </p>
      
      <!-- Reset Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #EA3B15; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
        Or copy and paste this link into your browser:
      </p>
      <p style="color: #EA3B15; font-size: 14px; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 4px; margin: 0 0 20px 0;">
        ${resetUrl}
      </p>
      
      <!-- Warning Box -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          <strong>⏰ Important:</strong> This password reset link will expire in 1 hour.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
      
      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Best regards,<br><strong>UM6P Map Team</strong></p>
        <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
          `,
        })

        return reply.send({
          message: 'Password reset link has been sent to your email',
        })
      } catch (emailError: any) {
        // Email failed to send, but token is saved
        request.log.error('Failed to send reset email:', emailError)
        
        // Return success with the reset link for development/testing
        if (process.env.NODE_ENV === 'development') {
          return reply.send({
            message: 'Email service not configured. Use this link to reset your password:',
            resetUrl: resetUrl,
          })
        }
        
        return reply.status(500).send({
          error: 'Failed to send reset email. Please contact support.',
        })
      }
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        error: 'Failed to process password reset request',
      })
    }
  }

  /**
   * Validate reset token
   * POST /api/auth/validate-reset-token
   */
  async validateResetToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token } = request.body as { token: string }

      if (!token) {
        return reply.status(400).send({
          error: 'Reset token is required',
        })
      }

      // Find user with this token
      const user = await userRepository.findByResetToken(token)

      if (!user || !user.resetPasswordTokenExpiry) {
        return reply.status(400).send({
          error: 'Invalid or expired reset token',
        })
      }

      // Check if token is expired
      if (new Date() > user.resetPasswordTokenExpiry) {
        return reply.status(400).send({
          error: 'Reset token has expired',
        })
      }

      return reply.send({
        message: 'Token is valid',
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        error: 'Failed to validate reset token',
      })
    }
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token, password } = request.body as { token: string; password: string }

      if (!token || !password) {
        return reply.status(400).send({
          error: 'Token and password are required',
        })
      }

      // Validate password
      if (password.length < 8) {
        return reply.status(400).send({
          error: 'Password must be at least 8 characters long',
        })
      }

      // Find user with this token
      const user = await userRepository.findByResetToken(token)

      if (!user || !user.resetPasswordTokenExpiry) {
        return reply.status(400).send({
          error: 'Invalid or expired reset token',
        })
      }

      // Check if token is expired
      if (new Date() > user.resetPasswordTokenExpiry) {
        return reply.status(400).send({
          error: 'Reset token has expired',
        })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Update password and clear reset token
      await userRepository.update(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      })

      return reply.send({
        message: 'Password has been reset successfully',
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        error: 'Failed to reset password',
      })
    }
  }
}

export const authController = new AuthController()
