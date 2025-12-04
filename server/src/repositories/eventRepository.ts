/**
 * Event Repository
 * Purpose: Handle all database operations for events
 * Inputs: Event data objects
 * Outputs: Event records from database
 */

import { prisma } from '@/config/database'
import type { Event } from '@prisma/client'
import { Prisma } from '@prisma/client'

export class EventRepository {
  /**
   * Find event by ID
   */
  async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: { id },
      include: {
        campus: true,
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        sessions: {
          include: {
            building: true,
            openSpace: true,
          },
          orderBy: { startTime: 'asc' },
        },
        agendaItems: {
          orderBy: { startTime: 'asc' },
        },
        media: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    })
  }

  /**
   * Find event by slug
   */
  async findBySlug(campusId: string, slug: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: {
        slug_campusId: { slug, campusId },
      },
      include: {
        campus: true,
        sessions: true,
      },
    })
  }

  /**
   * Create new event
   */
  async create(data: Prisma.EventCreateInput): Promise<Event> {
    return prisma.event.create({
      data,
      include: {
        campus: true,
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  /**
   * Update event
   */
  async update(id: string, data: Prisma.EventUpdateInput): Promise<Event> {
    return prisma.event.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete event
   */
  async delete(id: string): Promise<Event> {
    return prisma.event.delete({
      where: { id },
    })
  }

  /**
   * Find all events with filters
   */
  async findAll(params: {
    skip?: number
    take?: number
    where?: Prisma.EventWhereInput
    orderBy?: Prisma.EventOrderByWithRelationInput
  }) {
    const { skip, take, where, orderBy } = params

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          campus: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              sessions: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ])

    return { events, total }
  }

  /**
   * Find upcoming events
   */
  async findUpcoming(campusId?: string, limit: number = 10) {
    return prisma.event.findMany({
      where: {
        campusId,
        isActive: true,
        status: 'published',
        startDate: {
          gte: new Date(),
        },
      },
      take: limit,
      orderBy: { startDate: 'asc' },
      include: {
        campus: true,
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    })
  }

  /**
   * Find happening now
   */
  async findHappeningNow(campusId?: string) {
    const now = new Date()
    return prisma.event.findMany({
      where: {
        campusId,
        isActive: true,
        status: 'published',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        campus: true,
        sessions: {
          where: {
            startTime: { lte: now },
            endTime: { gte: now },
          },
        },
      },
    })
  }
}

export const eventRepository = new EventRepository()
