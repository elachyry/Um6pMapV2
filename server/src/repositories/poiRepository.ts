/**
 * POI Repository
 * Purpose: Database operations for points of interest
 */

import { prisma } from '../config/database'

/**
 * Find by coordinates
 * Purpose: Check for duplicate based on geometry
 * Input: coordinates string
 * Output: POI or null
 */
export const findByCoordinates = async (coordinates: string) => {
  return prisma.pOI.findFirst({
    where: { coordinates },
  })
}

/**
 * Delete POI
 * Purpose: Remove POI from database
 * Input: POI ID
 * Output: None
 */
export const remove = async (id: string) => {
  return (prisma as any).pOI.delete({
    where: { id }
  })
}

/**
 * Find POI by ID
 * Purpose: Get single POI with relations
 * Input: POI ID
 * Output: POI with building/openSpace relations
 */
export const findById = async (id: string) => {
  return (prisma as any).pOI.findUnique({
    where: { id },
    include: {
      building: {
        include: {
          images: true
        }
      },
      openSpace: {
        include: {
          images: true
        }
      },
      campus: true,
      category: true
    }
  })
}

/**
 * Create POI
 * Purpose: Create new POI
 * Input: POI data
 * Output: Created POI
 */
export const create = async (data: any) => {
  return (prisma as any).pOI.create({
    data,
    include: {
      building: {
        include: {
          images: true
        }
      },
      openSpace: {
        include: {
          images: true
        }
      },
      campus: true,
      category: true
    }
  })
}

/**
 * Update POI
 * Purpose: Update existing POI
 * Input: POI ID and updated data
 * Output: Updated POI
 */
export const update = async (id: string, data: any) => {
  return (prisma as any).pOI.update({
    where: { id },
    data,
    include: {
      building: {
        include: {
          images: true
        }
      },
      openSpace: {
        include: {
          images: true
        }
      },
      campus: true,
      category: true
    }
  })
}
