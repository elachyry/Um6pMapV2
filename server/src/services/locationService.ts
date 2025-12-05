/**
 * Location Service
 * Purpose: Business logic for locations
 */

import * as locationRepository from '../repositories/locationRepository'

/**
 * Get all locations
 * Purpose: Fetch paginated locations
 * Input: page, limit, buildingId, campusId
 * Output: Locations with pagination
 */
export const getAll = async (page: number, limit: number, buildingId?: string, campusId?: string) => {
  return locationRepository.findAll(page, limit, buildingId, campusId)
}

/**
 * Get location by ID
 * Purpose: Fetch single location
 * Input: Location ID
 * Output: Location object
 */
export const getById = async (id: string) => {
  const location = await locationRepository.findById(id)
  if (!location) {
    throw new Error('Location not found')
  }
  return location
}

/**
 * Create location
 * Purpose: Create new location
 * Input: Location data
 * Output: Created location
 */
export const create = async (data: any) => {
  const locationData = {
    name: data.name,
    buildingId: data.buildingId,
    floor: data.floor,
    roomNumber: data.roomNumber || null,
    description: data.description || null,
    coordinates: data.coordinates || null,
    locationType: data.locationType || 'room',
    capacity: data.capacity || null,
    isReservable: data.isReservable || false,
    facilities: data.facilities || null,
  }

  return locationRepository.create(locationData)
}

/**
 * Update location
 * Purpose: Update existing location with relations
 * Input: Location ID and update data (including relations)
 * Output: Updated location
 */
export const update = async (id: string, data: any) => {
  const { operatingHours, contactInfo, ...locationData } = data
  
  // Check if location exists
  await getById(id)

  const updateData: any = {}

  // Only include fields that are provided
  if (locationData.name !== undefined) updateData.name = locationData.name
  if (locationData.buildingId !== undefined) updateData.buildingId = locationData.buildingId
  if (locationData.floor !== undefined) updateData.floor = locationData.floor
  if (locationData.roomNumber !== undefined) updateData.roomNumber = locationData.roomNumber
  if (locationData.description !== undefined) updateData.description = locationData.description
  if (locationData.coordinates !== undefined) updateData.coordinates = locationData.coordinates
  if (locationData.locationType !== undefined) updateData.locationType = locationData.locationType
  if (locationData.capacity !== undefined) updateData.capacity = locationData.capacity
  if (locationData.isReservable !== undefined) updateData.isReservable = locationData.isReservable
  if (locationData.facilities !== undefined) updateData.facilities = locationData.facilities

  // Update basic location data
  const location = await locationRepository.update(id, updateData)
  
  // Handle operating hours if provided
  if (operatingHours && Array.isArray(operatingHours)) {
    await locationRepository.updateOperatingHours(id, operatingHours)
  }
  
  // Handle contact info if provided
  if (contactInfo && Array.isArray(contactInfo)) {
    await locationRepository.updateContactInfo(id, contactInfo)
  }
  
  return location
}

/**
 * Delete location
 * Purpose: Delete location
 * Input: Location ID
 * Output: Success message
 */
export const deleteLocation = async (id: string) => {
  // Check if location exists
  await getById(id)

  await locationRepository.deleteLocation(id)
  return { message: 'Location deleted successfully' }
}

/**
 * Toggle reservable status
 * Purpose: Toggle isReservable field
 * Input: Location ID
 * Output: Updated location
 */
export const toggleReservable = async (id: string) => {
  // Check if location exists
  await getById(id)

  return locationRepository.toggleReservable(id)
}
