/**
 * Get Campus IDs Script
 * Purpose: Display all campus IDs for reference
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getCampusIds() {
  console.log('\n📍 Campus IDs:\n')
  console.log('=' .repeat(80))
  
  const campuses = await prisma.campus.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  if (campuses.length === 0) {
    console.log('❌ No campuses found in database!')
    console.log('\n💡 Run: npm run seed')
    return
  }

  campuses.forEach((campus, index) => {
    console.log(`\n${index + 1}. ${campus.name}`)
    console.log(`   ID: ${campus.id}`)
    console.log(`   Slug: ${campus.slug}`)
    console.log(`   Active: ${campus.isActive ? '✅' : '❌'}`)
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n💡 Use these IDs when importing data in the UI\n')
}

getCampusIds()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
