/**
 * Campus Service
 * Purpose: Business logic for campus management
 * Inputs: Campus data and query parameters
 * Outputs: Processed campus data
 */

import { campusRepository } from '@/repositories/campusRepository'
import { prisma } from '@/config/database'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'

export class CampusService {
  /**
   * Get all campuses with counts
   * Purpose: Fetch all campuses with building counts
   */
  async getAll(params?: { page?: number; limit?: number; search?: string }) {
    const page = params?.page || 1
    const limit = params?.limit || 10
    const skip = (page - 1) * limit

    const where: Prisma.CampusWhereInput = {
      ...(params?.search && {
        OR: [
          { name: { contains: params.search } },
          { description: { contains: params.search } },
          { address: { contains: params.search } },
        ],
      }),
    }

    const { campuses, total } = await campusRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { name: 'asc' },
    })

    return {
      campuses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get active campuses only
   * Purpose: Fetch list of active campuses for dropdowns/selection
   */
  async getActive() {
    return campusRepository.findActive()
  }

  /**
   * Get campus by ID
   * Purpose: Fetch single campus with details
   */
  async getById(id: string) {
    return campusRepository.findById(id)
  }

  /**
   * Get campus by slug
   * Purpose: Fetch campus by URL-friendly slug
   */
  async getBySlug(slug: string) {
    return campusRepository.findBySlug(slug)
  }

  /**
   * Create new campus
   * Purpose: Add a new campus to the system
   */
  async create(data: Prisma.CampusCreateInput) {
    return campusRepository.create(data)
  }

  /**
   * Update campus
   * Purpose: Update existing campus data
   */
  async update(id: string, data: Prisma.CampusUpdateInput) {
    return campusRepository.update(id, data)
  }

  /**
   * Delete campus with password verification
   * Purpose: Delete campus and all related data after verifying admin password
   */
  async delete(id: string, userId: string, password: string) {
    // Verify user password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }

    // Delete campus (cascade delete will handle related data)
    return campusRepository.delete(id)
  }
}

export const campusService = new CampusService()
