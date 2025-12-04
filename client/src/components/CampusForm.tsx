/**
 * CampusForm Component
 * Purpose: Form for creating and editing campuses
 * Inputs: campus data (optional for edit mode), onSubmit, onCancel
 * Outputs: Campus form data
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'

interface CampusFormData {
  name: string
  slug: string
  description: string
  address: string
  coordinates: { lat: number; lng: number } | null
  isActive: boolean
}

interface CampusFormProps {
  campus?: any
  onSubmit: (data: CampusFormData) => void
  onCancel: () => void
}

export function CampusForm({ campus, onSubmit, onCancel }: CampusFormProps) {
  const [formData, setFormData] = useState<CampusFormData>({
    name: campus?.name || '',
    slug: campus?.slug || '',
    description: campus?.description || '',
    address: campus?.address || '',
    coordinates: campus?.coordinates ? JSON.parse(campus.coordinates) : null,
    isActive: campus?.isActive ?? true,
  })

  const [latInput, setLatInput] = useState(
    campus?.coordinates ? JSON.parse(campus.coordinates).lat : ''
  )
  const [lngInput, setLngInput] = useState(
    campus?.coordinates ? JSON.parse(campus.coordinates).lng : ''
  )

  // Auto-generate slug from name
  useEffect(() => {
    if (!campus && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.name, campus])

  // Update coordinates when lat/lng change
  useEffect(() => {
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)
    if (!isNaN(lat) && !isNaN(lng)) {
      setFormData((prev) => ({ ...prev, coordinates: { lat, lng } }))
    } else {
      setFormData((prev) => ({ ...prev, coordinates: null }))
    }
  }, [latInput, lngInput])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {campus ? 'Edit Campus' : 'Add New Campus'}
              </CardTitle>
              <CardDescription>
                {campus ? 'Update campus information' : 'Create a new campus location'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Campus Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., UM6P Benguerir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md bg-muted"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL-friendly identifier (auto-generated from name)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this campus location..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-sm font-medium">Active Campus</span>
                </label>
                <p className="text-xs text-muted-foreground ml-6">
                  Only active campuses will be visible to users
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address including city and postal code"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full px-3 py-2 border rounded-md"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    placeholder="e.g., 32.2308"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full px-3 py-2 border rounded-md"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    placeholder="e.g., -7.9544"
                  />
                </div>
              </div>
              {formData.coordinates && (
                <p className="text-xs text-muted-foreground">
                  Coordinates: {formData.coordinates.lat.toFixed(4)}°N, {formData.coordinates.lng.toFixed(4)}°E
                </p>
              )}
            </div>
          </CardContent>

          {/* Form Actions */}
          <div className="border-t p-4">
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {campus ? 'Update Campus' : 'Create Campus'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
