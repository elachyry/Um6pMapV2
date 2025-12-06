/**
 * Super Admin Seed
 * Purpose: Initialize super admin user if user table is empty
 * Inputs: None
 * Outputs: Super admin user with SuperAdmin role
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../../src/utils/password'

const prisma = new PrismaClient()

export async function seedSuperAdmin() {
  console.log('👤 Checking for super admin user...')

  try {
    // Check if any users exist
    const userCount = await prisma.user.count()
    
    if (userCount > 0) {
      console.log('  ℹ️  Users already exist. Skipping super admin creation.')
      return
    }

    console.log('  📝 User table is empty. Creating super admin...')

    // Find SuperAdmin role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SuperAdmin' }
    })

    if (!superAdminRole) {
      throw new Error('SuperAdmin role not found. Please run role seeding first.')
    }

    // Default super admin credentials
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@um6p.ma'
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123'
    
    // Hash password
    const hashedPassword = await hashPassword(superAdminPassword)

    // Create super admin user
    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        userType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }
    })

    // Assign SuperAdmin role
    await prisma.userRole.create({
      data: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
        campusId: null, // Global scope
      }
    })

    console.log('  ✅ Super admin created successfully!')
    console.log('  📧 Email:', superAdminEmail)
    console.log('  🔑 Password:', superAdminPassword)
    console.log('  ⚠️  IMPORTANT: Change the password after first login!')
    
  } catch (error) {
    console.error('❌ Error seeding super admin:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedSuperAdmin()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
