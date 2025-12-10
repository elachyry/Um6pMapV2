/**
 * User Routes
 * Purpose: Define user management endpoints
 */

import { FastifyInstance } from 'fastify'
import * as userController from '../controllers/userController'

export default async function userRoutes(fastify: FastifyInstance) {
  // Get all users
  fastify.get('/', userController.getAllUsers)
  
  // Get user by ID
  fastify.get('/:id', userController.getUserById)
  
  // Create user
  fastify.post('/', userController.createUser)
  
  // Update user
  fastify.put('/:id', userController.updateUser)
  
  // Delete user
  fastify.delete('/:id', userController.deleteUser)
  
  // Toggle user status
  fastify.patch('/:id/toggle-status', userController.toggleUserStatus)
  
  // Update password
  fastify.patch('/:id/password', userController.updatePassword)
  
  // Reset password
  fastify.post('/:id/reset-password', userController.resetPassword)
  
  // Get user audit logs
  fastify.get('/:id/audit-logs', userController.getUserAuditLogs)
  
  // Bulk import users
  fastify.post('/bulk-import', userController.bulkImport)
  
  // Bulk import temporary users with session dates
  fastify.post('/bulk-import-temporary', userController.bulkImportTemporary)
}
