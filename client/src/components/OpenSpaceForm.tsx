/**
 * OpenSpaceForm Component
 * Purpose: Form for creating and editing open spaces with full feature support
 * Features: Multi-tab interface, image/document upload, operating hours, contact info
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

interface OpenSpaceFormData {
  name: string
  slug: string
  description: string
  campusId: string
  address: string
  coordinates: string | null
  openSpaceType: string
  capacity: number | null
  isReservable: boolean
  isActive: boolean
  accessibility: string[]
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

interface OpenSpaceFormProps {
  openSpace?: any
  onSubmit: (data: OpenSpaceFormData) => void
  onCancel: () => void
  campuses?: Array<{ id: string; name: string }>
  isLoading?: boolean
}

const openSpaceTypes = [
  { value: 'park', label: 'Park' },
  { value: 'garden', label: 'Garden' },
  { value: 'plaza', label: 'Plaza' },
  { value: 'courtyard', label: 'Courtyard' },
  { value: 'sports_field', label: 'Sports Field' },
  { value: 'playground', label: 'Playground' },
  { value: 'amphitheater', label: 'Amphitheater' },
  { value: 'other', label: 'Other' },
]

const accessibilityFeatures = [
  'Wheelchair Accessible',
  'Wheelchair Parking',
  'Accessible Restrooms',
  'Braille Signage',
  'Audio Announcements',
  'Accessible Paths',
  'Reserved Seating',
  'Assisted Listening',
]

// Amenity name to ID mapping for AmenitiesSelector
const AMENITY_NAME_TO_ID: Record<string, string> = {
  'Wheelchair Accessible': 'wheelchair-accessible',
  'Elevator': 'elevator',
  'Ramps': 'ramps',
  'Accessible Parking': 'accessible-parking',
  'Accessible Restrooms': 'accessible-restrooms',
  'Braille Signage': 'braille-signage',
  'Wi-Fi': 'wifi',
  'Computer Lab': 'computer-lab',
  'Projector': 'projector',
  'Smart Board': 'smart-board',
  'AV Equipment': 'av-equipment',
  'Video Conferencing': 'video-conferencing',
  'Charging Stations': 'charging-stations',
  'Cafeteria': 'cafeteria',
  'Vending Machines': 'vending-machines',
  'Kitchen': 'kitchen',
  'Lounge Area': 'lounge',
  'Study Rooms': 'study-rooms',
  'Conference Rooms': 'conference-rooms',
  'Auditorium': 'auditorium',
  'Library': 'library',
  'Security Cameras': 'security-cameras',
  'Emergency Exits': 'emergency-exits',
  'Fire Extinguishers': 'fire-extinguishers',
  'First Aid Station': 'first-aid',
  'Security Desk': 'security-desk',
  'Emergency Lighting': 'emergency-lighting',
  'Air Conditioning': 'air-conditioning',
  'Heating': 'heating',
  'Natural Lighting': 'natural-lighting',
  'Comfortable Seating': 'comfortable-seating',
  'Water Fountains': 'water-fountains',
  'Parking Lot': 'parking-lot',
  'Bike Racks': 'bike-racks',
  'Outdoor Seating': 'outdoor-seating',
  'Garden Area': 'garden',
  'Reception Desk': 'reception',
  'Mail Room': 'mail-room',
  'Printing Services': 'printing',
  'Copy Center': 'copy-center',
  'Lost & Found': 'lost-and-found',
}

const AMENITY_ID_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(AMENITY_NAME_TO_ID).map(([name, id]) => [id, name])
)

export function OpenSpaceForm({ openSpace, onSubmit, onCancel, isLoading = false }: OpenSpaceFormProps) {
  console.log('OpenSpaceForm - openSpace prop:', openSpace)
  console.log('OpenSpaceForm - openSpace.contactInfo:', openSpace?.contactInfo)
  console.log('OpenSpaceForm - openSpace.amenities:', openSpace?.amenities)
  console.log('OpenSpaceForm - openSpace.operatingHours:', openSpace?.operatingHours)
  
  const [activeTab, setActiveTab] = useState('basic')
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [polygonEditable, setPolygonEditable] = useState(false)
  
  const [formData, setFormData] = useState<OpenSpaceFormData>({
    name: openSpace?.name || '',
    slug: openSpace?.slug || '',
    description: openSpace?.description || '',
    campusId: openSpace?.campusId || '',
    address: openSpace?.address || '',
    coordinates: openSpace?.coordinates || null,
    openSpaceType: openSpace?.openSpaceType || 'park',
    capacity: openSpace?.capacity || null,
    isReservable: openSpace?.isReservable || false,
    isActive: openSpace?.isActive ?? true,
    accessibility: openSpace?.accessibility ? JSON.parse(openSpace.accessibility) : [],
    // 3D Model Configuration
    modelId: openSpace?.modelId || null,
    modelScale: openSpace?.modelScale || 1.0,
    modelRotationX: openSpace?.modelRotationX || 0.0,
    modelRotationY: openSpace?.modelRotationY || 0.0,
    modelRotationZ: openSpace?.modelRotationZ || 0.0,
    modelOffsetX: openSpace?.modelOffsetX || 0.0,
    modelOffsetY: openSpace?.modelOffsetY || 0.0,
    modelOffsetZ: openSpace?.modelOffsetZ || 0.0,
    images: openSpace?.images?.map((img: any, idx: number) => ({
      id: img.id,
      url: img.imageUrl,
      caption: img.caption || '',
      displayOrder: img.displayOrder || idx,
    })) || [],
    documents: openSpace?.documents?.map((doc: any, idx: number) => ({
      id: doc.id,
      url: doc.documentUrl,
      title: doc.title,
      fileType: doc.fileType,
      displayOrder: doc.displayOrder || idx,
    })) || [],
    operatingHours: openSpace?.operatingHours || [],
    contactInfo: openSpace?.contactInfo || [],
    amenities: openSpace?.amenities?.map((a: any) => {
      const name = a.amenity?.name || a.amenityId
      const id = AMENITY_NAME_TO_ID[name] || name
      console.log(`Mapping amenity: ${name} -> ${id}`)
      return id
    }) || [],
  })
  
  console.log('OpenSpaceForm - Initial formData.contactInfo:', formData.contactInfo)
  console.log('OpenSpaceForm - Initial formData.amenities:', formData.amenities)
  console.log('OpenSpaceForm - Initial formData.operatingHours:', formData.operatingHours)

  const [accessibilityInput, setAccessibilityInput] = useState('')
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

  // Update form data when openSpace prop changes (for editing)
  useEffect(() => {
    if (openSpace) {
      setFormData({
        name: openSpace.name || '',
        slug: openSpace.slug || '',
        description: openSpace.description || '',
        campusId: openSpace.campusId || '',
        address: openSpace.address || '',
        coordinates: openSpace.coordinates || null,
        openSpaceType: openSpace.openSpaceType || 'park',
        capacity: openSpace.capacity || null,
        isReservable: openSpace.isReservable || false,
        isActive: openSpace.isActive ?? true,
        accessibility: openSpace.accessibility ? JSON.parse(openSpace.accessibility) : [],
        // 3D Model Configuration
        modelId: openSpace.modelId || null,
        modelScale: openSpace.modelScale || 1.0,
        modelRotationX: openSpace.modelRotationX || 0.0,
        modelRotationY: openSpace.modelRotationY || 0.0,
        modelRotationZ: openSpace.modelRotationZ || 0.0,
        modelOffsetX: openSpace.modelOffsetX || 0.0,
        modelOffsetY: openSpace.modelOffsetY || 0.0,
        modelOffsetZ: openSpace.modelOffsetZ || 0.0,
        images: openSpace.images?.map((img: any, idx: number) => ({
          id: img.id,
          url: img.imageUrl,
          caption: img.caption || '',
          displayOrder: img.displayOrder || idx,
        })) || [],
        documents: openSpace.documents?.map((doc: any, idx: number) => ({
          id: doc.id,
          url: doc.documentUrl,
          title: doc.title,
          fileType: doc.fileType,
          displayOrder: doc.displayOrder || idx,
        })) || [],
        operatingHours: openSpace.operatingHours || [],
        contactInfo: openSpace.contactInfo || [],
        amenities: openSpace.amenities?.map((a: any) => {
          const name = a.amenity?.name || a.amenityId
          return AMENITY_NAME_TO_ID[name] || name
        }) || [],
      })
    }
  }, [openSpace])

  // Update slug when name changes
  useEffect(() => {
    if (!openSpace) { // Only auto-generate for new open spaces
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name, openSpace])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Convert amenity IDs back to names for the server
    const submitData = {
      ...formData,
      amenities: formData.amenities.map(id => AMENITY_ID_TO_NAME[id] || id)
    }
    onSubmit(submitData)
  }

  const addAccessibilityFeature = () => {
    if (accessibilityInput.trim() && !formData.accessibility.includes(accessibilityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        accessibility: [...prev.accessibility, accessibilityInput.trim()]
      }))
      setAccessibilityInput('')
    }
  }

  const removeAccessibilityFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      accessibility: prev.accessibility.filter(f => f !== feature)
    }))
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'location', label: 'Location & Polygon' },
    { id: 'model', label: '3D Model' },
    { id: 'hours', label: 'Operating Hours' },
    { id: 'contact', label: 'Contact Info' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'images', label: 'Images' },
    { id: 'documents', label: 'Documents' },
  ]

  const addImage = (files: FileList | null) => {
    if (!files) return
    const newImages = Array.from(files).map((file, index) => ({
      file,
      url: URL.createObjectURL(file),
      caption: '',
      displayOrder: formData.images.length + index,
    }))
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }))
  }

  const addDocument = (files: FileList | null) => {
    if (!files) return
    const newDocs = Array.from(files).map((file, index) => ({
      file,
      url: URL.createObjectURL(file),
      title: file.name,
      fileType: file.type,
      displayOrder: formData.documents.length + index,
    }))
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...newDocs] }))
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
      <Card className="w-full h-full sm:h-[90vh] sm:max-w-5xl flex flex-col sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
        {/* Fixed Header */}
        <CardHeader className="border-b flex-shrink-0 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-2xl truncate">
                {openSpace ? 'Edit Open Space' : 'Add New Open Space'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2">
                {openSpace ? 'Update open space information' : 'Create a new open space with images and documents'}
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
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                      placeholder="auto-generated-from-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select
                    value={formData.openSpaceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, openSpaceType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                    required
                  >
                    {openSpaceTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reservable"
                        checked={formData.isReservable}
                        onChange={(e) => setFormData(prev => ({ ...prev, isReservable: e.target.checked }))}
                        className="mr-2"
                      />
                      <label htmlFor="reservable" className="text-sm">Reservable</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="active"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="mr-2"
                      />
                      <label htmlFor="active" className="text-sm">Active</label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Location & Polygon Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary resize-none"
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter open space address..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Coordinates (GeoJSON Polygon)</label>
                    {openSpace && (
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
                      className={`w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-primary font-mono text-sm resize-none ${
                        openSpace && !polygonEditable ? 'bg-muted cursor-not-allowed' : 'bg-background'
                      }`}
                      value={formData.coordinates || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, coordinates: e.target.value }))}
                      placeholder='{"type":"Polygon","coordinates":[[[lng,lat],[lng,lat]...]]}'
                      disabled={openSpace && !polygonEditable}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {polygonEditable || !openSpace
                        ? 'Enter GeoJSON polygon coordinates for the open space footprint'
                        : 'Polygon editing is locked. Click "Edit Polygon" to make changes'}
                    </p>
                  </div>
                </div>

                {/* Accessibility Features */}
                <div>
                  <label className="block text-sm font-medium mb-2">Accessibility Features</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={accessibilityInput}
                      onChange={(e) => setAccessibilityInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAccessibilityFeature())}
                      placeholder="Add accessibility feature..."
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                    />
                    <Button type="button" onClick={addAccessibilityFeature}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {accessibilityFeatures.map(feature => (
                      <Button
                        key={feature}
                        type="button"
                        variant={formData.accessibility.includes(feature) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (formData.accessibility.includes(feature)) {
                            removeAccessibilityFeature(feature)
                          } else {
                            setFormData(prev => ({ ...prev, accessibility: [...prev.accessibility, feature] }))
                          }
                        }}
                      >
                        {feature}
                      </Button>
                    ))}
                  </div>
                  {formData.accessibility.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.accessibility.map(feature => (
                        <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeAccessibilityFeature(feature)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3D Model Tab */}
            {activeTab === 'model' && (
              <div className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Select a 3D model uploaded in Map Settings and configure its position, rotation, and scale for this open space.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select 3D Model</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                    value={formData.modelId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, modelId: e.target.value || null }))}
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
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                        value={formData.modelScale}
                        onChange={(e) => setFormData(prev => ({ ...prev, modelScale: parseFloat(e.target.value) || 1.0 }))}
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
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                            value={formData.modelRotationX}
                            onChange={(e) => setFormData(prev => ({ ...prev, modelRotationX: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Y-axis</label>
                          <input
                            type="number"
                            step="1"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                            value={formData.modelRotationY}
                            onChange={(e) => setFormData(prev => ({ ...prev, modelRotationY: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Z-axis</label>
                          <input
                            type="number"
                            step="1"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                            value={formData.modelRotationZ}
                            onChange={(e) => setFormData(prev => ({ ...prev, modelRotationZ: parseFloat(e.target.value) || 0 }))}
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
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                            value={formData.modelOffsetX}
                            onChange={(e) => setFormData(prev => ({ ...prev, modelOffsetX: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Y-offset</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                            value={formData.modelOffsetY}
                            onChange={(e) => setFormData(prev => ({ ...prev, modelOffsetY: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Z-offset</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                            value={formData.modelOffsetZ}
                            onChange={(e) => setFormData(prev => ({ ...prev, modelOffsetZ: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Operating Hours Tab */}
            {activeTab === 'hours' && (
              <div>
                <OperatingHoursEditor
                  hours={formData.operatingHours}
                  onChange={(hours) => setFormData(prev => ({ ...prev, operatingHours: hours }))}
                />
              </div>
            )}

            {/* Contact Info Tab */}
            {activeTab === 'contact' && (
              <div>
                <ContactInfoEditor
                  contacts={formData.contactInfo}
                  onChange={(contacts) => setFormData(prev => ({ ...prev, contactInfo: contacts }))}
                />
              </div>
            )}

            {/* Amenities Tab */}
            {activeTab === 'amenities' && (
              <div>
                <AmenitiesSelector
                  selectedAmenities={formData.amenities}
                  onChange={(amenities) => setFormData(prev => ({ ...prev, amenities }))}
                />
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Open Space Images</label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={(e) => addImage(e.target.files)}
                      className="hidden"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop images
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF up to 10MB each
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
                            onClick={() => {
                              const newImages = formData.images.filter((_, i) => i !== index)
                              setFormData({ ...formData, images: newImages })
                            }}
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
                  <label className="block text-sm font-medium mb-2">Open Space Documents</label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                    <input
                      type="file"
                      id="document-upload"
                      multiple
                      onChange={(e) => addDocument(e.target.files)}
                      className="hidden"
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
                          onClick={() => {
                            const newDocs = formData.documents.filter((_, i) => i !== index)
                            setFormData({ ...formData, documents: newDocs })
                          }}
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
                    {openSpace ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  openSpace ? 'Update Open Space' : 'Create Open Space'
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
