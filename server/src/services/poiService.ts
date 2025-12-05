/**
 * POI Service
 * Purpose: Business logic for points of interest
 */

import * as poiRepository from '../repositories/poiRepository'
import { prisma } from '../config/database'

/**
 * Get all POIs with pagination and filters
 * Purpose: Fetch POIs with associated building/open space data
 * Input: page, limit, campusId, search
 * Output: Paginated POIs with relations
 */
export const getAll = async (page: number, limit: number, campusId?: string, search?: string) => {
  const skip = (page - 1) * limit
  
  const where: any = {}
  
  if (campusId) {
    where.campusId = campusId
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } }
    ]
  }
  
  const [pois, total] = await Promise.all([
    (prisma as any).pOI.findMany({
      where,
      skip,
      take: limit,
      include: {
        building: {
          select: {
            id: true,
            name: true,
            images: {
              orderBy: { displayOrder: 'asc' },
              take: 1,
              select: {
                imageUrl: true
              }
            }
          }
        },
        openSpace: {
          select: {
            id: true,
            name: true,
            images: {
              orderBy: { displayOrder: 'asc' },
              take: 1,
              select: {
                imageUrl: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    (prisma as any).pOI.count({ where })
  ])
  
  return {
    data: pois,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 * Purpose: Compare two strings and return similarity score (0-1)
 * Input: Two strings to compare
 * Output: Similarity score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1.0
  if (s1.length === 0 || s2.length === 0) return 0.0
  
  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8
  }
  
  // Levenshtein distance
  const matrix: number[][] = []
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length)
  const distance = matrix[s2.length][s1.length]
  return 1 - distance / maxLength
}

/**
 * Find matching building or open space by name
 * Purpose: Automatically detect corresponding building/open space using fuzzy matching
 * Input: POI name, campusId
 * Output: { buildingId, openSpaceId } or null values
 */
async function findMatchingEntity(poiName: string, campusId: string): Promise<{ buildingId: string | null; openSpaceId: string | null }> {
  const SIMILARITY_THRESHOLD = 0.6 // 60% similarity required
  
  // Fetch all buildings and open spaces for this campus
  const buildings = await (prisma as any).buildings.findMany({
    where: { campusId },
    select: { id: true, name: true }
  })
  
  const openSpaces = await (prisma as any).openSpace.findMany({
    where: { campusId },
    select: { id: true, name: true }
  })
  
  let bestMatch: { id: string; type: 'building' | 'openSpace'; similarity: number } | null = null
  
  // Check buildings
  for (const building of buildings) {
    const similarity = calculateSimilarity(poiName, building.name)
    if (similarity >= SIMILARITY_THRESHOLD && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { id: building.id, type: 'building', similarity }
    }
  }
  
  // Check open spaces
  for (const openSpace of openSpaces) {
    const similarity = calculateSimilarity(poiName, openSpace.name)
    if (similarity >= SIMILARITY_THRESHOLD && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { id: openSpace.id, type: 'openSpace', similarity }
    }
  }
  
  if (bestMatch) {
    return bestMatch.type === 'building' 
      ? { buildingId: bestMatch.id, openSpaceId: null }
      : { buildingId: null, openSpaceId: bestMatch.id }
  }
  
  return { buildingId: null, openSpaceId: null }
}

/**
 * Import POIs from GeoJSON
 * Purpose: Bulk import with duplicate detection and automatic entity assignment
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

  result.total = geojson.features.length

  for (const feature of geojson.features) {
    try {
      const name = feature.properties?.name || 'Unnamed'
      const coordinates = JSON.stringify(feature.geometry?.coordinates || [])

      // Check for duplicate by coordinates
      const existing = await poiRepository.findByCoordinates(coordinates)
      if (existing) {
        result.duplicates++
        result.details.duplicates.push(name)
        continue
      }

      // Find matching building or open space by name
      const { buildingId, openSpaceId } = await findMatchingEntity(name, campusId)

      // Create POI with automatic entity assignment
      await poiRepository.create({
        name,
        description: feature.properties?.description || '',
        coordinates,
        isActive: true,
        campusId,
        buildingId,
        openSpaceId,
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

/**
 * Delete POI
 * Purpose: Remove POI from database
 * Input: POI ID
 * Output: Deleted POI
 */
export const remove = async (id: string) => {
  return (prisma as any).pOI.delete({
    where: { id }
  })
}

/**
 * Toggle POI active status
 * Purpose: Activate/deactivate POI
 * Input: POI ID
 * Output: Updated POI
 */
export const toggleActive = async (id: string) => {
  const poi = await poiRepository.findById(id)
  if (!poi) {
    throw new Error('POI not found')
  }

  return poiRepository.update(id, { isActive: !poi.isActive })
}

/**
 * Create POI
 * Purpose: Create new POI
 * Input: POI data
 * Output: Created POI
 */
export const create = async (data: any) => {
  return poiRepository.create(data)
}

/**
 * Update POI
 * Purpose: Update existing POI
 * Input: POI ID and updated data
 * Output: Updated POI
 */
export const update = async (id: string, data: any) => {
  const poi = await poiRepository.findById(id)
  if (!poi) {
    throw new Error('POI not found')
  }

  return poiRepository.update(id, data)
}

/**
 * Get POI by ID
 * Purpose: Get single POI with relations
 * Input: POI ID
 * Output: POI with building/openSpace relations
 */
export const getById = async (id: string) => {
  const poi = await poiRepository.findById(id)
  if (!poi) {
    throw new Error('POI not found')
  }
  return poi
}
