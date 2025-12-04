/**
 * JWT utilities
 * Purpose: Generate and verify JWT tokens
 */

import { env } from '@/config/env'

interface JWTPayload {
  userId: string
  email: string
  userType: string
}

/**
 * Generate JWT token
 * Input: User payload (userId, email, userType)
 * Output: JWT token string
 */
export function generateToken(_payload: JWTPayload): string {
  // Will be implemented with @fastify/jwt in the app instance
  // This is a placeholder for type safety
  return ''
}

/**
 * Verify JWT token
 * Input: JWT token string
 * Output: Decoded payload
 */
export function verifyToken(_token: string): JWTPayload {
  // Will be implemented with @fastify/jwt in the app instance
  // This is a placeholder for type safety
  return {} as JWTPayload
}

export function getTokenExpiry(type: 'access' | 'refresh' = 'access'): string {
  return type === 'access' ? env.JWT_EXPIRES_IN : env.JWT_REFRESH_EXPIRES_IN
}
