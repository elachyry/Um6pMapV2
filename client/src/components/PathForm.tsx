/**
 * PathForm Component
 * Purpose: Form for creating and editing paths with tab system
 * Features: Basic info, geometry/coordinates, description tabs
 */

import { useState, useEffect } from 'react'
import { X, Route, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'

interface PathFormData {
  name: string
  slug: string
  description: string
  coordinates: string // GeoJSON LineString as JSON string
  isActive: boolean
}

interface PathFormProps {
  path?: any
  onSubmit: (data: PathFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function PathForm({ path, onSubmit, onCancel, isLoading = false }: PathFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [coordinatesEditable, setCoordinatesEditable] = useState(false) // Will be set properly in useEffect
  
  const [formData, setFormData] = useState<PathFormData>({
    name: '',
    slug: '',
    description: '',
    coordinates: '',
    isActive: true
  })

  // Update form data when path prop changes
  useEffect(() => {
    console.log('PathForm - path prop changed:', path)
    if (path) {
      console.log('PathForm - Setting form data for editing:', {
        name: path.name,
        slug: path.slug,
        description: path.description,
        coordinates: path.coordinates,
        isActive: path.isActive
      })
      // Format coordinates for display
      let formattedCoordinates = path.coordinates || ''
      if (formattedCoordinates && typeof formattedCoordinates === 'string') {
        try {
          const parsed = JSON.parse(formattedCoordinates)
          formattedCoordinates = JSON.stringify(parsed, null, 2)
        } catch (e) {
          // If parsing fails, use as-is
          console.warn('Failed to parse coordinates JSON:', e)
        }
      }

      setFormData({
        name: path.name || '',
        slug: path.slug || '',
        description: path.description || '',
        coordinates: formattedCoordinates,
        isActive: path.isActive ?? true
      })
      setCoordinatesEditable(false) // Lock coordinates for editing
    } else {
      console.log('PathForm - Resetting form for new path')
      // Reset form for new path
      setFormData({
        name: '',
        slug: '',
        description: '',
        coordinates: '',
        isActive: true
      })
      setCoordinatesEditable(true) // Enable coordinates for new path
    }
  }, [path])

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  // Handle input changes
  const handleInputChange = (field: keyof PathFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-generate slug when name changes (only for new paths)
      if (field === 'name' && !path) {
        updated.slug = generateSlug(value)
      }
      
      return updated
    })
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate and compress coordinates JSON
    let processedData = { ...formData }
    if (processedData.coordinates) {
      try {
        const parsed = JSON.parse(processedData.coordinates)
        processedData.coordinates = JSON.stringify(parsed) // Compress to single line
      } catch (error) {
        console.error('Invalid coordinates JSON:', error)
        // Continue with original value if parsing fails
      }
    }
    
    onSubmit(processedData)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'geometry', label: 'Geometry & Route' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
      <Card className="w-full h-full sm:h-[80vh] sm:max-w-4xl flex flex-col sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
        {/* Fixed Header */}
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Route className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-xl">{path ? 'Edit Path' : 'Create New Path'}</CardTitle>
                <CardDescription>
                  {path ? 'Modify path details and geometry' : 'Add a new walkway or navigation path'}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {/* Mobile Dropdown - Visible only on mobile */}
          <div className="md:hidden border-b flex-shrink-0 bg-background p-3">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm font-medium"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>

          {/* Desktop Tabs - Hidden on mobile */}
          <div className="hidden md:flex border-b flex-shrink-0 bg-background">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap rounded-t-lg ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Content */}
          <CardContent className="flex-1 overflow-y-auto p-6">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Path Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary bg-background"
                      placeholder="e.g., Main Campus Walk, Library Path"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium mb-1">
                      URL Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary bg-background"
                      placeholder="e.g., main-campus-walk"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for URLs. Will be auto-generated from name if left empty.
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary bg-background"
                    placeholder="Describe the path route, surface type, accessibility features, etc."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active (visible on map)
                  </label>
                </div>
              </div>
            )}

            {/* Geometry & Route Tab */}
            {activeTab === 'geometry' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-semibold">Path Geometry</h3>
                  {path && (
                    <Button
                      type="button"
                      variant={coordinatesEditable ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCoordinatesEditable(!coordinatesEditable)}
                    >
                      {coordinatesEditable ? '🔓 Editing Enabled' : '🔒 Click to Edit Geometry'}
                    </Button>
                  )}
                </div>

                <div>
                  <label htmlFor="coordinates" className="block text-sm font-medium mb-1">
                    GeoJSON LineString Coordinates <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="coordinates"
                    value={formData.coordinates}
                    onChange={(e) => handleInputChange('coordinates', e.target.value)}
                    rows={8}
                    className={`w-full px-3 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:border-primary ${
                      path && !coordinatesEditable ? 'bg-muted cursor-not-allowed' : 'bg-background'
                    }`}
                    placeholder='{"type":"LineString","coordinates":[[-7.938275,32.221302],[-7.938483,32.220875]]}'
                    required
                    disabled={path && !coordinatesEditable}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {coordinatesEditable || !path 
                      ? 'GeoJSON LineString format with longitude, latitude coordinates defining the path route.' 
                      : 'Geometry editing is locked. Click "Edit Geometry" to make changes.'}
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">💡 Tips for Path Geometry</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use LineString geometry for walkable paths</li>
                    <li>• Coordinates should be in [longitude, latitude] order</li>
                    <li>• Add more coordinate points for curved or complex paths</li>
                    <li>• Ensure coordinates are within campus boundaries</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 border-t bg-background p-6">
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  path ? 'Update Path' : 'Create Path'
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
