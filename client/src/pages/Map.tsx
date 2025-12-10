/**
 * Map Page
 * Purpose: Interactive map view for permanent and temporary users
 * Mobile-first responsive design
 */

import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Languages, LogOut, Settings, Menu, X, User, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useCampusStore } from '@/stores/campusStore'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getAllBuildings, getBuildingById } from '@/api/buildingApi'
import { getOpenSpaces, getOpenSpaceById } from '@/api/openSpaceApi'
import { getLocations, getLocationById } from '@/api/locationApi'
import { getAllCategories } from '@/api/categoryApi'
import { getCampusById } from '@/api/campusApi'
import { getCacheKey, getCacheVersion, isCacheValid, invalidateMapCache } from '@/utils/mapCache'
import { useWebSocket } from '@/hooks/useWebSocket'
import { FeatureInfoPanel } from '@/components/FeatureInfoPanel'
import { MapControls } from '@/components/MapControls'
import { MapSearch } from '@/components/MapSearch'
import { DirectionsPanel } from '@/components/DirectionsPanel'
import { use3DModels } from '@/hooks/use3DModels'
import { getAllEmergencyContacts } from '@/api/emergencyContactApi'
import { getPOIs } from '@/api/poiApi'
import { getAllPaths } from '@/api/pathApi'
import { usePathfinding } from '@/hooks/usePathfinding'

// Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZWxhY2hyeSIsImEiOiJjbTRqYXlqMmswMGNkMmtzNnBhMjBzNDVrIn0.pFBDxJ3Jc-TKMfZXMYB-Gg'

