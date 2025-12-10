/**
 * Cache Service
 * Purpose: Handle caching of large assets (GLB files, images, documents) using IndexedDB
 * Uses localforage for easy IndexedDB management
 */

import localforage from 'localforage'

// Configure localforage instances for different asset types
const glbCache = localforage.createInstance({
  name: 'um6p-map',
  storeName: 'glb-models',
  description: '3D model files cache'
})

const imageCache = localforage.createInstance({
  name: 'um6p-map',
  storeName: 'images',
  description: 'Image files cache'
})

const documentCache = localforage.createInstance({
  name: 'um6p-map',
  storeName: 'documents',
  description: 'Document files cache'
})

export interface CachedAsset {
  data: Blob
  url: string
  timestamp: number
  size: number
}

class CacheService {
  // Cache expiry time (7 days)
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000

  /**
   * Get GLB model from cache or fetch and cache it
   * Purpose: Cache 3D models for buildings
   * Inputs: URL of the GLB file
   * Outputs: Blob of the GLB file
   */
  async getGLBModel(url: string): Promise<Blob> {
    try {
      // Try to get from cache
      const cached = await glbCache.getItem<CachedAsset>(url)
      
      if (cached && this.isValid(cached.timestamp)) {
        console.log('✓ GLB model loaded from cache:', url)
        return cached.data
      }

      // Fetch from network
      console.log('↓ Fetching GLB model:', url)
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch GLB: ${response.statusText}`)
      
      const blob = await response.blob()
      
      // Cache it
      await glbCache.setItem(url, {
        data: blob,
        url,
        timestamp: Date.now(),
        size: blob.size
      })
      
      return blob
    } catch (error) {
      console.error('Failed to get GLB model:', error)
      throw error
    }
  }

  /**
   * Get image from cache or fetch and cache it
   * Purpose: Cache building images, POI images, etc.
   * Inputs: URL of the image
   * Outputs: Blob of the image
   */
  async getImage(url: string): Promise<Blob> {
    try {
      const cached = await imageCache.getItem<CachedAsset>(url)
      
      if (cached && this.isValid(cached.timestamp)) {
        console.log('✓ Image loaded from cache:', url)
        return cached.data
      }

      console.log('↓ Fetching image:', url)
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
      
      const blob = await response.blob()
      
      await imageCache.setItem(url, {
        data: blob,
        url,
        timestamp: Date.now(),
        size: blob.size
      })
      
      return blob
    } catch (error) {
      console.error('Failed to get image:', error)
      throw error
    }
  }

  /**
   * Get document from cache or fetch and cache it
   * Purpose: Cache PDF documents, floor plans, etc.
   * Inputs: URL of the document
   * Outputs: Blob of the document
   */
  async getDocument(url: string): Promise<Blob> {
    try {
      const cached = await documentCache.getItem<CachedAsset>(url)
      
      if (cached && this.isValid(cached.timestamp)) {
        console.log('✓ Document loaded from cache:', url)
        return cached.data
      }

      console.log('↓ Fetching document:', url)
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch document: ${response.statusText}`)
      
      const blob = await response.blob()
      
      await documentCache.setItem(url, {
        data: blob,
        url,
        timestamp: Date.now(),
        size: blob.size
      })
      
      return blob
    } catch (error) {
      console.error('Failed to get document:', error)
      throw error
    }
  }

  /**
   * Check if cached item is still valid
   * Purpose: Determine if cache should be refreshed
   * Inputs: Timestamp of cached item
   * Outputs: Boolean indicating validity
   */
  private isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_EXPIRY
  }

  /**
   * Clear all caches
   * Purpose: Free up storage space
   * Inputs: None
   * Outputs: None
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      glbCache.clear(),
      imageCache.clear(),
      documentCache.clear()
    ])
    console.log('✓ All caches cleared')
  }

  /**
   * Get cache statistics
   * Purpose: Monitor cache usage
   * Inputs: None
   * Outputs: Cache statistics
   */
  async getStats() {
    const [glbKeys, imageKeys, docKeys] = await Promise.all([
      glbCache.keys(),
      imageCache.keys(),
      documentCache.keys()
    ])

    return {
      glbModels: glbKeys.length,
      images: imageKeys.length,
      documents: docKeys.length,
      total: glbKeys.length + imageKeys.length + docKeys.length
    }
  }

  /**
   * Preload assets for offline use
   * Purpose: Download and cache assets in advance
   * Inputs: Array of asset URLs with types
   * Outputs: Promise that resolves when all assets are cached
   */
  async preloadAssets(assets: Array<{ url: string; type: 'glb' | 'image' | 'document' }>): Promise<void> {
    console.log(`⏳ Preloading ${assets.length} assets...`)
    
    const promises = assets.map(async ({ url, type }) => {
      try {
        switch (type) {
          case 'glb':
            await this.getGLBModel(url)
            break
          case 'image':
            await this.getImage(url)
            break
          case 'document':
            await this.getDocument(url)
            break
        }
      } catch (error) {
        console.warn(`Failed to preload ${type}:`, url, error)
      }
    })

    await Promise.all(promises)
    console.log('✓ Assets preloaded')
  }
}

export const cacheService = new CacheService()
