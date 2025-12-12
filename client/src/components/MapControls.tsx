/**
 * MapControls Component
 * Purpose: Custom map control buttons (zoom, center, emergency)
 * Inputs: map instance, initial center, initial zoom
 * Outputs: Control buttons overlay
 */

import { useState, useEffect, useRef } from 'react'
import { Plus, Minus, AlignHorizontalSpaceAround, Siren, Locate, Calendar, CalendarPlus } from 'lucide-react'
import mapboxgl from 'mapbox-gl'

interface MapControlsProps {
  map: any | null
  initialCenter: [number, number]
  initialZoom: number
  initialPitch?: number
  initialBearing?: number
  isPanelExpanded?: boolean
  emergencyContacts?: Array<{
    id: string
    name: string
    phone: string
    type: string
  }>
  onLocationUpdate?: (location: [number, number]) => void
  isGpsActive?: boolean
  onGpsActiveChange?: (active: boolean) => void
  onEmergencyClick?: () => void
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    userType?: string
  }
  onAgendaClick?: () => void
  onReservationClick?: () => void
}

export function MapControls({ 
  map, 
  initialCenter, 
  initialZoom, 
  initialPitch = 0, 
  initialBearing = 0, 
  isPanelExpanded = false,
  emergencyContacts = [],
  onLocationUpdate,
  isGpsActive: externalIsGpsActive = false,
  onGpsActiveChange,
  onEmergencyClick,
  user,
  onAgendaClick,
  onReservationClick
}: MapControlsProps) {
  const [internalIsGpsActive, setInternalIsGpsActive] = useState(false)
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null)
  
  // Use external GPS state if provided, otherwise use internal state
  const isGpsActive = onGpsActiveChange ? externalIsGpsActive : internalIsGpsActive
  const setIsGpsActive = onGpsActiveChange || setInternalIsGpsActive

  // Check if user is permanent staff
  const isPermanentStaff = user?.userType === 'PERMANENT' || user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN'

  // Function to trigger GPS
  const triggerGPS = () => {
    if (geolocateControlRef.current) {
      geolocateControlRef.current.trigger()
    }
  }

  // Expose triggerGPS to window for parent access
  useEffect(() => {
    (window as any).triggerMapGPS = triggerGPS
    return () => {
      delete (window as any).triggerMapGPS
    }
  }, [])

  // Initialize GeolocateControl
  useEffect(() => {
    if (!map) return

    // Create geolocate control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserLocation: true,
      showUserHeading: true
    })

    // Add control to map (hidden, we'll trigger it manually)
    map.addControl(geolocateControl, 'bottom-right')
    geolocateControlRef.current = geolocateControl

    // Hide only the control button, not the user location marker
    setTimeout(() => {
      const geolocateButton = document.querySelector('.mapboxgl-ctrl-geolocate')
      if (geolocateButton) {
        // Hide only the button, not the parent container (which contains the marker)
        (geolocateButton as HTMLElement).style.display = 'none'
      }
      
      // Hide the control group if it only contains the geolocate button
      const ctrlGroup = document.querySelector('.mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-group')
      if (ctrlGroup && ctrlGroup.children.length === 1 && ctrlGroup.querySelector('.mapboxgl-ctrl-geolocate')) {
        (ctrlGroup as HTMLElement).style.display = 'none'
      }
    }, 100)

    // Listen for geolocate events
    geolocateControl.on('geolocate', (e: any) => {
      if (onGpsActiveChange) {
        onGpsActiveChange(true)
      } else {
        setInternalIsGpsActive(true)
      }
      if (onLocationUpdate && e.coords) {
        const coords: [number, number] = [e.coords.longitude, e.coords.latitude]
        onLocationUpdate(coords)
        console.log('📍 GPS location updated:', coords)
      }
    })

    geolocateControl.on('trackuserlocationstart', () => {
      if (onGpsActiveChange) {
        onGpsActiveChange(true)
      } else {
        setInternalIsGpsActive(true)
      }
    })

    geolocateControl.on('trackuserlocationend', () => {
      if (onGpsActiveChange) {
        onGpsActiveChange(false)
      } else {
        setInternalIsGpsActive(false)
      }
    })

    geolocateControl.on('error', () => {
      if (onGpsActiveChange) {
        onGpsActiveChange(false)
      } else {
        setInternalIsGpsActive(false)
      }
    })

    return () => {
      if (geolocateControlRef.current && map) {
        try {
          map.removeControl(geolocateControlRef.current)
        } catch (error) {
          console.warn('Error removing geolocate control:', error)
        }
        geolocateControlRef.current = null
      }
    }
  }, [map])

  const handleZoomIn = () => {
    if (!map) return
    map.zoomIn({ duration: 300 })
  }

  const handleZoomOut = () => {
    if (!map) return
    map.zoomOut({ duration: 300 })
  }

  const handleLocateUser = () => {
    if (geolocateControlRef.current) {
      // Trigger the geolocate control
      geolocateControlRef.current.trigger()
    }
  }

  const handleResetView = () => {
    if (!map) return
    
    // Validate center coordinates
    const [lng, lat] = initialCenter
    if (isNaN(lng) || isNaN(lat)) {
      console.warn('Invalid initial center coordinates, using current map center')
      return
    }
    
    map.flyTo({
      center: initialCenter,
      zoom: initialZoom || 16,
      pitch: initialPitch,
      bearing: initialBearing,
      duration: 1000
    })
  }


  return (
    <>
      {/* Desktop Controls - Right Middle */}
      <div className="hidden lg:flex flex-col fixed right-6 xl:right-8 top-1/2 transform -translate-y-1/2 z-50 space-y-3">
        {/* Reservation Button - Only for permanent staff */}
        {isPermanentStaff && onReservationClick && (
          <button
            className="bg-primary/95 backdrop-blur-md hover:bg-white text-white hover:text-primary-600 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border border-white/20"
            onClick={onReservationClick}
            title="Reserve Place"
          >
            <CalendarPlus className="w-6 h-6" />
          </button>
        )}

        {/* Agenda Button */}
        {onAgendaClick && (
          <button
            className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 hover:text-primary-600 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border border-white/20"
            onClick={onAgendaClick}
            title="View Agenda"
          >
            <Calendar className="w-6 h-6" />
          </button>
        )}

        {/* Locate User */}
        <button
          className={`backdrop-blur-md p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border ${
            isGpsActive 
              ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400/20' 
              : 'bg-white/95 hover:bg-white text-gray-700 hover:text-primary-600 border-white/20'
          }`}
          onClick={handleLocateUser}
          title="Locate Me"
        >
          <Locate className="w-6 h-6" />
        </button>

        {/* Center Map */}
        <button
          className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 hover:text-primary-600 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border border-white/20"
          onClick={handleResetView}
          title="Center Map"
        >
          <AlignHorizontalSpaceAround className="w-6 h-6" />
        </button>

        {/* Zoom In */}
        <button
          className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 hover:text-primary-600 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border border-white/20"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Zoom Out */}
        <button
          className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 hover:text-primary-600 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border border-white/20"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <Minus className="w-6 h-6" />
        </button>

        {/* Emergency Contacts */}
        {emergencyContacts.length > 0 && onEmergencyClick && (
          <button
            onClick={onEmergencyClick}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border border-red-400/20 backdrop-blur-md"
            title="Emergency Contacts"
          >
            <Siren className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Mobile Controls - Bottom Right */}
      <div className={`lg:hidden fixed bottom-20 sm:bottom-24 right-4 z-50 flex flex-col space-y-3 transition-all duration-300 ${isPanelExpanded ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
        
         {/* Reservation Button - Only for permanent staff */}
        {isPermanentStaff && onReservationClick && (
          <button
            className="bg-primary/95 backdrop-blur-md hover:bg-white text-white hover:text-primary-600 p-3 rounded-xl shadow-lg transition-all duration-200 border border-white/20"
            onClick={onReservationClick}
            title="Reserve Place"
          >
            <CalendarPlus className="w-5 h-5" />
          </button>
        )}
        
        {/* Agenda Button */}
        {onAgendaClick && (
          <button
            className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 hover:text-primary-600 p-3 rounded-xl shadow-lg transition-all duration-200 border border-white/20"
            onClick={onAgendaClick}
            title="View Agenda"
          >
            <Calendar className="w-5 h-5" />
          </button>
        )}

         {/* Locate User */}
        <button
          className={`backdrop-blur-md p-3 rounded-xl shadow-lg transition-all duration-200 border ${
            isGpsActive 
              ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400/20' 
              : 'bg-white/95 hover:bg-white text-gray-700 hover:text-primary-600 border-white/20'
          }`}
          onClick={handleLocateUser}
          title="Locate Me"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Center Map */}
        <button
          className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 hover:text-primary-600 p-3 rounded-xl shadow-lg transition-all duration-200 border border-white/20"
          onClick={handleResetView}
          title="Center Map"
        >
          <AlignHorizontalSpaceAround className="w-5 h-5" />
        </button>

        {/* Emergency Contacts */}
        {emergencyContacts.length > 0 && onEmergencyClick && (
          <button
            onClick={onEmergencyClick}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl shadow-lg transition-all duration-200 border border-red-400/20 backdrop-blur-md"
            title="Emergency Contacts"
          >
            <Siren className="w-5 h-5" />
          </button>
        )}
      </div>
    </>
  )
}
