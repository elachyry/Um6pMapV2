/**
 * LocationForm Component
 * Purpose: Form for creating and editing locations
 * Features: Mobile-responsive with dropdown tabs on mobile
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { OperatingHoursEditor } from './OperatingHoursEditor'
import { ContactInfoEditor } from './ContactInfoEditor'

interface LocationFormData {
  name: string
  buildingId: string
  floor: number
  roomNumber: string
  description: string
  coordinates: string | null
  locationType: string
  capacity: number | null
  isReservable: boolean
  facilities: string[]
  operatingHours: any[]
  contactInfo: any[]
}

interface LocationFormProps {
  location?: any
  buildings: any[]
  onSubmit: (data: LocationFormData) => void
  onCancel: () => void
}

export default function LocationForm({ location, buildings, onSubmit, onCancel }: LocationFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [facilityInput, setFacilityInput] = useState('')

  const [formData, setFormData] = useState<LocationFormData>({
    name: location?.name || '',
    buildingId: location?.buildingId || '',
    floor: location?.floor || 0,
    roomNumber: location?.roomNumber || '',
    description: location?.description || '',
    coordinates: location?.coordinates || null,
    locationType: location?.locationType || 'room',
    capacity: location?.capacity || null,
    isReservable: location?.isReservable || false,
    facilities: location?.facilities ? JSON.parse(location.facilities) : [],
    operatingHours: location?.operatingHours || [],
    contactInfo: location?.contactInfo || [],
  })

  // Update formData when location prop changes
  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || '',
        buildingId: location.buildingId || '',
        floor: location.floor || '',
        roomNumber: location.roomNumber || '',
        description: location.description || '',
        coordinates: location.coordinates || null,
        locationType: location.locationType || 'room',
        capacity: location.capacity || null,
        isReservable: location.isReservable || false,
        facilities: location.facilities ? JSON.parse(location.facilities) : [],
        operatingHours: location.operatingHours || [],
        contactInfo: location.contactInfo || [],
      })
    }
  }, [location])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleAddFacility = () => {
    if (facilityInput.trim() && !formData.facilities.includes(facilityInput.trim())) {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, facilityInput.trim()]
      })
      setFacilityInput('')
    }
  }

  const handleRemoveFacility = (facility: string) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.filter(f => f !== facility)
    })
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'hours', label: 'Operating Hours' },
    { id: 'contact', label: 'Contact Info' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
      <Card className="w-full h-full sm:h-[90vh] sm:max-w-4xl flex flex-col sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
        {/* Fixed Header */}
        <CardHeader className="border-b flex-shrink-0 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-2xl truncate">
                {location ? 'Edit Location' : 'Add New Location'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2">
                {location ? 'Update location information' : 'Create a new location'}
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
          <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Location Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Room 101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Building <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={formData.buildingId}
                      onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
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
                    <label className="block text-sm font-medium mb-1">
                      Floor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 0, 1, 2, -1 for basement"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Room Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      placeholder="e.g., 101, A-205"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Location Type</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={formData.locationType}
                      onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                    >
                      <option value="room">Room</option>
                      <option value="office">Office</option>
                      <option value="lab">Laboratory</option>
                      <option value="classroom">Classroom</option>
                      <option value="auditorium">Auditorium</option>
                      <option value="library">Library</option>
                      <option value="cafeteria">Cafeteria</option>
                      <option value="gym">Gym</option>
                      <option value="parking">Parking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Capacity</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Number of people"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the location..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isReservable"
                    checked={formData.isReservable}
                    onChange={(e) => setFormData({ ...formData, isReservable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isReservable" className="text-sm font-medium">
                    This location is reservable
                  </label>
                </div>

                {/* Facilities */}
                <div>
                  <label className="block text-sm font-medium mb-2">Facilities & Equipment</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                      value={facilityInput}
                      onChange={(e) => setFacilityInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFacility())}
                      placeholder="e.g., Projector, Whiteboard, WiFi"
                    />
                    <Button type="button" onClick={handleAddFacility} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.facilities.map((facility, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                      >
                        {facility}
                        <button
                          type="button"
                          onClick={() => handleRemoveFacility(facility)}
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
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
          </CardContent>

          {/* Fixed Footer */}
          <div className="border-t p-4 sm:p-6 flex gap-2 flex-shrink-0 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none">
              {location ? 'Update Location' : 'Create Location'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
