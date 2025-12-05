/**
 * Path Repository
 * Purpose: Database operations for path management
 */

import { prisma } from '../config/database'

/**
 * Find all paths with pagination and filters
 * Purpose: Get paths with optional filtering by campus, search, and pagination
 * Input: page, limit, filters
 * Output: Paginated paths with total count
 */
export const findAll = async (page: number, limit: number, filters: any = {}) => {
  const skip = (page - 1) * limit
  const { campusId, search, isActive } = filters

  const where: any = {}
  
  if (campusId) {
    where.campusId = campusId
  }
  
  if (typeof isActive === 'boolean') {
    where.isActive = isActive
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const [paths, total] = await Promise.all([
    prisma.path.findMany({
      where,
      skip,
      take: limit,
      include: {
        campus: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.path.count({ where })
  ])

  return {
    paths,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total
    }
  }
}

/**
 * Find path by ID
 * Purpose: Get single path with relations
 * Input: Path ID
 * Output: Path with campus relation
 */
export const findById = async (id: string) => {
  return prisma.path.findUnique({
    where: { id },
    include: {
      campus: true
    }
  })
}

/**
 * Create path
 * Purpose: Create new path
 * Input: Path data
 * Output: Created path
 */
export const create = async (data: any) => {
  return prisma.path.create({
    data,
    include: {
      campus: true
    }
  })
}

/**
 * Update path
 * Purpose: Update existing path
 * Input: Path ID and updated data
 * Output: Updated path
 */
export const update = async (id: string, data: any) => {
  return prisma.path.update({
    where: { id },
    data,
    include: {
      campus: true
    }
  })
}

/**
 * Delete path by ID
 * Purpose: Delete path
 * Input: Path ID
 * Output: Deleted path
 */
export const deleteById = async (id: string) => {
  return prisma.path.delete({
    where: { id }
  })
}

/**
 * Check for duplicate by coordinates
 * Purpose: Detect duplicate paths by comparing GeoJSON coordinates
 * Input: GeoJSON coordinates string
 * Output: Boolean indicating if duplicate exists
 */
export const checkDuplicateByGeometry = async (coordinates: string): Promise<boolean> => {
  const existing = await prisma.path.findFirst({
    where: { coordinates }
  })
  return !!existing
}

/**
 * Find path by coordinates
 * Purpose: Find path with exact coordinates match
 * Input: GeoJSON coordinates string
 * Output: Path or null
 */
export const findByCoordinates = async (coordinates: string) => {
  return prisma.path.findFirst({
    where: { coordinates }
  })
}

/**
 * Find path by slug
 * Purpose: Check if slug already exists
 * Input: Path slug
 * Output: Path or null
 */
export const findBySlug = async (slug: string) => {
  return prisma.path.findFirst({
    where: { slug }
  })
}
