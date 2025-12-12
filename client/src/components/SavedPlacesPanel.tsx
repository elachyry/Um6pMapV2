/**
 * SavedPlacesPanel Component
 * Purpose: Display user's saved places (buildings, locations, open spaces)
 * Inputs: onClose callback, onPlaceClick callback
 * Outputs: Modal with saved places list
 */

import { useState, useEffect } from 'react'
import { X, MapPin, Loader2, Building2, Trees, Bookmark } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'

interface SavedPlace {
  id: string
  placeId: string
  placeType: string
  placeName: string
  createdAt: string
}

interface SavedPlacesPanelProps {
  onClose: () => void
  onPlaceClick: (placeId: string, placeType: 'building' | 'openSpace') => void
}

export function SavedPlacesPanel({ onClose, onPlaceClick }: SavedPlacesPanelProps) {
  const toast = useToast()
  const { user } = useAuthStore()
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [unsavingId, setUnsavingId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchSavedPlaces()
    }
  }, [user?.id])

  const fetchSavedPlaces = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/saved-places/user/${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (response.ok) {
        const result = await response.json()
        setSavedPlaces(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch saved places:', error)
      toast.error('Failed to load saved places')
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceClick = (place: SavedPlace, e: React.MouseEvent) => {
    // Don't trigger if clicking the unsave button
    if ((e.target as HTMLElement).closest('.unsave-button')) {
      return
    }
    
    if (place.placeType === 'building' || place.placeType === 'openSpace') {
      onPlaceClick(place.placeId, place.placeType as 'building' | 'openSpace')
      onClose()
    }
  }

  const handleUnsave = async (place: SavedPlace, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user) return

    setUnsavingId(place.id)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/saved-places`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            userId: user.id,
            placeId: place.placeId,
            placeType: place.placeType
          })
        }
      )
      
      if (response.ok) {
        setSavedPlaces(prev => prev.filter(p => p.id !== place.id))
        toast.success('Removed from saved places')
      } else {
        toast.error('Failed to remove place')
      }
    } catch (error) {
      console.error('Failed to unsave place:', error)
      toast.error('Failed to remove place')
    } finally {
      setUnsavingId(null)
    }
  }

  const getPlaceIcon = (placeType: string) => {
    switch (placeType) {
      case 'building':
        return <Building2 className="w-5 h-5 text-primary" />
      case 'openSpace':
        return <Trees className="w-5 h-5 text-green-600" />
      case 'location':
        return <MapPin className="w-5 h-5 text-orange-600" />
      default:
        return <MapPin className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getPlaceTypeLabel = (placeType: string) => {
    switch (placeType) {
      case 'building':
        return 'Building'
      case 'openSpace':
        return 'Open Space'
      case 'location':
        return 'Location'
      default:
        return placeType
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel - Centered Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-lg">
            <h2 className="text-lg sm:text-xl font-bold">Saved Places</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : savedPlaces.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved places yet</h3>
              <p className="text-gray-500 text-sm">Save places from the map to see them here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedPlaces.map((place) => (
                <div
                  key={place.id}
                  className="relative w-full p-3 sm:p-4 border border-border rounded-lg hover:shadow-md hover:border-primary/50 transition-all bg-card group"
                >
                  <button
                    onClick={(e) => handlePlaceClick(place, e)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getPlaceIcon(place.placeType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">
                          {place.placeName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded">
                            {getPlaceTypeLabel(place.placeType)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(place.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </button>

                  {/* Unsave Button */}
                  <button
                    onClick={(e) => handleUnsave(place, e)}
                    disabled={unsavingId === place.id}
                    className="unsave-button absolute top-2 right-2 w-8 h-8 rounded-full bg-card hover:bg-destructive/10 border border-border flex items-center justify-center transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                    title="Remove from saved places"
                  >
                    {unsavingId === place.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                    ) : (
                      <Bookmark className="w-4 h-4 text-destructive fill-current" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  )
}
