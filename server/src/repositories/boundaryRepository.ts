/**
 * Boundary Repository
 * Purpose: Database operations for boundaries
 */

import { prisma } from '../config/database'

/**
 * Find all boundaries
 * Purpose: Get paginated boundaries with filters
 * Input: page, limit, filters (search, campusId)
 * Output: Boundaries with pagination
 */
export const findAll = async (page: number, limit: number, filters: any = {}) => {
  const skip = (page - 1) * limit
  const where: any = {}

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } }
    ]
  }

  if (filters.campusId) {
    where.campusId = filters.campusId
  }

  const [boundaries, total] = await Promise.all([
    prisma.boundary.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        campus: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.boundary.count({ where })
  ])

  return {
    boundaries,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Find boundary by ID
 * Purpose: Get single boundary
 * Input: Boundary ID
 * Output: Boundary or null
 */
export const findById = async (id: string) => {
  return prisma.boundary.findUnique({
    where: { id },
    include: {
      campus: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}

/**
 * Find boundary by coordinates
 * Purpose: Check for duplicate by geometry
 * Input: Coordinates JSON string
 * Output: Boundary or null
 */
export const findByCoordinates = async (coordinates: string) => {
  return prisma.boundary.findFirst({
    where: { coordinates }
  })
}

/**
 * Create boundary
 * Purpose: Create new boundary
 * Input: Boundary data
 * Output: Created boundary
 */
export const create = async (data: any) => {
  return prisma.boundary.create({
    data,
    include: {
      campus: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}

/**
 * Update boundary
 * Purpose: Update existing boundary
 * Input: Boundary ID and update data
 * Output: Updated boundary
 */
export const update = async (id: string, data: any) => {
  return prisma.boundary.update({
    where: { id },
    data,
    include: {
      campus: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}

/**
 * Delete boundary
 * Purpose: Remove boundary
 * Input: Boundary ID
 * Output: Deleted boundary
 */
export const remove = async (id: string) => {
  return prisma.boundary.delete({
    where: { id }
  })
}

/**
 * Check duplicate by geometry
 * Purpose: Check if boundary with same geometry exists
 * Input: Coordinates JSON string
 * Output: Boolean
 */
export const checkDuplicateByGeometry = async (coordinates: string): Promise<boolean> => {
  const existing = await prisma.boundary.findFirst({
    where: { coordinates }
  })
  return !!existing
}
