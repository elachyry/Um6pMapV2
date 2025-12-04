import { Database, Download, Upload, Trash2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const mockBackups = [
  { id: 1, name: 'backup_2024_11_24.sql', size: '245 MB', date: '2024-11-24 09:30 AM', type: 'Manual' },
  { id: 2, name: 'backup_2024_11_23.sql', size: '243 MB', date: '2024-11-23 09:30 AM', type: 'Automatic' },
  { id: 3, name: 'backup_2024_11_22.sql', size: '240 MB', date: '2024-11-22 09:30 AM', type: 'Automatic' },
  { id: 4, name: 'backup_2024_11_21.sql', size: '238 MB', date: '2024-11-21 09:30 AM', type: 'Automatic' },
]

export default function DatabaseBackup() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Backup</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage database backups
          </p>
        </div>
        <Button>
          <Database className="w-4 h-4 mr-2" />
          Create Backup
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">24</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">5.8 GB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Last Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">2h ago</p>
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
          <div className="space-y-3">
            {mockBackups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Database className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">{backup.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {backup.size} • {backup.date}
                    </p>
                  </div>
                  <Badge variant={backup.type === 'Manual' ? 'default' : 'secondary'}>
                    {backup.type}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-1" />
                    Restore
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
