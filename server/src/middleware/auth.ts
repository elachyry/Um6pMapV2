/**
 * Authentication middleware
 * Purpose: Verify JWT tokens and protect routes
 */

import { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError, ForbiddenError } from '@/utils/errors'
import { UserType } from '@prisma/client'

/**
 * Authenticate user from JWT token
 * Input: Request with Authorization header
 * Output: Adds user to request object or throws error
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

/**
 * Authorize user based on roles
 * Input: Allowed user types
 * Output: Middleware function that checks user type
 */
export function authorize(...allowedTypes: UserType[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any

    if (!user) {
      throw new UnauthorizedError('Authentication required')
    }

    if (allowedTypes.length && !allowedTypes.includes(user.userType)) {
      throw new ForbiddenError('Insufficient permissions')
    }
  }
}

/**
 * Optional authentication - doesn't throw if no token
 * Input: Request
 * Output: Adds user to request if token is valid
 */
export async function optionalAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (error) {
    // Silently fail - user will be undefined
  }
}
