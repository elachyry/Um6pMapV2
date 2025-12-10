/**
 * Map Data Hooks
 * Purpose: React Query hooks for caching and fetching map data
 * All map entities: buildings, POIs, paths, boundaries, categories, emergency contacts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

// Query Keys for cache management
export const MAP_QUERY_KEYS = {
  buildings: (campusId?: string) => ['buildings', campusId] as const,
  building: (id: string) => ['building', id] as const,
  openSpaces: (campusId?: string) => ['openSpaces', campusId] as const,
  openSpace: (id: string) => ['openSpace', id] as const,
  pois: (campusId?: string) => ['pois', campusId] as const,
  poi: (id: string) => ['poi', id] as const,
  paths: (campusId?: string) => ['paths', campusId] as const,
  path: (id: string) => ['path', id] as const,
  boundaries: (campusId?: string) => ['boundaries', campusId] as const,
  boundary: (id: string) => ['boundary', id] as const,
  categories: () => ['categories'] as const,
  category: (id: string) => ['category', id] as const,
  emergencyContacts: (campusId?: string) => ['emergencyContacts', campusId] as const,
  campuses: () => ['campuses'] as const,
}

/**
 * Hook: useBuildings
 * Purpose: Fetch and cache all buildings for a campus
 * Inputs: Campus ID (optional)
 * Outputs: Buildings data, loading state, error
 */
export function useBuildings(campusId?: string) {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.buildings(campusId),
    queryFn: async () => {
      const params = campusId ? { campusId } : {}
      const response = await apiClient.get('/buildings', { params })
      return response.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - buildings don't change often
    enabled: !!campusId, // Only fetch if campusId is provided
  })
}

/**
 * Hook: useBuilding
 * Purpose: Fetch and cache a single building
 * Inputs: Building ID
 * Outputs: Building data, loading state, error
 */
export function useBuilding(id: string) {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.building(id),
    queryFn: async () => {
      const response = await apiClient.get(`/buildings/${id}`)
      return response
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  })
}

/**
 * Hook: useOpenSpaces
 * Purpose: Fetch and cache all open spaces for a campus
 */
export function useOpenSpaces(campusId?: string) {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.openSpaces(campusId),
    queryFn: async () => {
      const params = campusId ? { campusId } : {}
      const response = await apiClient.get('/open-spaces', { params })
      return response.data
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!campusId,
  })
}

/**
 * Hook: usePOIs
 * Purpose: Fetch and cache all POIs (Points of Interest) for a campus
 */
export function usePOIs(campusId?: string) {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.pois(campusId),
    queryFn: async () => {
      const params = campusId ? { campusId } : {}
      const response = await apiClient.get('/pois', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - POIs might change more frequently
    enabled: !!campusId,
  })
}

/**
 * Hook: usePaths
 * Purpose: Fetch and cache all paths for a campus
 */
export function usePaths(campusId?: string) {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.paths(campusId),
    queryFn: async () => {
      const params = campusId ? { campusId } : {}
      const response = await apiClient.get('/paths', { params })
      return response.data
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!campusId,
  })
}

/**
 * Hook: useBoundaries
 * Purpose: Fetch and cache all boundaries for a campus
 */
export function useBoundaries(campusId?: string) {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.boundaries(campusId),
    queryFn: async () => {
      const params = campusId ? { campusId } : {}
      const response = await apiClient.get('/boundaries', { params })
      return response.data
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - boundaries rarely change
    enabled: !!campusId,
  })
}

/**
 * Hook: useCategories
 * Purpose: Fetch and cache all POI categories
 */
export function useCategories() {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.categories(),
    queryFn: async () => {
      const response = await apiClient.get('/categories')
      return response.data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - categories rarely change
  })
}

/**
 * Hook: useEmergencyContacts
 * Purpose: Fetch and cache emergency contacts for a campus
 */
export function useEmergencyContacts(campusId?: string) {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.emergencyContacts(campusId),
    queryFn: async () => {
      const params = campusId ? { campusId } : {}
      const response = await apiClient.get('/emergency-contacts', { params })
      return response.data
    },
    staleTime: 20 * 60 * 1000, // 20 minutes
    enabled: !!campusId,
  })
}

/**
 * Hook: useCampuses
 * Purpose: Fetch and cache all active campuses
 */
export function useCampuses() {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.campuses(),
    queryFn: async () => {
      const response = await apiClient.get('/campuses')
      return response.data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - campuses rarely change
  })
}

/**
 * Hook: usePrefetchMapData
 * Purpose: Prefetch all map data for a campus for offline use
 * Inputs: Campus ID
 * Outputs: Mutation function to trigger prefetch
 */
export function usePrefetchMapData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campusId: string) => {
      console.log('🔄 Prefetching map data for campus:', campusId)
      
      // Prefetch all map data in parallel
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: MAP_QUERY_KEYS.buildings(campusId),
          queryFn: async () => {
            const response = await apiClient.get('/buildings', { params: { campusId } })
            return response.data
          },
        }),
        queryClient.prefetchQuery({
          queryKey: MAP_QUERY_KEYS.openSpaces(campusId),
          queryFn: async () => {
            const response = await apiClient.get('/open-spaces', { params: { campusId } })
            return response.data
          },
        }),
        queryClient.prefetchQuery({
          queryKey: MAP_QUERY_KEYS.pois(campusId),
          queryFn: async () => {
            const response = await apiClient.get('/pois', { params: { campusId } })
            return response.data
          },
        }),
        queryClient.prefetchQuery({
          queryKey: MAP_QUERY_KEYS.paths(campusId),
          queryFn: async () => {
            const response = await apiClient.get('/paths', { params: { campusId } })
            return response.data
          },
        }),
        queryClient.prefetchQuery({
          queryKey: MAP_QUERY_KEYS.boundaries(campusId),
          queryFn: async () => {
            const response = await apiClient.get('/boundaries', { params: { campusId } })
            return response.data
          },
        }),
        queryClient.prefetchQuery({
          queryKey: MAP_QUERY_KEYS.emergencyContacts(campusId),
          queryFn: async () => {
            const response = await apiClient.get('/emergency-contacts', { params: { campusId } })
            return response.data
          },
        }),
      ])

      console.log('✓ Map data prefetched successfully')
    },
  })
}

/**
 * Hook: useInvalidateMapData
 * Purpose: Invalidate and refetch map data
 * Inputs: None
 * Outputs: Function to invalidate specific or all map data
 */
export function useInvalidateMapData() {
  const queryClient = useQueryClient()

  return {
    invalidateBuildings: (campusId?: string) => 
      queryClient.invalidateQueries({ queryKey: MAP_QUERY_KEYS.buildings(campusId) }),
    invalidatePOIs: (campusId?: string) => 
      queryClient.invalidateQueries({ queryKey: MAP_QUERY_KEYS.pois(campusId) }),
    invalidatePaths: (campusId?: string) => 
      queryClient.invalidateQueries({ queryKey: MAP_QUERY_KEYS.paths(campusId) }),
    invalidateBoundaries: (campusId?: string) => 
      queryClient.invalidateQueries({ queryKey: MAP_QUERY_KEYS.boundaries(campusId) }),
    invalidateAll: () => 
      queryClient.invalidateQueries(),
  }
}
