/**
 * Location Repository
 * Purpose: Database operations for locations
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Find location by ID
 * Purpose: Get single location with relations
 * Input: Location ID
 * Output: Location object with building, images, documents, operating hours, contact info
 */
export const findById = async (id: string) => {
  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      building: true,
    },
  })

  if (!location) return null

  // Manually fetch relations to avoid TypeScript errors
  const operatingHours = await (prisma as any).operatingHours.findMany({
    where: { locationId: id },
    orderBy: { dayOfWeek: 'asc' }
  })

  const contactInfo = await (prisma as any).contactInfo.findMany({
    where: { locationId: id }
  })

  const images = await (prisma as any).locationImage.findMany({
    where: { locationId: id },
    orderBy: { displayOrder: 'asc' }
  })

  const documents = await (prisma as any).locationDocument.findMany({
    where: { locationId: id },
    orderBy: { displayOrder: 'asc' }
  })

  return {
    ...location,
    operatingHours,
    contactInfo,
    images,
    documents,
  }
}

/**
 * Find all locations with pagination
 * Purpose: Get paginated list of locations
 * Input: page, limit, buildingId (optional)
 * Output: Locations array with pagination info
 */
export const findAll = async (page: number = 1, limit: number = 10, buildingId?: string, campusId?: string) => {
  const skip = (page - 1) * limit

  const where: any = {}
  if (buildingId) {
    where.buildingId = buildingId
  }
  
  // Filter by campus through building relation
  if (campusId) {
    where.building = {
      campusId: campusId
    }
  }

  const [locations, total] = await Promise.all([
    prisma.location.findMany({
      where,
      skip,
      take: limit,
      include: {
        building: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.location.count({ where }),
  ])

  // Fetch relations for each location
  const locationsWithRelations = await Promise.all(
    locations.map(async (location) => {
      const operatingHours = await (prisma as any).operatingHours.findMany({
        where: { locationId: location.id },
        orderBy: { dayOfWeek: 'asc' }
      })

      const contactInfo = await (prisma as any).contactInfo.findMany({
        where: { locationId: location.id }
      })

      const images = await (prisma as any).locationImage.findMany({
        where: { locationId: location.id },
        orderBy: { displayOrder: 'asc' }
      })

      const documents = await (prisma as any).locationDocument.findMany({
        where: { locationId: location.id },
        orderBy: { displayOrder: 'asc' }
      })

      return {
        ...location,
        operatingHours,
        contactInfo,
        images,
        documents,
      }
    })
  )

  return {
    data: locationsWithRelations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Create location
 * Purpose: Create new location
 * Input: Location data
 * Output: Created location
 */
export const create = async (data: any) => {
  return prisma.location.create({
    data,
    include: {
      building: true,
    },
  })
}

/**
 * Update location
 * Purpose: Update existing location
 * Input: Location ID and update data
 * Output: Updated location
 */
export const update = async (id: string, data: any) => {
  return prisma.location.update({
    where: { id },
    data,
    include: {
      building: true,
    },
  })
}

/**
 * Delete location
 * Purpose: Delete location
 * Input: Location ID
 * Output: Deleted location
 */
export const deleteLocation = async (id: string) => {
  return prisma.location.delete({
    where: { id },
  })
}

/**
 * Toggle reservable status
 * Purpose: Toggle isReservable field
 * Input: Location ID
 * Output: Updated location
 */
export const toggleReservable = async (id: string) => {
  const location = await prisma.location.findUnique({ where: { id } })
  if (!location) throw new Error('Location not found')

  return prisma.location.update({
    where: { id },
    data: { isReservable: !location.isReservable },
  })
}

/**
 * Update operating hours for a location
 * Purpose: Replace all operating hours for a location
 * Input: Location ID and hours array
 * Output: None
 */
export const updateOperatingHours = async (locationId: string, hours: any[]) => {
  try {
    // Delete existing hours
    await (prisma as any).operatingHours.deleteMany({
      where: { locationId }
    })
    
    // Create new hours
    if (hours.length > 0) {
      await (prisma as any).operatingHours.createMany({
        data: hours.map((hour: any) => ({
          locationId,
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
 * Update contact info for a location
 * Purpose: Replace all contact info for a location
 * Input: Location ID and contacts array
 * Output: None
 */
export const updateContactInfo = async (locationId: string, contacts: any[]) => {
  try {
    // Delete existing contacts
    await (prisma as any).contactInfo.deleteMany({
      where: { locationId }
    })
    
    // Create new contacts
    if (contacts.length > 0) {
      await (prisma as any).contactInfo.createMany({
        data: contacts.map((contact: any) => ({
          locationId,
          type: contact.type,
          value: contact.value,
          label: contact.label || null,
          isPrimary: contact.isPrimary || false,
        }))
      })
    }
  } catch (error) {
    console.error('Error updating contact info:', error)
    throw error
  }
}
