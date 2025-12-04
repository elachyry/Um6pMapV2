import { Route, MapPin, QrCode, Download, Navigation } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const stats = [
  { title: 'Total Routes', value: '45', icon: Route },
  { title: 'Active POIs', value: '128', icon: MapPin },
  { title: 'QR Codes Generated', value: '89', icon: QrCode },
]

const mockRoutes = [
  {
    id: 1,
    name: 'Main Entrance to Library',
    from: 'Main Gate',
    to: 'Central Library',
    distance: '450m',
    duration: '6 min',
    status: 'active',
  },
  {
    id: 2,
    name: 'Parking to Admin Building',
    from: 'Parking Lot A',
    to: 'Administration',
    distance: '320m',
    duration: '4 min',
    status: 'active',
  },
  {
    id: 3,
    name: 'Dorms to Cafeteria',
    from: 'Student Dorms',
    to: 'Main Cafeteria',
    distance: '280m',
    duration: '3 min',
    status: 'active',
  },
  {
    id: 4,
    name: 'Lab to Conference Hall',
    from: 'Research Lab',
    to: 'Conference Center',
    distance: '520m',
    duration: '7 min',
    status: 'inactive',
  },
]

export default function RouteGeneration() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Route Generation</h1>
          <p className="text-muted-foreground mt-2">
            Generate navigation links and QR codes for wayfinding
          </p>
        </div>
        <Button>
          <Navigation className="w-4 h-4 mr-2" />
          Create Route
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Route Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Route Generator</CardTitle>
          <CardDescription>Generate a route between two points of interest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Starting Point</label>
              <Input placeholder="Select location..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <Input placeholder="Select location..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Route Name</label>
              <Input placeholder="Enter name..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Input placeholder="Walking/Driving..." />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Route className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Routes</CardTitle>
          <CardDescription>Manage navigation routes and waypoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRoutes.map((route) => (
              <div
                key={route.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Route className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{route.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {route.from} → {route.to}
                      </span>
                      <span>{route.distance}</span>
                      <span>{route.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={route.status === 'active' ? 'success' : 'secondary'}>
                    {route.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <QrCode className="w-4 h-4 mr-1" />
                    QR Code
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* POI Management */}
      <Card>
        <CardHeader>
          <CardTitle>Points of Interest (POI)</CardTitle>
          <CardDescription>Manage waypoints and landmarks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {['Main Gate', 'Library', 'Cafeteria', 'Labs', 'Admin Building', 'Parking', 'Dorms', 'Sports Complex'].map(
              (poi, index) => (
                <div
                  key={index}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium">{poi}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