// Cache interface
interface MapCache {
  buildings: any[]
  openSpaces: any[]
  categories: any[]
  campus: any
  timestamp: number
  version: number  // Cache version for invalidation
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

export default function Map() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { selectedCampusId } = useCampusStore()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shouldReloadMap, setShouldReloadMap] = useState(0)
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null)
  const [selectedFeatureType, setSelectedFeatureType] = useState<'building' | 'openSpace' | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isPanelExpanded, setIsPanelExpanded] = useState(false)
  const [showDirections, setShowDirections] = useState(false)
  const [directionsDestination, setDirectionsDestination] = useState<{ name: string, coordinates: [number, number] } | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [previousMapPosition, setPreviousMapPosition] = useState<{ center: [number, number], zoom: number, pitch: number, bearing: number } | null>(null)
  const [buildingsData, setBuildingsData] = useState<any[]>([])
  const [openSpacesData, setOpenSpacesData] = useState<any[]>([])
  const [locationsData, setLocationsData] = useState<any[]>([])
  const [poisData, setPoisData] = useState<any[]>([])
  const [pathsData, setPathsData] = useState<any[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([])
  const [initialMapCenter, setInitialMapCenter] = useState<[number, number]>([-7.6033, 33.5731])
  const [initialMapZoom, setInitialMapZoom] = useState(16)
  const [initialMapPitch, setInitialMapPitch] = useState(0)
  const [initialMapBearing, setInitialMapBearing] = useState(0)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  // Load 3D models for buildings and open spaces
  use3DModels(map.current, buildingsData, openSpacesData)

  // Initialize pathfinding with POIs and paths
  const pathfinding = usePathfinding({
    pois: poisData,
    paths: pathsData,
    buildings: buildingsData,
    openSpaces: openSpacesData
  })

  // Load emoji icon as canvas-based image for Mapbox
  const loadIconToMapbox = async (map: mapboxgl.Map, iconName: string, emoji: string): Promise<void> => {
    // Check if icon already loaded
    if (map.hasImage(iconName)) return

    return new Promise((resolve) => {
      try {
        // Create canvas to render emoji
        const size = 48
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve()
          return
        }

        // Draw emoji on canvas
        ctx.font = `${size * 0.7}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(emoji, size / 2, size / 2)

        // Convert canvas to image
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve()
            return
          }

          const img = new Image()
          img.onload = () => {
            if (!map.hasImage(iconName)) {
              map.addImage(iconName, img as any)
            }
            resolve()
          }
          img.onerror = () => {
            console.error(`Failed to load icon: ${iconName}`)
            resolve()
          }
          img.src = URL.createObjectURL(blob)
        })
      } catch (error) {
        console.error(`Failed to load icon ${iconName}:`, error)
        resolve()
      }
    })
  }

  // Load all unique category icons into Mapbox
  const loadCategoryIcons = async (map: mapboxgl.Map, categories: any[]) => {
    const uniqueEmojis = new Set<string>()
    
    // Collect all unique emojis from categories
    categories.forEach((cat: any) => {
      if (cat.icon) {
        uniqueEmojis.add(cat.icon)
      }
    })

    // Add default emojis
    uniqueEmojis.add('🏢')  // Default building
    uniqueEmojis.add('🌳')  // Default open space

    // Load all emoji icons
    const loadPromises = Array.from(uniqueEmojis).map(emoji => 
      loadIconToMapbox(map, emoji, emoji)
    )

    await Promise.all(loadPromises)
  }

  // WebSocket connection for real-time cache invalidation
  const wsUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  useWebSocket({
    url: `${wsUrl}/ws`,
    onMessage: (data) => {
      if (data.type === 'cache_invalidate') {
        console.log('🔄 Cache invalidation received via WebSocket:', data.entityType)
        // Invalidate local cache
        invalidateMapCache(data.campusId)
        // Trigger map reload
        setShouldReloadMap(prev => prev + 1)
      }
    },
    onConnect: () => {
      console.log('✅ WebSocket connected for real-time updates')
    }
  })

  // Load map data with caching
  useEffect(() => {
    if (!selectedCampusId || !mapContainer.current) return

    const loadMapData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check cache first
        const cacheKey = getCacheKey(selectedCampusId)
        const cachedData = localStorage.getItem(cacheKey)
        const currentVersion = getCacheVersion()
        let buildings, openSpaces, categories, campus

        if (cachedData) {
          const cache: MapCache = JSON.parse(cachedData)
          const now = Date.now()
          
          // Use cache if still valid (time-based AND version-based)
          const isTimeValid = now - cache.timestamp < CACHE_DURATION
          const isVersionValid = isCacheValid(cache.version || 0)
          
          if (isTimeValid && isVersionValid) {
            console.log('📦 Using cached map data (version:', cache.version, ')')
            buildings = cache.buildings
            openSpaces = cache.openSpaces
            categories = cache.categories
            campus = cache.campus
          } else {
            if (!isVersionValid) {
              console.log('🔄 Cache invalidated - fetching fresh data')
            }
          }
        }

        // Fetch fresh data if no cache or expired
        if (!buildings || !openSpaces || !categories || !campus) {
          console.log('🔄 Fetching fresh map data')
          const [buildingsRes, openSpacesRes, categoriesRes, campusRes] = await Promise.all([
            getAllBuildings(1, 1000, '', selectedCampusId),
            getOpenSpaces(1, 1000, '', selectedCampusId),
            getAllCategories(1, 100),
            getCampusById(selectedCampusId)
          ])

          buildings = (buildingsRes as any).data || []
          openSpaces = (openSpacesRes as any).data || []
          categories = (categoriesRes as any).data || []
          campus = (campusRes as any).data || {}

          // Cache the data with current version
          const cacheData: MapCache = {
            buildings,
            openSpaces,
            categories,
            campus,
            timestamp: Date.now(),
            version: currentVersion
          }
          localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        }

        // Set data for 3D models
        setBuildingsData(buildings)
        setOpenSpacesData(openSpaces)

        // Load locations for search
        try {
          const locationsRes = await getLocations(1, 1000, undefined, selectedCampusId)
          setLocationsData((locationsRes as any).data || [])
        } catch (error) {
          console.error('Failed to load locations:', error)
        }

        // Load POIs for pathfinding
        try {
          const poisRes = await getPOIs(1, 10000, selectedCampusId)
          setPoisData((poisRes as any).data || [])
          console.log('📍 Loaded POIs:', (poisRes as any).data?.length || 0)
        } catch (error) {
          console.error('Failed to load POIs:', error)
        }

        // Load Paths for pathfinding
        try {
          const pathsRes = await getAllPaths(1, 10000, '', selectedCampusId)
          setPathsData((pathsRes as any).data || [])
          console.log('🛤️  Loaded Paths:', (pathsRes as any).data?.length || 0)
        } catch (error) {
          console.error('Failed to load paths:', error)
        }

        // Load emergency contacts
        try {
          const contactsRes = await getAllEmergencyContacts()
          setEmergencyContacts((contactsRes as any).data || [])
        } catch (error) {
          console.error('Failed to load emergency contacts:', error)
        }

        // Log campus display settings
        console.log('🎨 Campus Display Settings:', {
          buildingLabels3D: campus.showBuildingLabels3D,
          buildingLabelsNo3D: campus.showBuildingLabelsNo3D,
          buildingIcons3D: campus.showBuildingIcons3D,
          buildingIconsNo3D: campus.showBuildingIconsNo3D,
          openSpaceLabels3D: campus.showOpenSpaceLabels3D,
          openSpaceLabelsNo3D: campus.showOpenSpaceLabelsNo3D,
          openSpaceIcons3D: campus.showOpenSpaceIcons3D,
          openSpaceIconsNo3D: campus.showOpenSpaceIconsNo3D
        })

        // Create category color map
        const categoryColors: Record<string, string> = {}
        categories.forEach((cat: any) => {
          categoryColors[cat.id] = cat.color || '#3B82F6'
        })

        // Parse campus settings
        let mapCenter: [number, number] = [-7.9365, 32.2185] // Default UM6P coordinates
        let mapZoom = 15
        let mapPitch = 45
        let mapBearing = 0
        let mapStyle = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'
        let hoverColor = '#FFA500' // Default hover color (orange)
        let highlightColor = '#FF0000' // Default highlight color (red)

        if (campus) {
          // Parse mapCenter from campus settings
          if (campus.mapCenter) {
            try {
              const center = typeof campus.mapCenter === 'string' 
                ? JSON.parse(campus.mapCenter) 
                : campus.mapCenter
              if (Array.isArray(center) && center.length === 2) {
                mapCenter = [center[0], center[1]]
              }
            } catch (e) {
              console.error('Error parsing mapCenter:', e)
            }
          }

          // Use campus zoom settings
          if (campus.initialZoom) mapZoom = campus.initialZoom
          
          // Use campus map style if available
          if (campus.mapStyle) {
            mapStyle = campus.mapStyle
          }

          // Use campus hover and highlight colors
          if (campus.buildingHoverColor) hoverColor = campus.buildingHoverColor
          if (campus.buildingHighlightColor) highlightColor = campus.buildingHighlightColor
        }

        // Initialize map
        if (!map.current) {
          map.current = new mapboxgl.Map({
            container: mapContainer.current!,
            style: mapStyle,
            center: mapCenter,
            zoom: mapZoom,
            pitch: mapPitch,
            bearing: mapBearing,
            minZoom: campus?.minZoom || 10,
            maxZoom: campus?.maxZoom || 20
          })

          // Store initial map position for reset (use the calculated values)
          setInitialMapCenter(mapCenter)
          setInitialMapZoom(mapZoom)
          setInitialMapPitch(mapPitch)
          setInitialMapBearing(mapBearing)
          
          // Don't add built-in navigation controls - using custom controls instead
        }

        map.current.on('load', async () => {
          if (!map.current) return

          // Add buildings layer
          const buildingFeatures = buildings
            .filter((b: any) => b.coordinates)
            .map((building: any) => {
              try {
                const coords = typeof building.coordinates === 'string' 
                  ? JSON.parse(building.coordinates) 
                  : building.coordinates
                
                // Use building height, default to 10 meters if not specified
                const height = building.height || 10
                
                // Get category info for icon
                const category = categories.find((c: any) => c.id === building.categoryId)
                const iconEmoji = category?.icon || '🏢'
                
                return {
                  type: 'Feature',
                  properties: {
                    id: building.id,  // promoteId will use this as feature id
                    name: building.name,
                    description: building.description || '',
                    color: categoryColors[building.categoryId] || '#3B82F6',
                    height: height,
                    type: 'building',
                    icon: iconEmoji
                  },
                  geometry: coords
                }
              } catch (e) {
                console.error('Error parsing building coordinates:', e)
                return null
              }
            })
            .filter(Boolean)

          // Add open spaces layer
          const openSpaceFeatures = openSpaces
            .filter((os: any) => os.coordinates)
            .map((openSpace: any) => {
              try {
                const coords = typeof openSpace.coordinates === 'string'
                  ? JSON.parse(openSpace.coordinates)
                  : openSpace.coordinates

                // Get category info for icon
                const category = categories.find((c: any) => c.id === openSpace.categoryId)
                const iconEmoji = category?.icon || '🌳'
                
                return {
                  type: 'Feature',
                  properties: {
                    id: openSpace.id,  // promoteId will use this as feature id
                    name: openSpace.name,
                    description: openSpace.description || '',
                    color: categoryColors[openSpace.categoryId] || '#22C55E',
                    type: 'openSpace',
                    icon: iconEmoji
                  },
                  geometry: coords
                }
              } catch (e) {
                console.error('Error parsing open space coordinates:', e)
                return null
              }
            })
            .filter(Boolean)

          // Load category icons into Mapbox
          await loadCategoryIcons(map.current!, categories)

          // Layer order (bottom to top): Open Spaces → Buildings → 3D Models
          // Strategy: Add open spaces first, then buildings (which will be on top)
          // 3D models added last via hook (will be on top of everything)
          
          // Step 1: Add Open Spaces (BOTTOM LAYER)
          if (openSpaceFeatures.length > 0) {
            console.log('📐 Layer Order Step 1: Adding Open Spaces (bottom)')
            
            // Remove existing source if it exists
            if (map.current!.getSource('openSpaces')) {
              if (map.current!.getLayer('openSpaces-labels')) map.current!.removeLayer('openSpaces-labels')
              if (map.current!.getLayer('openSpaces-outline')) map.current!.removeLayer('openSpaces-outline')
              if (map.current!.getLayer('openSpaces-fill')) map.current!.removeLayer('openSpaces-fill')
              map.current!.removeSource('openSpaces')
            }

            map.current!.addSource('openSpaces', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: openSpaceFeatures as any
              },
              promoteId: 'id'
            })

            const openSpacesWithModels = openSpaces
              .filter((os: any) => os.modelId && os.buildingModel?.modelUrl)
              .map((os: any) => os.id)

            console.log(`🎯 Excluding ${openSpacesWithModels.length} open spaces with 3D models from fill layer`)

            map.current!.addLayer({
              id: 'openSpaces-fill',
              type: 'fill',
              source: 'openSpaces',
              filter: ['!', ['in', ['get', 'id'], ['literal', openSpacesWithModels]]],
              paint: {
                'fill-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  hoverColor,
                  ['boolean', ['feature-state', 'selected'], false],
                  highlightColor,
                  ['get', 'color']
                ],
                'fill-opacity': 0.9
              }
            })

            map.current!.addLayer({
              id: 'openSpaces-outline',
              type: 'line',
              source: 'openSpaces',
              filter: ['!', ['in', ['get', 'id'], ['literal', openSpacesWithModels]]],
              paint: {
                'line-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  hoverColor,
                  ['boolean', ['feature-state', 'selected'], false],
                  highlightColor,
                  ['get', 'color']
                ],
                'line-width': 2
              }
            })

            const showOSLabels3D = campus.showOpenSpaceLabels3D !== false
            const showOSLabelsNo3D = campus.showOpenSpaceLabelsNo3D !== false
            const showOSIcons3D = campus.showOpenSpaceIcons3D !== false
            const showOSIconsNo3D = campus.showOpenSpaceIconsNo3D !== false

            console.log('🌳 Open Space Display:', { 
              labels3D: showOSLabels3D, 
              labelsNo3D: showOSLabelsNo3D, 
              icons3D: showOSIcons3D, 
              iconsNo3D: showOSIconsNo3D,
              openSpacesWithModels: openSpacesWithModels.length
            })

            let osLabelFilter: any = ['all']
            if (!showOSLabels3D && !showOSLabelsNo3D) {
              osLabelFilter = ['==', 'id', '']
              console.log('🚫 Hiding all open space labels')
            } else if (!showOSLabels3D) {
              osLabelFilter = ['!', ['in', ['get', 'id'], ['literal', openSpacesWithModels]]]
              console.log('🏷️ Showing labels only for open spaces WITHOUT 3D models')
            } else if (!showOSLabelsNo3D) {
              osLabelFilter = ['in', ['get', 'id'], ['literal', openSpacesWithModels]]
              console.log('🏷️ Showing labels only for open spaces WITH 3D models')
            } else {
              console.log('🏷️ Showing labels for ALL open spaces')
            }

            map.current!.addLayer({
              id: 'openSpaces-labels',
              type: 'symbol',
              source: 'openSpaces',
              filter: osLabelFilter,
              layout: {
                'icon-image': showOSIcons3D || showOSIconsNo3D ? ['get', 'icon'] : '',
                'icon-size': 0.6,
                'text-field': ['get', 'name'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 10,
                'text-anchor': 'top',
                'text-offset': [0, 0.8],
                'icon-text-fit': 'none',
                'text-allow-overlap': false,
                'icon-allow-overlap': false,
                'text-optional': true
              },
              paint: {
                'text-color': '#2d5016',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1.5,
                'icon-color': '#22C55E',
                'icon-opacity': [
                  'case',
                  ['in', ['get', 'id'], ['literal', openSpacesWithModels]],
                  showOSIcons3D ? 1 : 0,
                  showOSIconsNo3D ? 1 : 0
                ]
              }
            })
          }

          // Step 2: Add Buildings (MIDDLE LAYER - on top of open spaces)
          if (buildingFeatures.length > 0) {
            console.log('📐 Layer Order Step 2: Adding Buildings (middle)')
            
            // Remove existing source if it exists
            if (map.current!.getSource('buildings')) {
              if (map.current!.getLayer('buildings-labels')) map.current!.removeLayer('buildings-labels')
              if (map.current!.getLayer('buildings-3d')) map.current!.removeLayer('buildings-3d')
              map.current!.removeSource('buildings')
            }

            map.current!.addSource('buildings', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: buildingFeatures as any
              },
              promoteId: 'id'  // Enable feature state by promoting id property
            })

            // Get list of building IDs that have 3D models
            const buildingsWithModels = buildings
              .filter((b: any) => b.modelId && b.buildingModel?.modelUrl)
              .map((b: any) => b.id)

            console.log(`🎯 Excluding ${buildingsWithModels.length} buildings with 3D models from fill-extrusion`)

            // 3D buildings layer (only for buildings WITHOUT 3D models)
            map.current!.addLayer({
              id: 'buildings-3d',
              type: 'fill-extrusion',
              source: 'buildings',
              filter: ['!', ['in', ['get', 'id'], ['literal', buildingsWithModels]]],
              paint: {
                'fill-extrusion-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  hoverColor,
                  ['boolean', ['feature-state', 'selected'], false],
                  highlightColor,
                  ['get', 'color']
                ],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 1.0
              }
            })

            // Determine which buildings to show labels/icons for based on settings
            const showLabels3D = campus.showBuildingLabels3D !== false
            const showLabelsNo3D = campus.showBuildingLabelsNo3D !== false
            const showIcons3D = campus.showBuildingIcons3D !== false
            const showIconsNo3D = campus.showBuildingIconsNo3D !== false

            console.log('🏢 Building Display:', { 
              labels3D: showLabels3D, 
              labelsNo3D: showLabelsNo3D, 
              icons3D: showIcons3D, 
              iconsNo3D: showIconsNo3D,
              buildingsWithModels: buildingsWithModels.length
            })

            // Build filter for labels
            let labelFilter: any = ['all']
            if (!showLabels3D && !showLabelsNo3D) {
              labelFilter = ['==', 'id', ''] // Hide all labels
              console.log('🚫 Hiding all building labels')
            } else if (!showLabels3D) {
              labelFilter = ['!', ['in', ['get', 'id'], ['literal', buildingsWithModels]]]
              console.log('🏷️ Showing labels only for buildings WITHOUT 3D models')
            } else if (!showLabelsNo3D) {
              labelFilter = ['in', ['get', 'id'], ['literal', buildingsWithModels]]
              console.log('🏷️ Showing labels only for buildings WITH 3D models')
            } else {
              console.log('🏷️ Showing labels for ALL buildings')
            }

            // Add building labels with icon
            map.current!.addLayer({
              id: 'buildings-labels',
              type: 'symbol',
              source: 'buildings',
              filter: labelFilter,
              layout: {
                'icon-image': showIcons3D || showIconsNo3D ? ['get', 'icon'] : '',
                'icon-size': 0.6,
                'text-field': ['get', 'name'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 10,
                'text-anchor': 'top',
                'text-offset': [0, 0.8],
                'icon-text-fit': 'none',
                'text-allow-overlap': false,
                'icon-allow-overlap': false,
                'text-optional': true
              },
              paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1.5,
                'icon-color': '#ffffff',
                'icon-opacity': [
                  'case',
                  ['in', ['get', 'id'], ['literal', buildingsWithModels]],
                  showIcons3D ? 1 : 0,
                  showIconsNo3D ? 1 : 0
                ]
              }
            })
          }

          // Step 3: 3D Models added via use3DModels hook (TOP LAYER)
          console.log('� Layer Order Step 3: 3D Models will be added on top via hook')

          // Track hover and selected states
          let hoveredBuildingId: string | null = null
          let hoveredOpenSpaceId: string | null = null
          let selectedBuildingId: string | null = null
          let selectedOpenSpaceId: string | null = null

          // Building hover handlers
          map.current!.on('mousemove', 'buildings-3d', (e: any) => {
            if (e.features.length > 0) {
              const featureId = e.features[0].properties.id
              if (featureId !== hoveredBuildingId) {
                // Clear previous hover
                if (hoveredBuildingId !== null && hoveredBuildingId !== undefined) {
                  map.current!.setFeatureState(
                    { source: 'buildings', id: hoveredBuildingId },
                    { hover: false }
                  )
                }
                // Set new hover
                hoveredBuildingId = featureId
                if (hoveredBuildingId !== null && hoveredBuildingId !== undefined) {
                  map.current!.setFeatureState(
                    { source: 'buildings', id: hoveredBuildingId },
                    { hover: true }
                  )
                }
              }
            }
          })
          
          // Change cursor on hover for buildings
          map.current!.on('mouseenter', 'buildings-3d', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer'
            }
          })
          
          map.current!.on('mouseleave', 'buildings-3d', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = ''
            }
            // Clear hover state
            if (hoveredBuildingId !== null && hoveredBuildingId !== undefined) {
              map.current!.setFeatureState(
                { source: 'buildings', id: hoveredBuildingId },
                { hover: false }
              )
            }
            hoveredBuildingId = null
          })

          // Building click handler with focus
          map.current!.on('click', 'buildings-3d', async (e: any) => {
            if (!e.features || e.features.length === 0) return
            const feature = e.features[0]
            
            // Clear previous selection
            if (selectedBuildingId !== null) {
              map.current!.setFeatureState(
                { source: 'buildings', id: selectedBuildingId as string },
                { selected: false }
              )
            }
            if (selectedOpenSpaceId !== null) {
              map.current!.setFeatureState(
                { source: 'openSpaces', id: selectedOpenSpaceId as string },
                { selected: false }
              )
              selectedOpenSpaceId = null
            }

            // Set new selection
            selectedBuildingId = feature.properties.id
            if (selectedBuildingId !== null && selectedBuildingId !== undefined) {
              map.current!.setFeatureState(
                { source: 'buildings', id: selectedBuildingId },
                { selected: true }
              )
            }

            // Save current map position before flying
            const currentCenter = map.current!.getCenter()
            const currentZoom = map.current!.getZoom()
            const currentPitch = map.current!.getPitch()
            const currentBearing = map.current!.getBearing()
            setPreviousMapPosition({
              center: [currentCenter.lng, currentCenter.lat],
              zoom: currentZoom,
              pitch: currentPitch,
              bearing: currentBearing
            })

            // Focus on building
            const coordinates = e.lngLat
            map.current!.flyTo({
              center: [coordinates.lng, coordinates.lat],
              zoom: 18,
              pitch: 60,
              duration: 1500
            })

            // Fetch full building details
            setIsLoadingDetails(true)
            setSelectedFeatureType('building')
            try {
              const buildingDetails = await getBuildingById(feature.properties.id)
              setSelectedFeature(buildingDetails)
            } catch (error) {
              console.error('Failed to fetch building details:', error)
            } finally {
              setIsLoadingDetails(false)
            }
          })

          // Open space hover handlers
          map.current!.on('mousemove', 'openSpaces-fill', (e: any) => {
            if (e.features.length > 0) {
              const featureId = e.features[0].properties.id
              if (featureId !== hoveredOpenSpaceId) {
                // Clear previous hover
                if (hoveredOpenSpaceId !== null && hoveredOpenSpaceId !== undefined) {
                  map.current!.setFeatureState(
                    { source: 'openSpaces', id: hoveredOpenSpaceId },
                    { hover: false }
                  )
                }
                // Set new hover
                hoveredOpenSpaceId = featureId
                if (hoveredOpenSpaceId !== null && hoveredOpenSpaceId !== undefined) {
                  map.current!.setFeatureState(
                    { source: 'openSpaces', id: hoveredOpenSpaceId },
                    { hover: true }
                  )
                }
              }
            }
          })
          
          // Change cursor on hover for open spaces
          map.current!.on('mouseenter', 'openSpaces-fill', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer'
            }
          })
          
          map.current!.on('mouseleave', 'openSpaces-fill', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = ''
            }
            // Clear hover state
            if (hoveredOpenSpaceId !== null && hoveredOpenSpaceId !== undefined) {
              map.current!.setFeatureState(
                { source: 'openSpaces', id: hoveredOpenSpaceId },
                { hover: false }
              )
            }
            hoveredOpenSpaceId = null
          })

          // Open space click handler with focus
          map.current!.on('click', 'openSpaces-fill', async (e: any) => {
            if (!e.features || e.features.length === 0) return
            const feature = e.features[0]
            
            // Clear previous selection
            if (selectedOpenSpaceId !== null) {
              map.current!.setFeatureState(
                { source: 'openSpaces', id: selectedOpenSpaceId as string },
                { selected: false }
              )
            }
            if (selectedBuildingId !== null) {
              map.current!.setFeatureState(
                { source: 'buildings', id: selectedBuildingId as string },
                { selected: false }
              )
              selectedBuildingId = null
            }

            // Set new selection
            selectedOpenSpaceId = feature.properties.id
            if (selectedOpenSpaceId !== null && selectedOpenSpaceId !== undefined) {
              map.current!.setFeatureState(
                { source: 'openSpaces', id: selectedOpenSpaceId },
                { selected: true }
              )
            }

            // Save current map position before flying
            const currentCenter = map.current!.getCenter()
            const currentZoom = map.current!.getZoom()
            const currentPitch = map.current!.getPitch()
            const currentBearing = map.current!.getBearing()
            setPreviousMapPosition({
              center: [currentCenter.lng, currentCenter.lat],
              zoom: currentZoom,
              pitch: currentPitch,
              bearing: currentBearing
            })

            // Focus on open space
            const coordinates = e.lngLat
            map.current!.flyTo({
              center: [coordinates.lng, coordinates.lat],
              zoom: 17,
              pitch: 45,
              duration: 1500
            })

            // Fetch full open space details
            setIsLoadingDetails(true)
            setSelectedFeatureType('openSpace')
            try {
              const openSpaceDetails = await getOpenSpaceById(feature.properties.id)
              setSelectedFeature(openSpaceDetails)
            } catch (error) {
              console.error('Failed to fetch open space details:', error)
            } finally {
              setIsLoadingDetails(false)
            }
          })

          // General map click handler for 3D models
          // This handles clicks on 3D models that don't have clickable 2D layers underneath
          map.current!.on('click', async (e: any) => {
            // Query all features at the click point
            const features = map.current!.queryRenderedFeatures(e.point, {
              layers: ['buildings-3d', 'openSpaces-fill']
            })

            // If we already have a feature from the layer-specific handlers, skip
            if (features.length > 0) return

            // Check if click is near any building or open space with a 3D model
            const clickPoint = [e.lngLat.lng, e.lngLat.lat]

            // Check buildings with 3D models
            for (const building of buildings) {
              if (!building.modelId || !building.buildingModel?.modelUrl) continue
              
              try {
                const geometry = typeof building.coordinates === 'string' 
                  ? JSON.parse(building.coordinates) 
                  : building.coordinates
                
                // Simple point-in-polygon or proximity check
                const coords = geometry.coordinates[0]
                let inside = false
                for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
                  const xi = coords[i][0], yi = coords[i][1]
                  const xj = coords[j][0], yj = coords[j][1]
                  
                  const intersect = ((yi > clickPoint[1]) !== (yj > clickPoint[1]))
                      && (clickPoint[0] < (xj - xi) * (clickPoint[1] - yi) / (yj - yi) + xi)
                  if (intersect) inside = !inside
                }

                if (inside) {
                  // Trigger building click
                  // Clear previous selection
                  if (selectedBuildingId !== null) {
                    map.current!.setFeatureState(
                      { source: 'buildings', id: selectedBuildingId as string },
                      { selected: false }
                    )
                  }
                  if (selectedOpenSpaceId !== null) {
                    map.current!.setFeatureState(
                      { source: 'openSpaces', id: selectedOpenSpaceId as string },
                      { selected: false }
                    )
                    selectedOpenSpaceId = null
                  }

                  selectedBuildingId = building.id
                  if (selectedBuildingId !== null && selectedBuildingId !== undefined) {
                    map.current!.setFeatureState(
                      { source: 'buildings', id: selectedBuildingId },
                      { selected: true }
                    )
                  }

                  // Save current map position
                  const currentCenter = map.current!.getCenter()
                  const currentZoom = map.current!.getZoom()
                  const currentPitch = map.current!.getPitch()
                  const currentBearing = map.current!.getBearing()
                  setPreviousMapPosition({
                    center: [currentCenter.lng, currentCenter.lat],
                    zoom: currentZoom,
                    pitch: currentPitch,
                    bearing: currentBearing
                  })

                  // Focus on building
                  map.current!.flyTo({
                    center: [e.lngLat.lng, e.lngLat.lat],
                    zoom: 18,
                    pitch: 60,
                    duration: 1500
                  })

                  // Fetch building details
                  setIsLoadingDetails(true)
                  setSelectedFeatureType('building')
                  try {
                    const buildingDetails = await getBuildingById(building.id)
                    setSelectedFeature(buildingDetails)
                  } catch (error) {
                    console.error('Failed to fetch building details:', error)
                  } finally {
                    setIsLoadingDetails(false)
                  }
                  return
                }
              } catch (error) {
                console.error('Error checking building click:', error)
              }
            }

            // Check open spaces with 3D models
            for (const openSpace of openSpaces) {
              if (!openSpace.modelId || !openSpace.buildingModel?.modelUrl) continue
              
              try {
                const geometry = typeof openSpace.coordinates === 'string' 
                  ? JSON.parse(openSpace.coordinates) 
                  : openSpace.coordinates
                
                // Simple point-in-polygon check
                const coords = geometry.coordinates[0]
                let inside = false
                for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
                  const xi = coords[i][0], yi = coords[i][1]
                  const xj = coords[j][0], yj = coords[j][1]
                  
                  const intersect = ((yi > clickPoint[1]) !== (yj > clickPoint[1]))
                      && (clickPoint[0] < (xj - xi) * (clickPoint[1] - yi) / (yj - yi) + xi)
                  if (intersect) inside = !inside
                }

                if (inside) {
                  // Trigger open space click
                  // Clear previous selection
                  if (selectedOpenSpaceId !== null) {
                    map.current!.setFeatureState(
                      { source: 'openSpaces', id: selectedOpenSpaceId as string },
                      { selected: false }
                    )
                  }
                  if (selectedBuildingId !== null) {
                    map.current!.setFeatureState(
                      { source: 'buildings', id: selectedBuildingId as string },
                      { selected: false }
                    )
                    selectedBuildingId = null
                  }

                  selectedOpenSpaceId = openSpace.id
                  if (selectedOpenSpaceId !== null && selectedOpenSpaceId !== undefined) {
                    map.current!.setFeatureState(
                      { source: 'openSpaces', id: selectedOpenSpaceId },
                      { selected: true }
                    )
                  }

                  // Save current map position
                  const currentCenter = map.current!.getCenter()
                  const currentZoom = map.current!.getZoom()
                  const currentPitch = map.current!.getPitch()
                  const currentBearing = map.current!.getBearing()
                  setPreviousMapPosition({
                    center: [currentCenter.lng, currentCenter.lat],
                    zoom: currentZoom,
                    pitch: currentPitch,
                    bearing: currentBearing
                  })

                  // Focus on open space
                  map.current!.flyTo({
                    center: [e.lngLat.lng, e.lngLat.lat],
                    zoom: 17,
                    pitch: 45,
                    duration: 1500
                  })

                  // Fetch open space details
                  setIsLoadingDetails(true)
                  setSelectedFeatureType('openSpace')
                  try {
                    const openSpaceDetails = await getOpenSpaceById(openSpace.id)
                    setSelectedFeature(openSpaceDetails)
                  } catch (error) {
                    console.error('Failed to fetch open space details:', error)
                  } finally {
                    setIsLoadingDetails(false)
                  }
                  return
                }
              } catch (error) {
                console.error('Error checking open space click:', error)
              }
            }
          })

          setIsLoading(false)
        })
      } catch (err: any) {
        console.error('Error loading map:', err)
        setError(err.message || 'Failed to load map')
        setIsLoading(false)
      }
    }

    loadMapData()

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [selectedCampusId, theme, shouldReloadMap])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleAccountSettings = () => {
    navigate('/change-password')
    setShowProfileMenu(false)
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const getUserInitials = () => {
    const firstName = user?.firstName || ''
    const lastName = user?.lastName || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleSearchSelect = async (result: { id: string; name: string; type: 'building' | 'openSpace' | 'location' }) => {
    if (!map.current) return

    // Save current map position
    const currentCenter = map.current.getCenter()
    const currentZoom = map.current.getZoom()
    const currentPitch = map.current.getPitch()
    const currentBearing = map.current.getBearing()
    setPreviousMapPosition({
      center: [currentCenter.lng, currentCenter.lat],
      zoom: currentZoom,
      pitch: currentPitch,
      bearing: currentBearing
    })

    if (result.type === 'building') {
      // Fetch and display building
      setIsLoadingDetails(true)
      setSelectedFeatureType('building')
      try {
        const buildingDetails = await getBuildingById(result.id)
        setSelectedFeature(buildingDetails)
        
        // Fly to building
        const geometry = typeof buildingDetails.coordinates === 'string'
          ? JSON.parse(buildingDetails.coordinates)
          : buildingDetails.coordinates
        const coords = geometry.coordinates[0][0]
        
        map.current.flyTo({
          center: coords,
          zoom: 18,
          pitch: 60,
          duration: 1500
        })
      } catch (error) {
        console.error('Failed to fetch building details:', error)
      } finally {
        setIsLoadingDetails(false)
      }
    } else if (result.type === 'openSpace') {
      // Fetch and display open space
      setIsLoadingDetails(true)
      setSelectedFeatureType('openSpace')
      try {
        const openSpaceDetails: any = await getOpenSpaceById(result.id)
        setSelectedFeature(openSpaceDetails)
        
        // Fly to open space
        const geometry = typeof openSpaceDetails.coordinates === 'string'
          ? JSON.parse(openSpaceDetails.coordinates)
          : openSpaceDetails.coordinates
        const coords = geometry.coordinates[0][0]
        
        map.current.flyTo({
          center: coords,
          zoom: 17,
          pitch: 45,
          duration: 1500
        })
      } catch (error) {
        console.error('Failed to fetch open space details:', error)
      } finally {
        setIsLoadingDetails(false)
      }
    } else if (result.type === 'location') {
      // Fetch and display location
      setIsLoadingDetails(true)
      setSelectedFeatureType('building') // Locations belong to buildings
      try {
        const locationDetails: any = await getLocationById(result.id)
        setSelectedFeature(locationDetails)
        
        // Fly to location (use building coordinates if available)
        if (locationDetails.building?.coordinates) {
          const geometry = typeof locationDetails.building.coordinates === 'string'
            ? JSON.parse(locationDetails.building.coordinates)
            : locationDetails.building.coordinates
          const coords = geometry.coordinates[0][0]
          
          map.current.flyTo({
            center: coords,
            zoom: 19,
            pitch: 60,
            duration: 1500
          })
        }
      } catch (error) {
        console.error('Failed to fetch location details:', error)
      } finally {
        setIsLoadingDetails(false)
      }
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Mobile Responsive */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo - UM6P */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/um6p-logo.png" 
                alt="UM6P Logo" 
                className="h-8 sm:h-10 w-auto"
                onError={(e) => {
                  // Fallback to text if logo not found
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div className="hidden font-bold text-primary text-lg sm:text-xl">UM6P</div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              {/* Language Switcher - Simple Icon Button */}
              <button
                onClick={toggleLanguage}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                title={`Switch to ${i18n.language === 'en' ? 'Français' : 'English'}`}
              >
                <Languages className="w-4 h-4" />
                <span className="text-xs font-semibold ml-0.5 hidden lg:inline">{i18n.language.toUpperCase()}</span>
              </button>

              {/* Theme Switcher - Simple Icon Button */}
              <button
                onClick={toggleTheme}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    {/* Account Settings - Only for permanent users */}
                    {user?.userType === 'PERMANENT' && (
                      <button
                        onClick={handleAccountSettings}
                        className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        Account Settings
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pt-4 border-t border-border space-y-2">
              {/* Language Toggle Mobile */}
              <button
                onClick={() => {
                  toggleLanguage()
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm"
              >
                <Languages className="w-4 h-4" />
                {i18n.language === 'en' ? 'Français' : 'English'}
              </button>

              {/* Theme Toggle Mobile */}
              <button
                onClick={() => {
                  toggleTheme()
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>

              {/* Profile Mobile */}
              <div className="border-t border-border pt-2 mt-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                {/* Account Settings - Only for permanent users */}
                {user?.userType === 'PERMANENT' && (
                  <button
                    onClick={() => {
                      handleAccountSettings()
                      setShowMobileMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </button>
                )}
                <button
                  onClick={() => {
                    handleLogout()
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Map Container - Mobile Responsive */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading interactive map...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="text-center p-6">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        <div ref={mapContainer} className="w-full h-full" />

        {/* Search Bar */}
        {!isLoading && !showDirections && (
          <MapSearch
            buildings={buildingsData}
            openSpaces={openSpacesData}
            locations={locationsData}
            onSelect={handleSearchSelect}
            onDirections={(result) => {
              // If result has a name, set it as destination, otherwise open empty
              if (result.name) {
                setDirectionsDestination({
                  name: result.name,
                  coordinates: [0, 0] // Will be populated from actual data
                })
              } else {
                setDirectionsDestination(null)
              }
              setShowDirections(true)
            }}
            isPanelExpanded={!!selectedFeature || isPanelExpanded}
          />
        )}

        {/* Directions Panel */}
        {showDirections && (
          <DirectionsPanel
            onClose={() => {
              setShowDirections(false)
              // Clear route from map
              if (map.current) {
                if (map.current.getLayer('route')) {
                  map.current.removeLayer('route')
                }
                if (map.current.getSource('route')) {
                  map.current.removeSource('route')
                }
              }
              pathfinding.clearRoute()
            }}
            initialDestination={directionsDestination || undefined}
            userLocation={userLocation}
            buildings={buildingsData}
            openSpaces={openSpacesData}
            locations={locationsData}
            onGetDirections={async (source, destination) => {
              console.log('🗺️ Getting directions from', source?.name, 'to', destination?.name)
              
              if (!source || !destination) {
                console.warn('⚠️ Source or destination missing')
                return
              }

              // Helper function to extract valid coordinates
              const getValidCoordinates = (data: any, fallback: any): [number, number] => {
                // Try center first
                if (data?.center && Array.isArray(data.center) && data.center.length === 2) {
                  return data.center as [number, number]
                }
                
                // Try coordinates field
                if (data?.coordinates) {
                  // If it's already an array of 2 numbers
                  if (Array.isArray(data.coordinates) && data.coordinates.length === 2 &&
                      typeof data.coordinates[0] === 'number' && typeof data.coordinates[1] === 'number') {
                    return data.coordinates as [number, number]
                  }
                  
                  // If it's a GeoJSON geometry
                  if (typeof data.coordinates === 'string') {
                    try {
                      const parsed = JSON.parse(data.coordinates)
                      if (parsed.type === 'Polygon' && parsed.coordinates?.[0]?.length > 0) {
                        // Calculate centroid of polygon
                        const coords = parsed.coordinates[0]
                        const sumLng = coords.reduce((sum: number, c: number[]) => sum + c[0], 0)
                        const sumLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0)
                        return [sumLng / coords.length, sumLat / coords.length]
                      }
                    } catch (e) {
                      console.warn('Failed to parse coordinates:', e)
                    }
                  }
                }
                
                // Use fallback
                if (fallback && Array.isArray(fallback) && fallback.length === 2) {
                  return fallback as [number, number]
                }
                
                console.warn('⚠️ No valid coordinates found, using default')
                return [0, 0]
              }

              // Find the building/openSpace/location data to get proper coordinates and IDs
              let sourceData: any = null
              let destData: any = null

              // Find source data
              if (source.type === 'building') {
                sourceData = buildingsData.find(b => b.id === source.id)
              } else if (source.type === 'openSpace') {
                sourceData = openSpacesData.find(os => os.id === source.id)
              } else if (source.type === 'location') {
                sourceData = locationsData.find(l => l.id === source.id)
              }

              // Find destination data
              if (destination.type === 'building') {
                destData = buildingsData.find(b => b.id === destination.id)
              } else if (destination.type === 'openSpace') {
                destData = openSpacesData.find(os => os.id === destination.id)
              } else if (destination.type === 'location') {
                destData = locationsData.find(l => l.id === destination.id)
              }

              // Get valid coordinates
              const sourceCoords = getValidCoordinates(sourceData, source.coordinates)
              const destCoords = getValidCoordinates(destData, destination.coordinates)

              console.log('📍 Source coords:', sourceCoords, 'Dest coords:', destCoords)

              // Calculate route
              const route = await pathfinding.findRoute(
                {
                  coordinates: sourceCoords,
                  name: source.name,
                  type: source.type,
                  buildingId: sourceData?.id || sourceData?.buildingId,
                  openSpaceId: sourceData?.openSpaceId
                },
                {
                  coordinates: destCoords,
                  name: destination.name,
                  type: destination.type,
                  buildingId: destData?.id || destData?.buildingId,
                  openSpaceId: destData?.openSpaceId
                }
              )

              if (!route || !map.current) {
                console.warn('⚠️ No route found or map not ready')
                return
              }

              console.log('✅ Route calculated:', route.distance, 'meters,', route.estimatedTime, 'minutes')

              // Draw route on map
              const geojson = {
                type: 'Feature' as const,
                properties: {},
                geometry: {
                  type: 'LineString' as const,
                  coordinates: route.coordinates
                }
              }

              // Remove existing route if any
              if (map.current.getLayer('route')) {
                map.current.removeLayer('route')
              }
              if (map.current.getSource('route')) {
                map.current.removeSource('route')
              }

              // Add route source and layer
              map.current.addSource('route', {
                type: 'geojson',
                data: geojson
              })

              map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#4285F4',
                  'line-width': 5,
                  'line-opacity': 0.8
                }
              })

              // Fit map to route bounds
              const coordinates = route.coordinates
              const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord as [number, number])
              }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

              map.current.fitBounds(bounds, {
                padding: { top: 100, bottom: 100, left: 100, right: 100 },
                duration: 1000
              })
            }}
          />
        )}

        {/* Custom Map Controls */}
        <MapControls
          map={map.current}
          initialCenter={initialMapCenter}
          initialZoom={initialMapZoom}
          initialPitch={initialMapPitch}
          initialBearing={initialMapBearing}
          isPanelExpanded={isPanelExpanded}
          emergencyContacts={emergencyContacts}
        />

        {/* Info Panel - Google Maps Style */}
        {selectedFeature && selectedFeatureType && (
          <FeatureInfoPanel
            feature={selectedFeature}
            featureType={selectedFeatureType}
            isLoading={isLoadingDetails}
            onClose={() => {
              // Restore previous map position
              if (previousMapPosition && map.current) {
                map.current.flyTo({
                  center: previousMapPosition.center,
                  zoom: previousMapPosition.zoom,
                  pitch: previousMapPosition.pitch,
                  bearing: previousMapPosition.bearing,
                  duration: 1500
                })
              }
              
              setSelectedFeature(null)
              setSelectedFeatureType(null)
              setPreviousMapPosition(null)
              setIsPanelExpanded(false)
            }}
            onExpandChange={setIsPanelExpanded}
            onDirections={() => {
              setDirectionsDestination({
                name: selectedFeature.name,
                coordinates: [0, 0] // Will be populated from actual data
              })
              setShowDirections(true)
              setSelectedFeature(null)
              setSelectedFeatureType(null)
            }}
          />
        )}
      </div>

      {/* Footer Info - Mobile Responsive */}
      <div className="bg-card border-t border-border px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
          <div className="text-center sm:text-left">
            <span className="font-medium">User Type:</span> {user?.userType}
          </div>
          <div className="text-center sm:text-right">
            © 2024 UM6P. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}
