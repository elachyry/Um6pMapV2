/**
 * Cache API
 * Purpose: Trigger cache invalidation via WebSocket
 */

import { apiClient } from './client'

/**
 * Trigger cache invalidation broadcast via WebSocket
 * Purpose: Notify all connected clients to invalidate their cache
 */
export async function broadcastCacheInvalidation(entityType: string, campusId?: string): Promise<void> {
  try {
    console.log('📡 Calling cache invalidation API:', { entityType, campusId })
    const response = await apiClient.post('/v1/cache/invalidate', {
      entityType,
      campusId
    })
    console.log('✅ Cache invalidation API response:', (response as any).data)
  } catch (error: any) {
    console.error('❌ Failed to broadcast cache invalidation:', error.response?.data || error.message)
    // Don't throw - cache invalidation failure shouldn't break the app
  }
}
