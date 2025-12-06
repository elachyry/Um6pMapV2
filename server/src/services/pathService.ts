/**
 * Path Service
 * Purpose: Business logic for path management
 */

import * as pathRepository from '../repositories/pathRepository'
import { prisma } from '../config/database'

interface GeoJSONFeature {
  type: 'Feature'
  properties: {
    fid?: number
    name: string
    [key: string]: any
  }
  geometry: {
    type: string
    coordinates: any
  }
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

interface ImportResult {
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
 * Import paths from GeoJSON
 * Purpose: Process GeoJSON file and import paths, detecting duplicates
 * Input: GeoJSON FeatureCollection, optional campusId
 * Output: Import statistics and details
 */
export async function importFromGeoJSON(geojson: GeoJSONFeatureCollection, campusId?: string): Promise<ImportResult> {
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

  if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new Error('Invalid GeoJSON format. Expected FeatureCollection.')
  }

  // Validate campus exists if campusId is provided
  if (campusId) {
    const campus = await prisma.campus.findUnique({ where: { id: campusId } })
    if (!campus) {
      throw new Error(`Campus with ID ${campusId} not found`)
    }
  }

  result.total = geojson.features.length
  
  // Get current path count to avoid duplicate generated names
  const existingPathsCount = await pathRepository.findAll(1, 1000, { campusId })
  let pathCounter = existingPathsCount.paths.length + 1

  for (const feature of geojson.features) {
    try {
      // Generate name if not provided - use incremental numbering
      let pathName = feature.properties.name
      if (!pathName || pathName.trim() === '') {
        pathName = `Path ${pathCounter}`
      }

      // Convert geometry to GeoJSON string
      const geometryString = JSON.stringify(feature.geometry)

      // Check for duplicate by geometry
      const isDuplicate = await pathRepository.checkDuplicateByGeometry(geometryString)

      if (isDuplicate) {
        result.duplicates++
        result.details.duplicates.push(pathName)
        pathCounter++
        continue
      }

      // Generate unique slug
      let baseSlug = pathName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      let slug = baseSlug
      let slugCounter = 1

      // Check if slug already exists and make it unique
      while (await pathRepository.findBySlug && await pathRepository.findBySlug(slug)) {
        slug = `${baseSlug}-${slugCounter}`
        slugCounter++
      }

      // Create path
      await pathRepository.create({
        name: pathName,
        slug: slug,
        description: `Imported from GeoJSON (FID: ${feature.properties.fid || 'N/A'})`,
        coordinates: geometryString,
        isActive: true,
        ...(campusId && { campusId })
      })

      result.imported++
      result.details.imported.push(pathName)
      pathCounter++
    } catch (error: any) {
      result.errors++
      result.details.errors.push({
        name: feature.properties.name || 'Unknown',
        error: error.message || 'Unknown error'
      })
    }
  }

  return result
}

/**
 * Get all paths
 * Purpose: Retrieve all paths from database with pagination
 * Input: page, limit, filters (search, campusId)
 * Output: Paginated list of paths with total count
 */
export async function getAll(page: number = 1, limit: number = 12, filters: any = {}) {
  return await pathRepository.findAll(page, limit, filters)
}

/**
 * Get path by ID
 * Purpose: Retrieve a single path by its ID
 * Input: Path ID
 * Output: Path or null
 */
export async function getById(id: string) {
  const path = await pathRepository.findById(id)
  if (!path) {
    throw new Error('Path not found')
  }
  return path
}

/**
 * Create path
 * Purpose: Create a new path
 * Input: Path data
 * Output: Created path
 */
export async function create(data: any) {
  return await pathRepository.create(data)
}

/**
 * Update path
 * Purpose: Update an existing path
 * Input: Path ID and update data
 * Output: Updated path
 */
export async function update(id: string, data: any) {
  const path = await pathRepository.findById(id)
  if (!path) {
    throw new Error('Path not found')
  }
  return await pathRepository.update(id, data)
}

/**
 * Delete path by ID
 * Purpose: Delete a path
 * Input: Path ID
 * Output: Deleted path
 */
export async function deleteById(id: string) {
  const path = await pathRepository.findById(id)
  if (!path) {
    throw new Error('Path not found')
  }
  return await pathRepository.deleteById(id)
}

/**
 * Toggle path active status
 * Purpose: Activate/deactivate path
 * Input: Path ID
 * Output: Updated path
 */
export async function toggleActive(id: string) {
  const path = await pathRepository.findById(id)
  if (!path) {
    throw new Error('Path not found')
  }
  return await pathRepository.update(id, { isActive: !path.isActive })
}
