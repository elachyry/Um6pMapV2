import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, Upload, Trash2, Eye, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { useCampusStore } from '@/stores/campusStore'
import { getMapSettings, updateMapSettings } from '@/api/campusApi'
import { getCampusModels, uploadCampusModel, deleteCampusModel } from '@/api/modelApi'
import { broadcastCacheInvalidation } from '@/api/cacheApi'
import { apiClient } from '@/api/client'
import { ModelViewer } from '@/components/ModelViewer'

const MAPBOX_STYLES = [
  { value: 'mapbox://styles/mapbox/streets-v12', label: 'Streets' },
  { value: 'mapbox://styles/mapbox/outdoors-v12', label: 'Outdoors' },
  { value: 'mapbox://styles/mapbox/light-v11', label: 'Light' },
  { value: 'mapbox://styles/mapbox/dark-v11', label: 'Dark' },
  { value: 'mapbox://styles/mapbox/navigation-day-v1', label: 'Navigation Day' },
  { value: 'mapbox://styles/mapbox/navigation-night-v1', label: 'Navigation Night' },
]

export default function MapSettings() {
  const toast = useToast()
  const { selectedCampusId } = useCampusStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [customStyleUrl, setCustomStyleUrl] = useState('')
  
  // GLB Models state
  const [models, setModels] = useState<any[]>([])
  const [isUploadingModel, setIsUploadingModel] = useState(false)
  const [previewModel, setPreviewModel] = useState<any>(null)
  const [boundaries, setBoundaries] = useState<any[]>([])
  const [showBoundaryDialog, setShowBoundaryDialog] = useState(false)
  const [selectedBoundary, setSelectedBoundary] = useState<string>('')

  useEffect(() => {
    if (selectedCampusId) {
      loadMapSettings()
      loadModels()
    }
  }, [selectedCampusId])
  
  const loadModels = async () => {
    if (!selectedCampusId) return
    try {
      const response: any = await getCampusModels(selectedCampusId)
      setModels(response.data || [])
    } catch (error: any) {
      console.error('Failed to load models:', error)
    }
  }
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedCampusId) return
    
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      toast.error('Please select a GLB or GLTF file')
      return
    }
    
    setIsUploadingModel(true)
    try {
      await uploadCampusModel(selectedCampusId, file, file.name, 1.0)
      toast.success('Model uploaded successfully')
      await loadModels()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      toast.error('Failed to upload model')
    } finally {
      setIsUploadingModel(false)
    }
  }
  
  const handleDeleteModel = async (modelId: string) => {
    if (!selectedCampusId) return
    try {
      await deleteCampusModel(selectedCampusId, modelId)
      toast.success('Model deleted successfully')
      await loadModels()
    } catch (error: any) {
      toast.error('Failed to delete model')
    }
  }

  const loadMapSettings = async () => {
    if (!selectedCampusId) return
    setIsLoading(true)
    try {
      const response = await getMapSettings(selectedCampusId)
      const campusData = response.data || response
      setSettings(campusData)
      if (campusData.mapStyle && !MAPBOX_STYLES.find(s => s.value === campusData.mapStyle)) {
        setCustomStyleUrl(campusData.mapStyle)
      }
    } catch (error: any) {
      toast.error('Failed to load map settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCalculateCenter = async (boundaryId?: string) => {
    if (!selectedCampusId) return
    try {
      const response: any = await apiClient.post(`/campuses/${selectedCampusId}/calculate-center`, {
        boundaryId
      })
      
      // Check if multiple boundaries
      if (response.multipleBoundaries) {
        setBoundaries(response.boundaries)
        setShowBoundaryDialog(true)
        return
      }
      
      setSettings({
        ...settings,
        mapCenter: JSON.stringify(response.center)
      })
      toast.success(`Map center calculated from boundary${response.boundaryName ? `: ${response.boundaryName}` : ''}`)
      setShowBoundaryDialog(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to calculate center')
    }
  }
  
  const handleBoundarySelect = () => {
    if (selectedBoundary) {
      handleCalculateCenter(selectedBoundary)
    }
  }

  const handleSave = async () => {
    if (!selectedCampusId) return
    setIsSaving(true)
    try {
      // Extract only the map settings fields
      const mapSettingsData = {
        mapStyle: settings.mapStyle,
        buildingHoverColor: settings.buildingHoverColor,
        buildingHighlightColor: settings.buildingHighlightColor,
        mapCenter: settings.mapCenter,
        initialZoom: settings.initialZoom,
        minZoom: settings.minZoom,
        maxZoom: settings.maxZoom,
        showBuildingLabels3D: settings.showBuildingLabels3D,
        showBuildingLabelsNo3D: settings.showBuildingLabelsNo3D,
        showBuildingIcons3D: settings.showBuildingIcons3D,
        showBuildingIconsNo3D: settings.showBuildingIconsNo3D,
        showOpenSpaceLabels3D: settings.showOpenSpaceLabels3D,
        showOpenSpaceLabelsNo3D: settings.showOpenSpaceLabelsNo3D,
        showOpenSpaceIcons3D: settings.showOpenSpaceIcons3D,
        showOpenSpaceIconsNo3D: settings.showOpenSpaceIconsNo3D,
      }
      await updateMapSettings(selectedCampusId, mapSettingsData)
      toast.success('Map settings saved successfully')
      
      // Broadcast cache invalidation via WebSocket
      await broadcastCacheInvalidation('mapSettings', selectedCampusId)
    } catch (error: any) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (!selectedCampusId || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const mapCenter = settings?.mapCenter ? JSON.parse(settings.mapCenter) : { lat: 0, lng: 0 }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Map Settings</h2>
          <p className="text-muted-foreground">Configure map appearance, zoom levels, and layer visibility</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>


      {settings && (
        <>
          {/* Map Appearance */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Map Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Map Style */}
              <div>
                <label className="block text-sm font-medium mb-2">Map Style</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {MAPBOX_STYLES.map(style => (
                    <label key={style.value} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent">
                      <input
                        type="radio"
                        checked={settings.mapStyle === style.value}
                        onChange={() => setSettings({ ...settings, mapStyle: style.value })}
                      />
                      <span className="text-sm">{style.label}</span>
                    </label>
                  ))}
                </div>
                <Input
                  className="mt-2"
                  placeholder="Or enter custom URL"
                  value={customStyleUrl}
                  onChange={(e) => {
                    setCustomStyleUrl(e.target.value)
                    setSettings({ ...settings, mapStyle: e.target.value })
                  }}
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Building Hover Color</label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="text"
                      value={settings.buildingHoverColor || '#4F46E5'}
                      onChange={(e) => setSettings({ ...settings, buildingHoverColor: e.target.value })}
                    />
                    <input
                      type="color"
                      value={settings.buildingHoverColor || '#4F46E5'}
                      onChange={(e) => setSettings({ ...settings, buildingHoverColor: e.target.value })}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Building Highlight Color</label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="text"
                      value={settings.buildingHighlightColor || '#EF4444'}
                      onChange={(e) => setSettings({ ...settings, buildingHighlightColor: e.target.value })}
                    />
                    <input
                      type="color"
                      value={settings.buildingHighlightColor || '#EF4444'}
                      onChange={(e) => setSettings({ ...settings, buildingHighlightColor: e.target.value })}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Position & Zoom */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Map Position & Zoom</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Map Center */}
              <div>
                <label className="block text-sm font-medium mb-2">Map Center</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="Latitude"
                    value={mapCenter.lat}
                    onChange={(e) => setSettings({
                      ...settings,
                      mapCenter: JSON.stringify({ ...mapCenter, lat: parseFloat(e.target.value) })
                    })}
                  />
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="Longitude"
                    value={mapCenter.lng}
                    onChange={(e) => setSettings({
                      ...settings,
                      mapCenter: JSON.stringify({ ...mapCenter, lng: parseFloat(e.target.value) })
                    })}
                  />
                </div>
                <Button variant="outline" className="mt-2" onClick={() => handleCalculateCenter()}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Calculate from Boundary
                </Button>
              </div>
              
              {/* Boundary Selection Dialog */}
              {showBoundaryDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <CardTitle>Select Boundary</CardTitle>
                      <CardDescription>
                        Multiple boundaries found. Please select one to calculate the map center.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {boundaries.map((boundary: any) => (
                            <label key={boundary.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                              <input
                                type="radio"
                                name="boundary"
                                value={boundary.id}
                                checked={selectedBoundary === boundary.id}
                                onChange={(e) => setSelectedBoundary(e.target.value)}
                                className="w-4 h-4"
                              />
                              <span>{boundary.name}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowBoundaryDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleBoundarySelect} disabled={!selectedBoundary}>
                            Calculate Center
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Zoom Levels */}
              <div>
                <label className="block text-sm font-medium mb-2">Initial Zoom: {settings.initialZoom || 15}</label>
                <input
                  type="range"
                  min={settings.minZoom || 10}
                  max={settings.maxZoom || 22}
                  step="0.1"
                  value={settings.initialZoom || 15}
                  onChange={(e) => setSettings({ ...settings, initialZoom: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Min Zoom: {settings.minZoom || 10}</label>
                <input
                  type="range"
                  min="1"
                  max={settings.initialZoom || 15}
                  step="0.1"
                  value={settings.minZoom || 10}
                  onChange={(e) => setSettings({ ...settings, minZoom: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Zoom: {settings.maxZoom || 22}</label>
                <input
                  type="range"
                  min={settings.initialZoom || 15}
                  max="24"
                  step="0.1"
                  value={settings.maxZoom || 22}
                  onChange={(e) => setSettings({ ...settings, maxZoom: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Building Display Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Building Display Settings</CardTitle>
              <CardDescription>Control labels and icons for buildings with and without 3D models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="text-sm font-medium">Labels (with 3D models)</label>
                  <input
                    type="checkbox"
                    checked={settings.showBuildingLabels3D !== false}
                    onChange={(e) => setSettings({ ...settings, showBuildingLabels3D: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="text-sm font-medium">Labels (without 3D models)</label>
                  <input
                    type="checkbox"
                    checked={settings.showBuildingLabelsNo3D !== false}
                    onChange={(e) => setSettings({ ...settings, showBuildingLabelsNo3D: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="text-sm font-medium">Icons (with 3D models)</label>
                  <input
                    type="checkbox"
                    checked={settings.showBuildingIcons3D !== false}
                    onChange={(e) => setSettings({ ...settings, showBuildingIcons3D: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="text-sm font-medium">Icons (without 3D models)</label>
                  <input
                    type="checkbox"
                    checked={settings.showBuildingIconsNo3D !== false}
                    onChange={(e) => setSettings({ ...settings, showBuildingIconsNo3D: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Space Display Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Open Space Display Settings</CardTitle>
              <CardDescription>Control labels and icons for open spaces with and without 3D models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="text-sm font-medium">Labels (with 3D models)</label>
                  <input
                    type="checkbox"
                    checked={settings.showOpenSpaceLabels3D !== false}
                    onChange={(e) => setSettings({ ...settings, showOpenSpaceLabels3D: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="text-sm font-medium">Labels (without 3D models)</label>
                  <input
                    type="checkbox"
                    checked={settings.showOpenSpaceLabelsNo3D !== false}
                    onChange={(e) => setSettings({ ...settings, showOpenSpaceLabelsNo3D: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="text-sm font-medium">Icons (with 3D models)</label>
                  <input
                    type="checkbox"
                    checked={settings.showOpenSpaceIcons3D !== false}
                    onChange={(e) => setSettings({ ...settings, showOpenSpaceIcons3D: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="text-sm font-medium">Icons (without 3D models)</label>
                  <input
                    type="checkbox"
                    checked={settings.showOpenSpaceIconsNo3D !== false}
                    onChange={(e) => setSettings({ ...settings, showOpenSpaceIconsNo3D: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3D Campus Models Management */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3D Campus Models (GLB/GLTF)</CardTitle>
              <CardDescription>Upload and manage 3D models for this campus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Section */}
              {selectedCampusId && (
                <>
                  <div className="border-2 border-dashed rounded-lg p-6">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium mb-1">Upload 3D Model</p>
                        <p className="text-xs text-muted-foreground">GLB or GLTF files only</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".glb,.gltf"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="model-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingModel}
                      >
                        {isUploadingModel ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Select File
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Models List */}
                  {models.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Uploaded Models ({models.length})</h3>
                      <div className="grid gap-2">
                        {models.map((model) => (
                          <div
                            key={model.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                                <Eye className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{model.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Scale: {model.scale || 1.0} • {model.isActive ? 'Active' : 'Inactive'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPreviewModel(model)}
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteModel(model.id)}
                                title="Delete"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {models.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No 3D models uploaded yet</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Model Preview Modal */}
          {previewModel && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setPreviewModel(null)}>
              <div className="bg-background rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{previewModel.name}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setPreviewModel(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* 3D Viewer */}
                <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                  <ModelViewer modelUrl={previewModel.modelUrl} className="w-full h-full" />
                </div>
                
                {/* Model Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Scale:</span> {previewModel.scale || 1.0}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {previewModel.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <div>
                    <span className="font-medium">File Size:</span> {previewModel.fileSize ? (previewModel.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(previewModel.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
