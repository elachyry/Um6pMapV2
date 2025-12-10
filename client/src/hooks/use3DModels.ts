/**
 * use3DModels Hook
 * Purpose: Manage 3D models on the map
 */

import { useEffect, useRef } from 'react'
import type mapboxgl from 'mapbox-gl'
import { add3DModelToMap, remove3DModelFromMap, Model3DConfig } from '@/services/create3DLayer'
import { calculatePolygonCenter, parseCoordinates } from '@/utils/geometryUtils'

interface Building3DData {
  id: string
  name: string
  coordinates: string // JSON string
  modelId?: string
  modelScale?: number
  modelRotationX?: number
  modelRotationY?: number
  modelRotationZ?: number
  modelOffsetX?: number
  modelOffsetY?: number
  modelOffsetZ?: number
  buildingModel?: {
    id: string
    modelUrl: string
    name: string
  }
}

interface OpenSpace3DData {
  id: string
  name: string
  coordinates: string // JSON string
  modelId?: string
  modelScale?: number
  modelRotationX?: number
  modelRotationY?: number
  modelRotationZ?: number
  modelOffsetX?: number
  modelOffsetY?: number
  modelOffsetZ?: number
  buildingModel?: {
    id: string
    modelUrl: string
    name: string
  }
}

/**
 * Hook to manage 3D models on map
 * Inputs: map instance, buildings, and open spaces data
 * Outputs: none (manages models as side effect)
 */
export function use3DModels(
  map: mapboxgl.Map | null,
  buildings: Building3DData[],
  openSpaces: OpenSpace3DData[]
) {
  const layerIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!map) return

    console.log('🎨 3D Models Hook - Buildings:', buildings.length, 'Open Spaces:', openSpaces.length)

    const addedLayers = new Set<string>()

    // Sort buildings by latitude (descending) for proper north-to-south occlusion
    // Northern buildings render first, southern buildings can occlude them
    const sortedBuildings = [...buildings].sort((a, b) => {
      const centerA = calculatePolygonCenter(parseCoordinates(a.coordinates))
      const centerB = calculatePolygonCenter(parseCoordinates(b.coordinates))
      return (centerB?.[1] || 0) - (centerA?.[1] || 0) // Sort by latitude descending
    })

    // Add building models
    sortedBuildings.forEach((building) => {
      if (!building.modelId || !building.buildingModel?.modelUrl) {
        if (building.modelId) {
          console.log(`⚠️ Building ${building.name} has modelId but no buildingModel data`)
        }
        return
      }

      console.log(`🏢 Loading 3D model for building: ${building.name}`, building.buildingModel.modelUrl)

      try {
        // Parse the GeoJSON geometry
        const geometry = parseCoordinates(building.coordinates)
        
        // Calculate the center of the polygon
        const center = calculatePolygonCenter(geometry)
        if (!center) {
          console.warn(`⚠️ Could not calculate center for building: ${building.name}`)
          return
        }

        console.log(`📍 Building ${building.name} center:`, center)

        const config: Model3DConfig = {
          id: `building-3d-${building.id}`,
          modelId: building.modelId,
          modelUrl: building.buildingModel.modelUrl,
          name: building.name,
          coordinates: center, // Use calculated polygon center
          scale: building.modelScale,
          rotationX: building.modelRotationX,
          rotationY: building.modelRotationY,
          rotationZ: building.modelRotationZ,
          offsetX: building.modelOffsetX,
          offsetY: building.modelOffsetY,
          offsetZ: building.modelOffsetZ
        }

        const layerId = add3DModelToMap(map, config)
        addedLayers.add(layerId)
        layerIdsRef.current.add(layerId)
      } catch (error) {
        console.error(`Failed to add 3D model for building ${building.id}:`, error)
      }
    })

    // Sort open spaces by latitude (descending) for proper occlusion
    const sortedOpenSpaces = [...openSpaces].sort((a, b) => {
      const centerA = calculatePolygonCenter(parseCoordinates(a.coordinates))
      const centerB = calculatePolygonCenter(parseCoordinates(b.coordinates))
      return (centerB?.[1] || 0) - (centerA?.[1] || 0)
    })

    // Add open space models
    sortedOpenSpaces.forEach((openSpace) => {
      if (!openSpace.modelId || !openSpace.buildingModel?.modelUrl) {
        if (openSpace.modelId) {
          console.log(`⚠️ Open Space ${openSpace.name} has modelId but no buildingModel data`)
        }
        return
      }

      console.log(`🌳 Loading 3D model for open space: ${openSpace.name}`, openSpace.buildingModel.modelUrl)

      try {
        // Parse the GeoJSON geometry
        const geometry = parseCoordinates(openSpace.coordinates)
        
        // Calculate the center of the polygon
        const center = calculatePolygonCenter(geometry)
        if (!center) {
          console.warn(`⚠️ Could not calculate center for open space: ${openSpace.name}`)
          return
        }

        console.log(`📍 Open space ${openSpace.name} center:`, center)

        const config: Model3DConfig = {
          id: `openspace-3d-${openSpace.id}`,
          modelId: openSpace.modelId,
          modelUrl: openSpace.buildingModel.modelUrl,
          name: openSpace.name,
          coordinates: center, // Use calculated polygon center
          scale: openSpace.modelScale,
          rotationX: openSpace.modelRotationX,
          rotationY: openSpace.modelRotationY,
          rotationZ: openSpace.modelRotationZ,
          offsetX: openSpace.modelOffsetX,
          offsetY: openSpace.modelOffsetY,
          offsetZ: openSpace.modelOffsetZ
        }

        const layerId = add3DModelToMap(map, config)
        addedLayers.add(layerId)
        layerIdsRef.current.add(layerId)
      } catch (error) {
        console.error(`Failed to add 3D model for open space ${openSpace.id}:`, error)
      }
    })

    // Cleanup function
    return () => {
      addedLayers.forEach((layerId) => {
        remove3DModelFromMap(map, layerId)
        layerIdsRef.current.delete(layerId)
      })
    }
  }, [map, buildings, openSpaces])

  return {
    layerCount: layerIdsRef.current.size
  }
}
