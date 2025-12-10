/**
 * Main Seed File
 * Purpose: Orchestrate all database seeding
 */

import { prisma } from '../src/config/database'
import seedCampuses from './seeds/campuses'
import { seedRolesAndPermissions } from './seeds/roles'
import seedAmenities from './seeds/amenities'
import { seedSuperAdmin } from './seeds/superAdmin'
import { seedCategories } from './seeds/categories'

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Seed campuses
    await seedCampuses()
    
    // Seed roles and permissions (must run before super admin)
    await seedRolesAndPermissions()
    
    // Seed super admin (only if user table is empty)
    await seedSuperAdmin()
    
    // Seed amenities
    await seedAmenities()
    
    // Seed categories
    await seedCategories()

    console.log('✅ Seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
