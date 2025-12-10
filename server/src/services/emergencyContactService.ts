/**
 * Emergency Contact Service
 * Purpose: Business logic for emergency contacts
 */

import * as emergencyContactRepository from '../repositories/emergencyContactRepository'

/**
 * Get all emergency contacts
 * Purpose: Fetch paginated emergency contacts with filters
 * Input: page, limit, search, campusId
 * Output: Paginated emergency contacts
 */
export const getAll = async (page: number, limit: number, search?: string, campusId?: string) => {
  const filters: any = {}
  
  if (search) filters.search = search
  if (campusId) filters.campusId = campusId
  
  return emergencyContactRepository.findAll(page, limit, filters)
}

/**
 * Get emergency contact by ID
 * Purpose: Fetch single emergency contact
 * Input: id
 * Output: Emergency contact object
 */
export const getById = async (id: string) => {
  const contact = await emergencyContactRepository.findById(id)
  if (!contact) {
    throw new Error('Emergency contact not found')
  }
  return contact
}

/**
 * Create emergency contact
 * Purpose: Add new emergency contact
 * Input: Emergency contact data
 * Output: Created emergency contact
 */
export const create = async (data: any) => {
  return emergencyContactRepository.create(data)
}

/**
 * Update emergency contact
 * Purpose: Modify existing emergency contact
 * Input: id, data
 * Output: Updated emergency contact
 */
export const update = async (id: string, data: any) => {
  const exists = await emergencyContactRepository.findById(id)
  if (!exists) {
    throw new Error('Emergency contact not found')
  }
  return emergencyContactRepository.update(id, data)
}

/**
 * Delete emergency contact
 * Purpose: Remove emergency contact
 * Input: id
 * Output: Success message
 */
export const remove = async (id: string) => {
  const exists = await emergencyContactRepository.findById(id)
  if (!exists) {
    throw new Error('Emergency contact not found')
  }
  await emergencyContactRepository.remove(id)
  return { message: 'Emergency contact deleted successfully' }
}

/**
 * Toggle active status
 * Purpose: Enable/disable emergency contact
 * Input: id
 * Output: Updated emergency contact
 */
export const toggleActive = async (id: string) => {
  return emergencyContactRepository.toggleActive(id)
}
