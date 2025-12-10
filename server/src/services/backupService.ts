/**
 * Backup Service
 * Purpose: Business logic for backup operations
 * Inputs: Backup requests
 * Outputs: Processed backup data
 */

import backupRepository, { BackupRecord } from '../repositories/backupRepository'

class BackupService {
  /**
   * Create backup
   * Purpose: Create new database backup
   * Inputs: backup type
   * Outputs: backup record
   */
  async createBackup(type: 'manual' | 'automatic' = 'manual'): Promise<BackupRecord> {
    return backupRepository.createBackup(type)
  }

  /**
   * Get all backups
   * Purpose: Fetch paginated backups
   * Inputs: page and limit
   * Outputs: backup list with total
   */
  async getAllBackups(page: number, limit: number) {
    return backupRepository.findAll(page, limit)
  }

  /**
   * Get backup by ID
   * Purpose: Fetch single backup
   * Inputs: backup ID
   * Outputs: backup record
   */
  async getBackupById(id: string) {
    return backupRepository.findById(id)
  }

  /**
   * Delete backup
   * Purpose: Remove backup
   * Inputs: backup ID
   * Outputs: success boolean
   */
  async deleteBackup(id: string): Promise<boolean> {
    return backupRepository.deleteBackup(id)
  }

  /**
   * Restore backup
   * Purpose: Restore database from backup
   * Inputs: backup ID
   * Outputs: success boolean
   */
  async restoreBackup(id: string): Promise<boolean> {
    return backupRepository.restoreBackup(id)
  }

  /**
   * Get backup statistics
   * Purpose: Get backup stats
   * Inputs: none
   * Outputs: stats object
   */
  async getStats() {
    return backupRepository.getStats()
  }
}

export default new BackupService()
