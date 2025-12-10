/**
 * MapPreview Component
 * Purpose: Full campus map view with all buildings, paths, and open spaces
 * Features: Click to select, delete, and toggle activation for any item
 */

import { useEffect, useRef, useState } from 'react'
import { X, Trash2, Power } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'

interface MapPreviewProps {
  buildings: any[]
  paths: any[]
  openSpaces: any[]
  campusId?: string
  onClose: () => void
  onDeleteBuilding?: (id: string, name: string) => void
  onToggleBuilding?: (id: string, name: string, isActive: boolean) => void
  onDeletePath?: (id: string, name: string) => void
  onTogglePath?: (id: string, name: string, isActive: boolean) => void
  onDeleteOpenSpace?: (id: string, name: string) => void
  onToggleOpenSpace?: (id: string, name: string, isActive: boolean) => void
}

export function MapPreview({
  buildings,
  paths,
  openSpaces,
  onClose,
  onDeleteBuilding,
  onToggleBuilding,
  onDeletePath,
  onTogglePath,
  onDeleteOpenSpace,
  onToggleOpenSpace
}: MapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ type: 'building' | 'path' | 'openSpace', data: any } | null>(null)

  useEffect(() => {
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token not found')
      return
    }

    // Dynamically import mapbox-gl
    import('mapbox-gl').then((mapboxgl) => {
      if (!mapContainerRef.current || mapRef.current) return

      mapboxgl.default.accessToken = MAPBOX_TOKEN

      // Calculate bounds from all data
      const allCoordinates: [number, number][] = []

      // Extract coordinates from buildings
      buildings.forEach(building => {
        try {
          const geom = typeof building.coordinates === 'string' 
            ? JSON.parse(building.coordinates) 
            : building.coordinates
          if (geom?.coordinates?.[0]) {
            geom.coordinates[0].forEach((coord: number[]) => {
              allCoordinates.push([coord[0], coord[1]])
            })
          }
        } catch (e) {
          console.error('Error parsing building coordinates:', e)
        }
      })

      // Extract coordinates from paths
      paths.forEach(path => {
        try {
          const geom = typeof path.coordinates === 'string' 
            ? JSON.parse(path.coordinates) 
            : path.coordinates
          if (geom?.coordinates) {
            geom.coordinates.forEach((coord: number[]) => {
              allCoordinates.push([coord[0], coord[1]])
            })
          }
        } catch (e) {
          console.error('Error parsing path coordinates:', e)
        }
      })

      // Extract coordinates from open spaces
      openSpaces.forEach(space => {
        try {
          const geom = typeof space.coordinates === 'string' 
            ? JSON.parse(space.coordinates) 
            : space.coordinates
          if (geom?.coordinates?.[0]) {
            geom.coordinates[0].forEach((coord: number[]) => {
              allCoordinates.push([coord[0], coord[1]])
            })
          }
        } catch (e) {
          console.error('Error parsing open space coordinates:', e)
        }
      })

      // Calculate bounds
      if (allCoordinates.length === 0) {
        console.error('No valid coordinates found')
        return
      }

      const lngs = allCoordinates.map(c => c[0])
      const lats = allCoordinates.map(c => c[1])
      const bounds = new mapboxgl.default.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      )

      // Initialize map
      const map = new mapboxgl.default.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        bounds: bounds,
        fitBoundsOptions: { padding: 50 }
      })

      map.on('load', () => {
        setMapLoaded(true)

        // Add buildings layer
        if (buildings.length > 0) {
          const buildingFeatures = buildings.map(building => {
            try {
              const geom = typeof building.coordinates === 'string' 
                ? JSON.parse(building.coordinates) 
                : building.coordinates
              return {
                type: 'Feature',
                properties: { 
                  id: building.id, 
                  name: building.name,
                  isActive: building.isActive,
                  type: 'building'
                },
                geometry: geom
              }
            } catch (e) {
              return null
            }
          }).filter(Boolean)

          map.addSource('buildings', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: buildingFeatures as any
            }
          })

          map.addLayer({
            id: 'buildings-fill',
            type: 'fill',
            source: 'buildings',
            paint: {
              'fill-color': '#94a3b8',
              'fill-opacity': 0.3
            }
          })

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

          map.addLayer({
            id: 'buildings-highlight',
            type: 'fill',
            source: 'buildings',
            paint: {
              'fill-color': '#3b82f6',
              'fill-opacity': 0.5
            },
            filter: ['==', 'id', '']
          })
        }

        // Add open spaces layer
        if (openSpaces.length > 0) {
          const openSpaceFeatures = openSpaces.map(space => {
            try {
              const geom = typeof space.coordinates === 'string' 
                ? JSON.parse(space.coordinates) 
                : space.coordinates
              return {
                type: 'Feature',
                properties: { 
                  id: space.id, 
                  name: space.name,
                  isActive: space.isActive,
                  type: 'openSpace'
                },
                geometry: geom
              }
            } catch (e) {
              return null
            }
          }).filter(Boolean)

          map.addSource('openSpaces', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: openSpaceFeatures as any
            }
          })

          map.addLayer({
            id: 'openSpaces-fill',
            type: 'fill',
            source: 'openSpaces',
            paint: {
              'fill-color': '#86efac',
              'fill-opacity': 0.3
            }
          })

          map.addLayer({
            id: 'openSpaces-outline',
            type: 'line',
            source: 'openSpaces',
            paint: {
              'line-color': '#22c55e',
              'line-width': 2,
              'line-opacity': 0.8
            }
          })

          map.addLayer({
            id: 'openSpaces-highlight',
            type: 'fill',
            source: 'openSpaces',
            paint: {
              'fill-color': '#22c55e',
              'fill-opacity': 0.5
            },
            filter: ['==', 'id', '']
          })
        }

        // Add paths layer
        if (paths.length > 0) {
          const pathFeatures = paths.map(path => {
            try {
              const geom = typeof path.coordinates === 'string' 
                ? JSON.parse(path.coordinates) 
                : path.coordinates
              return {
                type: 'Feature',
                properties: { 
                  id: path.id, 
                  name: path.name,
                  isActive: path.isActive,
                  type: 'path'
                },
                geometry: geom
              }
            } catch (e) {
              return null
            }
          }).filter(Boolean)

          map.addSource('paths', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: pathFeatures as any
            }
          })

          map.addLayer({
            id: 'paths-outline',
            type: 'line',
            source: 'paths',
            paint: {
              'line-color': '#ffffff',
              'line-width': 8,
              'line-opacity': 0.5
            }
          })

          map.addLayer({
            id: 'paths-line',
            type: 'line',
            source: 'paths',
            paint: {
              'line-color': ['case',
                ['get', 'isActive'], '#3b82f6',
                '#ef4444'
              ],
              'line-width': 4
            }
          })

          map.addLayer({
            id: 'paths-highlight',
            type: 'line',
            source: 'paths',
            paint: {
              'line-color': '#fbbf24',
              'line-width': 6
            },
            filter: ['==', 'id', '']
          })
        }

        // Add click handlers
        map.on('click', 'buildings-fill', (e: any) => {
          if (e.features && e.features[0]) {
            const feature = e.features[0]
            const building = buildings.find(b => b.id === feature.properties.id)
            if (building) {
              setSelectedItem({ type: 'building', data: building })
              map.setFilter('buildings-highlight', ['==', 'id', building.id])
              map.setFilter('openSpaces-highlight', ['==', 'id', ''])
              map.setFilter('paths-highlight', ['==', 'id', ''])
            }
          }
        })

        map.on('click', 'openSpaces-fill', (e: any) => {
          if (e.features && e.features[0]) {
            const feature = e.features[0]
            const space = openSpaces.find(s => s.id === feature.properties.id)
            if (space) {
              setSelectedItem({ type: 'openSpace', data: space })
              map.setFilter('openSpaces-highlight', ['==', 'id', space.id])
              map.setFilter('buildings-highlight', ['==', 'id', ''])
              map.setFilter('paths-highlight', ['==', 'id', ''])
            }
          }
        })

        map.on('click', 'paths-line', (e: any) => {
          if (e.features && e.features[0]) {
            const feature = e.features[0]
            const path = paths.find(p => p.id === feature.properties.id)
            if (path) {
              setSelectedItem({ type: 'path', data: path })
              map.setFilter('paths-highlight', ['==', 'id', path.id])
              map.setFilter('buildings-highlight', ['==', 'id', ''])
              map.setFilter('openSpaces-highlight', ['==', 'id', ''])
            }
          }
        })

        // Change cursor on hover
        map.on('mouseenter', 'buildings-fill', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'buildings-fill', () => { map.getCanvas().style.cursor = '' })
        map.on('mouseenter', 'openSpaces-fill', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'openSpaces-fill', () => { map.getCanvas().style.cursor = '' })
        map.on('mouseenter', 'paths-line', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'paths-line', () => { map.getCanvas().style.cursor = '' })
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [buildings, paths, openSpaces])

  const handleDelete = () => {
    if (!selectedItem) return
    
    if (selectedItem.type === 'building' && onDeleteBuilding) {
      onDeleteBuilding(selectedItem.data.id, selectedItem.data.name)
    } else if (selectedItem.type === 'path' && onDeletePath) {
      onDeletePath(selectedItem.data.id, selectedItem.data.name)
    } else if (selectedItem.type === 'openSpace' && onDeleteOpenSpace) {
      onDeleteOpenSpace(selectedItem.data.id, selectedItem.data.name)
    }
    setSelectedItem(null)
  }

  const handleToggle = () => {
    if (!selectedItem) return
    
    if (selectedItem.type === 'building' && onToggleBuilding) {
      onToggleBuilding(selectedItem.data.id, selectedItem.data.name, selectedItem.data.isActive)
    } else if (selectedItem.type === 'path' && onTogglePath) {
      onTogglePath(selectedItem.data.id, selectedItem.data.name, selectedItem.data.isActive)
    } else if (selectedItem.type === 'openSpace' && onToggleOpenSpace) {
      onToggleOpenSpace(selectedItem.data.id, selectedItem.data.name, selectedItem.data.isActive)
    }
    setSelectedItem(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Campus Map View</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{buildings.length} Buildings</Badge>
                <Badge variant="secondary">{paths.length} Paths</Badge>
                <Badge variant="secondary">{openSpaces.length} Open Spaces</Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Click on any building, path, or open space to select and manage it
          </p>
        </CardHeader>

        <CardContent className="flex-1 p-0 relative overflow-hidden">
          {/* Map Container */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-sm">
            <div className="font-semibold mb-2">Legend</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 border-2 border-gray-600 opacity-50"></div>
                <span>Buildings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-300 border-2 border-green-500 opacity-50"></div>
                <span>Open Spaces</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span>Active Paths</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500"></div>
                <span>Inactive Paths</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 opacity-50"></div>
                <span>Selected Item</span>
              </div>
            </div>
          </div>

          {/* Selected Item Panel */}
          {selectedItem && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{selectedItem.data.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{selectedItem.type === 'openSpace' ? 'Open Space' : selectedItem.type}</p>
                </div>
                <Badge variant={selectedItem.data.isActive ? 'success' : 'secondary'}>
                  {selectedItem.data.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              {selectedItem.data.description && (
                <p className="text-sm text-muted-foreground mb-3">{selectedItem.data.description}</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggle}
                  className="flex-1"
                >
                  <Power className={`w-4 h-4 mr-2 ${selectedItem.data.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  {selectedItem.data.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
