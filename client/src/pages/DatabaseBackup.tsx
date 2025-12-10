import { useState, useEffect } from 'react'
import { Database, Download, Upload, Trash2, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/useToast'
import {
  createBackup,
  getAllBackups,
  getBackupStats,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  Backup,
  BackupStats
} from '@/api/backupApi'

export default function DatabaseBackup() {
  const { showToast } = useToast()
  const [backups, setBackups] = useState<Backup[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  // Load backups and stats
  useEffect(() => {
    loadBackups()
    loadStats()
  }, [page])

  const loadBackups = async () => {
    try {
      setLoading(true)
      const response: any = await getAllBackups(page, limit)
      setBackups(response.data)
      setTotalPages(response.pagination.totalPages)
    } catch (error) {
      showToast('Failed to load backups', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response: any = await getBackupStats()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleCreateBackup = async () => {
    try {
      setLoading(true)
      await createBackup('manual')
      showToast('Backup created successfully', 'success')
      loadBackups()
      loadStats()
    } catch (error) {
      showToast('Failed to create backup', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (backup: Backup) => {
    try {
      await downloadBackup(backup.id, backup.filename)
      showToast('Backup downloaded', 'success')
    } catch (error) {
      showToast('Failed to download backup', 'error')
    }
  }

  const handleRestore = async (backup: Backup) => {
    if (!confirm(`Are you sure you want to restore from ${backup.filename}? This will replace the current database.`)) {
      return
    }

    try {
      setLoading(true)
      await restoreBackup(backup.id)
      showToast('Database restored successfully. Please restart the server.', 'success')
    } catch (error) {
      showToast('Failed to restore backup', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (backup: Backup) => {
    if (!confirm(`Are you sure you want to delete ${backup.filename}?`)) {
      return
    }

    try {
      setLoading(true)
      await deleteBackup(backup.id)
      showToast('Backup deleted successfully', 'success')
      loadBackups()
      loadStats()
    } catch (error) {
      showToast('Failed to delete backup', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Backup</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage database backups
          </p>
        </div>
        <Button onClick={handleCreateBackup} disabled={loading}>
          <Database className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Backup'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalBackups || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats ? formatBytes(stats.totalSize) : '0 Bytes'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Last Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{getTimeAgo(stats?.lastBackup || null)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automatic Backup Schedule</CardTitle>
          <CardDescription>Configure automated backup settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <h3 className="font-semibold mb-1">Daily Backup</h3>
                <p className="text-sm text-muted-foreground">Every day at 9:30 AM</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Configure Schedule</Button>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>View and manage existing backups</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No backups found</p>
              <p className="text-sm">Create your first backup to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Database className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{backup.filename}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(backup.size)} • {formatDate(backup.createdAt)}
                        </p>
                      </div>
                      <Badge variant={backup.type === 'manual' ? 'default' : 'secondary'}>
                        {backup.type}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(backup)}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRestore(backup)}>
                        <Upload className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(backup)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
