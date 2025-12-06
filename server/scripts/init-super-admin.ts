/**
 * Initialize Super Admin Script
 * Purpose: Standalone script to create super admin user
 * Usage: npm run init-super-admin
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/password'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function initSuperAdmin() {
  console.log('🚀 Super Admin Initialization Script')
  console.log('=====================================\n')

  try {
    // Check if users exist
    const userCount = await prisma.user.count()
    
    if (userCount > 0) {
      console.log('⚠️  Warning: Users already exist in the database.')
      const proceed = await question('Do you want to create another super admin? (yes/no): ')
      
      if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled.')
        rl.close()
        return
      }
    }

    // Find SuperAdmin role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SuperAdmin' }
    })

    if (!superAdminRole) {
      console.error('❌ SuperAdmin role not found!')
      console.log('Please run: npm run seed')
      rl.close()
      return
    }

    // Get user input
    console.log('\n📝 Enter super admin details:\n')
    
    const email = await question('Email (default: admin@um6p.ma): ') || 'admin@um6p.ma'
    const password = await question('Password (default: Admin@123): ') || 'Admin@123'
    const firstName = await question('First Name (default: Super): ') || 'Super'
    const lastName = await question('Last Name (default: Admin): ') || 'Admin'

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.error(`❌ User with email ${email} already exists!`)
      rl.close()
      return
    }

    // Hash password
    console.log('\n🔐 Hashing password...')
    const hashedPassword = await hashPassword(password)

    // Create super admin user
    console.log('👤 Creating super admin user...')
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        userType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }
    })

    // Assign SuperAdmin role
    console.log('🔑 Assigning SuperAdmin role...')
    await prisma.userRole.create({
      data: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
        campusId: null, // Global scope
      }
    })

    console.log('\n✅ Super admin created successfully!')
    console.log('=====================================')
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
    console.log('👤 Name:', `${firstName} ${lastName}`)
    console.log('=====================================')
    console.log('⚠️  IMPORTANT: Change the password after first login!\n')
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error)
    throw error
  } finally {
    rl.close()
  }
}

// Run the script
initSuperAdmin()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
