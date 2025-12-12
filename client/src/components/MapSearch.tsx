/**
 * MapSearch Component
 * Purpose: Google Maps-style search bar for buildings and open spaces
 * Inputs: buildings and open spaces data, onSelect callback
 * Outputs: Search input with autocomplete suggestions
 */

import { useState, useRef, useEffect } from 'react'
import { Search, CornerUpRight, MapPin, Navigation } from 'lucide-react'
import { getAllCategories } from '@/api/categoryApi'

interface SearchResult {
  id: string
  name: string
  type: 'building' | 'openSpace' | 'location'
  category?: string
  image?: string
  buildingName?: string
  locationType?: string
  distance?: number
  coordinates?: [number, number]
}

interface Category {
  id: string
  name: string
  type: string
  icon?: string
}

interface MapSearchProps {
  buildings: any[]
  openSpaces: any[]
  locations?: any[]
  onSelect: (result: SearchResult) => void
  onDirections?: (result: SearchResult) => void
  isPanelExpanded?: boolean
  userLocation?: [number, number]
}

export function MapSearch({ buildings, openSpaces, locations = [], onSelect, onDirections, isPanelExpanded = false, userLocation }: MapSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Debug: Log user location and panel status
  console.log('MapSearch: Component status:', {
    hasUserLocation: !!userLocation,
    userLocation,
    isPanelExpanded,
    buildings: buildings.length,
    openSpaces: openSpaces.length,
    locations: locations.length,
    shouldHide: isPanelExpanded
  })
  
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Parking', type: 'building' },
    { id: '2', name: 'Dining', type: 'building' },
    { id: '3', name: 'Healthcare', type: 'building' },
    { id: '4', name: 'Academic', type: 'building' },
    { id: '5', name: 'Library', type: 'building' },
    { id: '6', name: 'Laboratory', type: 'building' },
    { id: '7', name: 'Office', type: 'building' },
    { id: '8', name: 'Recreation', type: 'open_space' },
    { id: '9', name: 'Student Services', type: 'building' },
    { id: '10', name: 'Administration', type: 'building' }
  ])
  const searchRef = useRef<HTMLDivElement>(null)

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in kilometers
  }

  // Format distance for display
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${distance.toFixed(1)}km`
  }

  // Calculate estimated walking time (average walking speed: 5 km/h)
  const calculateWalkingTime = (distance: number): string => {
    const walkingSpeedKmH = 5
    const timeInHours = distance / walkingSpeedKmH
    const timeInMinutes = Math.round(timeInHours * 60)
    
    if (timeInMinutes < 1) {
      return '< 1 min'
    } else if (timeInMinutes < 60) {
      return `${timeInMinutes} min`
    } else {
      const hours = Math.floor(timeInMinutes / 60)
      const minutes = timeInMinutes % 60
      return `${hours}h ${minutes}m`
    }
  }

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllCategories(1, 50)
        console.log('Categories API response:', response)
        
        if (response?.data?.success) {
          const fetchedCategories = response.data.categories || response.data.data || []
          console.log('Fetched categories:', fetchedCategories)
          setCategories(fetchedCategories)
        }
      } catch (error) {
        console.warn('Failed to fetch categories:', error)
        // Add some fallback categories for testing
        setCategories([
          { id: '1', name: 'Parking', type: 'building' },
          { id: '2', name: 'Dining', type: 'building' },
          { id: '3', name: 'Healthcare', type: 'building' },
          { id: '4', name: 'Academic', type: 'building' }
        ])
      }
    }
    fetchCategories()
  }, [])

  // Search through buildings and open spaces or filter by category
  useEffect(() => {
    let filteredResults: SearchResult[] = []

    // Helper function to calculate centroid of a polygon
    const calculateCentroid = (coords: any): [number, number] => {
      try {
        // Handle GeoJSON Polygon format: coordinates[0] is the outer ring
        if (Array.isArray(coords) && coords.length > 0) {
          const ring = Array.isArray(coords[0]) ? coords[0] : coords
          
          let sumLng = 0
          let sumLat = 0
          let count = 0
          
          for (const point of ring) {
            if (Array.isArray(point) && point.length >= 2) {
              sumLng += point[0]
              sumLat += point[1]
              count++
            }
          }
          
          if (count > 0) {
            return [sumLng / count, sumLat / count]
          }
        }
      } catch (e) {
        console.error('Error calculating centroid:', e)
      }
      return [0, 0]
    }

    // Helper function to add coordinates and distance to results
    const addLocationData = (item: any, type: 'building' | 'openSpace' | 'location'): SearchResult => {
      let longitude = 0
      let latitude = 0
      
      // Try to parse coordinates from different formats
      try {
        // Check if coordinates is a GeoJSON string
        if (typeof item.coordinates === 'string') {
          const parsed = JSON.parse(item.coordinates)
          if (parsed.type === 'Polygon' && parsed.coordinates) {
            const centroid = calculateCentroid(parsed.coordinates)
            longitude = centroid[0]
            latitude = centroid[1]
          }
        }
        // Check if coordinates is already a GeoJSON object
        else if (item.coordinates?.type === 'Polygon' && item.coordinates?.coordinates) {
          const centroid = calculateCentroid(item.coordinates.coordinates)
          longitude = centroid[0]
          latitude = centroid[1]
        }
        // Try direct coordinate fields
        else {
          longitude = parseFloat(
            item.longitude || item.lng || item.long || 
            item.coordinates?.lng || item.coordinates?.longitude || 
            item.geometry?.coordinates?.[0] || 0
          )
          latitude = parseFloat(
            item.latitude || item.lat || 
            item.coordinates?.lat || item.coordinates?.latitude || 
            item.geometry?.coordinates?.[1] || 0
          )
        }
      } catch (e) {
        console.error('Error parsing coordinates for', item.name, e)
      }
      
      const coordinates: [number, number] = [longitude, latitude]
      
      let distance: number | undefined
      if (userLocation && coordinates[0] && coordinates[1]) {
        distance = calculateDistance(userLocation[1], userLocation[0], coordinates[1], coordinates[0])
        console.log(`Distance calculated for ${item.name}:`, distance, 'km', {
          userLocation,
          itemCoordinates: coordinates,
          item
        })
      } else {
        console.log(`No distance calculated for ${item.name}:`, {
          userLocation: userLocation ? 'Available' : 'Not available',
          itemCoordinates: coordinates,
          hasValidCoords: !!(coordinates[0] && coordinates[1]),
          rawItem: {
            longitude: item.longitude,
            latitude: item.latitude,
            lng: item.lng,
            lat: item.lat,
            coordinates: item.coordinates
          }
        })
      }

      // Log if coordinates are missing
      if (!coordinates[0] || !coordinates[1]) {
        console.warn(`Missing coordinates for ${item.name}:`, {
          item,
          attemptedFields: {
            longitude: item.longitude,
            latitude: item.latitude,
            lng: item.lng,
            lat: item.lat,
            coordinates: item.coordinates,
            geometry: item.geometry
          }
        })
      }

      const result: SearchResult = {
        id: item.id,
        name: item.name,
        type,
        category: item.category?.name,
        image: item.images?.[0]?.url || item.images?.[0]?.imageUrl || item.image || item.imageUrl,
        coordinates,
        distance
      }

      if (type === 'location') {
        result.buildingName = item.building?.name
        result.locationType = item.type
      }

      return result
    }

    if (selectedCategory && !searchQuery.trim()) {
      // Filter by selected category only (when no search query)
      const buildingResults = buildings
        .filter((b) => b.category?.name === selectedCategory)
        .map((b) => addLocationData(b, 'building'))

      const openSpaceResults = openSpaces
        .filter((os) => os.category?.name === selectedCategory)
        .map((os) => addLocationData(os, 'openSpace'))

      const locationResults = locations
        .filter((loc) => loc.category?.name === selectedCategory)
        .map((loc) => addLocationData(loc, 'location'))

      filteredResults = [...buildingResults, ...openSpaceResults, ...locationResults]
    } else if (searchQuery.trim()) {
      // Search by query (this will work even if a category is selected)
      const query = searchQuery.toLowerCase()
      
      let buildingResults = buildings.filter((b) => b.name?.toLowerCase().includes(query))
      let openSpaceResults = openSpaces.filter((os) => os.name?.toLowerCase().includes(query))  
      let locationResults = locations.filter((loc) => loc.name?.toLowerCase().includes(query))

      // If a category is selected, further filter by category
      if (selectedCategory) {
        buildingResults = buildingResults.filter((b) => b.category?.name === selectedCategory)
        openSpaceResults = openSpaceResults.filter((os) => os.category?.name === selectedCategory)
        locationResults = locationResults.filter((loc) => loc.category?.name === selectedCategory)
      }

      filteredResults = [
        ...buildingResults.map((b) => addLocationData(b, 'building')),
        ...openSpaceResults.map((os) => addLocationData(os, 'openSpace')),
        ...locationResults.map((loc) => addLocationData(loc, 'location'))
      ]
    }

    // Sort by distance if user location is available (nearest first)
    if (userLocation) {
      console.log('Sorting results by distance. User location:', userLocation)
      
      const resultsWithDistance = filteredResults.filter(r => r.distance !== undefined)
      const resultsWithoutDistance = filteredResults.filter(r => r.distance === undefined)
      
      resultsWithDistance.sort((a, b) => {
        return (a.distance || 0) - (b.distance || 0) // Nearest first
      })
      
      // Combine: results with distance first (sorted), then results without distance
      filteredResults = [...resultsWithDistance, ...resultsWithoutDistance]
      
      console.log('Sorted results:', filteredResults.map(r => ({
        name: r.name,
        distance: r.distance ? `${r.distance.toFixed(2)}km` : 'No distance',
        coordinates: r.coordinates
      })))
    } else {
      console.log('No user location available for distance sorting')
    }

    // Limit results
    setResults(filteredResults.slice(0, selectedCategory ? 10 : 5))
  }, [searchQuery, selectedCategory, buildings, openSpaces, locations, userLocation])

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
    // Keep the category filter active when selecting a result
    onSelect(result)
  }

  // Handle category selection
  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      // Deselect category if already selected
      setSelectedCategory(null)
      setShowResults(false)
    } else {
      // Select new category
      setSelectedCategory(categoryName)
      setSearchQuery('') // Clear search query when filtering by category
      setShowResults(true)
    }
  }

  // Get categories for display (show at least 5, up to all available)
  const getDisplayCategories = (): Category[] => {
    console.log('All categories:', categories)
    
    const importantCategories = [
      'Parking', 'Dining', 'Healthcare', 'Academic', 'Library', 'Laboratory', 
      'Office', 'Recreation', 'Student Services', 'Administration'
    ]
    
    // First, try to get important categories
    const displayCategories = categories
      .filter(cat => importantCategories.includes(cat.name))
    
    console.log('Display categories:', displayCategories)
    
    // If we have fewer than 5 important categories, add others to reach at least 5
    if (displayCategories.length < 5 && categories.length > 0) {
      const remainingCategories = categories
        .filter(cat => !importantCategories.includes(cat.name))
        .slice(0, 5 - displayCategories.length)
      
      const allDisplayCategories = [...displayCategories, ...remainingCategories]
      return allDisplayCategories.slice(0, Math.max(5, categories.length))
    }
    
    // Show all categories if we have them
    return displayCategories.length > 0 ? displayCategories : categories
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
    <div ref={searchRef} className={`absolute top-4 left-4 right-4 md:left-4 md:right-auto md:w-[450px] z-20 transition-all duration-300 ${isPanelExpanded ? 'hidden md:hidden lg:hidden' : 'block'}`}>
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
          onFocus={() => {
            setShowResults(true)
            // Clear category filter when user starts searching
            if (selectedCategory) {
              setSelectedCategory(null)
            }
          }}
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

      {/* Category Buttons */}
      <div className="mt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-2 min-w-max">        
            {getDisplayCategories().map((category) => {
              // Debug logging
              console.log('Rendering category:', category.name)
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:bg-primary-50 shadow-sm'
                  }`}
                >
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Fallback: Show if no categories */}
        {getDisplayCategories().length === 0 && (
          <div className="text-sm text-gray-500">Loading categories...</div>
        )}
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
                {/* Distance and time display */}
                {result.distance !== undefined && (
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      <Navigation className="w-3 h-3" />
                      <span className="font-medium">{formatDistance(result.distance)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <span>🚶</span>
                      <span className="font-medium">{calculateWalkingTime(result.distance)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="text-xs text-gray-400 uppercase tracking-wide">
                  {result.type === 'building' ? 'Building' : result.type === 'openSpace' ? 'Open Space' : 'Location'}
                </div>
                {result.distance !== undefined && (
                  <div className="text-right">
                    <div className="text-xs font-bold text-primary-600">
                      {formatDistance(result.distance)}
                    </div>
                    <div className="text-xs text-green-600">
                      {calculateWalkingTime(result.distance)} walk
                    </div>
                  </div>
                )}
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
