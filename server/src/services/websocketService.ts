/**
 * WebSocket Service
 * Purpose: Manage WebSocket connections and broadcast events
 */

import { logger } from '@/utils/logger'

// Store active WebSocket connections
const connections = new Set<any>()

/**
 * Register a new WebSocket connection
 */
export function registerConnection(socket: any): void {
  connections.add(socket)
  logger.info(`WebSocket registered. Total connections: ${connections.size}`)
  
  // Remove on close
  socket.on('close', () => {
    connections.delete(socket)
    logger.info(`WebSocket removed. Total connections: ${connections.size}`)
  })
}

/**
 * Broadcast message to all connected clients
 */
export function broadcast(message: any): void {
  const payload = JSON.stringify(message)
  let sentCount = 0
  
  connections.forEach((socket) => {
    if (socket.readyState === 1) { // 1 = OPEN
      socket.send(payload)
      sentCount++
    }
  })
  
  logger.info(`Broadcast sent to ${sentCount} clients:`, message.type)
}

/**
 * Broadcast cache invalidation event
 * Purpose: Notify all clients to invalidate their map cache
 */
export function broadcastCacheInvalidation(entityType: string, campusId?: string): void {
  broadcast({
    type: 'cache_invalidate',
    entityType,
    campusId,
    timestamp: new Date().toISOString()
  })
  
  logger.info(`🔄 Cache invalidation broadcast: ${entityType}${campusId ? ` (campus: ${campusId})` : ''}`)
}

/**
 * Get number of active connections
 */
export function getConnectionCount(): number {
  return connections.size
}
