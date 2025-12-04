/**
 * UM6P Campuses Seed Data
 * Purpose: Add the three UM6P campuses with real data
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const campusesData = [
  {
    name: 'UM6P Benguerir',
    slug: 'benguerir',
    description: 'Mohammed VI Polytechnic University\'s main campus in Benguerir, known for its sustainable development and innovation. The campus features state-of-the-art facilities including research centers, laboratories, student housing, and sports facilities.',
    address: 'Lot 660, Hay Moulay Rachid, Ben Guerir 43150, Morocco',
    coordinates: JSON.stringify({ lat: 32.2308, lng: -7.9544 }),
    mapData: JSON.stringify({
      center: { lat: 32.2308, lng: -7.9544 },
      zoom: 16,
      bounds: {
        north: 32.2408,
        south: 32.2208,
        east: -7.9444,
        west: -7.9644
      }
    }),
    isActive: true,
  },
  {
    name: 'UM6P Rabat',
    slug: 'rabat',
    description: 'UM6P\'s campus in the capital city Rabat, focusing on executive education, research partnerships, and innovation programs. Located in the heart of Morocco\'s administrative and political center.',
    address: 'Rocade Rabat-Salé, Technopolis Rabat-Shore, Rabat 11100, Morocco',
    coordinates: JSON.stringify({ lat: 34.0209, lng: -6.8416 }),
    mapData: JSON.stringify({
      center: { lat: 34.0209, lng: -6.8416 },
      zoom: 16,
      bounds: {
        north: 34.0309,
        south: 34.0109,
        east: -6.8316,
        west: -6.8516
      }
    }),
    isActive: true,
  },
  {
    name: 'UM6P Laayoune',
    slug: 'laayoune',
    description: 'UM6P\'s southern campus in Laayoune, dedicated to sustainable development of the southern regions, focusing on agriculture, renewable energy, and marine sciences. Supporting local development and innovation.',
    address: 'Foum El Oued, Laayoune 70000, Morocco',
    coordinates: JSON.stringify({ lat: 27.1536, lng: -13.1994 }),
    mapData: JSON.stringify({
      center: { lat: 27.1536, lng: -13.1994 },
      zoom: 16,
      bounds: {
        north: 27.1636,
        south: 27.1436,
        east: -13.1894,
        west: -13.2094
      }
    }),
    isActive: true,
  },
]

async function seedCampuses() {
  console.log('🌱 Seeding UM6P campuses...')

  for (const campusData of campusesData) {
    const campus = await prisma.campus.upsert({
      where: { slug: campusData.slug },
      update: campusData,
      create: campusData,
    })
    console.log(`✅ Created/Updated campus: ${campus.name}`)
  }

  // Get Benguerir campus ID
  const bengueirCampus = await prisma.campus.findUnique({
    where: { slug: 'benguerir' },
  })

  if (bengueirCampus) {
    // Update all existing buildings without a campus to belong to Benguerir
    const buildingsWithoutCampus = await prisma.buildings.findMany({
      where: {
        // @ts-ignore - Prisma allows null comparison for optional fields
        campusId: null,
      },
    })
    
    if (buildingsWithoutCampus.length > 0) {
      await prisma.buildings.updateMany({
        where: {
          id: {
            in: buildingsWithoutCampus.map(b => b.id),
          },
        },
        data: {
          campusId: bengueirCampus.id,
        },
      })
      console.log(`📍 Assigned ${buildingsWithoutCampus.length} buildings to Benguerir campus`)
    } else {
      console.log('📍 No buildings without campus found')
    }
  }

  console.log('✨ Campus seeding completed!')
}

export default seedCampuses
