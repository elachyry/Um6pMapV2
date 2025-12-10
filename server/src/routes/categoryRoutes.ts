import { FastifyInstance } from 'fastify'
import * as categoryController from '../controllers/categoryController'

export default async function categoryRoutes(fastify: FastifyInstance) {
  // Get all categories
  fastify.get('/', categoryController.getAll)
  
  // Get category by ID
  fastify.get('/:id', categoryController.getById)
  
  // Create category
  fastify.post('/', categoryController.create)
  
  // Update category
  fastify.put('/:id', categoryController.update)
  
  // Delete category
  fastify.delete('/:id', categoryController.remove)
}
