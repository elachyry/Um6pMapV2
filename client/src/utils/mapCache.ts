/**
 * Map Cache Utility
 * Purpose: Manage map data cache and invalidation
 */

const CACHE_PREFIX = 'map_data_'
const CACHE_VERSION_KEY = 'map_cache_version'

/**
 * Get cache key for a campus
 */
export function getCacheKey(campusId: string): string {
  return `${CACHE_PREFIX}${campusId}`
}

/**
 * Invalidate map cache for a specific campus
 * This forces the map to fetch fresh data on next load
 */
export function invalidateMapCache(campusId?: string): void {
  if (campusId) {
    // Invalidate specific campus cache
    const cacheKey = getCacheKey(campusId)
    localStorage.removeItem(cacheKey)
    console.log(`🗑️ Invalidated map cache for campus: ${campusId}`)
  } else {
    // Invalidate all map caches
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
    console.log('🗑️ Invalidated all map caches')
  }
  
  // Increment cache version to force refresh
  const currentVersion = parseInt(localStorage.getItem(CACHE_VERSION_KEY) || '0')
  localStorage.setItem(CACHE_VERSION_KEY, (currentVersion + 1).toString())
}

/**
 * Get current cache version
 */
export function getCacheVersion(): number {
  return parseInt(localStorage.getItem(CACHE_VERSION_KEY) || '0')
}

/**
 * Check if cache is valid based on version
 */
export function isCacheValid(cacheVersion: number): boolean {
  return cacheVersion === getCacheVersion()
}

/**
 * Invalidate cache when admin updates these entities
 */
export function invalidateCacheOnUpdate(entityType: string, campusId?: string): void {
  const entitiesToInvalidate = [
    'building',
    'openSpace',
    'poi',
    'path',
    'boundary',
    'category',
    'emergencyContact',
    'location',
    'campus',
    'mapSettings'
  ]
  
  if (entitiesToInvalidate.includes(entityType)) {
    invalidateMapCache(campusId)
  }
}
