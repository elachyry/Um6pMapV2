/**
 * User Repository
 * Purpose: Handle all database operations for users
 * Inputs: User data objects
 * Outputs: User records from database
 */

import { prisma } from '@/config/database'
import type { User } from '@prisma/client'
import { Prisma } from '@prisma/client'

export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
            campus: true,
          },
        },
        campus: true,
      },
    })
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { verificationToken: token },
    })
  }

  /**
   * Find user by reset password token
   */
  async findByResetToken(token: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { resetPasswordToken: token },
    })
  }

  /**
   * Create new user
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  /**
   * Update user
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete user (hard delete)
   * Purpose: Permanently remove user and cascade delete related records
   */
  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    })
  }

  /**
   * Find all users with filters
   */
  async findAll(params: {
    skip?: number
    take?: number
    where?: Prisma.UserWhereInput
    orderBy?: Prisma.UserOrderByWithRelationInput
  }) {
    const { skip, take, where, orderBy } = params

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          campus: true,
        },
      }),
      prisma.user.count({
        where,
      }),
    ])

    return { users, total }
  }

  /**
   * Find temporary users
   */
  async findTemporaryUsers(params: {
    skip?: number
    take?: number
    status?: string
  }) {
    return this.findAll({
      ...params,
      where: {
        userType: 'TEMPORARY',
        status: params.status,
      },
    })
  }

  /**
   * Find permanent users
   */
  async findPermanentUsers(params: {
    skip?: number
    take?: number
    userType?: string
  }) {
    const types = ['PERMANENT', 'ADMIN', 'SUPER_ADMIN']
    return this.findAll({
      ...params,
      where: {
        userType: params.userType || { in: types },
      },
    })
  }

  /**
   * Update last activity
   * TODO: Add lastActivityAt field to schema
   */
  async updateLastActivity(id: string): Promise<void> {
    // Field not in schema yet
    // await prisma.user.update({
    //   where: { id },
    //   data: { lastActivityAt: new Date() },
    // })
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLogins(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        loginAttempts: { increment: 1 },
      },
    })
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedLogins(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
      },
    })
  }

  /**
   * Lock user account
   */
  async lockAccount(id: string, until: Date): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        lockedUntil: until,
        status: 'SUSPENDED',
      },
    })
  }
}

export const userRepository = new UserRepository()
