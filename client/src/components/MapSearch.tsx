/**
 * MapSearch Component
 * Purpose: Google Maps-style search bar for buildings and open spaces
 * Inputs: buildings and open spaces data, onSelect callback
 * Outputs: Search input with autocomplete suggestions
 */

import { useState, useRef, useEffect } from 'react'
import { Search, CornerUpRight, MapPin } from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  type: 'building' | 'openSpace' | 'location'
  category?: string
  image?: string
  buildingName?: string
  locationType?: string
}

interface MapSearchProps {
  buildings: any[]
  openSpaces: any[]
  locations?: any[]
  onSelect: (result: SearchResult) => void
  onDirections?: (result: SearchResult) => void
  isPanelExpanded?: boolean
}

export function MapSearch({ buildings, openSpaces, locations = [], onSelect, onDirections, isPanelExpanded = false }: MapSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Search through buildings and open spaces
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    
    // Search buildings
    const buildingResults: SearchResult[] = buildings
      .filter((b) => b.name?.toLowerCase().includes(query))
      .map((b) => ({
        id: b.id,
        name: b.name,
        type: 'building' as const,
        category: b.category?.name,
        image: b.images?.[0]?.url || b.images?.[0]?.imageUrl || b.image || b.imageUrl
      }))

    // Search open spaces
    const openSpaceResults: SearchResult[] = openSpaces
      .filter((os) => os.name?.toLowerCase().includes(query))
      .map((os) => ({
        id: os.id,
        name: os.name,
        type: 'openSpace' as const,
        category: os.category?.name,
        image: os.images?.[0]?.url || os.images?.[0]?.imageUrl || os.image || os.imageUrl
      }))

    // Search locations
    const locationResults: SearchResult[] = locations
      .filter((loc) => loc.name?.toLowerCase().includes(query))
      .map((loc) => ({
        id: loc.id,
        name: loc.name,
        type: 'location' as const,
        buildingName: loc.building?.name,
        locationType: loc.type,
        image: loc.images?.[0]?.url || loc.images?.[0]?.imageUrl || loc.image || loc.imageUrl
      }))

    // Combine all results and limit to top 5
    const allResults = [...buildingResults, ...openSpaceResults, ...locationResults]
    setResults(allResults.slice(0, 5))
  }, [searchQuery, buildings, openSpaces, locations])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (result: SearchResult) => {
    setSearchQuery(result.name)
    setShowResults(false)
    onSelect(result)
  }

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 text-gray-900 font-semibold">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    )
  }

  return (
    <div ref={searchRef} className={`absolute top-4 left-4 right-4 md:left-4 md:right-auto md:w-[450px] z-20 transition-all duration-300 ${isPanelExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Search Input */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200/50 flex items-center pl-5 pr-3 py-3 gap-3 hover:shadow-2xl transition-shadow duration-200">
        <Search className="w-6 h-6 text-gray-500 flex-shrink-0" />
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search for building, location ..."
          className="flex-1 outline-none text-gray-800 placeholder-gray-500 text-base bg-transparent"
        />

        <button
          type="button"
          onClick={() => {
            if (onDirections) {
              // Open directions panel without a specific destination
              onDirections({ id: '', name: '', type: 'building' })
            }
          }}
          className="flex items-center justify-center text-gray-400 hover:text-primary-500 transition-colors duration-200"
          title="Open Directions Panel"
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            {/* Rhombus background */}
            <div className="absolute inset-0 bg-primary-500 transform rotate-45 rounded-sm opacity-90 hover:opacity-100 transition-opacity duration-200 m-0.5"></div>
            {/* Icon */}
            <CornerUpRight className="h-3.5 w-3.5 text-white relative z-10" />
          </div>
        </button>
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          {results.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <button
                onClick={() => handleSelect(result)}
                className="flex items-center gap-3 flex-1 text-left"
              >
              {/* Image or fallback icon */}
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {result.image ? (
                  <img 
                    src={result.image} 
                    alt={result.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        const icon = result.type === 'building' ? '🏢' : result.type === 'openSpace' ? '🌳' : '📍'
                        parent.innerHTML = icon
                        parent.classList.add('text-2xl')
                      }
                    }}
                  />
                ) : (
                  <span className="text-2xl">
                    {result.type === 'building' ? '🏢' : result.type === 'openSpace' ? '🌳' : '📍'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {highlightText(result.name, searchQuery)}
                </div>
                {result.type === 'location' ? (
                  <div className="text-sm text-gray-500 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>{result.buildingName}</span>
                    {result.locationType && (
                      <span className="text-gray-400">• {result.locationType}</span>
                    )}
                  </div>
                ) : result.category ? (
                  <div className="text-sm text-gray-500 truncate">{result.category}</div>
                ) : null}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide flex-shrink-0">
                {result.type === 'building' ? 'Building' : result.type === 'openSpace' ? 'Open Space' : 'Location'}
              </div>
            </button>
            
            {/* Directions Button */}
            {onDirections && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDirections(result)
                }}
                className="p-2 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
                title="Get Directions"
              >
                <CornerUpRight className="w-5 h-5 text-primary-600" />
              </button>
            )}
          </div>
          ))}
        </div>
      )}
    </div>
  )
}
