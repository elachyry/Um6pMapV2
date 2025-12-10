/**
 * OpenSpace Service
 * Purpose: Business logic for open spaces
 */

import * as openSpaceRepository from '../repositories/openSpaceRepository'
import { prisma } from '../config/database'

/**
 * Get all open spaces
 * Purpose: Fetch paginated open spaces
 * Input: page, limit, filters (search, campusId, openSpaceType)
 * Output: Open spaces with pagination
 */
export const getAll = async (page: number, limit: number, filters: any = {}) => {
  return openSpaceRepository.findAll(page, limit, filters)
}

/**
 * Get open space by ID
 * Purpose: Fetch single open space
 * Input: Open space ID
 * Output: Open space object
 */
export const getById = async (id: string) => {
  const openSpace = await openSpaceRepository.findById(id)
  if (!openSpace) {
    throw new Error('Open space not found')
  }
  return openSpace
}

/**
 * Create open space
 * Purpose: Create new open space
 * Input: Open space data
 * Output: Created open space
 */
export const create = async (data: any) => {
  console.log('OpenSpace Service - Create received data:', data)
  console.log('CategoryId from data:', data.categoryId)
  
  const { operatingHours, contactInfo, images, documents, accessibility, amenities, ...rest } = data

  // Generate slug from name
  const slug = rest.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const openSpaceData = {
    name: rest.name,
    slug,
    description: rest.description,
    campusId: rest.campusId,
    categoryId: rest.categoryId ? rest.categoryId : null,
    address: rest.address,
    coordinates: rest.coordinates,
    openSpaceType: rest.openSpaceType,
    capacity: rest.capacity,
    isReservable: rest.isReservable,
    isActive: rest.isActive,
    facilities: accessibility || rest.facilities,
    // 3D Model Configuration
    modelId: rest.modelId || null,
    modelScale: rest.modelScale || 1.0,
    modelRotationX: rest.modelRotationX || 0.0,
    modelRotationY: rest.modelRotationY || 0.0,
    modelRotationZ: rest.modelRotationZ || 0.0,
    modelOffsetX: rest.modelOffsetX || 0.0,
    modelOffsetY: rest.modelOffsetY || 0.0,
    modelOffsetZ: rest.modelOffsetZ || 0.0,
  }

  console.log('OpenSpace Service - Data being sent to repository:', openSpaceData)
  console.log('CategoryId in openSpaceData:', openSpaceData.categoryId)
  
  const openSpace = await openSpaceRepository.create(openSpaceData)

  if (operatingHours && Array.isArray(operatingHours)) {
    await openSpaceRepository.updateOperatingHours(openSpace.id, operatingHours)
  }

  if (contactInfo && Array.isArray(contactInfo)) {
    await openSpaceRepository.updateContactInfo(openSpace.id, contactInfo)
  }

  if (amenities && Array.isArray(amenities)) {
    await openSpaceRepository.updateAmenities(openSpace.id, amenities)
  }

  return openSpace
}

/**
 * Update open space
 * Purpose: Update existing open space
 * Input: Open space ID and update data
 * Output: Updated open space
 */
