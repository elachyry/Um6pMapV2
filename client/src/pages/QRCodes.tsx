import { useState } from 'react'
import { QrCode, Download, RefreshCw, Play, Pause, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const mockQRCodes = [
  { id: 1, name: 'Main Entrance Check-in', event: 'Tech Conference 2024', created: '2024-11-20', scans: 234 },
  { id: 2, name: 'Building A Access', event: 'AI Symposium', created: '2024-11-18', scans: 156 },
  { id: 3, name: 'Event Registration', event: 'Student Orientation', created: '2024-11-15', scans: 489 },
  { id: 4, name: 'Workshop Check-in', event: 'Hackathon Weekend', created: '2024-11-12', scans: 203 },
]

export default function QRCodes() {
  const [isSlideshow, setIsSlideshow] = useState(false)
  const [interval, setInterval] = useState('30')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Codes</h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage QR codes for event check-ins
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Generate QR Code
          </Button>
        </div>
      </div>

      {/* Slideshow Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Slideshow Mode</CardTitle>
          <CardDescription>Display multiple QR codes in rotation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant={isSlideshow ? 'destructive' : 'default'}
              onClick={() => setIsSlideshow(!isSlideshow)}
            >
              {isSlideshow ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Slideshow
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Slideshow
                </>
              )}
            </Button>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Interval (seconds):</label>
              <Input
                type="number"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-24"
                min="5"
                max="300"
              />
            </div>
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          {isSlideshow && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-center">
                Slideshow is active. QR codes will rotate every {interval} seconds.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Codes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockQRCodes.map((qr) => (
          <Card key={qr.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{qr.name}</CardTitle>
              <CardDescription>{qr.event}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Placeholder */}
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="w-32 h-32 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{qr.created}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Scans:</span>
                  <Badge variant="secondary">{qr.scans}</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate New QR Code */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <Button variant="outline" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Generate New QR Code
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
