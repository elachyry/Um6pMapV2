/**
 * MapControls Component
 * Purpose: Custom map control buttons (zoom, center, emergency)
 * Inputs: map instance, initial center, initial zoom
 * Outputs: Control buttons overlay
 */

import { useState, useEffect, useRef } from 'react'
import { Plus, Minus, AlignHorizontalSpaceAround, Siren, Phone, Locate } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
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
}

export function MapControls({ 
  map, 
  initialCenter, 
  initialZoom, 
  initialPitch = 0, 
  initialBearing = 0, 
  isPanelExpanded = false,
  emergencyContacts = [] 
}: MapControlsProps) {
  const [showEmergency, setShowEmergency] = useState(false)
  const [isGpsActive, setIsGpsActive] = useState(false)
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null)

  // Initialize GeolocateControl
  useEffect(() => {
    if (!map) return

    // Create geolocate control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    })

    // Add control to map (hidden, we'll trigger it manually)
    map.addControl(geolocateControl, 'bottom-right')
    geolocateControlRef.current = geolocateControl

    // Hide the default control button (use timeout to ensure DOM is ready)
    setTimeout(() => {
      const geolocateContainer = document.querySelector('.mapboxgl-ctrl-geolocate')?.parentElement
      if (geolocateContainer) {
        (geolocateContainer as HTMLElement).style.display = 'none'
      }
      
      // Also try to hide by class
      const ctrlGroup = document.querySelector('.mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-group')
      if (ctrlGroup && ctrlGroup.querySelector('.mapboxgl-ctrl-geolocate')) {
        (ctrlGroup as HTMLElement).style.display = 'none'
      }
    }, 100)

    // Listen for geolocate events
    geolocateControl.on('geolocate', () => {
      setIsGpsActive(true)
    })

    geolocateControl.on('trackuserlocationstart', () => {
      setIsGpsActive(true)
    })

    geolocateControl.on('trackuserlocationend', () => {
      setIsGpsActive(false)
    })

    geolocateControl.on('error', () => {
      setIsGpsActive(false)
    })

    return () => {
      if (geolocateControlRef.current) {
        map.removeControl(geolocateControlRef.current)
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

  const handleEmergencyCall = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  return (
    <>
      {/* Desktop Controls - Right Middle */}
      <div className="hidden lg:flex flex-col fixed right-6 xl:right-8 top-1/2 transform -translate-y-1/2 z-50 space-y-3">
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

        {/* Emergency Contacts */}
        {emergencyContacts.length > 0 && (
          <button
            onClick={() => setShowEmergency(!showEmergency)}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border border-red-400/20 backdrop-blur-md"
            title="Emergency Contacts"
          >
            <Siren className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Mobile Controls - Bottom Right */}
      <div className={`lg:hidden fixed bottom-20 sm:bottom-24 right-4 z-50 flex flex-col space-y-3 transition-all duration-300 ${isPanelExpanded ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
        {/* Center Map */}
        <button
          className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 hover:text-primary-600 p-3 rounded-xl shadow-lg transition-all duration-200 border border-white/20"
          onClick={handleResetView}
          title="Center Map"
        >
          <AlignHorizontalSpaceAround className="w-5 h-5" />
        </button>

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

        {/* Emergency Contacts */}
        {emergencyContacts.length > 0 && (
          <button
            onClick={() => setShowEmergency(!showEmergency)}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl shadow-lg transition-all duration-200 border border-red-400/20 backdrop-blur-md"
            title="Emergency Contacts"
          >
            <Siren className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Emergency Contacts Panel */}
      {showEmergency && emergencyContacts.length > 0 && (
        <div className="fixed top-1/2 -translate-y-1/2 right-20 lg:right-24 xl:right-28 z-50">
          <Card className="w-80 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-600" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>Quick access to emergency services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {emergencyContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-sm">{contact.name}</h3>
                      <p className="text-xs text-muted-foreground">{contact.type}</p>
                    </div>
                    <button
                      onClick={() => handleEmergencyCall(contact.phone)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowEmergency(false)}
                className="w-full mt-3 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors text-sm"
              >
                Close
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
