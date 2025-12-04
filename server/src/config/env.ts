/**
 * Environment configuration
 * Purpose: Load and validate environment variables
 */

import dotenv from 'dotenv'

dotenv.config()

interface EnvConfig {
  NODE_ENV: string
  PORT: number
  HOST: string
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  JWT_REFRESH_EXPIRES_IN: string
  CSRF_SECRET: string
  RATE_LIMIT_MAX: number
  RATE_LIMIT_TIMEWINDOW: number
  CORS_ORIGIN: string
  MAX_FILE_SIZE: number
  UPLOAD_DIR: string
  LOG_LEVEL: string
}

export const env: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  CSRF_SECRET: process.env.CSRF_SECRET || '',
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  RATE_LIMIT_TIMEWINDOW: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '60000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
}

// Validate required env variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'CSRF_SECRET']

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}
