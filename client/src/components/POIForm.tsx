/**
 * POIForm Component
 * Purpose: Form for creating and editing POIs with better UX
 * Features: Similar design to BuildingForm, coordinates input, building/openspace selection
 */

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'

interface POIFormData {
  name: string
  description: string
  coordinates: string // JSON string: { lat, lng }
  floor: number | null
  buildingRef: string
  buildingId: string
  openSpaceId: string
  campusId: string
  isActive: boolean
}

interface POIFormProps {
  poi?: any
  onSubmit: (data: POIFormData) => void
  onCancel: () => void
  buildings?: Array<{ id: string; name: string }>
  openSpaces?: Array<{ id: string; name: string }>
  isLoading?: boolean
}

export function POIForm({ 
  poi, 
  onSubmit, 
  onCancel, 
  buildings = [],
  openSpaces = [],
  isLoading = false 
}: POIFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [coordinatesEditable, setCoordinatesEditable] = useState(false)
  
  const [formData, setFormData] = useState<POIFormData>({
    name: poi?.name || '',
    description: poi?.description || '',
    coordinates: poi?.coordinates || '',
    floor: poi?.floor || null,
    buildingRef: poi?.buildingRef || '',
    buildingId: poi?.buildingId || '',
    openSpaceId: poi?.openSpaceId || '',
    campusId: poi?.campusId || '',
    isActive: poi?.isActive ?? true,
  })

  const [coordinatesInput, setCoordinatesInput] = useState({
    lat: '',
    lng: ''
  })

  // Initialize form data when poi changes (for editing)
  useEffect(() => {
    if (poi) {
      setFormData({
        name: poi.name || '',
        description: poi.description || '',
        coordinates: poi.coordinates || '',
        floor: poi.floor || null,
        buildingRef: poi.buildingRef || '',
        buildingId: poi.buildingId || poi.building?.id || '',
        openSpaceId: poi.openSpaceId || poi.openSpace?.id || '',
        campusId: poi.campusId || '',
        isActive: poi.isActive ?? true,
      })
      
      // Parse and set coordinates for lat/lng inputs
      if (poi.coordinates) {
        try {
          let coords = poi.coordinates
          if (typeof coords === 'string') {
            try {
              coords = JSON.parse(coords)
            } catch (e) {
              console.error('Error parsing coordinates string:', e)
            }
          }
          
          // Handle different coordinate formats
          let lat = ''
          let lng = ''
          
          if (coords) {
            // Handle array format [lng, lat] (GeoJSON standard)
            if (Array.isArray(coords) && coords.length >= 2) {
              lng = coords[0]
              lat = coords[1]
            } 
            // Handle object format { lat, lng } or { latitude, longitude }
            else {
              if (typeof coords.lat !== 'undefined') lat = coords.lat
              else if (typeof coords.latitude !== 'undefined') lat = coords.latitude
              
              if (typeof coords.lng !== 'undefined') lng = coords.lng
              else if (typeof coords.longitude !== 'undefined') lng = coords.longitude
            }
          }
          
          setCoordinatesInput({
            lat: lat?.toString() || '',
            lng: lng?.toString() || ''
          })
        } catch (error) {
          console.error('Error processing coordinates:', error)
          setCoordinatesInput({ lat: '', lng: '' })
        }
      } else {
        setCoordinatesInput({ lat: '', lng: '' })
      }
    } else {
      // Reset form for new POI
      setFormData({
        name: '',
        description: '',
        coordinates: '',
        floor: null,
        buildingRef: '',
        buildingId: '',
        openSpaceId: '',
        campusId: '',
        isActive: true,
      })
      setCoordinatesInput({ lat: '', lng: '' })
    }
  }, [poi])

  // Update coordinates JSON when lat/lng inputs change
  useEffect(() => {
    if (coordinatesInput.lat && coordinatesInput.lng) {
      // Use [lng, lat] format to match existing data
      const coords = [
        parseFloat(coordinatesInput.lng),
        parseFloat(coordinatesInput.lat)
      ]
      setFormData(prev => ({
        ...prev,
        coordinates: JSON.stringify(coords)
      }))
    }
  }, [coordinatesInput])

  const handleInputChange = (field: keyof POIFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear the other association when one is selected
    if (field === 'buildingId' && value) {
      setFormData(prev => ({ ...prev, openSpaceId: '' }))
    } else if (field === 'openSpaceId' && value) {
      setFormData(prev => ({ ...prev, buildingId: '' }))
    }
  }

  const handleCoordinateChange = (field: 'lat' | 'lng', value: string) => {
    setCoordinatesInput(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'location', label: 'Location & Geometry' },
    { id: 'association', label: 'Association' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
      <Card className="w-full h-full sm:h-[90vh] sm:max-w-3xl flex flex-col sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
        {/* Fixed Header */}
        <CardHeader className="border-b flex-shrink-0 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-2xl truncate">
                {poi ? 'Edit POI' : 'Add New POI'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2">
                {poi ? 'Update point of interest information' : 'Create a new point of interest'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel} className="flex-shrink-0">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Mobile Dropdown - Visible only on mobile */}
          <div className="md:hidden border-b flex-shrink-0 bg-background p-3">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm font-medium"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Tabs - Hidden on mobile */}
          <div className="hidden md:block border-b flex-shrink-0 bg-background sticky top-0 z-10">
            <div className="flex gap-1 px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Content */}
          <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-6">
              
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter POI name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
                    rows={3}
                    placeholder="Enter POI description"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-gray-300 focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active (POI is visible and accessible)
                  </label>
                </div>
              </div>
              )}

              {/* Location & Geometry Tab */}
              {activeTab === 'location' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-semibold">Location & Geometry</h3>
                  {poi && (
                    <Button
                      type="button"
                      variant={coordinatesEditable ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCoordinatesEditable(!coordinatesEditable)}
                    >
                      {coordinatesEditable ? '🔓 Editing Enabled' : '🔒 Click to Edit'}
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Latitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={coordinatesInput.lat}
                      onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                        poi && !coordinatesEditable ? 'bg-muted cursor-not-allowed' : 'bg-background'
                      }`}
                      placeholder="e.g., 34.0522"
                      required
                      disabled={poi && !coordinatesEditable}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Longitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={coordinatesInput.lng}
                      onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                        poi && !coordinatesEditable ? 'bg-muted cursor-not-allowed' : 'bg-background'
                      }`}
                      placeholder="e.g., -118.2437"
                      required
                      disabled={poi && !coordinatesEditable}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Floor (Optional)</label>
                  <input
                    type="number"
                    value={formData.floor || ''}
                    onChange={(e) => handleInputChange('floor', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
                    placeholder="e.g., 1, 2, -1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Building Reference</label>
                  <input
                    type="text"
                    value={formData.buildingRef}
                    onChange={(e) => handleInputChange('buildingRef', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
                    placeholder="e.g., Room number, area reference"
                  />
                </div>
              </div>
              )}

              {/* Association Tab */}
              {activeTab === 'association' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Association</h3>
                <p className="text-sm text-muted-foreground">
                  Associate this POI with a building or open space (optional)
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Building</label>
                    <select
                      value={formData.buildingId}
                      onChange={(e) => handleInputChange('buildingId', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                        formData.openSpaceId ? 'bg-muted cursor-not-allowed' : 'bg-background'
                      }`}
                      disabled={!!formData.openSpaceId}
                    >
                      <option value="">Select Building</option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Open Space</label>
                    <select
                      value={formData.openSpaceId}
                      onChange={(e) => handleInputChange('openSpaceId', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                        formData.buildingId ? 'bg-muted cursor-not-allowed' : 'bg-background'
                      }`}
                      disabled={!!formData.buildingId}
                    >
                      <option value="">Select Open Space</option>
                      {openSpaces.map((openSpace) => (
                        <option key={openSpace.id} value={openSpace.id}>
                          {openSpace.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              )}
            </div>
          </CardContent>

          {/* Fixed Footer */}
          <div className="border-t p-4 sm:p-6 flex-shrink-0 bg-background">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="order-2 sm:order-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="order-1 sm:order-2"
                disabled={isLoading || !formData.name || !coordinatesInput.lat || !coordinatesInput.lng}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {poi ? 'Update POI' : 'Create POI'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
