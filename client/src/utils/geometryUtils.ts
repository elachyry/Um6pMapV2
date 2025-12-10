/**
 * Geometry Utilities
 * Purpose: Calculate geometric properties like polygon centroids
 */

/**
 * Calculate the centroid (center point) of a GeoJSON polygon
 * Inputs: GeoJSON geometry object (Polygon or MultiPolygon)
 * Outputs: [lng, lat] coordinates of the center
 */
export function calculatePolygonCenter(geometry: any): [number, number] | null {
  try {
    if (!geometry || !geometry.coordinates) return null

    let coordinates: number[][][]

    // Handle Polygon
    if (geometry.type === 'Polygon') {
      coordinates = [geometry.coordinates]
    }
    // Handle MultiPolygon
    else if (geometry.type === 'MultiPolygon') {
      coordinates = geometry.coordinates
    }
    // Handle Point (already a center)
    else if (geometry.type === 'Point') {
      return geometry.coordinates as [number, number]
    }
    else {
      return null
    }

    // Calculate centroid of the first polygon (outer ring)
    const outerRing = coordinates[0][0] // First polygon, outer ring
    
    let sumLng = 0
    let sumLat = 0
    let count = 0

    for (const coord of outerRing) {
      sumLng += (coord as any)[0]
      sumLat += (coord as any)[1]
      count++
    }

    if (count === 0) return null

    return [sumLng / count, sumLat / count]
  } catch (error) {
    console.error('Error calculating polygon center:', error)
    return null
  }
}

/**
 * Parse coordinates from database format
 * Inputs: coordinates string or object from database
 * Outputs: GeoJSON geometry object
 */
export function parseCoordinates(coordinates: string | any): any {
  if (typeof coordinates === 'string') {
    return JSON.parse(coordinates)
  }
  return coordinates
}
