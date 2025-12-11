/**
 * Backup Repository
 * Purpose: Handle database backup operations
 * Inputs: Backup data and queries
 * Outputs: Backup records
 */

import * as fs from 'fs'
import * as path from 'path'




export interface BackupRecord {
  id: string
  filename: string
  filepath: string
  size: number
  type: 'manual' | 'automatic'
  createdAt: Date
}

const BACKUP_DIR = path.join(process.cwd(), 'backups')

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

class BackupRepository {
  /**
   * Create a new backup
   * Purpose: Create SQLite database backup
   * Inputs: backup type
   * Outputs: backup record
   */
  async createBackup(type: 'manual' | 'automatic' = 'manual'): Promise<BackupRecord> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const time = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]
    const filename = `backup_${timestamp}_${time}.db`
    const filepath = path.join(BACKUP_DIR, filename)
    
    // Get source database path
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    // Copy database file
    fs.copyFileSync(dbPath, filepath)
    
    // Get file size
    const stats = fs.statSync(filepath)
    
    const backup: BackupRecord = {
      id: `${Date.now()}`,
      filename,
      filepath,
      size: stats.size,
      type,
      createdAt: new Date()
    }
    
    // Save backup metadata to a JSON file
    await this.saveBackupMetadata(backup)
    
    return backup
  }

  /**
   * Get all backups
   * Purpose: List all available backups
   * Inputs: pagination params
   * Outputs: backup list
   */
  async findAll(page: number = 1, limit: number = 10): Promise<{ data: BackupRecord[], total: number }> {
    const metadataPath = path.join(BACKUP_DIR, 'metadata.json')
    
    let backups: BackupRecord[] = []
    
    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, 'utf-8')
      backups = JSON.parse(data)
    }
    
    // Sort by date descending
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    const total = backups.length
    const start = (page - 1) * limit
    const end = start + limit
    
    return {
      data: backups.slice(start, end),
      total
    }
  }

  /**
   * Get backup by ID
   * Purpose: Get single backup details
   * Inputs: backup ID
   * Outputs: backup record
   */
  async findById(id: string): Promise<BackupRecord | null> {
    const metadataPath = path.join(BACKUP_DIR, 'metadata.json')
    
    if (!fs.existsSync(metadataPath)) {
      return null
    }
    
    const data = fs.readFileSync(metadataPath, 'utf-8')
    const backups: BackupRecord[] = JSON.parse(data)
    
    return backups.find(b => b.id === id) || null
  }

  /**
   * Delete backup
   * Purpose: Remove backup file and metadata
   * Inputs: backup ID
   * Outputs: success boolean
   */
  async deleteBackup(id: string): Promise<boolean> {
    const backup = await this.findById(id)
    
    if (!backup) {
      return false
    }
    
    // Delete file
    if (fs.existsSync(backup.filepath)) {
      fs.unlinkSync(backup.filepath)
    }
    
    // Update metadata
    const metadataPath = path.join(BACKUP_DIR, 'metadata.json')
    const data = fs.readFileSync(metadataPath, 'utf-8')
    const backups: BackupRecord[] = JSON.parse(data)
    
    const filtered = backups.filter(b => b.id !== id)
    fs.writeFileSync(metadataPath, JSON.stringify(filtered, null, 2))
    
    return true
  }

  /**
   * Restore backup
   * Purpose: Restore database from backup
   * Inputs: backup ID
   * Outputs: success boolean
   */
  async restoreBackup(id: string): Promise<boolean> {
    const backup = await this.findById(id)
    
    if (!backup || !fs.existsSync(backup.filepath)) {
      return false
    }
    
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    // Create a backup of current database before restoring
    const currentBackupPath = path.join(BACKUP_DIR, `pre-restore-${Date.now()}.db`)
    fs.copyFileSync(dbPath, currentBackupPath)
    
    // Restore from backup
    fs.copyFileSync(backup.filepath, dbPath)
    
    return true
  }

  /**
   * Get backup statistics
   * Purpose: Get total size and count
   * Inputs: none
   * Outputs: stats object
   */
  async getStats(): Promise<{ totalBackups: number, totalSize: number, lastBackup: Date | null }> {
    const { data, total } = await this.findAll(1, 1000)
    
    const totalSize = data.reduce((sum, backup) => sum + backup.size, 0)
    const lastBackup = data.length > 0 ? new Date(data[0].createdAt) : null
    
    return {
      totalBackups: total,
      totalSize,
      lastBackup
    }
  }

  /**
   * Save backup metadata
   * Purpose: Store backup info in JSON file
   * Inputs: backup record
   * Outputs: none
   */
  private async saveBackupMetadata(backup: BackupRecord): Promise<void> {
    const metadataPath = path.join(BACKUP_DIR, 'metadata.json')
    
    let backups: BackupRecord[] = []
    
    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, 'utf-8')
      backups = JSON.parse(data)
    }
    
    backups.push(backup)
    fs.writeFileSync(metadataPath, JSON.stringify(backups, null, 2))
  }
}

export default new BackupRepository()
