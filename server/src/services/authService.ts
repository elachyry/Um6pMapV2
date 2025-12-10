/**
 * Authentication Service
 * Purpose: Handle authentication business logic
 * Inputs: User credentials, tokens
 * Outputs: Authenticated user data, tokens
 */

import { userRepository } from '../repositories/userRepository'
import { hashPassword, verifyPassword } from '../utils/password'
import { UnauthorizedError, ConflictError } from '../utils/errors'
import { sendVerificationEmail } from './emailService'
import type { User } from '@prisma/client'

export class AuthService {
  /**
   * Register new user
   */
  async register(data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    userType?: string
    campusId?: string
  }): Promise<Omit<User, 'password'>> {
    // Normalize email to lowercase
    const normalizedEmail = data.email.toLowerCase().trim()
    
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(normalizedEmail)
    if (existingUser) {
      throw new ConflictError('Email already registered')
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    // Create user
    const user = await userRepository.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      userType: data.userType as any,
      campus: data.campusId ? { connect: { id: data.campusId } } : undefined,
    })

    // Remove password from response
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<User> {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim()
    
    // Find user
    const user = await userRepository.findByEmail(normalizedEmail)
    if (!user) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Check if account is pending email verification
    if (user.status === 'PENDING') {
      throw new UnauthorizedError('Please verify your email address before logging in. Check your inbox for the verification link.')
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Account is locked. Please try again later.')
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      // Increment failed attempts
      await userRepository.incrementFailedLogins(user.id)

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 4) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        await userRepository.lockAccount(user.id, lockUntil)
        throw new UnauthorizedError('Too many failed attempts. Account locked for 15 minutes.')
      }

      throw new UnauthorizedError('Invalid email or password')
    }

    // Reset failed attempts and update last login
    if (user.loginAttempts > 0) {
      await userRepository.resetFailedLogins(user.id)
    }

    // Update last login timestamp
    await userRepository.update(user.id, {
      lastLoginAt: new Date()
    } as any)

    return user
  }

  /**
   * Validate user for JWT payload
   */
  async validateUser(userId: string): Promise<User | null> {
    const user = await userRepository.findById(userId)
    if (!user || user.status !== 'ACTIVE') {
      return null
    }
    return user
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    // Verify old password
    const isValid = await verifyPassword(oldPassword, user.password)
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect')
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password and clear mustChangePassword flag
    await userRepository.update(userId, {
      password: hashedPassword,
      mustChangePassword: false,
    })
  }

  /**
   * Self-signup for UM6P users
   * Purpose: Create account with email verification
   */
  async signup(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    campusId: string
    userCategory: 'STUDENT' | 'STAFF'
    department?: string
    verificationToken: string
    verificationTokenExpiry: Date
  }): Promise<void> {
    // Normalize email to lowercase
    const normalizedEmail = data.email.toLowerCase().trim()
    
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(normalizedEmail)
    if (existingUser) {
      throw new ConflictError('Email already registered')
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    // Create user with PERMANENT userType and PENDING status
    // Security: Self-registered users are PERMANENT (verified UM6P members)
    // Only admins can create TEMPORARY users
    await userRepository.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      campus: {
        connect: { id: data.campusId }
      },
      userType: 'PERMANENT', // Self-registered users are PERMANENT (UM6P verified)
      status: 'PENDING', // Pending until email is verified
      mustChangePassword: false, // They set their own password
      // verificationToken: data.verificationToken, // TODO: Add to schema when implementing email verification
      // verificationTokenExpiry: data.verificationTokenExpiry, // TODO: Add to schema when implementing email verification
      department: data.department // Optional department/faculty
    } as any)

    // Send verification email
    try {
      await sendVerificationEmail({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        verificationToken: data.verificationToken
      })
      console.log(`✅ Verification email sent to ${data.email}`)
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError)
      console.log(`📧 Verification token for ${data.email}: ${data.verificationToken}`)
    }
  }

  /**
   * Verify email address
   * Purpose: Activate account after email verification
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await userRepository.findByVerificationToken(token)
    
    if (!user) {
      throw new UnauthorizedError('Invalid or expired verification token')
    }

    // Check if token is expired
    // TODO: Implement when verification token fields are added to schema
    // if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    //   throw new UnauthorizedError('Verification token has expired')
    // }

    // Update user status to ACTIVE and clear verification token
    await userRepository.update(user.id, {
      status: 'ACTIVE',
      // verificationToken: null, // TODO: Add when field exists in schema
      verificationTokenExpiry: null
    } as any)
  }

  /**
   * Resend verification email
   * Purpose: Generate new token and resend verification email
   */
  async resendVerification(email: string): Promise<void> {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim()
    
    const user = await userRepository.findByEmail(normalizedEmail)
    
    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    // Check if already verified
    if (user.status === 'ACTIVE') {
      throw new Error('Email already verified. You can log in.')
    }

    // Generate new verification token
    const crypto = require('crypto')
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    await userRepository.update(user.id, {
      verificationToken,
      verificationTokenExpiry
    } as any)

    // Send verification email
    try {
      await sendVerificationEmail({
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        verificationToken
      })
      console.log(`✅ Verification email resent to ${user.email}`)
    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError)
      console.log(`📧 Verification token for ${user.email}: ${verificationToken}`)
      throw new Error('Failed to send verification email')
    }
  }

  /**
   * Magic link login for temporary users
   * Purpose: Authenticate user with magic link token (no password required)
   * Inputs: Magic link token
   * Outputs: User data
   */
  async magicLogin(token: string) {
    // Find user by verification token
    const user = await userRepository.findByVerificationToken(token)

    if (!user) {
      throw new Error('Invalid or expired magic link')
    }

    // Check if token is expired (cast to any to avoid TypeScript errors)
    const userAny = user as any
    if (userAny.verificationTokenExpiry && new Date() > new Date(userAny.verificationTokenExpiry)) {
      throw new Error('Magic link has expired')
    }

    // Check if user is temporary
    if (user.userType !== 'TEMPORARY') {
      throw new Error('Magic link login is only available for temporary users')
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new Error('User account is not active')
    }

    // Invalidate the magic link token (one-time use) and update last login
    await userRepository.update(user.id, {
      verificationToken: null,
      verificationTokenExpiry: null,
      lastLoginAt: new Date()
    } as any)

    return user
  }
}

export const authService = new AuthService()
