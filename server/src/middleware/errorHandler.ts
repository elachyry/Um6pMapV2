/**
 * Error handler middleware
 * Purpose: Centralized error handling for all routes
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '@/utils/errors'
import { logger } from '@/utils/logger'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

/**
 * Global error handler
 * Input: Error object, request, reply
 * Output: Formatted error response
 */
export async function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error
  logger.error('Request error', {
    url: request.url,
    method: request.method,
    error: error.message,
    stack: error.stack,
  })

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors,
    })
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Resource already exists',
      })
    }
    if (error.code === 'P2025') {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Resource not found',
      })
    }
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.name,
      message: error.message,
    })
  }

  // Handle Fastify errors
  if ('statusCode' in error) {
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name,
      message: error.message,
    })
  }

  // Default to 500
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  })
}
