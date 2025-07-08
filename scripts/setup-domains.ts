import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupDomains() {
  try {
    console.log('🏢 Setting up domains (without hardcoded coordinator assignments)...')

    // Create domains
    const libraryDomain = await prisma.domain.upsert({
      where: { name: 'Library' },
      update: {},
      create: {
        name: 'Library',
        description: 'Manages library books, journals, and digital resources'
      }
    })

    const labComponentsDomain = await prisma.domain.upsert({
      where: { name: 'Lab Components' },
      update: {},
      create: {
        name: 'Lab Components',
        description: 'Manages laboratory equipment, components, and hardware'
      }
    })

    console.log('✅ Domains created:')
    console.log(`   - ${libraryDomain.name} (${libraryDomain.id})`)
    console.log(`   - ${labComponentsDomain.name} (${labComponentsDomain.id})`)

    // Update existing lab components to assign them to the Lab Components domain
    const labComponentsUpdated = await prisma.labComponent.updateMany({
      where: { domain_id: null },
      data: { domain_id: labComponentsDomain.id }
    })

    // Update existing library items to assign them to the Library domain
    const libraryItemsUpdated = await prisma.libraryItem.updateMany({
      where: { domain_id: null },
      data: { domain_id: libraryDomain.id }
    })

    console.log(`✅ Updated ${labComponentsUpdated.count} lab components to Lab Components domain`)
    console.log(`✅ Updated ${libraryItemsUpdated.count} library items to Library domain`)

    console.log('\n🎉 Domain setup completed successfully!')
    console.log('\n📋 Note: Coordinator assignments can now be managed dynamically through the admin panel.')
    console.log('💡 Use the "Manage CIE Coordinators" feature to assign faculty to domains.')

  } catch (error) {
    console.error('❌ Error setting up domains:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupDomains()