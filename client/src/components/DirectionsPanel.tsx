/**
 * DirectionsPanel Component
 * Purpose: Handle route planning and directions between two points
 * Inputs: onClose callback, initial destination
 * Outputs: Route display on map
 */

import { useState, useRef, useEffect } from 'react'
import { X, ArrowUpDown, MapPin, Mic, Navigation } from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  type: 'building' | 'openSpace' | 'location'
  category?: string
  image?: string
  buildingName?: string
  locationType?: string
}

interface DirectionsPanelProps {
  onClose: () => void
  initialDestination?: {
    name: string
    coordinates: [number, number]
  }
  userLocation?: [number, number] | null
  buildings: any[]
  openSpaces: any[]
  locations?: any[]
  onGetDirections?: (source: any, destination: any) => void
}

export function DirectionsPanel({ onClose, initialDestination, userLocation, buildings, openSpaces, locations = [], onGetDirections }: DirectionsPanelProps) {
  const [sourceInput, setSourceInput] = useState('')
  const [destinationInput, setDestinationInput] = useState(initialDestination?.name || '')
  const [isSourceGPS, setIsSourceGPS] = useState(!!userLocation)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false)
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)
  const [sourceResults, setSourceResults] = useState<SearchResult[]>([])
  const [destResults, setDestResults] = useState<SearchResult[]>([])
  const [selectedSource, setSelectedSource] = useState<SearchResult | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<SearchResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  
  const sourceRef = useRef<HTMLDivElement>(null)
  const destRef = useRef<HTMLDivElement>(null)
  const hasCalculatedRef = useRef(false)

  // Set initial source if GPS is available
  useEffect(() => {
    if (userLocation) {
      setSourceInput('My Location')
      setIsSourceGPS(true)
    }
  }, [userLocation])

  // Auto-calculate route when both source and destination are selected
  useEffect(() => {
    if (onGetDirections && (selectedSource || isSourceGPS) && selectedDestination && !hasCalculatedRef.current) {
      const source = isSourceGPS
        ? { name: 'My Location', coordinates: userLocation || [0, 0], type: 'location' as const }
        : selectedSource
      
      hasCalculatedRef.current = true
      setIsCalculating(true)
      
      // Small delay to ensure UI updates
      const timer = setTimeout(async () => {
        await onGetDirections(source, selectedDestination)
        // Hide calculating message after route is drawn
        setTimeout(() => setIsCalculating(false), 1000)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [selectedSource, selectedDestination, isSourceGPS, userLocation])

  // Reset calculation flag when selections change
  useEffect(() => {
    hasCalculatedRef.current = false
    setIsCalculating(false)
  }, [selectedSource, selectedDestination, isSourceGPS])

  // Search for source
  useEffect(() => {
    if (!sourceInput.trim() || sourceInput === 'My Location') {
      setSourceResults([])
      return
    }

    const query = sourceInput.toLowerCase()
    const allResults: SearchResult[] = []

    // Search buildings
    buildings.forEach((building: any) => {
      if (building.name?.toLowerCase().includes(query)) {
        const imageUrl = building.images?.[0]?.url || building.images?.[0]?.imageUrl || building.images?.[0]?.path || building.image?.url || building.image?.imageUrl || building.image?.path
        allResults.push({
          id: building.id,
          name: building.name,
          type: 'building',
          category: building.category?.name,
          image: imageUrl
        })
      }
    })

    // Search open spaces
    openSpaces.forEach((space: any) => {
      if (space.name?.toLowerCase().includes(query)) {
        const imageUrl = space.images?.[0]?.url || space.images?.[0]?.imageUrl || space.images?.[0]?.path || space.image?.url || space.image?.imageUrl || space.image?.path
        allResults.push({
          id: space.id,
          name: space.name,
          type: 'openSpace',
          category: space.category?.name,
          image: imageUrl
        })
      }
    })

    // Search locations
    locations.forEach((location: any) => {
      if (location.name?.toLowerCase().includes(query)) {
        allResults.push({
          id: location.id,
          name: location.name,
          type: 'location',
          buildingName: location.building?.name,
          locationType: location.locationType?.name
        })
      }
    })

    setSourceResults(allResults.slice(0, 5))
  }, [sourceInput, buildings, openSpaces, locations])

  // Search for destination
  useEffect(() => {
    if (!destinationInput.trim()) {
      setDestResults([])
      return
    }

    const query = destinationInput.toLowerCase()
    const allResults: SearchResult[] = []

    // Search buildings
    buildings.forEach((building: any) => {
      if (building.name?.toLowerCase().includes(query)) {
        const imageUrl = building.images?.[0]?.url || building.images?.[0]?.imageUrl || building.images?.[0]?.path || building.image?.url || building.image?.imageUrl || building.image?.path
        allResults.push({
          id: building.id,
          name: building.name,
          type: 'building',
          category: building.category?.name,
          image: imageUrl
        })
      }
    })

    // Search open spaces
    openSpaces.forEach((space: any) => {
      if (space.name?.toLowerCase().includes(query)) {
        const imageUrl = space.images?.[0]?.url || space.images?.[0]?.imageUrl || space.images?.[0]?.path || space.image?.url || space.image?.imageUrl || space.image?.path
        allResults.push({
          id: space.id,
          name: space.name,
          type: 'openSpace',
          category: space.category?.name,
          image: imageUrl
        })
      }
    })

    // Search locations
    locations.forEach((location: any) => {
      if (location.name?.toLowerCase().includes(query)) {
        allResults.push({
          id: location.id,
          name: location.name,
          type: 'location',
          buildingName: location.building?.name,
          locationType: location.locationType?.name
        })
      }
    })

    setDestResults(allResults.slice(0, 5))
  }, [destinationInput, buildings, openSpaces, locations])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setShowSourceSuggestions(false)
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSwap = () => {
    if (!sourceInput || !destinationInput) return
    
    const temp = sourceInput
    setSourceInput(destinationInput)
    setDestinationInput(temp)
    setIsSourceGPS(false)
  }

  const handleUseMyLocation = () => {
    if (userLocation) {
      setSourceInput('My Location')
      setIsSourceGPS(true)
    }
  }

  const handleVoiceSearch = (field: 'source' | 'destination') => {
    // Voice search implementation placeholder
    setVoiceError('Voice search is not available in your browser')
    setTimeout(() => setVoiceError(null), 3000)
  }

  const canSwap = sourceInput && destinationInput

  return (
    <div className="fixed top-16 sm:top-20 left-2 sm:left-4 right-2 sm:right-auto z-40 w-full sm:w-[32rem] sm:max-w-lg">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-4 py-4 flex flex-col gap-4 min-w-[320px] max-w-[95vw] relative">
        
        {/* Main Input Row */}
        <div className="flex flex-row items-center gap-4 relative mt-2">
          
          {/* Visual Indicators Column (Left) */}
          <div className="flex flex-col items-center justify-between h-full py-2">
            {/* Source Indicator */}
            <div className="flex items-center">
              <span className="w-5 h-5 flex items-center justify-center">
                {isSourceGPS ? (
                  <span className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></span>
                ) : (
                  <span className="w-4 h-4 border-2 border-gray-400 rounded-full bg-transparent"></span>
                )}
              </span>
            </div>
            
            {/* Connecting Dotted Line */}
            <div className="flex flex-col items-center my-1">
              <span className="w-1 h-2 bg-gray-300 rounded-full mb-1"></span>
              <span className="w-1 h-2 bg-gray-300 rounded-full mb-1"></span>
              <span className="w-1 h-2 bg-gray-300 rounded-full"></span>
            </div>
            
            {/* Destination Indicator */}
            <div className="flex items-center">
              <span className="w-5 h-5 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-red-500" />
              </span>
            </div>
          </div>
          
          {/* Input Fields Column (Center) */}
          <div className="flex flex-col gap-4 flex-1">
            
            {/* Source Input */}
            <div className="relative" ref={sourceRef}>
              <input
                type="text"
                placeholder="Choose start location"
                value={sourceInput}
                onChange={(e) => {
                  setSourceInput(e.target.value)
                  setIsSourceGPS(false)
                  setShowSourceSuggestions(true)
                }}
                onFocus={() => setShowSourceSuggestions(true)}
                className="w-full pl-4 pr-32 py-3 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                style={{ fontSize: '16px' }}
              />
              
              {/* Clear Button */}
              {sourceInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSourceInput('')
                    setIsSourceGPS(false)
                  }}
                  className="absolute inset-y-0 flex items-center text-gray-400 hover:text-primary-500 transition-colors duration-200"
                  style={{ right: '7.5rem' }}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              
              {/* Voice Search Button */}
              <div className="absolute inset-y-0 flex items-center" style={{ right: '5rem' }}>
                <button 
                  type="button" 
                  onClick={() => handleVoiceSearch('source')}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Mic className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Location Button */}
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-primary-500 transition-colors duration-200"
              >
                <Navigation className="h-5 w-5" />
              </button>

              {/* Source Suggestions */}
              {showSourceSuggestions && sourceResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-60 overflow-y-auto">
                  {sourceResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => {
                        setSourceInput(result.name)
                        setShowSourceSuggestions(false)
                        setIsSourceGPS(false)
                        setSelectedSource(result)
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {result.image ? (
                          <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">
                            {result.type === 'building' ? '🏢' : result.type === 'openSpace' ? '🌳' : '📍'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{result.name}</div>
                        {result.type === 'location' ? (
                          <div className="text-xs text-gray-500 truncate">
                            {result.buildingName} • {result.locationType}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 truncate">{result.category}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Destination Input */}
            <div className="relative" ref={destRef}>
              <input
                type="text"
                placeholder="Choose destination"
                value={destinationInput}
                onChange={(e) => {
                  setDestinationInput(e.target.value)
                  setShowDestSuggestions(true)
                }}
                onFocus={() => setShowDestSuggestions(true)}
                className="w-full pl-4 pr-24 py-3 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                style={{ fontSize: '16px' }}
              />
              
              {/* Clear Button */}
              {destinationInput && (
                <button
                  type="button"
                  onClick={() => setDestinationInput('')}
                  className="absolute inset-y-0 flex items-center text-gray-400 hover:text-primary-500 transition-colors duration-200"
                  style={{ right: '5rem' }}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              
              {/* Voice Search Button */}
              <div className="absolute inset-y-0 flex items-center" style={{ right: '2.5rem' }}>
                <button 
                  type="button"
                  onClick={() => handleVoiceSearch('destination')}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Mic className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Destination Suggestions */}
              {showDestSuggestions && destResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-60 overflow-y-auto">
                  {destResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => {
                        setDestinationInput(result.name)
                        setShowDestSuggestions(false)
                        setSelectedDestination(result)
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {result.image ? (
                          <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">
                            {result.type === 'building' ? '🏢' : result.type === 'openSpace' ? '🌳' : '📍'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{result.name}</div>
                        {result.type === 'location' ? (
                          <div className="text-xs text-gray-500 truncate">
                            {result.buildingName} • {result.locationType}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 truncate">{result.category}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Control Buttons Column (Right) */}
          <div className="flex flex-col items-center h-full py-2">
            {/* Close Button (Top) */}
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors mb-2 self-end"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            
            {/* Spacer */}
            <div className="flex-1 flex items-center justify-center">
              {/* Swap Button (Middle) */}
              <button 
                onClick={handleSwap}
                disabled={!canSwap}
                className={`p-2 hover:bg-gray-50 transition-colors ${!canSwap ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <ArrowUpDown className={`w-5 h-5 ${canSwap ? 'text-gray-600' : 'text-gray-300'}`} />
              </button>
            </div>
          </div>
          
        </div>
        
        {/* Route Status Indicator */}
        {isCalculating && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary-600">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span>Calculating route...</span>
          </div>
        )}
        
        {/* Voice Search Error (Optional) */}
        {voiceError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{voiceError}</span>
            </div>
          </div>
        )}
        
      </div>
    </div>
  )
}
