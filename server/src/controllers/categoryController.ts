import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../config/database'

/**
 * Get all categories
 * Purpose: Retrieve all building categories
 * Output: List of categories
 */
export async function getAll(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })

    return reply.status(200).send({
      success: true,
      data: categories
    })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch categories'
    })
  }
}