export const update = async (id: string, data: any) => {
  console.log('OpenSpace Service - Update received data:', data)
  console.log('CategoryId from data:', data.categoryId)
  console.log('Contact Info:', data.contactInfo)
  console.log('Amenities:', data.amenities)
  console.log('Operating Hours:', data.operatingHours)
  
  const { operatingHours, contactInfo, amenities, ...openSpaceData } = data
  await getById(id) // Check if open space exists

  const updateData: any = {}
  
  // Only include fields that are provided
  if (openSpaceData.name !== undefined) updateData.name = openSpaceData.name
  if (openSpaceData.description !== undefined) updateData.description = openSpaceData.description
  if (openSpaceData.categoryId !== undefined) {
    updateData.categoryId = openSpaceData.categoryId ? openSpaceData.categoryId : null
    console.log('Setting categoryId in updateData:', updateData.categoryId)
  }
  if (openSpaceData.address !== undefined) updateData.address = openSpaceData.address
  if (openSpaceData.coordinates !== undefined) updateData.coordinates = openSpaceData.coordinates
  if (openSpaceData.openSpaceType !== undefined) updateData.openSpaceType = openSpaceData.openSpaceType
  if (openSpaceData.capacity !== undefined) updateData.capacity = openSpaceData.capacity
  if (openSpaceData.isReservable !== undefined) updateData.isReservable = openSpaceData.isReservable
  if (openSpaceData.isActive !== undefined) updateData.isActive = openSpaceData.isActive
  if (openSpaceData.facilities !== undefined) updateData.facilities = openSpaceData.facilities
  if (openSpaceData.modelId !== undefined) updateData.modelId = openSpaceData.modelId
  if (openSpaceData.modelScale !== undefined) updateData.modelScale = openSpaceData.modelScale
  if (openSpaceData.modelRotationX !== undefined) updateData.modelRotationX = openSpaceData.modelRotationX
  if (openSpaceData.modelRotationY !== undefined) updateData.modelRotationY = openSpaceData.modelRotationY
  if (openSpaceData.modelRotationZ !== undefined) updateData.modelRotationZ = openSpaceData.modelRotationZ
  if (openSpaceData.modelOffsetX !== undefined) updateData.modelOffsetX = openSpaceData.modelOffsetX
  if (openSpaceData.modelOffsetY !== undefined) updateData.modelOffsetY = openSpaceData.modelOffsetY
  if (openSpaceData.modelOffsetZ !== undefined) updateData.modelOffsetZ = openSpaceData.modelOffsetZ

  console.log('OpenSpace Service - Final updateData being sent to repository:', updateData)
  console.log('CategoryId in final updateData:', updateData.categoryId)
  
  const openSpace = await openSpaceRepository.update(id, updateData)

  if (operatingHours && Array.isArray(operatingHours)) {
    await openSpaceRepository.updateOperatingHours(id, operatingHours)
  }
  if (contactInfo && Array.isArray(contactInfo)) {
    await openSpaceRepository.updateContactInfo(id, contactInfo)
  }
  if (amenities && Array.isArray(amenities)) {
    await openSpaceRepository.updateAmenities(id, amenities)
  }
  return openSpace
}

/**
 * Delete open space
 * Purpose: Remove open space
 * Input: Open space ID
 * Output: Deleted open space
 */
export const remove = async (id: string) => {
  await getById(id) // Check if open space exists
  return openSpaceRepository.remove(id)
}

/**
 * Toggle active status
 * Purpose: Activate/deactivate open space
 * Input: Open space ID
 * Output: Updated open space
 */
export const toggleActive = async (id: string) => {
  const openSpace = await getById(id)
  return openSpaceRepository.update(id, {
    isActive: !openSpace.isActive,
  })
}

/**
 * Import open spaces from GeoJSON
 * Purpose: Bulk import with duplicate detection
 * Input: campusId, GeoJSON data
 * Output: Import result
 */
export const importFromGeoJSON = async (campusId: string, geojson: any) => {
  const result = {
    total: 0,
    imported: 0,
    duplicates: 0,
    errors: 0,
    details: {
      imported: [] as string[],
      duplicates: [] as string[],
      errors: [] as Array<{ name: string; error: string }>,
    },
  }

  if (!geojson.features || !Array.isArray(geojson.features)) {
    throw new Error('Invalid GeoJSON format')
  }

  // Validate campus exists
  if (campusId) {
    const campus = await prisma.campus.findUnique({ where: { id: campusId } })
    if (!campus) {
      throw new Error(`Campus with ID ${campusId} not found`)
    }
  }

  result.total = geojson.features.length

  for (const feature of geojson.features) {
    try {
      const name = feature.properties?.name || 'Unnamed'
      // Store the full geometry object (type + coordinates), not just coordinates array
      const coordinates = JSON.stringify(feature.geometry || {})

      // Check for duplicate by coordinates
      const existing = await openSpaceRepository.findByCoordinates(coordinates)
      if (existing) {
        result.duplicates++
        result.details.duplicates.push(name)
        continue
      }

      // Generate base slug
      let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // Ensure unique slug within campus
      let uniqueSlug = slug
      let counter = 1
      while (true) {
        const existingSlug = await (prisma as any).openSpace.findFirst({
          where: {
            campusId,
            slug: uniqueSlug
          }
        })
        if (!existingSlug) break
        uniqueSlug = `${slug}-${counter}`
        counter++
      }

      // Create open space
      await openSpaceRepository.create({
        name,
        slug: uniqueSlug,
        campusId,
        coordinates,
        openSpaceType: feature.properties?.type || 'general',
        isActive: true,
        isReservable: false,
      })

      result.imported++
      result.details.imported.push(name)
    } catch (error: any) {
      result.errors++
      result.details.errors.push({
        name: feature.properties?.name || 'Unknown',
        error: error.message,
      })
    }
  }

  return {
    success: true,
    ...result,
  }
}
