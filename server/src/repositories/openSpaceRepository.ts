/**
 * OpenSpace Repository
 * Purpose: Database operations for open spaces
 */

import { prisma } from '../config/database'

/**
 * Find open space by ID
 * Purpose: Get single open space with all relations
 * Input: Open space ID
 * Output: Open space object or null
 */
export const findById = async (id: string) => {
  const openSpace = await prisma.openSpace.findUnique({
    where: { id },
    include: {
      campus: true,
    },
  })

  if (!openSpace) return null

  // Manually fetch relations to avoid TypeScript errors
  const operatingHours = await (prisma as any).operatingHours.findMany({
    where: { openSpaceId: id },
    orderBy: { dayOfWeek: 'asc' }
  })

  const contactInfo = await (prisma as any).contactInfo.findMany({
    where: { openSpaceId: id }
  })

  const images = await (prisma as any).openSpaceImage.findMany({
    where: { openSpaceId: id },
    orderBy: { displayOrder: 'asc' }
  })

  const documents = await (prisma as any).openSpaceDocument.findMany({
    where: { openSpaceId: id },
    orderBy: { displayOrder: 'asc' }
  })

  const amenities = await (prisma as any).openSpaceAmenity.findMany({
    where: { openSpaceId: id },
    include: {
      amenity: true
    }
  })

  // Fetch buildingModel if modelId exists
  let buildingModel = null
  if (openSpace.modelId) {
    buildingModel = await prisma.buildingModel.findUnique({
      where: { id: openSpace.modelId },
    })
  }

  return {
    ...openSpace,
    operatingHours,
    contactInfo,
    images,
    documents,
    amenities,
    buildingModel,
  }
}

/**
 * Find all open spaces with pagination
 * Purpose: Get paginated list of open spaces
 * Input: page, limit, filters (search, campusId, openSpaceType)
 * Output: Open spaces array with pagination info
 */
export const findAll = async (page: number = 1, limit: number = 10, filters: any = {}) => {
  const skip = (page - 1) * limit
  const { search, campusId, openSpaceType } = filters

  const where: any = {}
  
  // Filter by campus
  if (campusId) {
    where.campusId = campusId
  }

  // Filter by type
  if (openSpaceType) {
    where.openSpaceType = openSpaceType
  }

  // Filter by search (name, description, address)
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { address: { contains: search } },
      { openSpaceType: { contains: search } },
    ]
  }

  const [openSpaces, total] = await Promise.all([
    prisma.openSpace.findMany({
      where,
      skip,
      take: limit,
      include: {
        campus: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.openSpace.count({ where }),
  ])

  // Fetch relations for each open space
  const openSpacesWithRelations = await Promise.all(
    openSpaces.map(async (openSpace: any) => {
      const operatingHours = await (prisma as any).operatingHours.findMany({
        where: { openSpaceId: openSpace.id },
        orderBy: { dayOfWeek: 'asc' }
      })

      const contactInfo = await (prisma as any).contactInfo.findMany({
        where: { openSpaceId: openSpace.id }
      })

      const images = await (prisma as any).openSpaceImage.findMany({
        where: { openSpaceId: openSpace.id },
        orderBy: { displayOrder: 'asc' }
      })

      const documents = await (prisma as any).openSpaceDocument.findMany({
        where: { openSpaceId: openSpace.id },
        orderBy: { displayOrder: 'asc' }
      })

      // Fetch buildingModel if modelId exists
      let buildingModel = null
      if (openSpace.modelId) {
        buildingModel = await prisma.buildingModel.findUnique({
          where: { id: openSpace.modelId },
        })
      }

      return {
        ...openSpace,
        operatingHours,
        contactInfo,
        images,
        documents,
        buildingModel,
      }
    })
  )

  return {
    data: openSpacesWithRelations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Create new open space
 * Purpose: Insert new open space into database
 * Input: Open space data
 * Output: Created open space
 */
export const create = async (data: any) => {
  return prisma.openSpace.create({
    data,
    include: {
      campus: true,
    },
  })
}

/**
 * Update open space
 * Purpose: Update existing open space
 * Input: Open space ID and update data
 * Output: Updated open space
 */
export const update = async (id: string, data: any) => {
  return prisma.openSpace.update({
    where: { id },
    data,
    include: {
      campus: true,
    },
  })
}

/**
 * Delete open space
 * Purpose: Remove open space from database
 * Input: Open space ID
 * Output: Deleted open space
 */
export const remove = async (id: string) => {
  return prisma.openSpace.delete({
    where: { id },
  })
}

/**
 * Find by coordinates
 * Purpose: Check for duplicate based on geometry
 * Input: coordinates string
 * Output: Open space or null
 */
export const findByCoordinates = async (coordinates: string) => {
  return prisma.openSpace.findFirst({
    where: { coordinates },
  })
}

/**
 * Update operating hours
 * Purpose: Replace all operating hours for an open space
 * Input: openSpaceId, array of hours
 * Output: void
 */
export const updateOperatingHours = async (openSpaceId: string, hours: any[]) => {
  try {
    await (prisma as any).operatingHours.deleteMany({
      where: { openSpaceId }
    })
    if (hours.length > 0) {
      await (prisma as any).operatingHours.createMany({
        data: hours.map((hour: any) => ({
          openSpaceId,
          dayOfWeek: hour.dayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isClosed: hour.isClosed || false,
          is24Hours: hour.is24Hours || false,
        }))
      })
    }
  } catch (error) {
    console.error('Error updating operating hours:', error)
    throw error
  }
}

/**
 * Update contact info
 * Purpose: Replace all contact info for an open space
 * Input: openSpaceId, array of contacts
 * Output: void
 */
export const updateContactInfo = async (openSpaceId: string, contacts: any[]) => {
  try {
    await (prisma as any).contactInfo.deleteMany({
      where: { openSpaceId }
    })
    if (contacts.length > 0) {
      await (prisma as any).contactInfo.createMany({
        data: contacts.map((contact: any) => ({
          openSpaceId,
          type: contact.type,
          value: contact.value,
          label: contact.label || '',
          isPrimary: contact.isPrimary || false,
        }))
      })
    }
  } catch (error) {
    console.error('Error updating contact info:', error)
    throw error
  }
}

/**
 * Update amenities
 * Purpose: Replace all amenities for an open space
 * Input: openSpaceId, array of amenity names
 * Output: void
 */
export const updateAmenities = async (openSpaceId: string, amenityNames: string[]) => {
  try {
    // Delete existing amenities
    await (prisma as any).openSpaceAmenity.deleteMany({
      where: { openSpaceId }
    })
    
    if (amenityNames.length > 0) {
      // Find or create amenities and link them
      for (const name of amenityNames) {
        let amenity = await (prisma as any).amenity.findFirst({
          where: { name }
        })
        
        if (!amenity) {
          amenity = await (prisma as any).amenity.create({
            data: { 
              name,
              category: 'General'
            }
          })
        }
        
        await (prisma as any).openSpaceAmenity.create({
          data: {
            openSpaceId,
            amenityId: amenity.id
          }
        })
      }
    }
  } catch (error) {
    console.error('Error updating amenities:', error)
    throw error
  }
}
