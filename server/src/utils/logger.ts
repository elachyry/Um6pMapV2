/**
 * Logger Utility
 * Purpose: Centralized logging with Pino
 */

import pino from 'pino'
import { env } from '@/config/env'

export const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  } : undefined,
})
