/**
 * Emergency Contact Repository
 * Purpose: Database operations for emergency contacts
 */

import { prisma } from '../config/database'

/**
 * Get all emergency contacts with pagination
 * Purpose: Fetch paginated list of emergency contacts
 * Input: page, limit, filters (search, campusId)
 * Output: Emergency contacts with pagination
 */
export const findAll = async (page: number, limit: number, filters: any = {}) => {
  const skip = (page - 1) * limit
  const where: any = {}

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { title: { contains: filters.search } },
      { department: { contains: filters.search } }
    ]
  }

  if (filters.campusId) {
    where.campusId = filters.campusId
  }

  const [contacts, total] = await Promise.all([
    prisma.emergencyContact.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        campus: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.emergencyContact.count({ where })
  ])

  return {
    contacts,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Find emergency contact by ID
 * Purpose: Get single emergency contact with details
 * Input: id
 * Output: Emergency contact object
 */
export const findById = async (id: string) => {
  return prisma.emergencyContact.findUnique({
    where: { id },
    include: {
      campus: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}

/**
 * Create emergency contact
 * Purpose: Add new emergency contact
 * Input: Emergency contact data
 * Output: Created emergency contact
 */
export const create = async (data: any) => {
  return prisma.emergencyContact.create({
    data,
    include: {
      campus: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}

/**
 * Update emergency contact
 * Purpose: Modify existing emergency contact
 * Input: id, data
 * Output: Updated emergency contact
 */
export const update = async (id: string, data: any) => {
  return prisma.emergencyContact.update({
    where: { id },
    data,
    include: {
      campus: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}

/**
 * Delete emergency contact
 * Purpose: Remove emergency contact
 * Input: id
 * Output: Deleted emergency contact
 */
export const remove = async (id: string) => {
  return prisma.emergencyContact.delete({
    where: { id }
  })
}

/**
 * Toggle active status
 * Purpose: Enable/disable emergency contact
 * Input: id
 * Output: Updated emergency contact
 */
export const toggleActive = async (id: string) => {
  const contact = await prisma.emergencyContact.findUnique({ where: { id } })
  if (!contact) throw new Error('Emergency contact not found')
  
  return prisma.emergencyContact.update({
    where: { id },
    data: { isActive: !contact.isActive }
  })
}
