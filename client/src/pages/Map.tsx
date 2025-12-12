/**
 * Map Page
 * Purpose: Interactive map view for permanent and temporary users
 * Mobile-first responsive design
 */

import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Languages, LogOut, Settings, Menu, X, User, Loader2, Calendar, Bookmark } from 'lucide-react'
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
import { TurnByTurnPanel } from '@/components/TurnByTurnPanel'
import { EmergencyContactsPanel } from '@/components/EmergencyContactsPanel'
import { ReservationForm } from '@/components/ReservationForm'
import { MyReservationsPanel } from '@/components/MyReservationsPanel'
import { SavedPlacesPanel } from '@/components/SavedPlacesPanel'
import { use3DModels } from '@/hooks/use3DModels'
import { getAllEmergencyContacts } from '@/api/emergencyContactApi'
import { getPOIs } from '@/api/poiApi'
import { getAllPaths } from '@/api/pathApi'
import { usePathfinding } from '@/hooks/usePathfinding'
import { CreateReservationInput } from '@/models/reservation'

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
  const [mapLayersReady, setMapLayersReady] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null)
  const [selectedFeatureType, setSelectedFeatureType] = useState<'building' | 'openSpace' | null>(null)
  const [isPanelExpanded, setIsPanelExpanded] = useState(false)
  const [showDirections, setShowDirections] = useState(false)
  const [directionsDestination, setDirectionsDestination] = useState<{ name: string, coordinates: [number, number] } | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [previousMapPosition, setPreviousMapPosition] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isGpsActive, setIsGpsActive] = useState(false)
  const [showTurnByTurn, setShowTurnByTurn] = useState(false)
  const [currentRoute, setCurrentRoute] = useState<any>(null)
  const [routeSource, setRouteSource] = useState<string>('')
  const [routeDestination, setRouteDestination] = useState<string>('')
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false)
  
  // Get URL parameters for shared links - store in state to preserve across re-renders
  const [sharedPlaceId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const placeId = urlParams.get('placeId')
    console.log('🔗 Initializing sharedPlaceId:', placeId)
    
    // If we have shared link params but no user, save URL immediately before any navigation
    if (placeId && !user) {
      const currentUrl = window.location.href
      console.log('🔗 No user detected on mount - saving URL immediately:', currentUrl)
      sessionStorage.setItem('redirectAfterLogin', currentUrl)
    }
    
    return placeId
  })
  const [sharedPlaceType] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const placeType = urlParams.get('placeType') as 'building' | 'openSpace' | null
    console.log('🔗 Initializing sharedPlaceType:', placeType)
    return placeType
  })
  
  // Sidebar and reservation states
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [showMyReservations, setShowMyReservations] = useState(false)
  const [showSavedPlaces, setShowSavedPlaces] = useState(false)
  const [sharedLinkProcessed, setSharedLinkProcessed] = useState(false)
  
  // Map data state
  const [pois, setPOIs] = useState<any[]>([])
  const [paths, setPaths] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [openSpaces, setOpenSpaces] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [campus, setCampus] = useState<any>(null)
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([])
  
  const [initialMapCenter, setInitialMapCenter] = useState<[number, number]>([-7.6033, 33.5731])
  const [initialMapZoom, setInitialMapZoom] = useState(16)
  const [initialMapPitch, setInitialMapPitch] = useState(0)
  const [initialMapBearing, setInitialMapBearing] = useState(0)
  
  const mapInitializingRef = useRef(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  // Load 3D models for buildings and open spaces
  use3DModels(map.current, buildings, openSpaces)

  // Initialize pathfinding with POIs and paths
  const pathfinding = usePathfinding({
    pois: pois,
    paths: paths,
    buildings: buildings,
    openSpaces: openSpaces
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

  // Handle shared links - check authentication and redirect if needed
  useEffect(() => {
    const loadSharedPlace = async () => {
      console.log('🔗 Shared link effect running:', {
        sharedPlaceId,
        sharedPlaceType,
        sharedLinkProcessed,
        hasUser: !!user,
        mapReady: !!map.current,
        mapLayersReady,
        buildingsCount: buildings.length,
        openSpacesCount: openSpaces.length
      })

      if (sharedPlaceId && sharedPlaceType && !sharedLinkProcessed) {
        if (!user) {
          console.log('🔗 No user - redirecting to login')
          console.log('🔗 Saving redirect URL:', window.location.href)
          // User not logged in - save the shared link and redirect to login
          sessionStorage.setItem('redirectAfterLogin', window.location.href)
          console.log('🔗 Saved to sessionStorage:', sessionStorage.getItem('redirectAfterLogin'))
          navigate('/login')
        } else {
          // User is logged in - load the shared place after map is ready
          const dataReady = sharedPlaceType === 'building' 
            ? buildings.length > 0 
            : openSpaces.length > 0
          
          console.log('🔗 Checking readiness:', {
            mapExists: !!map.current,
            mapLayersReady,
            dataReady,
            placeType: sharedPlaceType
          })
          
          if (map.current && mapLayersReady && dataReady) {
            console.log('🔗 All conditions met - Loading shared place:', sharedPlaceId, sharedPlaceType)
            try {
              await handleSavedPlaceClick(sharedPlaceId, sharedPlaceType)
              console.log('🔗 Successfully loaded shared place')
              setSharedLinkProcessed(true)
            } catch (error) {
              console.error('🔗 Failed to load shared place:', error)
            }
          } else {
            console.log('🔗 Waiting for conditions to be met...')
          }
        }
      }
    }
    
    loadSharedPlace()
  }, [sharedPlaceId, sharedPlaceType, user, mapLayersReady, buildings, openSpaces, sharedLinkProcessed])

  // Load map data with caching
  useEffect(() => {
    console.log('🔄 Map useEffect triggered:', {
      selectedCampusId,
      theme,
      shouldReloadMap,
      mapContainerReady: !!mapContainer.current,
      mapInitializing: mapInitializingRef.current
    })
    
    if (!selectedCampusId || !mapContainer.current || mapInitializingRef.current) {
      console.log('⏭️ Skipping map load: missing requirements or already initializing')
      return
    }

    // Set initialization flag to prevent multiple simultaneous loads
    mapInitializingRef.current = true
    setMapLayersReady(false)

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

        // Set data for components
        setBuildings(buildings)
        setOpenSpaces(openSpaces)
        setCategories(categories)
        setCampus(campus)

        // Load POIs for pathfinding
        try {
          const poisRes = await getPOIs(1, 10000, selectedCampusId)
          setPOIs((poisRes as any).data || [])
          console.log('📍 Loaded POIs:', (poisRes as any).data?.length || 0)
        } catch (error) {
          console.error('Failed to load POIs:', error)
        }

        // Load Paths for pathfinding
        try {
          const pathsRes = await getAllPaths(1, 10000, '', selectedCampusId)
          setPaths((pathsRes as any).data || [])
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

        // Helper function to get dark variant of a map style
        const getDarkVariant = (style: string): string => {
          // Light styles that should switch to navigation-night
          const navigationStyles = [
            'mapbox://styles/mapbox/streets-v12',
            'mapbox://styles/mapbox/outdoors-v12',
            'mapbox://styles/mapbox/navigation-day-v1'
          ]
          
          if (navigationStyles.includes(style)) {
            return 'mapbox://styles/mapbox/navigation-night-v1'
          }
          
          // Default to dark-v11 for other styles
          return 'mapbox://styles/mapbox/dark-v11'
        }

        // Helper function to check if a style is already dark
        const isDarkStyle = (style: string): boolean => {
          const darkStyles = [
            'mapbox://styles/mapbox/navigation-night-v1',
            'mapbox://styles/mapbox/dark-v11',
            'mapbox://styles/mapbox/satellite-streets-v12' // Satellite is dark by nature
          ]
          return darkStyles.some(darkStyle => style.includes(darkStyle.split('/').pop() || ''))
        }

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
          
          // Handle campus map style with theme awareness
          if (campus.mapStyle) {
            if (theme === 'dark') {
              // If dark mode is enabled and campus style is not already dark
              if (!isDarkStyle(campus.mapStyle)) {
                mapStyle = getDarkVariant(campus.mapStyle)
                console.log(`🌙 Dark mode: Converting ${campus.mapStyle} → ${mapStyle}`)
              } else {
                // Campus style is already dark, use it as-is
                mapStyle = campus.mapStyle
                console.log(`🌙 Dark mode: Using campus dark style ${mapStyle}`)
              }
            } else {
              // Light mode: use campus style directly
              mapStyle = campus.mapStyle
              console.log(`☀️ Light mode: Using campus style ${mapStyle}`)
            }
          }

          // Use campus hover and highlight colors
          if (campus.buildingHoverColor) hoverColor = campus.buildingHoverColor
          if (campus.buildingHighlightColor) highlightColor = campus.buildingHighlightColor
        }

        // Initialize map
        if (!map.current && mapContainer.current) {
          console.log('🗺️ Creating new Mapbox instance')
          
          // Enable RTL text plugin for Arabic and other RTL languages (only once)
          if (!(mapboxgl as any).getRTLTextPluginStatus || (mapboxgl as any).getRTLTextPluginStatus() === 'unavailable') {
            try {
              mapboxgl.setRTLTextPlugin(
                'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.3.0/mapbox-gl-rtl-text.js',
                null,
                true // lazy load
              )
            } catch (error) {
              console.warn('RTL plugin already loaded:', error)
            }
          }
          
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: mapCenter,
            zoom: mapZoom,
            pitch: mapPitch,
            bearing: mapBearing,
            minZoom: campus?.minZoom || 10,
            maxZoom: campus?.maxZoom || 20
          })
          console.log('✅ Mapbox instance created with RTL support')

          // Store initial map position for reset (use the calculated values)
          setInitialMapCenter(mapCenter)
          setInitialMapZoom(mapZoom)
          setInitialMapPitch(mapPitch)
          setInitialMapBearing(mapBearing)
          
          // Don't add built-in navigation controls - using custom controls instead
        }

        // Early return if map is not initialized
        if (!map.current) {
          console.warn('⚠️ Map container not ready, skipping initialization')
          setIsLoading(false)
          return
        }

        // Function to add all map layers
        const addMapLayers = async () => {
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
                    icon: iconEmoji,
                    categoryName: category?.name || ''
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
                    icon: iconEmoji,
                    categoryName: category?.name || ''
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
          
          // Store label config at higher scope for later use
          let openSpacesLabelConfig: any = null
          
          // Step 1: Add Open Spaces (BOTTOM LAYER)
          if (openSpaceFeatures.length > 0) {
            console.log('📐 Layer Order Step 1: Adding Open Spaces (bottom)')
            
            // Remove existing source if it exists
            if (map.current!.getSource('openSpaces')) {
              if (map.current!.getLayer('openSpaces-labels')) map.current!.removeLayer('openSpaces-labels')
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

            // Get list of open space IDs that have 3D models (needed for filters)
            const openSpacesWithModels = openSpaces
              .filter((os: any) => os.modelId && os.buildingModel?.modelUrl)
              .map((os: any) => os.id)

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

            // Store label config for later (labels need to be added AFTER all 3D layers)
            openSpacesLabelConfig = {
              filter: osLabelFilter,
              showIcons3D: showOSIcons3D,
              showIconsNo3D: showOSIconsNo3D,
              openSpacesWithModels: openSpacesWithModels
            }
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

            // Get list of building IDs and open space IDs that have 3D models
            const buildingsWithModels = buildings
              .filter((b: any) => b.modelId && b.buildingModel?.modelUrl)
              .map((b: any) => b.id)
            
            const openSpacesWithModels2 = openSpaces
              .filter((os: any) => os.modelId && os.buildingModel?.modelUrl)
              .map((os: any) => os.id)

            console.log(`🎯 Excluding ${buildingsWithModels.length} buildings with 3D models from fill-extrusion`)
            console.log(`🎯 Excluding ${openSpacesWithModels2.length} open spaces with 3D models from fill layer`)

            // STEP 1: Add buildings-3d FIRST as reference layer
            if (!map.current!.getLayer('buildings-3d')) {
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
              console.log('✅ Buildings-3d layer added FIRST (reference layer)')
            }

            // STEP 2: Add openSpaces layers BEFORE buildings-3d
            // Since buildings-3d is guaranteed to exist now, always use beforeId
            
            if (!map.current!.getLayer('openSpaces-fill')) {
              map.current!.addLayer({
                id: 'openSpaces-fill',
                type: 'fill-extrusion',  // ← Back to fill-extrusion (this was working!)
                source: 'openSpaces',
                filter: ['!', ['in', ['get', 'id'], ['literal', openSpacesWithModels2]]],
                paint: {
                  'fill-extrusion-color': [  // ← Back to fill-extrusion-color
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    hoverColor,
                    ['boolean', ['feature-state', 'selected'], false],
                    highlightColor,
                    ['get', 'color']
                  ],
                  'fill-extrusion-height': 0.1,  // ← Small height for 3D context
                  'fill-extrusion-base': 0,
                  'fill-extrusion-opacity': 0.8
                }
              }, 'buildings-3d')  // ← Always insert BEFORE buildings-3d
              console.log('✅ openSpaces-fill added as FILL-EXTRUSION (working solution restored)')
            }

            // Outlines removed per user request

            // STEP 3: Add placeholder route layer BEFORE 3D models are loaded
            // This ensures route renders UNDER 3D models (temporal ordering)
            // Route will be updated with actual data when user requests directions
            if (!map.current!.getSource('route')) {
              map.current!.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: []
                }
              })
            }

            if (!map.current!.getLayer('route')) {
              map.current!.addLayer({
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
              }, 'buildings-3d')  // ← Insert BEFORE buildings-3d (same as 3D models)
              console.log('✅ Route layer placeholder added BEFORE buildings-3d (will render under 3D models)')
            }

            // Clear initialization flag and mark layers as ready
            mapInitializingRef.current = false
            setMapLayersReady(true)
            console.log('✅ Map layers ready - 3D models can now be loaded')

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

            // OpenSpaces labels will be handled in the proper section

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
          console.log('📐 Layer Order Step 3: 3D Models will be added on top via hook')

          // STEP 4: Add openSpaces labels at the VERY END (on top of all 3D elements)
          if (openSpaceFeatures.length > 0 && openSpacesLabelConfig) {
            if (!map.current!.getLayer('openSpaces-labels')) {
              map.current!.addLayer({
                id: 'openSpaces-labels',
                type: 'symbol',
                source: 'openSpaces',
                filter: openSpacesLabelConfig.filter,
                layout: {
                  'icon-image': openSpacesLabelConfig.showIcons3D || openSpacesLabelConfig.showIconsNo3D ? ['get', 'icon'] : '',
                  'icon-size': 0.6,
                  'text-field': ['get', 'name'],
                  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                  'text-size': 12,
                  'text-anchor': 'center',
                  'text-offset': [0, 0],
                  'icon-text-fit': 'none',
                  'text-allow-overlap': false,
                  'icon-allow-overlap': false,
                  'text-optional': true
                },
                paint: {
                  'text-color': '#2d5016',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 2,
                  'icon-color': '#22C55E',
                  'icon-opacity': [
                    'case',
                    ['in', ['get', 'id'], ['literal', openSpacesLabelConfig.openSpacesWithModels]],
                    openSpacesLabelConfig.showIcons3D ? 1 : 0,
                    openSpacesLabelConfig.showIconsNo3D ? 1 : 0
                  ]
                }
              })
              // No beforeId = added to VERY TOP of rendering stack
              console.log('✅ openSpaces-labels added at TOP (above all 3D elements)')
            }
          }

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
            
            // Check if building has a non-clickable category (Emergency or Construction)
            const categoryName = feature.properties.categoryName?.toLowerCase() || ''
            const nonClickableCategories = ['emergency', 'construction', 'emergency area', 'construction zone']
            if (nonClickableCategories.some(cat => categoryName.includes(cat))) {
              console.log(`🚫 Building "${feature.properties.name}" is not clickable (Category: ${feature.properties.categoryName})`)
              return
            }
            
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
            
            // Check if open space has a non-clickable category (Emergency or Construction)
            const categoryName = feature.properties.categoryName?.toLowerCase() || ''
            const nonClickableCategories = ['emergency', 'construction', 'emergency area', 'construction zone']
            if (nonClickableCategories.some(cat => categoryName.includes(cat))) {
              console.log(`🚫 Open space "${feature.properties.name}" is not clickable (Category: ${feature.properties.categoryName})`)
              return
            }
            
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
                  // Check if building has a non-clickable category
                  const categoryName = building.category?.name?.toLowerCase() || ''
                  const nonClickableCategories = ['emergency', 'construction', 'emergency area', 'construction zone']
                  if (nonClickableCategories.some(cat => categoryName.includes(cat))) {
                    console.log(`🚫 Building "${building.name}" is not clickable (Category: ${building.category?.name})`)
                    return
                  }
                  
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
                  // Check if open space has a non-clickable category
                  const categoryName = openSpace.category?.name?.toLowerCase() || ''
                  const nonClickableCategories = ['emergency', 'construction', 'emergency area', 'construction zone']
                  if (nonClickableCategories.some(cat => categoryName.includes(cat))) {
                    console.log(`🚫 Open space "${openSpace.name}" is not clickable (Category: ${openSpace.category?.name})`)
                    return
                  }
                  
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
        }

        // Call addMapLayers based on map state
        // Use isStyleLoaded() which is more reliable than loaded()
        const isStyleLoaded = map.current.isStyleLoaded()
        console.log('🗺️ Map style loaded:', isStyleLoaded)
        
        if (isStyleLoaded) {
          // Style is already loaded, add layers immediately
          console.log('📍 Map style already loaded, adding layers immediately')
          await addMapLayers()
        } else {
          // Style not loaded yet, wait for style.load event (more reliable than 'load')
          console.log('⏳ Map style not loaded, waiting for style.load event')
          map.current.once('style.load', addMapLayers)
        }
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
  }, [selectedCampusId, shouldReloadMap])

  // Handle theme changes by triggering a map reload
  useEffect(() => {
    if (map.current && theme && buildings.length > 0 && !isLoading) {
      // Helper function to get dark variant of a map style
      const getDarkVariant = (style: string): string => {
        const navigationStyles = [
          'mapbox://styles/mapbox/streets-v12',
          'mapbox://styles/mapbox/outdoors-v12',
          'mapbox://styles/mapbox/navigation-day-v1'
        ]
        
        if (navigationStyles.includes(style)) {
          return 'mapbox://styles/mapbox/navigation-night-v1'
        }
        
        return 'mapbox://styles/mapbox/dark-v11'
      }

      const isDarkStyle = (style: string): boolean => {
        const darkStyles = [
          'mapbox://styles/mapbox/navigation-night-v1',
          'mapbox://styles/mapbox/dark-v11',
          'mapbox://styles/mapbox/satellite-streets-v12'
        ]
        return darkStyles.some(darkStyle => style.includes(darkStyle.split('/').pop() || ''))
      }

      // Get current style from map
      const currentStyle = map.current.getStyle()
      
      // Determine what the new style should be based on theme and campus settings
      let newMapStyle: string
      
      if (theme === 'dark') {
        // Dark mode: check if we need to convert the campus style
        const campusStyle = buildings[0]?.campusId ? campus?.mapStyle : null
        
        if (campusStyle && !isDarkStyle(campusStyle)) {
          newMapStyle = getDarkVariant(campusStyle)
        } else if (campusStyle) {
          newMapStyle = campusStyle
        } else {
          newMapStyle = 'mapbox://styles/mapbox/dark-v11'
        }
      } else {
        // Light mode: use campus style directly or default light
        const campusStyle = buildings[0]?.campusId ? campus?.mapStyle : null
        newMapStyle = campusStyle || 'mapbox://styles/mapbox/light-v11'
      }
      
      // Check if style needs to change
      const currentStyleName = currentStyle?.name || ''
      const newStyleName = newMapStyle.split('/').pop()?.replace(/-v\d+$/, '') || ''
      
      if (!currentStyleName.includes(newStyleName)) {
        console.log('🎨 Theme changed, reloading map with new style:', theme, '→', newMapStyle)
        
        // Trigger a full map reload with the new theme
        setShouldReloadMap(prev => prev + 1)
      }
    }
  }, [theme, buildings, campus])

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
    navigate('/dashboard')
  }

  // Sidebar handlers
  const handleReservationClick = () => {
    setShowReservationForm(true)
  }

  const handleAgendaClick = () => {
    // TODO: Implement agenda functionality
    console.log('Agenda clicked')
  }

  // Handle reservation form submission
  const handleReservationSubmit = async (data: CreateReservationInput) => {
    try {
      // TODO: Implement API call to submit reservation
      console.log('Reservation data:', data)
      
      // For now, just close the form and show success message
      setShowReservationForm(false)
      
    } catch (error) {
      console.error('Failed to submit reservation:', error)
      alert('Failed to submit reservation. Please try again.')
    }
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

  const handleSavedPlaceClick = async (placeId: string, placeType: 'building' | 'openSpace') => {
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

    if (placeType === 'building') {
      setIsLoadingDetails(true)
      setSelectedFeatureType('building')
      try {
        const buildingDetails = await getBuildingById(placeId)
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
    } else if (placeType === 'openSpace') {
      setIsLoadingDetails(true)
      setSelectedFeatureType('openSpace')
      try {
        const openSpaceDetails: any = await getOpenSpaceById(placeId)
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
    }
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
                    {/* My Reservations - Only for permanent users */}
                    {user?.userType === 'PERMANENT' && (
                      <button
                        onClick={() => {
                          setShowMyReservations(true)
                          setShowProfileMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                      >
                        <Calendar className="w-4 h-4" />
                        My Reservations
                      </button>
                    )}
                    {/* Saved Places */}
                    <button
                      onClick={() => {
                        setShowSavedPlaces(true)
                        setShowProfileMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                    >
                      <Bookmark className="w-4 h-4" />
                      Saved Places
                    </button>
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
                {/* My Reservations - Only for permanent users */}
                {user?.userType === 'PERMANENT' && (
                  <button
                    onClick={() => {
                      setShowMyReservations(true)
                      setShowMobileMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    My Reservations
                  </button>
                )}
                {/* Saved Places */}
                <button
                  onClick={() => {
                    setShowSavedPlaces(true)
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm"
                >
                  <Bookmark className="w-4 h-4" />
                  Saved Places
                </button>
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

      {/* Map Container - Full width without sidebar */}
      <div className="flex-1 relative overflow-hidden transition-all duration-300">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
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
        {!isLoading && !showDirections && !showTurnByTurn && (
          <MapSearch
            buildings={buildings}
            openSpaces={openSpaces}
            locations={[]}
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
            isPanelExpanded={isPanelExpanded}
            userLocation={userLocation || undefined}
          />
        )}

        {/* Directions Panel */}
        {showDirections && (
          <DirectionsPanel
            onClose={() => {
              setShowDirections(false)
              // Clear route data (but keep the layer for reuse)
              if (map.current) {
                const routeSource = map.current.getSource('route') as mapboxgl.GeoJSONSource
                if (routeSource) {
                  routeSource.setData({
                    type: 'FeatureCollection',
                    features: []
                  })
                  console.log('✅ Route cleared (layer preserved for reuse)')
                }
                
                // Restore previous map position if it exists
                if (previousMapPosition) {
                  map.current.flyTo({
                    center: previousMapPosition.center,
                    zoom: previousMapPosition.zoom,
                    pitch: previousMapPosition.pitch,
                    bearing: previousMapPosition.bearing,
                    duration: 1000
                  })
                  console.log('✅ Restored previous map position')
                  setPreviousMapPosition(null)
                }
              }
              pathfinding.clearRoute()
            }}
            initialDestination={directionsDestination || undefined}
            userLocation={userLocation}
            buildings={buildings}
            openSpaces={openSpaces}
            locations={[]}
            isGpsActive={isGpsActive}
            onGpsActiveChange={(active) => setIsGpsActive(active)}
            onRequestLocation={() => {
              // Trigger GPS from MapControls
              if ((window as any).triggerMapGPS) {
                (window as any).triggerMapGPS()
              }
            }}
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
                sourceData = buildings.find((b: any) => b.id === source.id)
              } else if (source.type === 'openSpace') {
                sourceData = openSpaces.find((os: any) => os.id === source.id)
              } else if (source.type === 'location') {
                sourceData = [] // No locations data currently
              }

              // Find destination data
              if (destination.type === 'building') {
                destData = buildings.find((b: any) => b.id === destination.id)
              } else if (destination.type === 'openSpace') {
                destData = openSpaces.find((os: any) => os.id === destination.id)
              } else if (destination.type === 'location') {
                destData = [] // No locations data currently
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

              // Save route data for turn-by-turn navigation
              setCurrentRoute(route)
              setRouteSource(source?.name || 'Unknown')
              setRouteDestination(destination?.name || 'Unknown')
              setShowTurnByTurn(true)
              setShowDirections(false)

              // Draw route on map
              const geojson = {
                type: 'Feature' as const,
                properties: {},
                geometry: {
                  type: 'LineString' as const,
                  coordinates: route.coordinates
                }
              }

              // Update existing route source with new data
              // Route layer was already added during map initialization with correct ordering
              const routeSource = map.current.getSource('route') as mapboxgl.GeoJSONSource
              if (routeSource) {
                routeSource.setData({
                  type: 'FeatureCollection',
                  features: [geojson]
                })
                console.log('✅ Route data updated (layer order preserved)')
              } else {
                console.warn('⚠️ Route source not found, this should not happen')
              }

              // Save current map position before fitting to route bounds
              if (!previousMapPosition) {
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
                console.log('💾 Saved map position before showing route')
              }

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

        {/* Turn-by-Turn Navigation Panel */}
        {showTurnByTurn && currentRoute && (
          <TurnByTurnPanel
            route={{
              ...currentRoute,
              coordinates: currentRoute.coordinates
            }}
            sourceName={routeSource}
            destinationName={routeDestination}
            onCameraMove={(coordinates, zoom, bearing, pitch) => {
              if (map.current) {
                map.current.flyTo({
                  center: coordinates,
                  zoom: zoom || 19,
                  bearing: bearing || 0,
                  pitch: pitch || 60,
                  duration: 1200,
                  essential: true
                })
                console.log('📹 Camera moved to:', coordinates, 'bearing:', bearing, 'pitch:', pitch)
              }
            }}
            onAddNodeMarker={(coordinates, stepIndex) => {
              if (map.current) {
                // Create a marker element
                const el = document.createElement('div')
                el.className = 'turn-node-marker'
                el.style.width = '32px'
                el.style.height = '32px'
                el.style.borderRadius = '50%'
                el.style.backgroundColor = 'hsl(var(--primary))'
                el.style.border = '3px solid white'
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
                el.style.display = 'flex'
                el.style.alignItems = 'center'
                el.style.justifyContent = 'center'
                el.style.color = 'white'
                el.style.fontWeight = 'bold'
                el.style.fontSize = '12px'
                el.textContent = `${stepIndex + 1}`
                
                // Add marker to map
                new mapboxgl.Marker(el)
                  .setLngLat(coordinates)
                  .addTo(map.current)
                
                console.log('📍 Node marker added at:', coordinates, 'step:', stepIndex + 1)
              }
            }}
            onClose={() => {
              setShowTurnByTurn(false)
              // Stop voice guidance
              window.speechSynthesis.cancel()
              
              // Clear route from map
              if (map.current) {
                const routeSource = map.current.getSource('route') as mapboxgl.GeoJSONSource
                if (routeSource) {
                  routeSource.setData({
                    type: 'FeatureCollection',
                    features: []
                  })
                  console.log('✅ Route cleared')
                }
                
                // Restore previous map position if it exists
                if (previousMapPosition) {
                  map.current.flyTo({
                    center: previousMapPosition.center,
                    zoom: previousMapPosition.zoom,
                    pitch: previousMapPosition.pitch,
                    bearing: previousMapPosition.bearing,
                    duration: 1500
                  })
                  console.log('✅ Restored previous map position')
                  setPreviousMapPosition(null)
                } else {
                  // If no previous position, reset to normal view
                  map.current.flyTo({
                    bearing: 0,
                    pitch: 0,
                    duration: 1500
                  })
                  console.log('✅ Reset to normal view (bearing: 0, pitch: 0)')
                }
              }
              pathfinding.clearRoute()
            }}
          />
        )}

        {/* Custom Map Controls */}
        <div className={showTurnByTurn ? 'hidden' : ''}>
          <MapControls
            map={map.current}
            initialCenter={initialMapCenter}
            initialZoom={initialMapZoom}
            initialPitch={initialMapPitch}
            initialBearing={initialMapBearing}
            isPanelExpanded={isPanelExpanded}
            emergencyContacts={emergencyContacts}
            onLocationUpdate={(location) => setUserLocation(location)}
            isGpsActive={isGpsActive}
            onGpsActiveChange={(active) => setIsGpsActive(active)}
            onEmergencyClick={() => setShowEmergencyPanel(true)}
            user={user || undefined}
            onAgendaClick={handleAgendaClick}
            onReservationClick={handleReservationClick}
          />
        </div>

        {/* Emergency Contacts Panel */}
        {showEmergencyPanel && (
          <EmergencyContactsPanel
            contacts={emergencyContacts}
            onClose={() => setShowEmergencyPanel(false)}
          />
        )}

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
              
              // Clean up URL parameters if this was a shared link
              if (sharedPlaceId && sharedPlaceType) {
                window.history.replaceState({}, '', '/map')
              }
            }}
            onExpandChange={setIsPanelExpanded}
            onDirections={() => {
              // Extract coordinates from the selected feature
              let coordinates: [number, number] = [0, 0]
              
              if (selectedFeature.center && Array.isArray(selectedFeature.center)) {
                coordinates = selectedFeature.center as [number, number]
              } else if (selectedFeature.coordinates) {
                // If coordinates is a string (GeoJSON), parse it
                if (typeof selectedFeature.coordinates === 'string') {
                  try {
                    const parsed = JSON.parse(selectedFeature.coordinates)
                    if (parsed.type === 'Polygon' && parsed.coordinates?.[0]?.length > 0) {
                      // Calculate centroid of polygon
                      const coords = parsed.coordinates[0]
                      const sumLng = coords.reduce((sum: number, c: number[]) => sum + c[0], 0)
                      const sumLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0)
                      coordinates = [sumLng / coords.length, sumLat / coords.length]
                    }
                  } catch (e) {
                    console.warn('Failed to parse coordinates:', e)
                  }
                } else if (Array.isArray(selectedFeature.coordinates) && selectedFeature.coordinates.length === 2) {
                  coordinates = selectedFeature.coordinates as [number, number]
                }
              }
              
              console.log('🎯 Opening directions with destination:', selectedFeature.name, coordinates)
              
              // Set destination and open directions panel
              setDirectionsDestination({
                name: selectedFeature.name,
                coordinates: coordinates
              })
              setShowDirections(true)
              
              // Close feature info panel
              setSelectedFeature(null)
              setSelectedFeatureType(null)
              setIsPanelExpanded(false)
            }}
          />
        )}


        {/* Reservation Form Modal */}
        {showReservationForm && (
          <ReservationForm
            user={user || undefined}
            onClose={() => setShowReservationForm(false)}
            onSubmit={handleReservationSubmit}
          />
        )}

        {/* My Reservations Panel */}
        {showMyReservations && (
          <MyReservationsPanel onClose={() => setShowMyReservations(false)} />
        )}

        {/* Saved Places Panel */}
        {showSavedPlaces && (
          <SavedPlacesPanel 
            onClose={() => setShowSavedPlaces(false)}
            onPlaceClick={handleSavedPlaceClick}
          />
        )}
      </div>

    </div>
  )
}
