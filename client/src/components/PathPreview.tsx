/**
 * PathPreview Component
 * Purpose: Display a path on a Mapbox map for preview
 * Features: Shows path geometry, zooms to fit, uses primary color
 */

import { useEffect, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { X, Route, MapPin, Trash2, Power } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'

interface PathPreviewProps {
  path: any | null // null for Map View mode (show all paths)
  allPaths?: any[] // All paths to display on the map
  buildings?: any[] // All buildings to display as polygons
  openSpaces?: any[] // All open spaces to display as polygons
  campusId?: string // Campus ID to fetch all data
  onClose: () => void
  onDelete?: (pathId: string, pathName: string) => void
  onToggleActive?: (pathId: string, pathName: string, isActive: boolean) => void
}

export function PathPreview({ path, allPaths = [], buildings = [], openSpaces = [], campusId, onClose, onDelete, onToggleActive }: PathPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [allData, setAllData] = useState<{
    paths: any[]
    buildings: any[]
    openSpaces: any[]
  }>({
    paths: allPaths,
    buildings: buildings,
    openSpaces: openSpaces
  })

  // Fetch all data from database when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      if (!campusId) return

      try {
        console.log('Fetching all data for campus:', campusId)
        
        // Import API functions dynamically
        const { getAllPaths } = await import('@/api/pathApi')
        const { getAllBuildings } = await import('@/api/buildingApi')
        const { getOpenSpaces } = await import('@/api/openSpaceApi')

        // Fetch all data with high limit to get everything
        const [pathsResponse, buildingsResponse, openSpacesResponse] = await Promise.all([
          getAllPaths(1, 1000, '', campusId),
          getAllBuildings(1, 1000, '', campusId),
          getOpenSpaces(1, 1000, '', campusId)
        ])

        console.log('Fetched paths:', pathsResponse.data?.length || 0)
        console.log('Fetched buildings:', buildingsResponse.data?.length || 0)
        console.log('Fetched open spaces:', (openSpacesResponse as any).data?.length || 0)

        setAllData({
          paths: pathsResponse.data || [],
          buildings: buildingsResponse.data || [],
          openSpaces: (openSpacesResponse as any).data || []
        })
      } catch (error) {
        console.error('Error fetching all data:', error)
        // Fallback to passed props if fetch fails
        setAllData({
          paths: allPaths,
          buildings: buildings,
          openSpaces: openSpaces
        })
      }
    }

    fetchAllData()
  }, [campusId, allPaths, buildings, openSpaces])

  useEffect(() => {
    // For Map View mode (path is null), we need at least the map container
    // For specific path mode, we need both container and path coordinates
    if (!mapContainerRef.current) return
    if (path !== null && !path?.coordinates) return

    // Initialize Mapbox map
    const initializeMap = async () => {
      try {
        // Dynamic import of mapbox-gl
        const mapboxgl = await import('mapbox-gl')
        
        // Get the Map class - handle both default export and named export
        const { Map, LngLatBounds, Popup } = mapboxgl.default || mapboxgl
        
        // Set Mapbox access token
        const token = import.meta.env.VITE_MAPBOX_TOKEN
        if (!token) {
          console.error('Mapbox token not found. Please set VITE_MAPBOX_TOKEN in your environment variables.')
          return
        }
        
        // Set access token on the imported mapbox object
        if (mapboxgl.default) {
          mapboxgl.default.accessToken = token
        } else {
          (mapboxgl as any).accessToken = token
        }

        // Calculate bounds based on mode
        const bounds = new LngLatBounds()
        
        if (path) {
          // Specific path mode: Parse and validate the selected path coordinates
          let coordinates
          try {
            coordinates = typeof path.coordinates === 'string' 
              ? JSON.parse(path.coordinates) 
              : path.coordinates
          } catch (error) {
            console.error('Failed to parse path coordinates:', error)
            return
          }

          // Ensure we have valid LineString coordinates
          if (!coordinates || coordinates.type !== 'LineString' || !coordinates.coordinates || !Array.isArray(coordinates.coordinates)) {
            console.error('Invalid path coordinates. Expected LineString with coordinates array:', coordinates)
            return
          }

          const lineCoords = coordinates.coordinates
          
          // Validate coordinate format
          if (!lineCoords || lineCoords.length < 2) {
            console.error('LineString must have at least 2 coordinate points:', lineCoords)
            return
          }

          // Validate each coordinate is [lng, lat] format
          const validCoords = lineCoords.every((coord: any) => 
            Array.isArray(coord) && coord.length >= 2 && 
            typeof coord[0] === 'number' && typeof coord[1] === 'number'
          )
          
          if (!validCoords) {
            console.error('Invalid coordinate format. Expected [longitude, latitude] pairs:', lineCoords)
            return
          }

          console.log('Valid coordinates detected:', lineCoords)

          // Calculate bounds for the selected path
          try {
            lineCoords.forEach((coord: [number, number]) => {
              bounds.extend(coord)
            })
          } catch (error) {
            console.error('Error calculating bounds:', error)
            return
          }
        } else {
          // Map View mode: Calculate bounds from all paths, buildings, and open spaces
          console.log('Map View mode: calculating bounds from all data')
          let hasCoordinates = false
          
          // Add all path coordinates to bounds
          allData.paths.forEach(p => {
            try {
              if (!p.coordinates) return
              const coords = typeof p.coordinates === 'string' ? JSON.parse(p.coordinates) : p.coordinates
              if (coords?.type === 'LineString' && coords?.coordinates) {
                coords.coordinates.forEach((coord: [number, number]) => {
                  bounds.extend(coord)
                  hasCoordinates = true
                })
              }
            } catch (error) {
              console.warn('Failed to parse path coordinates:', p.name, error)
            }
          })
          
          // Add building coordinates to bounds
          allData.buildings.forEach(b => {
            try {
              if (!b.coordinates) return
              const coords = typeof b.coordinates === 'string' ? JSON.parse(b.coordinates) : b.coordinates
              if ((coords?.type === 'Polygon' || coords?.type === 'MultiPolygon') && coords?.coordinates) {
                const polygonCoords = coords.type === 'Polygon' ? [coords.coordinates] : coords.coordinates
                polygonCoords.forEach((ring: any) => {
                  ring[0]?.forEach((coord: [number, number]) => {
                    bounds.extend(coord)
                    hasCoordinates = true
                  })
                })
              }
            } catch (error) {
              console.warn('Failed to parse building coordinates:', b.name, error)
            }
          })
          
          // Add open space coordinates to bounds
          allData.openSpaces.forEach(os => {
            try {
              if (!os.coordinates) return
              const coords = typeof os.coordinates === 'string' ? JSON.parse(os.coordinates) : os.coordinates
              if ((coords?.type === 'Polygon' || coords?.type === 'MultiPolygon') && coords?.coordinates) {
                const polygonCoords = coords.type === 'Polygon' ? [coords.coordinates] : coords.coordinates
                polygonCoords.forEach((ring: any) => {
                  ring[0]?.forEach((coord: [number, number]) => {
                    bounds.extend(coord)
                    hasCoordinates = true
                  })
                })
              }
            } catch (error) {
              console.warn('Failed to parse open space coordinates:', os.name, error)
            }
          })
          
          if (!hasCoordinates) {
            console.error('No valid coordinates found in any data')
            return
          }
        }

        // Create map
        const map = new Map({
          container: mapContainerRef.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          bounds: bounds,
          fitBoundsOptions: {
            padding: 50,
            maxZoom: 18
          }
        })

        mapRef.current = map

        map.on('load', () => {
          console.log('Map loaded, adding all paths...')
          console.log('Using data - Paths:', allData.paths.length, 'Buildings:', allData.buildings.length, 'Open Spaces:', allData.openSpaces.length)
          
          // Create GeoJSON FeatureCollection with all paths
          const features = allData.paths
            .filter(p => p.coordinates) // Only include paths with valid coordinates
            .map(p => {
              try {
                const coords = typeof p.coordinates === 'string' ? JSON.parse(p.coordinates) : p.coordinates
                return {
                  type: 'Feature' as const,
                  properties: {
                    id: p.id,
                    name: p.name,
                    isActive: p.isActive,
                    isSelected: path ? p.id === path.id : false // In Map View mode, no path is selected
                  },
                  geometry: coords
                }
              } catch (error) {
                console.error('Error parsing path coordinates:', p.name, error)
                return null
              }
            })
            .filter(f => f !== null)

          const featureCollection = {
            type: 'FeatureCollection' as const,
            features: features
          }
          
          console.log('Feature collection with', features.length, 'paths')

          // Add paths source
          try {
            map.addSource('all-paths', {
              type: 'geojson',
              data: featureCollection as any
            })
          } catch (error) {
            console.error('Error adding paths source:', error)
            return
          }

          // Add path outlines for better visibility
          try {
            map.addLayer({
              id: 'paths-outline',
              type: 'line',
              source: 'all-paths',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#ffffff',
                'line-width': 8,
                'line-opacity': 0.8
              }
            })
          } catch (error) {
            console.error('Error adding paths outline layer:', error)
          }

          // Add inactive paths layer (red)
          try {
            map.addLayer({
              id: 'paths-inactive',
              type: 'line',
              source: 'all-paths',
              filter: ['all', ['==', ['get', 'isActive'], false], ['==', ['get', 'isSelected'], false]],
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#ef4444', // Red for inactive
                'line-width': 4,
                'line-opacity': 0.7
              }
            })
            console.log('Inactive paths layer added')
          } catch (error) {
            console.error('Error adding inactive paths layer:', error)
          }

          // Add active paths layer (blue)
          try {
            map.addLayer({
              id: 'paths-active',
              type: 'line',
              source: 'all-paths',
              filter: ['all', ['==', ['get', 'isActive'], true], ['==', ['get', 'isSelected'], false]],
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#3b82f6', // Blue for active
                'line-width': 4,
                'line-opacity': 0.8
              }
            })
            console.log('Active paths layer added')
          } catch (error) {
            console.error('Error adding active paths layer:', error)
          }

          // Add selected path layer (green) - on top
          try {
            map.addLayer({
              id: 'path-selected',
              type: 'line',
              source: 'all-paths',
              filter: ['==', ['get', 'isSelected'], true],
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#10b981', // Green for selected
                'line-width': 5,
                'line-opacity': 1
              }
            })
            console.log('Selected path layer added')
          } catch (error) {
            console.error('Error adding selected path layer:', error)
          }

          // Add buildings as polygons
          if (allData.buildings && allData.buildings.length > 0) {
            const buildingFeatures = allData.buildings
              .filter(b => b.coordinates)
              .map(b => {
                try {
                  const coords = typeof b.coordinates === 'string' ? JSON.parse(b.coordinates) : b.coordinates
                  
                  // Validate geometry structure
                  if (!coords || !coords.type || !coords.coordinates) {
                    console.warn('Invalid building geometry structure:', b.name)
                    return null
                  }
                  
                  // Validate it's a Polygon or MultiPolygon
                  if (coords.type !== 'Polygon' && coords.type !== 'MultiPolygon') {
                    console.warn('Building geometry must be Polygon or MultiPolygon:', b.name, coords.type)
                    return null
                  }
                  
                  return {
                    type: 'Feature' as const,
                    properties: {
                      id: b.id,
                      name: b.name,
                      type: 'building'
                    },
                    geometry: coords
                  }
                } catch (error) {
                  console.error('Error parsing building coordinates:', b.name, error)
                  return null
                }
              })
              .filter(f => f !== null)

            console.log('Valid building features:', buildingFeatures.length)
            
            if (buildingFeatures.length > 0) {
              try {
                map.addSource('buildings', {
                  type: 'geojson',
                  data: {
                    type: 'FeatureCollection' as const,
                    features: buildingFeatures
                  } as any
                })

                // Building fill
                map.addLayer({
                  id: 'buildings-fill',
                  type: 'fill',
                  source: 'buildings',
                  paint: {
                    'fill-color': '#94a3b8', // Gray color for buildings
                    'fill-opacity': 0.3
                  }
                })

                // Building outline
                map.addLayer({
                  id: 'buildings-outline',
                  type: 'line',
                  source: 'buildings',
                  paint: {
                    'line-color': '#64748b',
                    'line-width': 2,
                    'line-opacity': 0.8
                  }
                })

                console.log('Buildings layer added:', buildingFeatures.length, 'buildings')
              } catch (error) {
                console.error('Error adding buildings layer:', error)
              }
            }
          }

          // Add open spaces as polygons
          if (allData.openSpaces && allData.openSpaces.length > 0) {
            const openSpaceFeatures = allData.openSpaces
              .filter(os => os.coordinates)
              .map(os => {
                try {
                  const coords = typeof os.coordinates === 'string' ? JSON.parse(os.coordinates) : os.coordinates
                  
                  // Validate geometry structure
                  if (!coords || !coords.type || !coords.coordinates) {
                    console.warn('Invalid open space geometry structure:', os.name)
                    return null
                  }
                  
                  // Validate it's a Polygon or MultiPolygon
                  if (coords.type !== 'Polygon' && coords.type !== 'MultiPolygon') {
                    console.warn('Open space geometry must be Polygon or MultiPolygon:', os.name, coords.type)
                    return null
                  }
                  
                  return {
                    type: 'Feature' as const,
                    properties: {
                      id: os.id,
                      name: os.name,
                      type: 'openspace'
                    },
                    geometry: coords
                  }
                } catch (error) {
                  console.error('Error parsing open space coordinates:', os.name, error)
                  return null
                }
              })
              .filter(f => f !== null)

            console.log('Valid open space features:', openSpaceFeatures.length)
            
            if (openSpaceFeatures.length > 0) {
              try {
                map.addSource('openspaces', {
                  type: 'geojson',
                  data: {
                    type: 'FeatureCollection' as const,
                    features: openSpaceFeatures
                  } as any
                })

                // Open space fill
                map.addLayer({
                  id: 'openspaces-fill',
                  type: 'fill',
                  source: 'openspaces',
                  paint: {
                    'fill-color': '#86efac', // Light green for open spaces
                    'fill-opacity': 0.3
                  }
                })

                // Open space outline
                map.addLayer({
                  id: 'openspaces-outline',
                  type: 'line',
                  source: 'openspaces',
                  paint: {
                    'line-color': '#22c55e',
                    'line-width': 2,
                    'line-opacity': 0.8
                  }
                })

                console.log('Open spaces layer added:', openSpaceFeatures.length, 'open spaces')
              } catch (error) {
                console.error('Error adding open spaces layer:', error)
              }
            }
          }

          // Add popup on click for all path layers
          const pathLayers = ['paths-inactive', 'paths-active', 'path-selected']
          
          pathLayers.forEach(layerId => {
            map.on('click', layerId, (e: any) => {
              if (e.features && e.features[0]) {
                const feature = e.features[0]
                const pathName = feature.properties.name
                const clickedPathId = feature.properties.id
                const isActive = feature.properties.isActive
                const isSelected = feature.properties.isSelected
                
                // In Map View mode (path is null), show action buttons
                const showActions = !path && onDelete && onToggleActive
                
                const popup = new Popup()
                  .setLngLat(e.lngLat)
                  .setHTML(`
                    <div class="p-2" style="min-width: 150px;">
                      <h3 class="font-semibold text-sm mb-2">${pathName}</h3>
                      <div class="flex gap-1 mb-2">
                        <span class="text-xs px-1.5 py-0.5 rounded ${isSelected ? 'bg-green-100 text-green-700' : isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}">
                          ${isSelected ? 'Selected' : isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      ${showActions ? `
                        <div class="flex flex-col gap-1 mt-2">
                          <button 
                            id="toggle-path-${clickedPathId}" 
                            class="text-xs px-2 py-1 rounded border hover:bg-gray-50 flex items-center gap-1"
                            style="cursor: pointer;"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            ${isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            id="delete-path-${clickedPathId}" 
                            class="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
                            style="cursor: pointer;"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      ` : '<p class="text-xs text-gray-500 mt-1">Click and drag to explore</p>'}
                    </div>
                  `)
                  .addTo(map)
                
                // Add event listeners for action buttons
                if (showActions) {
                  setTimeout(() => {
                    const toggleBtn = document.getElementById(`toggle-path-${clickedPathId}`)
                    const deleteBtn = document.getElementById(`delete-path-${clickedPathId}`)
                    
                    if (toggleBtn) {
                      toggleBtn.addEventListener('click', () => {
                        onToggleActive(clickedPathId, pathName, isActive)
                        popup.remove()
                      })
                    }
                    
                    if (deleteBtn) {
                      deleteBtn.addEventListener('click', () => {
                        onDelete(clickedPathId, pathName)
                        popup.remove()
                      })
                    }
                  }, 0)
                }
              }
            })

            // Change cursor on hover
            map.on('mouseenter', layerId, () => {
              map.getCanvas().style.cursor = 'pointer'
            })

            map.on('mouseleave', layerId, () => {
              map.getCanvas().style.cursor = ''
            })
          })
        })

        // Handle map errors
        map.on('error', (e: any) => {
          console.error('Map error:', e)
        })

      } catch (error) {
        console.error('Failed to initialize map:', error)
      }
    }

    initializeMap()

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, [path, allData])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Route className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-xl">{path ? path.name : 'Campus Map View'}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {path ? 'Path Preview' : 'Map View'}
                  </Badge>
                  {path && (
                    <Badge variant={path.isActive ? "success" : "secondary"} className="text-xs">
                      {path.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                  {!path && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {allData.paths.length} Paths
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {allData.buildings.length} Buildings
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {allData.openSpaces.length} Open Spaces
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle Active Button - Only show for specific path */}
              {path && onToggleActive && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleActive(path.id, path.name, path.isActive)}
                  className="flex items-center gap-2"
                >
                  <Power className={`w-4 h-4 ${path.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  {path.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              
              {/* Delete Button - Only show for specific path */}
              {path && onDelete && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(path.id, path.name)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
              
              {/* Close Button */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {path?.description && (
            <p className="text-sm text-muted-foreground mt-2">{path.description}</p>
          )}
          {!path && (
            <p className="text-sm text-muted-foreground mt-2">
              Click on any path to view details and manage it
            </p>
          )}
        </CardHeader>

        {/* Map Container */}
        <CardContent className="flex-1 p-0 relative">
          <div 
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
          
          {/* Map Legend */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
            <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
            <div className="space-y-2 text-xs">
              <div className="font-medium text-gray-700 mt-2">Paths:</div>
              {path && (
                <div className="flex items-center gap-2 ml-2">
                  <div className="w-4 h-1 bg-green-500 rounded"></div>
                  <span>Selected Path</span>
                </div>
              )}
              <div className="flex items-center gap-2 ml-2">
                <div className="w-4 h-1 bg-blue-500 rounded"></div>
                <span>Active Paths</span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-4 h-1 bg-red-500 rounded"></div>
                <span>Inactive Paths</span>
              </div>
              {!path && (
                <p className="text-xs text-gray-500 ml-2 mt-1 italic">Click any path to manage</p>
              )}
              <div className="font-medium text-gray-700 mt-2">Areas:</div>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-4 h-4 bg-slate-400 opacity-30 border-2 border-slate-600 rounded"></div>
                <span>Buildings</span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-4 h-4 bg-green-300 opacity-30 border-2 border-green-500 rounded"></div>
                <span>Open Spaces</span>
              </div>
            </div>
          </div>

          {/* Loading overlay - only show for specific path mode */}
          {path && !path.coordinates && (
            <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map preview...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
