import * as buildingRepository from '../repositories/buildingRepository'
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
 * Import buildings from GeoJSON
 * Purpose: Process GeoJSON file and import buildings, detecting duplicates
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

  for (const feature of geojson.features) {
    try {
      const buildingName = feature.properties.name

      if (!buildingName) {
        result.errors++
        result.details.errors.push({
          name: 'Unknown',
          error: 'Missing building name'
        })
        continue
      }

      // Convert geometry to GeoJSON string
      const geometryString = JSON.stringify(feature.geometry)

      // Check for duplicate by geometry
      const isDuplicate = await buildingRepository.checkDuplicateByGeometry(geometryString)

      if (isDuplicate) {
        result.duplicates++
        result.details.duplicates.push(buildingName)
        continue
      }

      // Create building
      await buildingRepository.create({
        name: buildingName,
        slug: buildingName.toLowerCase().replace(/\s+/g, '-'),
        description: `Imported from GeoJSON (FID: ${feature.properties.fid || 'N/A'})`,
        coordinates: geometryString,
        isActive: true,
        ...(campusId && { campusId })
      })

      result.imported++
      result.details.imported.push(buildingName)
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
 * Get all buildings
 * Purpose: Retrieve all buildings from database with pagination
 * Input: page, limit, filters (search, campusId)
 * Output: Paginated list of buildings with total count
 */
export async function getAll(page: number = 1, limit: number = 12, filters: any = {}) {
  return await buildingRepository.findAll(page, limit, filters)
}

/**
 * Get building by ID
 * Purpose: Retrieve a single building by its ID
 * Input: Building ID
 * Output: Building or null
 */
export async function getById(id: string) {
  return await buildingRepository.findById(id)
}

/**
 * Create building
 * Purpose: Create a new building
 * Input: Building data
 * Output: Created building
 */
export async function create(data: any) {
  return await buildingRepository.create(data)
}

/**
 * Update building
 * Purpose: Update an existing building with relations
 * Input: Building ID and update data (including relations)
 * Output: Updated building
 */
export async function update(id: string, data: any) {
  const { operatingHours, contactInfo, amenities, ...buildingData } = data
  
  // Update basic building data
  const building = await buildingRepository.update(id, buildingData)
  
  // Handle operating hours if provided
  if (operatingHours && Array.isArray(operatingHours)) {
    await buildingRepository.updateOperatingHours(id, operatingHours)
  }
  
  // Handle contact info if provided
  if (contactInfo && Array.isArray(contactInfo)) {
    await buildingRepository.updateContactInfo(id, contactInfo)
  }
  
  // Handle amenities if provided
  if (amenities && Array.isArray(amenities)) {
    await buildingRepository.updateAmenities(id, amenities)
  }
  
  return building
}

/**
 * Delete building by ID
 * Purpose: Delete a building
 * Input: Building ID
 * Output: Deleted building
 */
export async function deleteById(id: string) {
  return await buildingRepository.deleteById(id)
}
