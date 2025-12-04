import { FastifyInstance } from 'fastify'
import * as categoryController from '../controllers/categoryController'

export default async function categoryRoutes(fastify: FastifyInstance) {
  // Get all categories
  fastify.get('/categories', categoryController.getAll)
}
