/**
 * Reservation Repository
 * Purpose: Handle all database operations for reservations
 * Inputs: Reservation data objects
 * Outputs: Reservation records from database
 */

import { prisma } from '@/config/database'
import type { Reservation } from '@prisma/client'
import { Prisma } from '@prisma/client'

// Reservation status constants (SQLite doesn't support enums)
export const ReservationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const

export class ReservationRepository {
  /**
   * Find reservation by ID
   */
  async findById(id: string): Promise<Reservation | null> {
    return prisma.reservation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        building: true,
        location: true,
      },
    })
  }

  /**
   * Create new reservation
   */
  async create(data: Prisma.ReservationCreateInput): Promise<Reservation> {
    return prisma.reservation.create({
      data,
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        building: true,
        location: true,
      },
    })
  }

  /**
   * Update reservation
   */
  async update(id: string, data: Prisma.ReservationUpdateInput): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data,
    })
  }

  /**
   * Approve reservation
   */
  async approve(id: string, approverId: string): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.APPROVED,
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      include: {
        requester: true,
        building: true,
        location: true,
      },
    })
  }

  /**
   * Reject reservation
   */
  async reject(id: string, approverId: string, reason: string): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.REJECTED,
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    })
  }

  /**
   * Cancel reservation
   */
  async cancel(id: string): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.CANCELLED,
      },
    })
  }

  /**
   * Find all reservations with filters
   */
  async findAll(params: {
    skip?: number
    take?: number
    where?: Prisma.ReservationWhereInput
    orderBy?: Prisma.ReservationOrderByWithRelationInput
  }) {
    const { skip, take, where, orderBy } = params

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          building: {
            select: {
              id: true,
              name: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.reservation.count({ where }),
    ])

    return { reservations, total }
  }

  /**
   * Find pending reservations
   */
  async findPending(campusId?: string) {
    return this.findAll({
      where: {
        campusId,
        status: ReservationStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Find reservations by user
   */
  async findByUser(userId: string, status?: ReservationStatus) {
    return this.findAll({
      where: {
        requesterId: userId,
        status,
      },
      orderBy: { startDate: 'desc' },
    })
  }

  /**
   * Check for conflicts
   */
  async findConflicts(params: {
    resourceType: string
    resourceId: string
    startDate: Date
    endDate: Date
    startTime: string
    endTime: string
    excludeId?: string
  }) {
    const { resourceType, resourceId, startDate, endDate, excludeId } = params
    // TODO: Implement time-based conflict checking with startTime and endTime

    return prisma.reservation.findMany({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        resourceType,
        ...(resourceType === 'building' ? { buildingId: resourceId } : { locationId: parseInt(resourceId) }),
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
    })
  }
}

export const reservationRepository = new ReservationRepository()
