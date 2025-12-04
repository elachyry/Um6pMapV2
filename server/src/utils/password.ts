/**
 * Password utilities
 * Purpose: Hash and verify passwords
 */

import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

/**
 * Hash a plain text password
 * Input: Plain text password string
 * Output: Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 * Input: Plain text password and hashed password
 * Output: Boolean indicating if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
