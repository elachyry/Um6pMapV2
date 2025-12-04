import { FastifyRequest, FastifyReply } from 'fastify'
import * as buildingService from '../services/buildingService'

/**
 * Import buildings from GeoJSON file
 * Purpose: Handle GeoJSON upload and import buildings into database
 * Input: GeoJSON FeatureCollection in request body
 * Output: Import results with success/duplicate/error counts
 */
export async function importFromGeoJSON(
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  try {
    const geojson = request.body as any
    const result = await buildingService.importFromGeoJSON(geojson)
    
    return reply.status(200).send({
      success: true,
      data: result
    })
  } catch (error: any) {
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to import buildings'
    })
  }
}

/**
 * Get all buildings
 * Purpose: Retrieve all buildings with pagination
 * Input: Query params (page, limit, search, campusId)
 * Output: Paginated list of buildings
 */
export async function getAll(
  request: FastifyRequest<{
    Querystring: { page?: string; limit?: string; search?: string; campusId?: string; categoryId?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const page = parseInt(request.query.page || '1', 10)
    const limit = parseInt(request.query.limit || '12', 10)
    const search = request.query.search || ''
    const campusId = request.query.campusId
    const categoryId = request.query.categoryId

    const result = await buildingService.getAll(page, limit, { search, campusId, categoryId })
    
    return reply.status(200).send({
      success: true,
      data: result.buildings,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    })
  } catch (error: any) {
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to get buildings'
    })
  }
}

/**
 * Get building by ID
 * Purpose: Retrieve a single building by its ID
 * Input: Building ID in URL params
 * Output: Building details
 */
export async function getById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const building = await buildingService.getById(id)
    
    if (!building) {
      return reply.status(404).send({
        success: false,
        error: 'Building not found'
      })
    }
    
    return reply.status(200).send({
      success: true,
      data: building
    })
  } catch (error: any) {
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to get building'
    })
  }
}

/**
 * Create building
 * Purpose: Create a new building
 * Input: Building data in request body
 * Output: Created building
 */
export async function create(
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  try {
    const building = await buildingService.create(request.body)
    
    return reply.status(201).send({
      success: true,
      data: building
    })
  } catch (error: any) {
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to create building'
    })
  }
}

/**
 * Update building
 * Purpose: Update an existing building
 * Input: Building ID and update data in request body
 * Output: Updated building
 */
export async function update(
  request: FastifyRequest<{ Params: { id: string }; Body: any }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const updateData = request.body
    
    console.log('Update building request:', { id, updateData })
    
    const building = await buildingService.update(id, updateData)
    
    return reply.status(200).send({
      success: true,
      data: building
    })
  } catch (error: any) {
    console.error('Building update error:', error)
    console.error('Error stack:', error.stack)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to update building'
    })
  }
}

/**
 * Delete building
 * Purpose: Delete a building by ID
 * Input: Building ID in params
 * Output: Success message
 */
export async function deleteBuilding(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    await buildingService.deleteById(id)
    
    return reply.status(200).send({
      success: true,
      message: 'Building deleted successfully'
    })
  } catch (error: any) {
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to delete building'
    })
  }
}
