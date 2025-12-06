/**
 * BoundaryForm Component
 * Purpose: Form for creating and editing campus boundaries
 * Features: Tab-based design matching BuildingForm
 */

import { useState, useEffect } from 'react'
import { X, Lock, Unlock } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface BoundaryFormData {
  name: string
  slug: string
  description: string
  coordinates: string // GeoJSON polygon as JSON string
  isActive: boolean
}

interface BoundaryFormProps {
  boundary?: any
  onSubmit: (data: BoundaryFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function BoundaryForm({ boundary, onSubmit, onCancel, isLoading = false }: BoundaryFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [coordinatesEditable, setCoordinatesEditable] = useState(!boundary)
  
  const [formData, setFormData] = useState<BoundaryFormData>({
    name: '',
    slug: '',
    description: '',
    coordinates: '',
    isActive: true,
  })

  // Auto-fill form when editing
  useEffect(() => {
    if (boundary) {
      setFormData({
        name: boundary.name || '',
        slug: boundary.slug || '',
        description: boundary.description || '',
        coordinates: boundary.coordinates || '',
        isActive: boundary.isActive ?? true,
      })
      setCoordinatesEditable(false)
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        coordinates: '',
        isActive: true,
      })
      setCoordinatesEditable(true)
    }
  }, [boundary])

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: boundary ? prev.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'geometry', label: 'Geometry' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>{boundary ? 'Edit Boundary' : 'Create New Boundary'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Dropdown Tabs */}
          <div className="md:hidden mt-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm font-medium"
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:block border-b mt-4">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g., UM6P Benguerir Campus"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g., um6p-benguerir-campus"
                    required
                    disabled={!!boundary}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {boundary ? 'Slug cannot be changed after creation' : 'Auto-generated from name, but you can customize it'}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background min-h-[100px]"
                    placeholder="Describe this boundary..."
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active
                  </label>
                </div>
              </div>
            )}

            {/* Geometry Tab */}
            {activeTab === 'geometry' && (
              <div className="space-y-4">
                {/* Coordinates Lock/Unlock */}
                {boundary && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">
                      {coordinatesEditable ? '🔓 Editing Enabled' : '🔒 Geometry Protected'}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCoordinatesEditable(!coordinatesEditable)}
                    >
                      {coordinatesEditable ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Lock Geometry
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 mr-2" />
                          Unlock to Edit
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* GeoJSON Coordinates */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    GeoJSON Polygon <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.coordinates}
                    onChange={(e) => setFormData(prev => ({ ...prev, coordinates: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border border-border font-mono text-sm min-h-[300px] ${
                      !coordinatesEditable ? 'bg-muted cursor-not-allowed' : 'bg-background'
                    }`}
                    placeholder='{"type":"Polygon","coordinates":[[[-7.938232,32.221538],[-7.938586,32.220822],...]]}'
                    required
                    disabled={!coordinatesEditable}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {coordinatesEditable 
                      ? 'Enter GeoJSON Polygon geometry with type and coordinates'
                      : 'Click "Unlock to Edit" button above to modify geometry'
                    }
                  </p>
                </div>

                {/* Example Format */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-medium mb-2">Example Format:</p>
                  <pre className="text-xs overflow-x-auto">
{`{
  "type": "Polygon",
  "coordinates": [[
    [-7.938232, 32.221538],
    [-7.938586, 32.220822],
    [-7.938811, 32.220388],
    [-7.938232, 32.221538]
  ]]
}`}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>

          {/* Form Actions */}
          <div className="border-t p-4 flex justify-end gap-3 flex-shrink-0">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                boundary ? 'Update Boundary' : 'Create Boundary'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
