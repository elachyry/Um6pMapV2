/**
 * Authentication Service
 * Purpose: Handle authentication business logic
 * Inputs: User credentials, tokens
 * Outputs: Authenticated user data, tokens
 */

import { userRepository } from '@/repositories/userRepository'
import { hashPassword, verifyPassword } from '@/utils/password'
import { UnauthorizedError, ConflictError } from '@/utils/errors'
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
    // Check if user exists
    const existing = await userRepository.findByEmail(data.email)
    if (existing) {
      throw new ConflictError('Email already registered')
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    // Create user
    const user = await userRepository.create({
      email: data.email,
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
    // Find user
    const user = await userRepository.findByEmail(email)
    if (!user) {
      throw new UnauthorizedError('Invalid email or password')
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

    // Reset failed attempts
    if (user.loginAttempts > 0) {
      await userRepository.resetFailedLogins(user.id)
    }

    // TODO: Update last activity (field not in schema yet)
    // await userRepository.updateLastActivity(user.id)

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

    // Update password
    await userRepository.update(userId, {
      password: hashedPassword,
    })
  }
}

export const authService = new AuthService()
