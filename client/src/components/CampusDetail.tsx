/**
 * CampusDetail Component
 * Purpose: Display full campus details in a modal
 * Inputs: campus data, onClose, onEdit
 * Outputs: Detailed campus view
 */

import { X, MapPin, Building2, Users, Calendar, Edit } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'

interface CampusDetailProps {
  campus: any
  onClose: () => void
  onEdit: () => void
}

export function CampusDetail({ campus, onClose, onEdit }: CampusDetailProps) {
  const coordinates = campus.coordinates ? JSON.parse(campus.coordinates) : null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <Card className="w-full max-w-3xl my-8" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{campus.name}</CardTitle>
                <Badge variant={campus.isActive ? 'success' : 'secondary'}>
                  {campus.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {campus.address || 'No address provided'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Description */}
          {campus.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{campus.description}</p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Buildings</span>
              </div>
              <p className="text-2xl font-bold">{campus._count?.buildings || 0}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Users</span>
              </div>
              <p className="text-2xl font-bold">{campus._count?.users || 0}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Created</span>
              </div>
              <p className="text-sm font-medium">
                {new Date(campus.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Updated</span>
              </div>
              <p className="text-sm font-medium">
                {new Date(campus.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Location Details */}
          <div>
            <h3 className="font-semibold mb-3">Location Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Campus Slug:</span>
                <span className="font-mono font-medium">{campus.slug}</span>
              </div>
              {coordinates && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="font-mono font-medium">
                    {coordinates.lat.toFixed(4)}°N, {coordinates.lng.toFixed(4)}°E
                  </span>
                </div>
              )}
              {campus.address && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Full Address:</span>
                  <span className="font-medium text-right max-w-md">{campus.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Map Data */}
          {campus.mapData && (
            <div>
              <h3 className="font-semibold mb-2">Map Configuration</h3>
              <div className="bg-muted p-3 rounded-md">
                <code className="text-xs text-muted-foreground break-all">
                  {JSON.stringify(JSON.parse(campus.mapData), null, 2)}
                </code>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
            <div>
              <h3 className="font-semibold mb-1">Campus ID</h3>
              <p className="text-muted-foreground font-mono text-xs">{campus.id}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Status</h3>
              <p className="text-muted-foreground">
                {campus.isActive ? 'Active and visible to users' : 'Inactive and hidden'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
