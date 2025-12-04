/**
 * Campus Repository
 * Purpose: Handle all database operations for campuses
 * Inputs: Campus data objects
 * Outputs: Campus records from database
 */

import { prisma } from '@/config/database'
import { Prisma, Campus } from '@prisma/client'

export class CampusRepository {
  /**
   * Find campus by ID
   */
  async findById(id: string): Promise<Campus | null> {
    return prisma.campus.findUnique({
      where: { id },
      include: {
        buildings: {
          where: { isActive: true },
          take: 10,
        },
        _count: {
          select: {
            buildings: true,
            users: true,
            events: true,
          },
        },
      },
    })
  }

  /**
   * Find campus by slug
   */
  async findBySlug(slug: string): Promise<Campus | null> {
    return prisma.campus.findUnique({
      where: { slug },
    })
  }

  /**
   * Create new campus
   */
  async create(data: Prisma.CampusCreateInput): Promise<Campus> {
    return prisma.campus.create({
      data,
    })
  }

  /**
   * Update campus
   */
  async update(id: string, data: Prisma.CampusUpdateInput): Promise<Campus> {
    return prisma.campus.update({
      where: { id },
      data,
    })
  }

  /**
   * Find all campuses
   */
  async findAll(params: {
    skip?: number
    take?: number
    where?: Prisma.CampusWhereInput
    orderBy?: Prisma.CampusOrderByWithRelationInput
  }) {
    const { skip, take, where, orderBy } = params

    const [campuses, total] = await Promise.all([
      prisma.campus.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          _count: {
            select: {
              buildings: true,
              users: true,
            },
          },
        },
      }),
      prisma.campus.count({ where }),
    ])

    return { campuses, total }
  }

  /**
   * Get active campuses
   */
  async findActive() {
    return prisma.campus.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Delete campus
   */
  async delete(id: string): Promise<Campus> {
    return prisma.campus.delete({
      where: { id },
    })
  }
}

export const campusRepository = new CampusRepository()
