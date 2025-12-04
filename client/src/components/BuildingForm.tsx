/**
 * BuildingForm Component - Redesigned
 * Purpose: Form for creating and editing buildings with better UX
 * Features: Collapsible sections, separate image/document tabs, drag-and-drop reordering
 */

import { useState, useEffect } from 'react'
import { X, FileText, Trash2, GripVertical, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { OperatingHoursEditor } from './OperatingHoursEditor'
import { ContactInfoEditor } from './ContactInfoEditor'
import { AmenitiesSelector } from './AmenitiesSelector'
import { getCampusModels } from '@/api/modelApi'

interface OperatingHour {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
  is24Hours: boolean
}

interface ContactInfo {
  type: string
  value: string
  label: string
  isPrimary: boolean
}

interface BuildingFormData {
  name: string
  slug: string
  description: string
  campusId: string
  categoryId: string
  address: string
  coordinates: string | null // GeoJSON polygon as JSON string
  floorPlans: string | null // JSON string of floor plan data
  height: number
  capacity: number | null
  isReservable: boolean
  isActive: boolean
  facilities: string[]
  // 3D Model Configuration
  modelId: string | null
  modelScale: number
  modelRotationX: number
  modelRotationY: number
  modelRotationZ: number
  modelOffsetX: number
  modelOffsetY: number
  modelOffsetZ: number
  images: Array<{ file?: File; url: string; caption: string; displayOrder: number; id?: string }>
  documents: Array<{ file?: File; url: string; title: string; fileType: string; displayOrder: number; id?: string }>
  operatingHours: OperatingHour[]
  contactInfo: ContactInfo[]
  amenities: string[]
}

interface BuildingFormProps {
  building?: any
  onSubmit: (data: BuildingFormData) => void
  onCancel: () => void
  campuses?: Array<{ id: string; name: string }>
  categories?: Array<{ id: string; name: string }>
  isLoading?: boolean
}

export function BuildingForm({ building, onSubmit, onCancel, campuses = [], categories = [], isLoading = false }: BuildingFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [availableModels, setAvailableModels] = useState<any[]>([])
  
  // Debug: Log building data when component receives it
  useEffect(() => {
    if (building) {
      console.log('BuildingForm received building data:', building)
      console.log('Operating Hours:', building.operatingHours)
      console.log('Contact Info:', building.contactInfo)
      console.log('Amenities:', building.amenities)
    }
  }, [building])
  
  const [formData, setFormData] = useState<BuildingFormData>({
    name: building?.name || '',
    slug: building?.slug || '',
    description: building?.description || '',
    campusId: building?.campusId || '',
    categoryId: building?.categoryId || '',
    address: building?.address || '',
    coordinates: building?.coordinates || null,
    height: building?.height || 5,
    floorPlans: building?.floorPlans || null,
    capacity: building?.capacity || null,
    isReservable: building?.isReservable || false,
    isActive: building?.isActive ?? true,
    facilities: building?.facilities ? JSON.parse(building.facilities) : [],
    // 3D Model Configuration
    modelId: building?.modelId || null,
    modelScale: building?.modelScale || 1.0,
    modelRotationX: building?.modelRotationX || 0.0,
    modelRotationY: building?.modelRotationY || 0.0,
    modelRotationZ: building?.modelRotationZ || 0.0,
    modelOffsetX: building?.modelOffsetX || 0.0,
    modelOffsetY: building?.modelOffsetY || 0.0,
    modelOffsetZ: building?.modelOffsetZ || 0.0,
    images: building?.images?.map((img: any, idx: number) => ({
      id: img.id,
      url: img.imageUrl,
      caption: img.caption || '',
      displayOrder: img.displayOrder || idx,
    })) || [],
    documents: building?.documents?.map((doc: any, idx: number) => ({
      id: doc.id,
      url: doc.documentUrl,
      title: doc.title,
      fileType: doc.fileType,
      displayOrder: doc.displayOrder || idx,
    })) || [],
    operatingHours: building?.operatingHours || [],
    contactInfo: building?.contactInfo || [],
    amenities: building?.amenities?.map((a: any) => a.amenityId) || [],
  })

  const [facilityInput, setFacilityInput] = useState('')
  const [polygonEditable, setPolygonEditable] = useState(!building) // Editable for new buildings, locked for editing
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [draggedDocIndex, setDraggedDocIndex] = useState<number | null>(null)

  // Load available 3D models for the campus
  useEffect(() => {
    const loadModels = async () => {
      if (formData.campusId) {
        try {
          const response: any = await getCampusModels(formData.campusId)
          setAvailableModels(response.data || [])
        } catch (error) {
          console.error('Failed to load models:', error)
          setAvailableModels([])
        }
      }
    }
    loadModels()
  }, [formData.campusId])

  // Update formData when building prop changes
  useEffect(() => {
    if (building) {
      setFormData({
        name: building.name || '',
        slug: building.slug || '',
        description: building.description || '',
        campusId: building.campusId || '',
        categoryId: building.categoryId || '',
        address: building.address || '',
        coordinates: building.coordinates || null,
        height: building.height || 5,
        floorPlans: building.floorPlans || null,
        capacity: building.capacity || null,
        isReservable: building.isReservable || false,
        isActive: building.isActive ?? true,
        facilities: building.facilities ? JSON.parse(building.facilities) : [],
        // 3D Model Configuration
        modelId: building.modelId || null,
        modelScale: building.modelScale || 1.0,
        modelRotationX: building.modelRotationX || 0.0,
        modelRotationY: building.modelRotationY || 0.0,
        modelRotationZ: building.modelRotationZ || 0.0,
        modelOffsetX: building.modelOffsetX || 0.0,
        modelOffsetY: building.modelOffsetY || 0.0,
        modelOffsetZ: building.modelOffsetZ || 0.0,
        images: building.images?.map((img: any, idx: number) => ({
          id: img.id,
          url: img.imageUrl,
          caption: img.caption || '',
          displayOrder: img.displayOrder || idx,
        })) || [],
        documents: building.documents?.map((doc: any, idx: number) => ({
          id: doc.id,
          url: doc.documentUrl,
          title: doc.title,
          fileType: doc.fileType,
          displayOrder: doc.displayOrder || idx,
        })) || [],
        operatingHours: building.operatingHours || [],
        contactInfo: building.contactInfo || [],
        // Map amenities: from [{amenityId: "uuid", amenity: {name: "wifi"}}] to ["wifi"]
        amenities: building.amenities?.map((a: any) => a.amenity?.name || a.amenityId) || [],
      })
    }
  }, [building])

  // Auto-generate slug from name
  useEffect(() => {
    if (!building && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name, building])



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages = files.map((file, idx) => ({
      file,
      url: URL.createObjectURL(file),
      caption: '',
      displayOrder: formData.images.length + idx,
    }))
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }))
  }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newDocuments = files.map((file, idx) => ({
      file,
      url: URL.createObjectURL(file),
      title: file.name,
      fileType: file.type || 'application/octet-stream',
      displayOrder: formData.documents.length + idx,
    }))
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...newDocuments] }))
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index).map((img, i) => ({ ...img, displayOrder: i })),
    }))
  }

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index).map((doc, i) => ({ ...doc, displayOrder: i })),
    }))
  }

  const handleImageDragStart = (index: number) => {
    setDraggedImageIndex(index)
  }

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedImageIndex === null || draggedImageIndex === index) return

    const newImages = [...formData.images]
    const draggedImage = newImages[draggedImageIndex]
    newImages.splice(draggedImageIndex, 1)
    newImages.splice(index, 0, draggedImage)
    
    setFormData(prev => ({
      ...prev,
      images: newImages.map((img, i) => ({ ...img, displayOrder: i }))
    }))
    setDraggedImageIndex(index)
  }

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null)
  }

  const handleDocDragStart = (index: number) => {
    setDraggedDocIndex(index)
  }

  const handleDocDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedDocIndex === null || draggedDocIndex === index) return

    const newDocs = [...formData.documents]
    const draggedDoc = newDocs[draggedDocIndex]
    newDocs.splice(draggedDocIndex, 1)
    newDocs.splice(index, 0, draggedDoc)
    
    setFormData(prev => ({
      ...prev,
      documents: newDocs.map((doc, i) => ({ ...doc, displayOrder: i }))
    }))
    setDraggedDocIndex(index)
  }

  const handleDocDragEnd = () => {
    setDraggedDocIndex(null)
  }

  const addFacility = () => {
    if (facilityInput.trim() && !formData.facilities.includes(facilityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        facilities: [...prev.facilities, facilityInput.trim()],
      }))
      setFacilityInput('')
    }
  }

  const removeFacility = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.filter(f => f !== facility),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'location', label: 'Location & Polygon' },
    { id: 'model', label: '3D Model' },
    { id: 'hours', label: 'Operating Hours' },
    { id: 'contact', label: 'Contact Info' },
    { id: 'amenities', label: 'Services & Amenities' },
    { id: 'images', label: 'Images' },
    { id: 'documents', label: 'Documents' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
      <Card className="w-full h-full sm:h-[90vh] sm:max-w-5xl flex flex-col sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
        {/* Fixed Header */}
        <CardHeader className="border-b flex-shrink-0 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-2xl truncate">
                {building ? 'Edit Building' : 'Add New Building'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2">
                {building ? 'Update building information' : 'Create a new building with images and documents'}
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

          {/* Scrollable Content */}
          <CardContent className="flex-1 overflow-y-auto p-6">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md bg-muted"
                      value={formData.slug}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Campus</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.campusId}
                      onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                    >
                      <option value="">Select Campus</option>
                      {campuses.map((campus) => (
                        <option key={campus.id} value={campus.id}>
                          {campus.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Height (meters)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 5 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Capacity</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                  <div className="flex items-center gap-6 pt-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isReservable}
                        onChange={(e) => setFormData({ ...formData, isReservable: e.target.checked })}
                      />
                      <span className="text-sm font-medium">Reservable</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <span className="text-sm font-medium">Active</span>
                    </label>
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <label className="block text-sm font-medium mb-2">Facilities</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="Add facility..."
                      value={facilityInput}
                      onChange={(e) => setFacilityInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                    />
                    <Button type="button" onClick={addFacility}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.facilities.map((facility, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {facility}
                        <button
                          type="button"
                          onClick={() => removeFacility(facility)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter building address..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Building Polygon</label>
                    {building && (
                      <Button
                        type="button"
                        variant={polygonEditable ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPolygonEditable(!polygonEditable)}
                      >
                        {polygonEditable ? '🔓 Editing Enabled' : '🔒 Click to Edit Polygon'}
                      </Button>
                    )}
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-6">
                    <textarea
                      rows={6}
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                      value={formData.coordinates || ''}
                      onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                      placeholder='{"type":"Polygon","coordinates":[[[lng,lat],[lng,lat]...]]}'
                      disabled={building && !polygonEditable}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {polygonEditable || !building 
                        ? 'Enter GeoJSON polygon coordinates for the building footprint' 
                        : 'Polygon editing is locked. Click "Edit Polygon" to make changes'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Floor Plans (JSON)</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                    value={formData.floorPlans || ''}
                    onChange={(e) => setFormData({ ...formData, floorPlans: e.target.value })}
                    placeholder='[{"floor": 1, "imageUrl": "..."}]'
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional: Array of floor plan data</p>
                </div>
              </div>
            )}

            {/* 3D Model Tab */}
            {activeTab === 'model' && (
              <div className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Select a 3D model uploaded in Map Settings and configure its position, rotation, and scale for this building.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select 3D Model</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.modelId || ''}
                    onChange={(e) => setFormData({ ...formData, modelId: e.target.value || null })}
                  >
                    <option value="">No Model</option>
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Models are uploaded in Map Settings → 3D Campus Models
                  </p>
                </div>

                {formData.modelId && (
                  <>
                    {/* Scale */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Scale</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.modelScale}
                        onChange={(e) => setFormData({ ...formData, modelScale: parseFloat(e.target.value) || 1.0 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Default: 1.0</p>
                    </div>

                    {/* Rotation */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Rotation (degrees)</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">X-axis</label>
                          <input
                            type="number"
                            step="1"
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.modelRotationX}
                            onChange={(e) => setFormData({ ...formData, modelRotationX: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Y-axis</label>
                          <input
                            type="number"
                            step="1"
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.modelRotationY}
                            onChange={(e) => setFormData({ ...formData, modelRotationY: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Z-axis</label>
                          <input
                            type="number"
                            step="1"
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.modelRotationZ}
                            onChange={(e) => setFormData({ ...formData, modelRotationZ: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Offset */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Position Offset (meters)</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">X-offset</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.modelOffsetX}
                            onChange={(e) => setFormData({ ...formData, modelOffsetX: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Y-offset</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.modelOffsetY}
                            onChange={(e) => setFormData({ ...formData, modelOffsetY: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Z-offset</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.modelOffsetZ}
                            onChange={(e) => setFormData({ ...formData, modelOffsetZ: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Building Images</label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop images
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </label>
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleImageDragStart(index)}
                        onDragOver={(e) => handleImageDragOver(e, index)}
                        onDragEnd={handleImageDragEnd}
                        className="relative group border rounded-lg overflow-hidden cursor-move hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-video bg-muted">
                          <img
                            src={image.url}
                            alt={image.caption || `Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 bg-background">
                          <input
                            type="text"
                            placeholder="Caption..."
                            className="w-full text-xs px-2 py-1 border rounded"
                            value={image.caption}
                            onChange={(e) => {
                              const newImages = [...formData.images]
                              newImages[index].caption = e.target.value
                              setFormData({ ...formData, images: newImages })
                            }}
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                          #{index + 1}
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Building Documents</label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload"
                    />
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop documents
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, XLS up to 10MB
                      </p>
                    </label>
                  </div>
                </div>

                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    {formData.documents.map((doc, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDocDragStart(index)}
                        onDragOver={(e) => handleDocDragOver(e, index)}
                        onDragEnd={handleDocDragEnd}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-md transition-shadow cursor-move group"
                      >
                        <GripVertical className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        <FileText className="w-8 h-8 text-primary" />
                        <div className="flex-1">
                          <input
                            type="text"
                            className="w-full text-sm font-medium px-2 py-1 border rounded"
                            value={doc.title}
                            onChange={(e) => {
                              const newDocs = [...formData.documents]
                              newDocs[index].title = e.target.value
                              setFormData({ ...formData, documents: newDocs })
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">{doc.fileType}</p>
                        </div>
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDocument(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Operating Hours Tab */}
            {activeTab === 'hours' && (
              <div>
                <OperatingHoursEditor
                  hours={formData.operatingHours}
                  onChange={(hours) => setFormData({ ...formData, operatingHours: hours })}
                />
              </div>
            )}

            {/* Contact Info Tab */}
            {activeTab === 'contact' && (
              <div>
                <ContactInfoEditor
                  contacts={formData.contactInfo}
                  onChange={(info) => setFormData({ ...formData, contactInfo: info })}
                />
              </div>
            )}

            {/* Services & Amenities Tab */}
            {activeTab === 'amenities' && (
              <div>
                <AmenitiesSelector
                  selectedAmenities={formData.amenities}
                  onChange={(amenities) => setFormData({ ...formData, amenities })}
                />
              </div>
            )}
          </CardContent>

          {/* Fixed Footer */}
          <div className="border-t p-6 flex-shrink-0 bg-background">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {building ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  building ? 'Update Building' : 'Create Building'
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
