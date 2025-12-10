/**
 * Backup Controller
 * Purpose: Handle HTTP requests for backup operations
 * Inputs: HTTP requests
 * Outputs: HTTP responses
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import backupService from '../services/backupService'
import * as fs from 'fs'

class BackupController {
  /**
   * Create backup
   * Purpose: Create new database backup
   */
  async createBackup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { type } = request.body as { type?: 'manual' | 'automatic' }
      
      const backup = await backupService.createBackup(type || 'manual')
      
      return reply.code(201).send({
        success: true,
        data: backup,
        message: 'Backup created successfully'
      })
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to create backup'
      })
    }
  }

  /**
   * Get all backups
   * Purpose: Fetch paginated backups
   */
  async getAllBackups(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { page = 1, limit = 10 } = request.query as { page?: number, limit?: number }
      
      const result = await backupService.getAllBackups(Number(page), Number(limit))
      
      return reply.code(200).send({
        success: true,
        data: result.data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit))
        }
      })
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch backups'
      })
    }
  }

  /**
   * Get backup by ID
   * Purpose: Fetch single backup
   */
  async getBackupById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      
      const backup = await backupService.getBackupById(id)
      
      if (!backup) {
        return reply.code(404).send({
          success: false,
          error: 'Backup not found'
        })
      }
      
      return reply.code(200).send({
        success: true,
        data: backup
      })
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch backup'
      })
    }
  }

  /**
   * Download backup
   * Purpose: Download backup file
   */
  async downloadBackup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      
      const backup = await backupService.getBackupById(id)
      
      if (!backup || !fs.existsSync(backup.filepath)) {
        return reply.code(404).send({
          success: false,
          error: 'Backup file not found'
        })
      }
      
      const stream = fs.createReadStream(backup.filepath)
      
      reply.header('Content-Disposition', `attachment; filename="${backup.filename}"`)
      reply.header('Content-Type', 'application/octet-stream')
      reply.send(stream)
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to download backup'
      })
    }
  }

  /**
   * Delete backup
   * Purpose: Remove backup
   */
  async deleteBackup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      
      const success = await backupService.deleteBackup(id)
      
      if (!success) {
        return reply.code(404).send({
          success: false,
          error: 'Backup not found'
        })
      }
      
      return reply.code(200).send({
        success: true,
        message: 'Backup deleted successfully'
      })
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to delete backup'
      })
    }
  }

  /**
   * Restore backup
   * Purpose: Restore database from backup
   */
  async restoreBackup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      
      const success = await backupService.restoreBackup(id)
      
      if (!success) {
        return reply.code(404).send({
          success: false,
          error: 'Backup not found or restore failed'
        })
      }
      
      return reply.code(200).send({
        success: true,
        message: 'Database restored successfully. Please restart the server.'
      })
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to restore backup'
      })
    }
  }

  /**
   * Get backup statistics
   * Purpose: Get backup stats
   */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await backupService.getStats()
      
      return reply.code(200).send({
        success: true,
        data: stats
      })
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch stats'
      })
    }
  }
}

export default new BackupController()
