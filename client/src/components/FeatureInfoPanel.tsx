/**
 * FeatureInfoPanel Component
 * Purpose: Google Maps-style info panel for buildings and open spaces
 * Displays images, details, locations, and documents in a bottom sheet
 */

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  FileText, 
  Image as ImageIcon, 
  ExternalLink,
  Navigation,
  Bookmark,
  Share2,
  Star
} from 'lucide-react'

interface FeatureInfoPanelProps {
  feature: any
  featureType: 'building' | 'openSpace'
  isLoading?: boolean
  onClose: () => void
  onExpandChange?: (expanded: boolean) => void
  onDirections?: () => void
}

export function FeatureInfoPanel({ feature, featureType, isLoading = false, onClose, onExpandChange, onDirections }: FeatureInfoPanelProps) {
  const toast = useToast()
  const { user } = useAuthStore()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'hours' | 'locations' | 'services'>('overview')
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Notify parent that panel is expanded on mount (for desktop)
  useEffect(() => {
    onExpandChange?.(true)
    
    // Cleanup: notify parent that panel is collapsed on unmount
    return () => {
      onExpandChange?.(false)
    }
  }, [onExpandChange])

  // Check if item is saved
  useEffect(() => {
    if (feature?.id && user?.id) {
      checkIfSaved()
    }
  }, [feature?.id, user?.id])

  const checkIfSaved = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/saved-places/check?userId=${user?.id}&placeId=${feature.id}&placeType=${featureType}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      const result = await response.json()
      setIsSaved(result.isSaved || false)
    } catch (error) {
      console.error('Failed to check saved status:', error)
    }
  }

  const handleSaveToggle = async () => {
    if (!user) {
      toast.error('Please login to save places')
      return
    }

    setIsSaving(true)
    try {
      if (isSaved) {
        // Unsave
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
              placeId: feature.id,
              placeType: featureType
            })
          }
        )
        
        if (response.ok) {
          setIsSaved(false)
          toast.success('Removed from saved places')
        }
      } else {
        // Save
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/saved-places`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              userId: user.id,
              placeId: feature.id,
              placeType: featureType,
              placeName: feature.name
            })
          }
        )
        
        if (response.ok) {
          setIsSaved(true)
          toast.success('Saved to your places')
        }
      }
    } catch (error) {
      console.error('Failed to toggle save:', error)
      toast.error('Failed to save place')
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    setIsSharing(true)
    try {
      // Generate shareable link with proper URL encoding
      const baseUrl = window.location.origin
      const params = new URLSearchParams({
        placeId: feature.id,
        placeType: featureType
      })
      const shareUrl = `${baseUrl}/map?${params.toString()}`
      
      console.log('📤 Sharing URL:', shareUrl)
      
      // Always copy to clipboard (avoid text contamination from native share)
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    } catch (error: any) {
      console.error('Failed to share:', error)
      toast.error('Failed to copy link')
    } finally {
      setIsSharing(false)
    }
  }

  if (!feature) return null

  const images = feature.images || []
  const hasImages = images.length > 0
  
  // Get image URL - handle different possible property names
  const getImageUrl = (image: any) => {
    return image?.url || image?.imageUrl || image?.path || ''
  }

  // Convert day of week number to name
  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek] || 'Unknown'
  }

  return (
    <>
      {/* Collapsed View - Mobile Only */}
      {!isExpanded && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-[5] bg-card shadow-2xl animate-slide-up rounded-t-2xl">
          <div className="flex items-center gap-3 p-3">
            {/* Image */}
            <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              {hasImages ? (
                <img
                  src={getImageUrl(images[0])}
                  alt={feature.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  {feature.category?.icon || '📍'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{feature.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {feature.category?.name || featureType}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsExpanded(true)
                  onExpandChange?.(true)
                }}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                aria-label="Expand"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded View - Mobile & Desktop */}
      <div className={`fixed inset-x-0 bottom-0 top-[72px] z-[5] bg-card shadow-2xl flex flex-col animate-slide-up rounded-t-2xl md:absolute md:inset-y-4 md:left-4 md:right-auto md:w-full md:max-w-md md:rounded-2xl ${!isExpanded ? 'hidden md:flex' : ''}`}>
        {/* Mobile Collapse Button */}
        <button
          onClick={() => {
            setIsExpanded(false)
            onExpandChange?.(false)
          }}
          className="md:hidden absolute top-2 right-2 z-10 p-2 bg-card/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-muted transition-colors"
          aria-label="Collapse"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* Hero Image Section */}
        <div className="relative w-full h-48 bg-muted flex-shrink-0 rounded-t-2xl overflow-hidden">
        {hasImages ? (
          <>
            <img
              src={getImageUrl(images[currentImageIndex])}
              alt={feature.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const parent = e.currentTarget.parentElement
                if (parent) {
                  const placeholder = document.createElement('div')
                  placeholder.className = 'w-full h-full flex items-center justify-center bg-muted'
                  placeholder.innerHTML = '<svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>'
                  parent.appendChild(placeholder)
                }
              }}
            />
            
            {/* View Photos Button */}
            <button className="absolute bottom-3 left-3 px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-card transition-colors shadow-lg">
              <ImageIcon className="w-4 h-4" />
              View photos
            </button>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => 
                    prev === 0 ? images.length - 1 : prev - 1
                  )}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-colors shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => 
                    prev === images.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-colors shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Close Button - Desktop Only */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute top-3 right-3 w-9 h-9 items-center justify-center rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="p-4 pb-3">
          <h1 className="text-2xl font-bold mb-1">{feature.name}</h1>
          
          {/* Rating & Category */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            {feature.rating && (
              <>
                <span className="font-medium">{feature.rating}</span>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(feature.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {feature.reviewCount && <span>({feature.reviewCount})</span>}
                <span>·</span>
              </>
            )}
            <span>{feature.category?.name || (featureType === 'building' ? 'Building' : 'Open Space')}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {onDirections && (
              <button 
                onClick={onDirections}
                className="flex flex-col items-center gap-1 px-4 py-4 rounded-full bg-primary/10   hover:bg-primary/20 transition-colors min-w-fit"
              >
                <Navigation className="w-6 h-6 text-primary" />
                {/* <span className="text-xs font-medium">Directions</span> */}
              </button>
            )}
            
            <button 
              onClick={handleSaveToggle}
              disabled={isSaving}
              className="flex flex-col items-center gap-1 px-4 py-4 hover:bg-muted rounded-full transition-colors min-w-fit"
            >
              <Bookmark className={`w-6 h-6 ${
                isSaved ? 'text-primary fill-current' : 'text-muted-foreground'
              }`} />
              {/* <span className="text-xs font-medium">{isSaved ? 'Saved' : 'Save'}</span> */}
            </button>
            
          
            
            {feature.phone && (
              <button className="flex flex-col items-center gap-1 px-4 py-4 hover:bg-muted rounded-full transition-colors min-w-fit">
                <Phone className="w-6 h-6 text-muted-foreground" />
                {/* <span className="text-xs font-medium">Call</span> */}
              </button>
            )}
            
            <button 
              onClick={handleShare}
              disabled={isSharing}
              className="flex flex-col items-center gap-1 px-4 py-4 hover:bg-muted rounded-full transition-colors min-w-fit disabled:opacity-50"
            >
              <Share2 className="w-6 h-6 text-muted-foreground" />
              {/* <span className="text-xs font-medium">Share</span> */}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border sticky top-0 bg-card z-10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'overview'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          {featureType === 'building' && feature.locations && feature.locations.length > 0 && (
            <button
              onClick={() => setActiveTab('locations')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'locations'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Locations
              {activeTab === 'locations' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('hours')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'hours'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Hours
            {activeTab === 'hours' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'services'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Services
            {activeTab === 'services' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Description */}
              {feature.description && (
                <div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              )}

              {/* Address */}
              {feature.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{feature.address}</p>
                  </div>
                </div>
              )}

              {/* Accessibility */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                  <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm">Accessible entrance</p>
                </div>
              </div>

              {/* Building-specific info */}
              {featureType === 'building' && feature.floors && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Floors</span>
                    <span className="font-medium">{feature.floors}</span>
                  </div>
                </div>
              )}

              {/* Open Space-specific info */}
              {featureType === 'openSpace' && feature.area && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Area</span>
                    <span className="font-medium">{feature.area} m²</span>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {feature.contactInfo && feature.contactInfo.length > 0 && (
                <div className="pt-4 border-t border-border space-y-3">
                  <h3 className="font-semibold text-sm">Contact Information</h3>
                  {feature.contactInfo.map((contact: any) => {
                    const isPhone = contact.type === 'phone'
                    const isEmail = contact.type === 'email'
                    const isWebsite = contact.type === 'website'
                    const href = isPhone ? `tel:${contact.value}` : isEmail ? `mailto:${contact.value}` : contact.value
                    
                    return (
                      <a
                        key={contact.id}
                        href={href}
                        target={isWebsite ? '_blank' : undefined}
                        rel={isWebsite ? 'noopener noreferrer' : undefined}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {isPhone && <Phone className="w-5 h-5 text-primary flex-shrink-0" />}
                        {isEmail && <Mail className="w-5 h-5 text-primary flex-shrink-0" />}
                        {isWebsite && <ExternalLink className="w-5 h-5 text-primary flex-shrink-0" />}
                        {!isPhone && !isEmail && !isWebsite && <Phone className="w-5 h-5 text-primary flex-shrink-0" />}
                        
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground capitalize">
                            {contact.label || contact.type}
                          </p>
                          <p className="text-sm font-medium">{contact.value}</p>
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}

            </div>
          )}

          {/* Hours Tab */}
          {activeTab === 'hours' && (
            <div className="space-y-4">
              {feature.operatingHours && feature.operatingHours.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Working Hours</h3>
                  </div>
                  <div className="space-y-2">
                    {feature.operatingHours.map((hours: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50">
                        <span className="font-medium">{getDayName(hours.dayOfWeek)}</span>
                        <span className="text-muted-foreground">
                          {hours.isClosed ? (
                            <span className="text-destructive">Closed</span>
                          ) : hours.is24Hours ? (
                            <span className="text-green-600">Open 24 hours</span>
                          ) : (
                            `${hours.openTime || '--:--'} - ${hours.closeTime || '--:--'}`
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No working hours available</p>
                </div>
              )}
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div className="space-y-3">
              {feature.locations && feature.locations.length > 0 ? (
                <>
                  {feature.locations.map((location: any) => (
                    <div key={location.id} className="border border-border rounded-lg overflow-hidden">
                      {/* Location Header - Always Visible */}
                      <button
                        onClick={() => setExpandedLocationId(expandedLocationId === location.id ? null : location.id)}
                        className="w-full p-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{location.name}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {location.floor && <span>Floor {location.floor}</span>}
                              {location.roomNumber && (
                                <>
                                  <span>•</span>
                                  <span>Room {location.roomNumber}</span>
                                </>
                              )}
                              {location.locationType && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{location.locationType}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-muted-foreground">
                            {expandedLocationId === location.id ? '▼' : '▶'}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Location Details */}
                      {expandedLocationId === location.id && (
                        <div className="border-t border-border p-3 bg-muted/20 space-y-3">
                          {/* Description */}
                          {location.description && (
                            <p className="text-sm text-muted-foreground">{location.description}</p>
                          )}

                          {/* Capacity */}
                          {location.capacity && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Capacity:</span>
                              <span className="text-muted-foreground">{location.capacity} people</span>
                            </div>
                          )}

                          {/* Reservable */}
                          {location.isReservable && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <span>✓ Available for reservation</span>
                            </div>
                          )}

                          {/* Operating Hours */}
                          {location.operatingHours && location.operatingHours.length > 0 && (
                            <div className="pt-2 border-t border-border">
                              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Hours
                              </h5>
                              <div className="space-y-1">
                                {location.operatingHours.map((hours: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="font-medium">{getDayName(hours.dayOfWeek)}</span>
                                    <span className="text-muted-foreground">
                                      {hours.isClosed ? (
                                        <span className="text-destructive">Closed</span>
                                      ) : hours.is24Hours ? (
                                        <span className="text-green-600">24h</span>
                                      ) : (
                                        `${hours.openTime || '--:--'} - ${hours.closeTime || '--:--'}`
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Contact Info */}
                          {location.contactInfo && location.contactInfo.length > 0 && (
                            <div className="pt-2 border-t border-border">
                              <h5 className="text-sm font-semibold mb-2">Contact</h5>
                              <div className="space-y-2">
                                {location.contactInfo.map((contact: any) => {
                                  const isPhone = contact.type === 'phone'
                                  const isEmail = contact.type === 'email'
                                  const href = isPhone ? `tel:${contact.value}` : isEmail ? `mailto:${contact.value}` : contact.value
                                  
                                  return (
                                    <a
                                      key={contact.id}
                                      href={href}
                                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                                    >
                                      {isPhone && <Phone className="w-3 h-3" />}
                                      {isEmail && <Mail className="w-3 h-3" />}
                                      <span>{contact.value}</span>
                                    </a>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Documents */}
                          {location.documents && location.documents.length > 0 && (
                            <div className="pt-2 border-t border-border">
                              <h5 className="text-sm font-semibold mb-2">Documents</h5>
                              <div className="space-y-1">
                                {location.documents.map((doc: any) => (
                                  <a
                                    key={doc.id}
                                    href={doc.url || doc.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>{doc.title || doc.name || 'Document'}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No locations available</p>
                </div>
              )}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              {/* Amenities */}
              {feature.amenities && feature.amenities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {feature.amenities.map((item: any) => (
                      <div
                        key={item.id}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        {item.amenity?.icon && <span>{item.amenity.icon}</span>}
                        <span>{item.amenity?.name || 'Amenity'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {feature.documents && feature.documents.length > 0 && (
                <div className={feature.amenities?.length > 0 ? 'pt-4 border-t border-border' : ''}>
                  <h3 className="font-semibold mb-3">Documents</h3>
                  <div className="space-y-2">
                    {feature.documents.map((doc: any) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title || doc.name}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* No services message */}
              {(!feature.amenities || feature.amenities.length === 0) && 
               (!feature.documents || feature.documents.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No services available</p>
                </div>
              )}
            </div>
          )}
        </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </>
  )
}
