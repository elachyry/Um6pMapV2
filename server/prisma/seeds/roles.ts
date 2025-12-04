/**
 * Roles and Permissions Seed
 * Purpose: Initialize system roles and permissions
 * Inputs: None
 * Outputs: Seeded roles and permissions
 */

import { PrismaClient } from '@prisma/client'
import { PERMISSIONS, ROLE_PERMISSIONS, type RoleName } from '../../src/constants/permissions'

const prisma = new PrismaClient()

export async function seedRolesAndPermissions() {
  console.log('🔐 Seeding roles and permissions...')

  try {
    // Create all permissions
    const permissionMap = new Map<string, string>()
    
    for (const [key, permissionName] of Object.entries(PERMISSIONS)) {
      const [resource, action] = permissionName.split(':')
      
      // Check if permission exists
      let permission = await prisma.permission.findUnique({
        where: {
          name: permissionName,
        } as any,
      })
      
      if (!permission) {
        permission = await prisma.permission.create({
          data: {
            name: permissionName,
            resource,
            action,
            description: `${action} permission for ${resource}`,
          } as any,
        })
      }
      
      permissionMap.set(permissionName, permission.id)
      console.log(`  ✓ Created permission: ${permissionName}`)
    }

    // Create all roles with their permissions
    for (const [roleName, roleConfig] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {
          description: roleConfig.description,
        } as any,
        create: {
          name: roleName,
          description: roleConfig.description,
          isSystem: true, // System roles cannot be deleted
        } as any,
      })

      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      })

      // Create role permissions
      for (const permission of roleConfig.permissions) {
        const permissionId = permissionMap.get(permission)
        if (permissionId) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId,
            },
          })
        }
      }

      console.log(`  ✓ Created role: ${roleName} (${roleConfig.scope}) with ${roleConfig.permissions.length} permissions`)
    }

    console.log('✅ Roles and permissions seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedRolesAndPermissions()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
