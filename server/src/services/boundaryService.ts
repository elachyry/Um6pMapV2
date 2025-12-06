/**
 * Boundary Service
 * Purpose: Business logic for campus boundaries
 */

import * as boundaryRepository from '../repositories/boundaryRepository'
import { prisma } from '../config/database'

export interface ImportResult {
  total: number
  imported: number
  duplicates: number
  errors: number
  details: {
    imported: string[]
    duplicates: string[]
    errors: Array<{ name: string; error: string }>
  }
}

/**
 * Import boundaries from GeoJSON
 * Purpose: Bulk import with duplicate detection
 * Input: campusId, GeoJSON data
 * Output: Import result
 */
export const importFromGeoJSON = async (campusId: string, geojson: any): Promise<ImportResult> => {
  const result: ImportResult = {
    total: 0,
    imported: 0,
    duplicates: 0,
    errors: 0,
    details: {
      imported: [],
      duplicates: [],
      errors: []
    }
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
      // Get name from properties (try different field names)
      const name = feature.properties?.['display name'] || 
                   feature.properties?.name || 
                   feature.properties?.displayName ||
                   'Unnamed Boundary'
      
      // Store the full geometry object (type + coordinates), not just coordinates array
      const coordinates = JSON.stringify(feature.geometry || {})

      // Check for duplicate by coordinates
      const existing = await boundaryRepository.findByCoordinates(coordinates)
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
        const existingSlug = await prisma.boundary.findFirst({
          where: {
            campusId,
            slug: uniqueSlug
          }
        })
        if (!existingSlug) break
        uniqueSlug = `${slug}-${counter}`
        counter++
      }

      // Create boundary
      await boundaryRepository.create({
        name,
        slug: uniqueSlug,
        campusId,
        coordinates,
        isActive: true
      })

      result.imported++
      result.details.imported.push(name)
    } catch (error: any) {
      result.errors++
      result.details.errors.push({
        name: feature.properties?.['display name'] || feature.properties?.name || 'Unknown',
        error: error.message
      })
    }
  }

  return {
    success: true,
    ...result
  } as any
}

/**
 * Get all boundaries
 * Purpose: Fetch paginated boundaries
 * Input: page, limit, filters (search, campusId)
 * Output: Boundaries with pagination
 */
export const getAll = async (page: number, limit: number, filters: any = {}) => {
  return boundaryRepository.findAll(page, limit, filters)
}

/**
 * Get boundary by ID
 * Purpose: Fetch single boundary
 * Input: Boundary ID
 * Output: Boundary object
 */
export const getById = async (id: string) => {
  const boundary = await boundaryRepository.findById(id)
  if (!boundary) {
    throw new Error('Boundary not found')
  }
  return boundary
}

/**
 * Create boundary
 * Purpose: Create new boundary
 * Input: Boundary data
 * Output: Created boundary
 */
export const create = async (data: any) => {
  // Generate slug from name
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const boundaryData = {
    name: data.name,
    slug,
    description: data.description,
    campusId: data.campusId,
    coordinates: data.coordinates,
    isActive: data.isActive !== undefined ? data.isActive : true
  }

  return boundaryRepository.create(boundaryData)
}

/**
 * Update boundary
 * Purpose: Update existing boundary
 * Input: Boundary ID and update data
 * Output: Updated boundary
 */
export const update = async (id: string, data: any) => {
  await getById(id) // Check if boundary exists

  const updateData: any = {}
  
  // Only include fields that are provided
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.coordinates !== undefined) updateData.coordinates = data.coordinates
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  return boundaryRepository.update(id, updateData)
}

/**
 * Delete boundary
 * Purpose: Remove boundary
 * Input: Boundary ID
 * Output: Deleted boundary
 */
export const remove = async (id: string) => {
  await getById(id) // Check if boundary exists
  return boundaryRepository.remove(id)
}

/**
 * Toggle active status
 * Purpose: Activate/deactivate boundary
 * Input: Boundary ID
 * Output: Updated boundary
 */
export const toggleActive = async (id: string) => {
  const boundary = await getById(id)
  return boundaryRepository.update(id, {
    isActive: !boundary.isActive
  })
}
