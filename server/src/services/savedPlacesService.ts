/**
 * Saved Places Service
 * Purpose: Business logic for saving/unsaving places
 */

import { savedPlacesRepository } from '../repositories/savedPlacesRepository'

interface SavePlaceData {
  userId: string
  placeId: string
  placeType: string
  placeName: string
}

class SavedPlacesService {
  /**
   * Check if a place is saved by a user
   */
  async isSaved(userId: string, placeId: string, placeType: string): Promise<boolean> {
    const savedPlace = await savedPlacesRepository.findOne(userId, placeId, placeType)
    return !!savedPlace
  }

  /**
   * Save a place for a user
   */
  async savePlace(data: SavePlaceData) {
    // Check if already saved
    const existing = await savedPlacesRepository.findOne(data.userId, data.placeId, data.placeType)
    if (existing) {
      return existing
    }

    return savedPlacesRepository.create(data)
  }

  /**
   * Unsave a place for a user
   */
  async unsavePlace(userId: string, placeId: string, placeType: string) {
    return savedPlacesRepository.delete(userId, placeId, placeType)
  }

  /**
   * Get all saved places for a user
   */
  async getUserSavedPlaces(userId: string) {
    return savedPlacesRepository.findByUserId(userId)
  }
}

export const savedPlacesService = new SavedPlacesService()
