/**
 * Main Seed File
 * Purpose: Orchestrate all database seeding
 */

import { prisma } from '../src/config/database'
import seedCampuses from './seeds/campuses'
import { seedRolesAndPermissions } from './seeds/roles'
import seedAmenities from './seeds/amenities'

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Seed campuses
    await seedCampuses()
    
    // Seed roles and permissions
    await seedRolesAndPermissions()
    
    // Seed amenities
    await seedAmenities()

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
