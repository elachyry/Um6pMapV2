import { useState, useEffect } from 'react'
import { Database, Download, Upload, Trash2, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
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
  const [restoreDialog, setRestoreDialog] = useState<{ isOpen: boolean; backup: Backup | null }>({ isOpen: false, backup: null })
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; backup: Backup | null }>({ isOpen: false, backup: null })
  const [scheduleDialog, setScheduleDialog] = useState(false)
  const [scheduleEnabled, setScheduleEnabled] = useState(true)
  const [scheduleFrequency, setScheduleFrequency] = useState<1 | 2 | 3>(1)
  const [scheduleTime, setScheduleTime] = useState('09:30')
  const [scheduleTime2, setScheduleTime2] = useState('15:00')
  const [scheduleTime3, setScheduleTime3] = useState('21:00')
  const limit = 10

  // Load schedule settings from localStorage
  useEffect(() => {
    const savedSchedule = localStorage.getItem('backupSchedule')
    if (savedSchedule) {
      const schedule = JSON.parse(savedSchedule)
      setScheduleEnabled(schedule.enabled)
      setScheduleFrequency(schedule.frequency || 1)
      setScheduleTime(schedule.time)
      setScheduleTime2(schedule.time2 || '15:00')
      setScheduleTime3(schedule.time3 || '21:00')
    }
  }, [])

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

  const handleRestoreClick = (backup: Backup) => {
    setRestoreDialog({ isOpen: true, backup })
  }

  const handleRestoreConfirm = async () => {
    if (!restoreDialog.backup) return

    try {
      setLoading(true)
      await restoreBackup(restoreDialog.backup.id)
      showToast('Database restored successfully. Please restart the server.', 'success')
      setRestoreDialog({ isOpen: false, backup: null })
    } catch (error) {
      showToast('Failed to restore backup', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (backup: Backup) => {
    setDeleteDialog({ isOpen: true, backup })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.backup) return

    try {
      setLoading(true)
      await deleteBackup(deleteDialog.backup.id)
      showToast('Backup deleted successfully', 'success')
      setDeleteDialog({ isOpen: false, backup: null })
      loadBackups()
      loadStats()
    } catch (error) {
      showToast('Failed to delete backup', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRunNow = async () => {
    try {
      setLoading(true)
      await createBackup('automatic')
      showToast('Automatic backup created successfully', 'success')
      loadBackups()
      loadStats()
    } catch (error) {
      showToast('Failed to create automatic backup', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSchedule = () => {
    // Save schedule settings to localStorage or backend
    localStorage.setItem('backupSchedule', JSON.stringify({
      enabled: scheduleEnabled,
      frequency: scheduleFrequency,
      time: scheduleTime,
      time2: scheduleTime2,
      time3: scheduleTime3
    }))
    showToast('Schedule settings saved', 'success')
    setScheduleDialog(false)
  }

  const getScheduleDescription = () => {
    if (!scheduleEnabled) return 'Disabled'
    if (scheduleFrequency === 1) return `Once daily at ${scheduleTime}`
    if (scheduleFrequency === 2) return `Twice daily at ${scheduleTime} and ${scheduleTime2}`
    return `3 times daily at ${scheduleTime}, ${scheduleTime2}, and ${scheduleTime3}`
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
                <h3 className="font-semibold mb-1">Automatic Backup Schedule</h3>
                <p className="text-sm text-muted-foreground">{getScheduleDescription()}</p>
              </div>
              <Badge variant={scheduleEnabled ? 'success' : 'secondary'}>
                {scheduleEnabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setScheduleDialog(true)}>
                Configure Schedule
              </Button>
              <Button variant="outline" onClick={handleRunNow} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {loading ? 'Running...' : 'Run Now'}
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
                      <Button variant="outline" size="sm" onClick={() => handleRestoreClick(backup)}>
                        <Upload className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(backup)}>
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

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={restoreDialog.isOpen}
        title="Restore Database"
        message={`Are you sure you want to restore from ${restoreDialog.backup?.filename}? This will replace the current database. A backup of the current state will be created automatically.`}
        confirmText="Restore"
        cancelText="Cancel"
        variant="warning"
        isLoading={loading}
        onConfirm={handleRestoreConfirm}
        onCancel={() => setRestoreDialog({ isOpen: false, backup: null })}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Backup"
        message={`Are you sure you want to delete ${deleteDialog.backup?.filename}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, backup: null })}
      />

      {/* Schedule Configuration Dialog */}
      {scheduleDialog && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setScheduleDialog(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Configure Backup Schedule</CardTitle>
              <CardDescription>Set up automatic daily backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Automatic Backups</label>
                <Button
                  variant={scheduleEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScheduleEnabled(!scheduleEnabled)}
                >
                  {scheduleEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              
              {scheduleEnabled && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Backup Frequency</label>
                    <div className="flex gap-2">
                      <Button
                        variant={scheduleFrequency === 1 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScheduleFrequency(1)}
                        className="flex-1"
                      >
                        Once Daily
                      </Button>
                      <Button
                        variant={scheduleFrequency === 2 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScheduleFrequency(2)}
                        className="flex-1"
                      >
                        Twice Daily
                      </Button>
                      <Button
                        variant={scheduleFrequency === 3 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScheduleFrequency(3)}
                        className="flex-1"
                      >
                        3 Times Daily
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">First Backup Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      />
                    </div>

                    {scheduleFrequency >= 2 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Second Backup Time</label>
                        <input
                          type="time"
                          value={scheduleTime2}
                          onChange={(e) => setScheduleTime2(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        />
                      </div>
                    )}

                    {scheduleFrequency === 3 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Third Backup Time</label>
                        <input
                          type="time"
                          value={scheduleTime3}
                          onChange={(e) => setScheduleTime3(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        />
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {getScheduleDescription()}
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setScheduleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSchedule}>
                  Save Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
