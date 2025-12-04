/**
 * Audit logging middleware
 * Purpose: Log important actions to audit log
 */

import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '@/config/database'
import { ActivityLevel } from '@prisma/client'

/**
 * Log request to audit log
 * Input: Request and response
 * Output: Audit log entry in database
 */
export async function auditLog(request: FastifyRequest, reply: FastifyReply) {
  const startTime = Date.now()

  reply.raw.on('finish', async () => {
    const responseTime = Date.now() - startTime
    const user = (request.user as any) || {}

    // Only log write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.userId || null,
          userEmail: user.email || null,
          action: `${request.method} ${request.url}`,
          level: getActivityLevel(request.method, reply.statusCode),
          description: `${request.method} request to ${request.url}`,
          metadata: {
            body: request.body,
            params: request.params,
            query: request.query,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          method: request.method,
          path: request.url,
          success: reply.statusCode < 400,
          responseTime,
        },
      })
    } catch (error) {
      // Silently fail - don't break the request
      console.error('Failed to create audit log:', error)
    }
  })
}

/**
 * Determine activity level based on method and status
 * Input: HTTP method and status code
 * Output: Activity level enum
 */
function getActivityLevel(method: string, statusCode: number): ActivityLevel {
  if (statusCode >= 500) return 'CRITICAL'
  if (statusCode >= 400) return 'MEDIUM'
  if (method === 'DELETE') return 'HIGH'
  if (method === 'POST' || method === 'PUT') return 'MEDIUM'
  return 'LOW'
}
