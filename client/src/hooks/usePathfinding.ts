/**
 * usePathfinding Hook
 * Purpose: React hook for pathfinding with POIs and paths
 * Inputs: POIs and paths data
 * Outputs: Route finding function and current route
 */

import { useState, useEffect, useMemo } from 'react'
import { PathfindingService, Route } from '../services/pathfinding'

interface UsePathfindingProps {
  pois: any[]
  paths: any[]
  buildings: any[]
  openSpaces: any[]
}

export function usePathfinding({ pois, paths, buildings, openSpaces }: UsePathfindingProps) {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Create pathfinding service instance
  const pathfindingService = useMemo(() => {
    if (pois.length === 0 || paths.length === 0) {
      console.log('⚠️ Waiting for POIs and paths data...')
      return null
    }

    console.log('🚀 Initializing pathfinding service')
    return new PathfindingService(pois, paths)
  }, [pois, paths])

  /**
   * Find route between two points
   * Purpose: Calculate optimal path using A* algorithm
   * Input: Source and destination with their types
   * Output: Route object with coordinates and instructions
   */
  const findRoute = async (
    source: {
      coordinates: [number, number]
      name: string
      type: 'building' | 'openSpace' | 'location'
      buildingId?: number
      openSpaceId?: number
    },
    destination: {
      coordinates: [number, number]
      name: string
      type: 'building' | 'openSpace' | 'location'
      buildingId?: number
      openSpaceId?: number
    },
    options: { accessible?: boolean; avoidStairs?: boolean } = {}
  ): Promise<Route | null> => {
    if (!pathfindingService) {
      console.warn('⚠️ Pathfinding service not initialized')
      return null
    }

    setIsCalculating(true)

    try {
      console.log('🔍 Finding route with source:', source, 'destination:', destination)

      // Validate input coordinates
      if (!source.coordinates || !Array.isArray(source.coordinates) || source.coordinates.length !== 2) {
        console.error('❌ Invalid source coordinates:', source.coordinates)
        return null
      }

      if (!destination.coordinates || !Array.isArray(destination.coordinates) || destination.coordinates.length !== 2) {
        console.error('❌ Invalid destination coordinates:', destination.coordinates)
        return null
      }

      // Get coordinates for source
      let sourceCoords = source.coordinates
      let sourceName = source.name

      // If source is a building or open space, find nearest POI
      if (source.type === 'building' && source.buildingId) {
        console.log('🏢 Finding POI for building:', source.buildingId)
        const nearestPOI = pathfindingService.findNearestPOI(
          source.coordinates,
          source.buildingId
        )
        if (nearestPOI) {
          sourceCoords = nearestPOI.coordinates
          sourceName = `${source.name} (${nearestPOI.name || 'Entrance'})`
          console.log('📍 Using POI for source:', nearestPOI.name)
        }
      } else if (source.type === 'openSpace' && source.openSpaceId) {
        const nearestPOI = pathfindingService.findNearestPOI(
          source.coordinates,
          undefined,
          source.openSpaceId
        )
        if (nearestPOI) {
          sourceCoords = nearestPOI.coordinates
          sourceName = `${source.name} (${nearestPOI.name || 'Entrance'})`
          console.log('📍 Using POI for source:', nearestPOI.name)
        }
      } else if (source.type === 'location' && source.buildingId) {
        // For locations, use the building's POI
        const nearestPOI = pathfindingService.findNearestPOI(
          source.coordinates,
          source.buildingId
        )
        if (nearestPOI) {
          sourceCoords = nearestPOI.coordinates
          sourceName = source.name
          console.log('📍 Using building POI for location:', nearestPOI.name)
        }
      }

      // Get coordinates for destination
      let destCoords = destination.coordinates
      let destName = destination.name

      // If destination is a building or open space, find nearest POI
      if (destination.type === 'building' && destination.buildingId) {
        const nearestPOI = pathfindingService.findNearestPOI(
          destination.coordinates,
          destination.buildingId
        )
        if (nearestPOI) {
          destCoords = nearestPOI.coordinates
          destName = `${destination.name} (${nearestPOI.name || 'Entrance'})`
          console.log('📍 Using POI for destination:', nearestPOI.name)
        }
      } else if (destination.type === 'openSpace' && destination.openSpaceId) {
        const nearestPOI = pathfindingService.findNearestPOI(
          destination.coordinates,
          undefined,
          destination.openSpaceId
        )
        if (nearestPOI) {
          destCoords = nearestPOI.coordinates
          destName = `${destination.name} (${nearestPOI.name || 'Entrance'})`
          console.log('📍 Using POI for destination:', nearestPOI.name)
        }
      } else if (destination.type === 'location' && destination.buildingId) {
        // For locations, use the building's POI
        const nearestPOI = pathfindingService.findNearestPOI(
          destination.coordinates,
          destination.buildingId
        )
        if (nearestPOI) {
          destCoords = nearestPOI.coordinates
          destName = destination.name
          console.log('📍 Using building POI for location:', nearestPOI.name)
        }
      }

      // Find route
      const route = pathfindingService.findRoute(
        sourceCoords,
        destCoords,
        sourceName,
        destName,
        options
      )

      setCurrentRoute(route)
      return route
    } catch (error) {
      console.error('❌ Error finding route:', error)
      return null
    } finally {
      setIsCalculating(false)
    }
  }

  /**
   * Clear current route
   */
  const clearRoute = () => {
    setCurrentRoute(null)
  }

  /**
   * Get POIs for a building
   */
  const getPOIsForBuilding = (buildingId: number) => {
    if (!pathfindingService) return []
    return pathfindingService.findPOIsForBuilding(buildingId)
  }

  /**
   * Get POIs for an open space
   */
  const getPOIsForOpenSpace = (openSpaceId: number) => {
    if (!pathfindingService) return []
    return pathfindingService.findPOIsForOpenSpace(openSpaceId)
  }

  return {
    findRoute,
    clearRoute,
    currentRoute,
    isCalculating,
    isReady: pathfindingService !== null,
    getPOIsForBuilding,
    getPOIsForOpenSpace
  }
}
