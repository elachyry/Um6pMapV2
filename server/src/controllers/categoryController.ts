import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../config/database'

/**
 * Get all categories
 * Purpose: Retrieve all building categories with pagination
 * Output: List of categories with pagination
 */
export async function getAll(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { page = '1', limit = '12', search = '', type = '' } = request.query as any
    
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const where: any = {}
    
    // Filter by type if provided
    if (type) {
      where.type = type
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              buildings: true,
              pois: true,
              openSpaces: true
            }
          }
        }
      }),
      prisma.category.count({ where })
    ])

    return reply.status(200).send({
      success: true,
      data: categories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch categories'
    })
  }
}

/**
 * Get category by ID
 */
export async function getById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string }
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            buildings: true,
            pois: true
          }
        }
      }
    })

    if (!category) {
      return reply.status(404).send({
        success: false,
        error: 'Category not found'
      })
    }

    return reply.status(200).send({
      success: true,
      data: category
    })
  } catch (error: any) {
    console.error('Error fetching category:', error)
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch category'
    })
  }
}

/**
 * Create category
 */
export async function create(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const data = request.body as any
    
    // Generate slug from name if not provided
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }

    const category = await prisma.category.create({
      data
    })

    return reply.status(201).send({
      success: true,
      data: category
    })
  } catch (error: any) {
    console.error('Error creating category:', error)
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to create category'
    })
  }
}

/**
 * Update category
 */
export async function update(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string }
    const data = request.body as any

    // Generate slug from name if name is updated
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }

    const category = await prisma.category.update({
      where: { id },
      data
    })

    return reply.status(200).send({
      success: true,
      data: category
    })
  } catch (error: any) {
    console.error('Error updating category:', error)
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to update category'
    })
  }
}

/**
 * Delete category
 */
export async function remove(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string }

    // Check if category is in use
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            buildings: true,
            pois: true,
            openSpaces: true
          }
        }
      }
    })

    if (!category) {
      return reply.status(404).send({
        success: false,
        error: 'Category not found'
      })
    }

    const totalUsage = category._count.buildings + category._count.pois + category._count.openSpaces
    if (totalUsage > 0) {
      const usageParts = []
      if (category._count.buildings > 0) usageParts.push(`${category._count.buildings} buildings`)
      if (category._count.pois > 0) usageParts.push(`${category._count.pois} POIs`)
      if (category._count.openSpaces > 0) usageParts.push(`${category._count.openSpaces} open spaces`)
      
      return reply.status(400).send({
        success: false,
        error: `Cannot delete category. It is used by ${usageParts.join(', ')}.`
      })
    }

    await prisma.category.delete({
      where: { id }
    })

    return reply.status(200).send({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to delete category'
    })
  }
}
