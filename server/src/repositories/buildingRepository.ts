/**
 * Building Repository
 * Purpose: Handle all database operations for buildings
 * Inputs: Building data objects
 * Outputs: Building records from database
 */

import { prisma } from '@/config/database'
import { Prisma, Buildings } from '@prisma/client'

export class BuildingRepository {
  /**
   * Find building by ID
   * Purpose: Get complete building data with all relations
   */
  async findById(id: string): Promise<any> {
    return prisma.buildings.findUnique({
      where: { id },
      include: {
        campus: true,
        category: true,
        locations: {
          take: 20,
        },
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        documents: {
          orderBy: { displayOrder: 'asc' },
        },
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        contactInfo: true,
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    } as any)
  }

  /**
   * Find building by slug
   */
  async findBySlug(campusId: string, slug: string): Promise<Buildings | null> {
    return prisma.buildings.findFirst({
      where: {
        slug,
        campusId,
      },
      include: {
        campus: true,
        category: true,
        locations: true,
      },
    })
  }

  /**
   * Create new building
   */
  async create(data: Prisma.BuildingsCreateInput): Promise<Buildings> {
    return prisma.buildings.create({
      data,
      include: {
        campus: true,
        category: true,
      },
    })
  }

  /**
   * Update building
   */
  async update(id: string, data: Prisma.BuildingsUpdateInput): Promise<Buildings> {
    return prisma.buildings.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete building
   */
  async delete(id: string): Promise<Buildings> {
    return prisma.buildings.delete({
      where: { id },
    })
  }

  /**
   * Find all buildings with filters
   */
  async findAll(params: {
    skip?: number
    take?: number
    where?: Prisma.BuildingsWhereInput
    orderBy?: Prisma.BuildingsOrderByWithRelationInput
  }) {
    const { skip, take, where, orderBy } = params

    const [buildings, total] = await Promise.all([
      prisma.buildings.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          campus: true,
          category: true,
          images: {
            orderBy: { displayOrder: 'asc' },
            take: 1, // Only get first image for card thumbnail
          },
          _count: {
            select: {
              locations: true,
            },
          },
        },
      } as any),
      prisma.buildings.count({ where }),
    ])

    return { buildings, total }
  }

  /**
   * Find buildings by campus
   */
  async findByCampus(campusId: string, filters?: {
    categoryId?: string
    isActive?: boolean
    search?: string
  }) {
    return prisma.buildings.findMany({
      where: {
        campusId,
        categoryId: filters?.categoryId,
        isActive: filters?.isActive,
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search } },
            { description: { contains: filters.search } },
          ],
        }),
      },
      include: {
        category: true,
        _count: {
          select: {
            locations: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Find reservable buildings
   */
  async findReservable(campusId: string) {
    return prisma.buildings.findMany({
      where: {
        campusId,
        isReservable: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Check if a building with the same geometry already exists
   * Purpose: Detect duplicate buildings based on geometry coordinates
   * Input: GeoJSON geometry string
   * Output: true if duplicate exists, false otherwise
   */
  async checkDuplicateByGeometry(geometryString: string): Promise<boolean> {
    const existing = await prisma.buildings.findFirst({
      where: {
        coordinates: geometryString
      }
    })
    return existing !== null
  }
}

export const buildingRepository = new BuildingRepository()

// Export simplified functions for direct use in services
export async function findById(id: string) {
  return buildingRepository.findById(id)
}

export async function findAll(page: number = 1, limit: number = 12, filters: any = {}) {
  const skip = (page - 1) * limit
  const where: any = {}

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
    ]
  }
  
  // Add campus filter
  if (filters.campusId) {
    where.campusId = filters.campusId
  }
  
  // Add category filter
  if (filters.categoryId) {
    where.categoryId = filters.categoryId
  }

  return buildingRepository.findAll({
    skip,
    take: limit,
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export async function create(data: any) {
  // Generate slug if not provided
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-')
  
  return prisma.buildings.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      coordinates: data.coordinates,
      isActive: data.isActive ?? true,
      isReservable: data.isReservable ?? false,
      campusId: data.campusId || null,
      categoryId: data.categoryId || null,
    }
  })
}

export async function update(id: string, data: any) {
  return buildingRepository.update(id, data)
}

export async function deleteById(id: string) {
  return buildingRepository.delete(id)
}

export async function checkDuplicateByGeometry(geometryString: string) {
  return buildingRepository.checkDuplicateByGeometry(geometryString)
}

/**
 * Update operating hours for a building
 * Purpose: Replace all operating hours for a building
 */
export async function updateOperatingHours(buildingId: string, hours: any[]) {
  try {
    // Delete existing hours
    await (prisma as any).operatingHours.deleteMany({
      where: { buildingId }
    })
    
    // Create new hours
    if (hours.length > 0) {
      await (prisma as any).operatingHours.createMany({
        data: hours.map((hour: any) => ({
          buildingId,
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
 * Update contact info for a building
 * Purpose: Replace all contact info for a building
 */
export async function updateContactInfo(buildingId: string, contacts: any[]) {
  try {
    // Delete existing contacts
    await (prisma as any).contactInfo.deleteMany({
      where: { buildingId }
    })
    
    // Create new contacts
    if (contacts.length > 0) {
      await (prisma as any).contactInfo.createMany({
        data: contacts.map((contact: any) => ({
          buildingId,
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

/**
 * Update amenities for a building
 * Purpose: Replace all amenities for a building
 * Note: amenityNamesOrIds can be either names (e.g., "wifi") or IDs (UUIDs)
 */
export async function updateAmenities(buildingId: string, amenityNamesOrIds: string[]) {
  try {
    // Delete existing amenities
    await (prisma as any).buildingAmenity.deleteMany({
      where: { buildingId }
    })
    
    // Create new amenities
    if (amenityNamesOrIds.length > 0) {
      // Look up amenity IDs from names
      const amenities = await (prisma as any).amenity.findMany({
        where: {
          name: { in: amenityNamesOrIds }
        },
        select: { id: true, name: true }
      })
      
      console.log('Found amenities:', amenities)
      
      if (amenities.length === 0) {
        console.warn('No amenities found for names:', amenityNamesOrIds)
        return
      }
      
      await (prisma as any).buildingAmenity.createMany({
        data: amenities.map((amenity: any) => ({
          buildingId,
          amenityId: amenity.id,
        }))
      })
      
      console.log(`✅ Created ${amenities.length} building amenities`)
    }
  } catch (error) {
    console.error('Error updating amenities:', error)
    throw error
  }
}
