/**
 * Saved Places Repository
 * Purpose: Database operations for saved places
 */

import { prisma } from '../config/database'

interface SavePlaceData {
  userId: string
  placeId: string
  placeType: string
  placeName: string
}

class SavedPlacesRepository {
  /**
   * Find a saved place
   */
  async findOne(userId: string, placeId: string, placeType: string) {
    return prisma.savedPlace.findFirst({
      where: {
        userId,
        placeId,
        placeType
      }
    })
  }

  /**
   * Create a saved place
   */
  async create(data: SavePlaceData) {
    return prisma.savedPlace.create({
      data: {
        userId: data.userId,
        placeId: data.placeId,
        placeType: data.placeType,
        placeName: data.placeName
      }
    })
  }

  /**
   * Delete a saved place
   */
  async delete(userId: string, placeId: string, placeType: string) {
    return prisma.savedPlace.deleteMany({
      where: {
        userId,
        placeId,
        placeType
      }
    })
  }

  /**
   * Get all saved places for a user
   */
  async findByUserId(userId: string) {
    return prisma.savedPlace.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }
}

export const savedPlacesRepository = new SavedPlacesRepository()
