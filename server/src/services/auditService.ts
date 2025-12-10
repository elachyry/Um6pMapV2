/**
 * Audit Service
 * Purpose: Log user actions and system events for audit trail
 * Inputs: Action details, user info, request context
 * Outputs: Audit log entries
 */

import { prisma } from '@/config/database'
import type { FastifyRequest } from 'fastify'

export interface AuditLogData {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  method?: string
  endpoint?: string
  ip?: string
  userAgent?: string
  changes?: any
  metadata?: any
  level?: 'info' | 'warning' | 'error'
}

export class AuditService {
  /**
   * Create audit log entry
   * Purpose: Record user action for audit trail
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          method: data.method,
          endpoint: data.endpoint,
          ip: data.ip,
          userAgent: data.userAgent,
          changes: data.changes ? JSON.stringify(data.changes) : null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          level: data.level || 'info',
        },
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Log user login
   */
  async logLogin(userId: string, request?: FastifyRequest, success: boolean = true): Promise<void> {
    await this.log({
      userId,
      action: success ? 'login' : 'login_failed',
      resource: 'auth',
      method: 'POST',
      endpoint: '/api/auth/login',
      ip: this.getIp(request),
      userAgent: this.getUserAgent(request),
      level: success ? 'info' : 'warning',
    })
  }

  /**
   * Log user logout
   */
  async logLogout(userId: string, request?: FastifyRequest): Promise<void> {
    await this.log({
      userId,
      action: 'logout',
      resource: 'auth',
      method: 'POST',
      endpoint: '/api/auth/logout',
      ip: this.getIp(request),
      userAgent: this.getUserAgent(request),
    })
  }

  /**
   * Log user signup
   */
  async logSignup(userId: string, email: string, request?: FastifyRequest): Promise<void> {
    await this.log({
      userId,
      action: 'signup',
      resource: 'user',
      resourceId: userId,
      method: 'POST',
      endpoint: '/api/auth/signup',
      ip: this.getIp(request),
      userAgent: this.getUserAgent(request),
      metadata: { email },
    })
  }

  /**
   * Log user creation by admin
   */
  async logUserCreated(adminId: string, newUserId: string, userData: any, request?: FastifyRequest): Promise<void> {
    await this.log({
      userId: adminId,
      action: 'create',
      resource: 'user',
      resourceId: newUserId,
      method: 'POST',
      endpoint: '/api/users',
      ip: this.getIp(request),
      userAgent: this.getUserAgent(request),
      changes: { after: userData },
      metadata: { createdBy: adminId },
    })
  }

  /**
   * Log user update
   */
  async logUserUpdated(adminId: string, userId: string, before: any, after: any, request?: FastifyRequest): Promise<void> {
    await this.log({
      userId: adminId,
      action: 'update',
      resource: 'user',
      resourceId: userId,
      method: 'PUT',
      endpoint: `/api/users/${userId}`,
      ip: this.getIp(request),
      userAgent: this.getUserAgent(request),
      changes: { before, after },
      metadata: { updatedBy: adminId },
    })
  }

  /**
   * Log user deletion
   */
  async logUserDeleted(adminId: string, userId: string, userData: any, request?: FastifyRequest): Promise<void> {
    await this.log({
      userId: adminId,
      action: 'delete',
      resource: 'user',
      resourceId: userId,
      method: 'DELETE',
      endpoint: `/api/users/${userId}`,
      ip: this.getIp(request),
      userAgent: this.getUserAgent(request),
      changes: { before: userData },
      metadata: { deletedBy: adminId },
      level: 'warning',
    })
  }

  /**
   * Log password change
   */
  async logPasswordChange(userId: string, request?: FastifyRequest): Promise<void> {
    await this.log({
      userId,
      action: 'password_change',
      resource: 'user',
      resourceId: userId,
      method: 'POST',
      endpoint: '/api/auth/change-password',
      ip: this.getIp(request),
      userAgent: this.getUserAgent(request),
      level: 'info',
    })
  }

  /**
   * Log password reset
   */
  async logPasswordReset(adminId: string, userId: string, request?: FastifyRequest): Promise<void> {
    await this.log({
      userId: adminId,
      action: 'password_reset',
      resource: 'user',
      resourceId: userId,
      method: 'POST',
      endpoint: `/api/users/${userId}/reset-password`,
      ip: this.getIp(request),
      userAgent: this.getUserAgent(request),
      metadata: { resetBy: adminId },
      level: 'warning',
    })
  }

  /**
   * Log email verification
   */
  async logEmailVerified(userId: string, email: string, request?: FastifyRequest): Promise<void> {
    await this.log({
      userId,
      action: 'email_verified',
      resource: 'user',
      resourceId: userId,
      method: 'POST',
      endpoint: '/api/auth/verify-email',
      ip: this.getIp(request),
      userAgent: this.getUserAgent(request),
      metadata: { email },
    })
  }

  /**
   * Log user status change
   */
  async logStatusChange(adminId: string, userId: string, oldStatus: string, newStatus: string, request?: FastifyRequest): Promise<void> {
    await this.log({
      userId: adminId,
      action: 'status_change',
      resource: 'user',
      resourceId: userId,
      method: 'POST',
      endpoint: `/api/users/${userId}/toggle-status`,
      ip: this.getIp(request),
      userAgent: this.getUserAgent(request),
      changes: { before: { status: oldStatus }, after: { status: newStatus } },
      metadata: { changedBy: adminId },
      level: newStatus === 'INACTIVE' ? 'warning' : 'info',
    })
  }

  /**
   * Extract IP address from request
   */
  private getIp(request?: FastifyRequest): string | undefined {
    if (!request) return undefined
    return (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           (request.headers['x-real-ip'] as string) ||
           request.ip
  }

  /**
   * Extract user agent from request
   */
  private getUserAgent(request?: FastifyRequest): string | undefined {
    if (!request) return undefined
    return request.headers['user-agent']
  }
}

export const auditService = new AuditService()
