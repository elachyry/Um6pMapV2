/**
 * Backup Routes
 * Purpose: Define backup API endpoints
 */

import { FastifyInstance } from 'fastify'
import backupController from '../../controllers/backupController'

async function backupRoutes(fastify: FastifyInstance) {
  // Create backup
  fastify.post('/', backupController.createBackup.bind(backupController))
  
  // Get all backups
  fastify.get('/', backupController.getAllBackups.bind(backupController))
  
  // Get backup stats
  fastify.get('/stats', backupController.getStats.bind(backupController))
  
  // Get backup by ID
  fastify.get('/:id', backupController.getBackupById.bind(backupController))
  
  // Download backup
  fastify.get('/:id/download', backupController.downloadBackup.bind(backupController))
  
  // Restore backup
  fastify.post('/:id/restore', backupController.restoreBackup.bind(backupController))
  
  // Delete backup
  fastify.delete('/:id', backupController.deleteBackup.bind(backupController))
}

export default backupRoutes
