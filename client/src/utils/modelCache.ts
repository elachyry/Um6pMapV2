/**
 * Model Cache Utilities
 * Purpose: Cache 3D models to avoid repeated downloads
 */

import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface ModelCacheEntry {
  model: GLTF
  timestamp: number
  url: string
}

class ModelCache {
  private cache: Map<string, ModelCacheEntry> = new Map()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  /**
   * Get cached model by ID
   * Inputs: modelId - unique identifier for the model
   * Outputs: GLTF model or null if not cached or expired
   */
  get(modelId: string): GLTF | null {
    const entry = this.cache.get(modelId)
    
    if (!entry) {
      return null
    }

    // Check if cache is expired
    const now = Date.now()
    if (now - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(modelId)
      return null
    }

    return entry.model
  }

  /**
   * Store model in cache
   * Inputs: modelId, model GLTF, and URL
   * Outputs: none
   */
  set(modelId: string, model: GLTF, url: string): void {
    this.cache.set(modelId, {
      model,
      timestamp: Date.now(),
      url
    })
  }

  /**
   * Check if model is cached
   * Inputs: modelId
   * Outputs: boolean indicating if model exists in cache
   */
  has(modelId: string): boolean {
    return this.get(modelId) !== null
  }

  /**
   * Clear specific model from cache
   * Inputs: modelId
   * Outputs: none
   */
  delete(modelId: string): void {
    this.cache.delete(modelId)
  }

  /**
   * Clear all cached models
   * Inputs: none
   * Outputs: none
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   * Inputs: none
   * Outputs: object with cache size and entries
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const modelCache = new ModelCache()
