/**
 * AmenitiesSelector Component
 * Purpose: Select amenities grouped by category with custom options
 * Inputs: selectedAmenities array, onChange callback
 * Outputs: Updated amenities array
 */

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'

interface AmenitiesSelectorProps {
  selectedAmenities: string[] // Array of amenity IDs
  onChange: (amenities: string[]) => void
}

// Predefined amenities grouped by category
const AMENITY_CATEGORIES = {
  Accessibility: [
    { id: 'wheelchair-accessible', name: 'Wheelchair Accessible' },
    { id: 'elevator', name: 'Elevator' },
    { id: 'ramps', name: 'Ramps' },
    { id: 'accessible-parking', name: 'Accessible Parking' },
    { id: 'accessible-restrooms', name: 'Accessible Restrooms' },
    { id: 'braille-signage', name: 'Braille Signage' },
  ],
  Technology: [
    { id: 'wifi', name: 'Wi-Fi' },
    { id: 'computer-lab', name: 'Computer Lab' },
    { id: 'projector', name: 'Projector' },
    { id: 'smart-board', name: 'Smart Board' },
    { id: 'av-equipment', name: 'AV Equipment' },
    { id: 'video-conferencing', name: 'Video Conferencing' },
    { id: 'charging-stations', name: 'Charging Stations' },
  ],
  Facilities: [
    { id: 'cafeteria', name: 'Cafeteria' },
    { id: 'vending-machines', name: 'Vending Machines' },
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'lounge', name: 'Lounge Area' },
    { id: 'study-rooms', name: 'Study Rooms' },
    { id: 'conference-rooms', name: 'Conference Rooms' },
    { id: 'auditorium', name: 'Auditorium' },
    { id: 'library', name: 'Library' },
  ],
  Safety: [
    { id: 'security-cameras', name: 'Security Cameras' },
    { id: 'emergency-exits', name: 'Emergency Exits' },
    { id: 'fire-extinguishers', name: 'Fire Extinguishers' },
    { id: 'first-aid', name: 'First Aid Station' },
    { id: 'security-desk', name: 'Security Desk' },
    { id: 'emergency-lighting', name: 'Emergency Lighting' },
  ],
  Comfort: [
    { id: 'air-conditioning', name: 'Air Conditioning' },
    { id: 'heating', name: 'Heating' },
    { id: 'natural-lighting', name: 'Natural Lighting' },
    { id: 'comfortable-seating', name: 'Comfortable Seating' },
    { id: 'water-fountains', name: 'Water Fountains' },
  ],
  'Outdoor & Parking': [
    { id: 'parking-lot', name: 'Parking Lot' },
    { id: 'bike-racks', name: 'Bike Racks' },
    { id: 'outdoor-seating', name: 'Outdoor Seating' },
    { id: 'garden', name: 'Garden Area' },
  ],
  Services: [
    { id: 'reception', name: 'Reception Desk' },
    { id: 'mail-room', name: 'Mail Room' },
    { id: 'printing', name: 'Printing Services' },
    { id: 'copy-center', name: 'Copy Center' },
    { id: 'lost-and-found', name: 'Lost & Found' },
  ],
}

export function AmenitiesSelector({ selectedAmenities, onChange }: AmenitiesSelectorProps) {
  const [customAmenity, setCustomAmenity] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(Object.keys(AMENITY_CATEGORIES))

  const toggleAmenity = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      onChange(selectedAmenities.filter((id) => id !== amenityId))
    } else {
      onChange([...selectedAmenities, amenityId])
    }
  }

  const addCustomAmenity = () => {
    if (!customAmenity.trim()) return
    const customId = `custom-${Date.now()}`
    onChange([...selectedAmenities, customId])
    // TODO: You'll need to store custom amenity names separately
    setCustomAmenity('')
  }

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter((c) => c !== category))
    } else {
      setExpandedCategories([...expandedCategories, category])
    }
  }

  const selectAllInCategory = (category: string) => {
    const categoryAmenities = AMENITY_CATEGORIES[category as keyof typeof AMENITY_CATEGORIES].map(
      (a) => a.id
    )
    const newSelected = [...selectedAmenities]
    categoryAmenities.forEach((id) => {
      if (!newSelected.includes(id)) {
        newSelected.push(id)
      }
    })
    onChange(newSelected)
  }

  const deselectAllInCategory = (category: string) => {
    const categoryAmenities = AMENITY_CATEGORIES[category as keyof typeof AMENITY_CATEGORIES].map(
      (a) => a.id
    )
    onChange(selectedAmenities.filter((id) => !categoryAmenities.includes(id)))
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{selectedAmenities.length} amenities selected</Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (expandedCategories.length === Object.keys(AMENITY_CATEGORIES).length) {
              setExpandedCategories([])
            } else {
              setExpandedCategories(Object.keys(AMENITY_CATEGORIES))
            }
          }}
        >
          {expandedCategories.length === Object.keys(AMENITY_CATEGORIES).length
            ? 'Collapse All'
            : 'Expand All'}
        </Button>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {Object.entries(AMENITY_CATEGORIES).map(([category, amenities]) => {
          const isExpanded = expandedCategories.includes(category)
          const selectedCount = amenities.filter((a) => selectedAmenities.includes(a.id)).length

          return (
            <Card key={category}>
              <CardContent className="p-0">
                {/* Category Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-sm">{category}</h4>
                    <Badge variant="outline" className="text-xs">
                      {selectedCount}/{amenities.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded && selectedCount < amenities.length && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          selectAllInCategory(category)
                        }}
                      >
                        Select All
                      </Button>
                    )}
                    {isExpanded && selectedCount > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deselectAllInCategory(category)
                        }}
                      >
                        Clear
                      </Button>
                    )}
                    <span className="text-muted-foreground">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {/* Amenities List */}
                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3 pt-0 border-t">
                    {amenities.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.id)
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <span>{amenity.name}</span>
                          {isSelected && <Check className="w-4 h-4" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Custom Amenity */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-3">Add Custom Amenity</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Coffee Machine, Pet Friendly..."
              className="flex-1 px-3 py-2 text-sm border rounded-md"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
            />
            <Button type="button" onClick={addCustomAmenity}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
