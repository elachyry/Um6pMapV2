/**
 * BuildingForm Component
 * Purpose: Form for creating and editing buildings with image/document uploads
 * Inputs: building data (optional for edit mode), onSubmit, onCancel
 * Outputs: Building form data with images and documents
 */

import { useState, useEffect } from 'react'
import { X, Upload, FileText, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { OperatingHoursEditor } from './OperatingHoursEditor'
import { ContactInfoEditor } from './ContactInfoEditor'
import { AmenitiesSelector } from './AmenitiesSelector'

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
  coordinates: { lat: number; lng: number } | null
  capacity: number | null
  isReservable: boolean
  isActive: boolean
  facilities: string[]
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
}

export function BuildingForm({ building, onSubmit, onCancel, campuses = [], categories = [] }: BuildingFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState<BuildingFormData>({
    name: building?.name || '',
    slug: building?.slug || '',
    description: building?.description || '',
    campusId: building?.campusId || '',
    categoryId: building?.categoryId || '',
    address: building?.address || '',
    coordinates: building?.coordinates ? JSON.parse(building.coordinates) : null,
    capacity: building?.capacity || null,
    isReservable: building?.isReservable || false,
    isActive: building?.isActive ?? true,
    facilities: building?.facilities ? JSON.parse(building.facilities) : [],
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
  const [latInput, setLatInput] = useState(building?.coordinates ? JSON.parse(building.coordinates).lat : '')
  const [lngInput, setLngInput] = useState(building?.coordinates ? JSON.parse(building.coordinates).lng : '')

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

  // Update coordinates when lat/lng change
  useEffect(() => {
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)
    if (!isNaN(lat) && !isNaN(lng)) {
      setFormData(prev => ({ ...prev, coordinates: { lat, lng } }))
    } else {
      setFormData(prev => ({ ...prev, coordinates: null }))
    }
  }, [latInput, lngInput])

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
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }))
  }

  const updateImageCaption = (index: number, caption: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? { ...img, caption } : img),
    }))
  }

  const updateDocumentTitle = (index: number, title: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) => i === index ? { ...doc, title } : doc),
    }))
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <Card className="w-full max-w-4xl my-8" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="sticky top-0 bg-background border-b z-10">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {building ? 'Edit Building' : 'Add New Building'}
              </CardTitle>
              <CardDescription>
                {building ? 'Update building information' : 'Create a new building with images and documents'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          {/* Tabs */}
          <div className="border-b">
            <div className="flex gap-1 px-6 overflow-x-auto">
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'location', label: 'Location' },
                { id: 'hours', label: 'Operating Hours' },
                { id: 'contact', label: 'Contact Info' },
                { id: 'amenities', label: 'Services & Amenities' },
                { id: 'media', label: 'Images & Documents' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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

          <CardContent className="p-6 space-y-6">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
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
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Legacy Facilities */}
              <div>
                <label className="block text-sm font-medium mb-1">Facilities (Legacy)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded-md"
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                    placeholder="Type and press Enter"
                  />
                  <Button type="button" onClick={addFacility}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.facilities.map((facility, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      {facility}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeFacility(facility)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                    placeholder="e.g., 33.5731"
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
                    placeholder="e.g., -7.5898"
                  />
                </div>
              </div>
            </div>
            )}

            {/* Operating Hours Tab */}
            {activeTab === 'hours' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Operating Hours</h3>
                <p className="text-sm text-muted-foreground">Set when this building is open to visitors</p>
                <OperatingHoursEditor
                  hours={formData.operatingHours}
                  onChange={(hours) => setFormData({ ...formData, operatingHours: hours })}
                />
              </div>
            )}

            {/* Contact Information Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <p className="text-sm text-muted-foreground">Add phones, emails, websites, and social media</p>
                <ContactInfoEditor
                  contacts={formData.contactInfo}
                  onChange={(contacts) => setFormData({ ...formData, contactInfo: contacts })}
                />
              </div>
            )}

            {/* Amenities Tab */}
            {activeTab === 'amenities' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Services & Amenities</h3>
                <p className="text-sm text-muted-foreground">Select available services and amenities</p>
                <AmenitiesSelector
                  selectedAmenities={formData.amenities}
                  onChange={(amenities) => setFormData({ ...formData, amenities })}
                />
              </div>
            )}

            {/* Images & Documents Tab */}
            {activeTab === 'media' && (
            <div className="space-y-6">
            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Images</h3>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-md hover:bg-muted transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Upload Images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.images.map((image, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-3">
                      <div className="relative aspect-video bg-muted rounded-md overflow-hidden mb-2">
                        <img src={image.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <input
                        type="text"
                        placeholder="Caption (optional)"
                        className="w-full px-2 py-1 text-sm border rounded"
                        value={image.caption}
                        onChange={(e) => updateImageCaption(idx, e.target.value)}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documents</h3>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-md hover:bg-muted transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Upload Documents</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    className="hidden"
                    onChange={handleDocumentUpload}
                  />
                </label>
              </div>
              <div className="space-y-2">
                {formData.documents.map((doc, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            placeholder="Document title"
                            className="w-full px-2 py-1 text-sm border rounded mb-1"
                            value={doc.title}
                            onChange={(e) => updateDocumentTitle(idx, e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground truncate">{doc.fileType}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(idx)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            </div>
            )}
          </CardContent>

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-background border-t p-4">
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {building ? 'Update Building' : 'Create Building'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
