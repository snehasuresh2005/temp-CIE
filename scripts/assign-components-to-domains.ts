import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function assignComponentsToDomains() {
  console.log('🔧 Assigning lab components to domains...\n')

  try {
    // Get the Lab Components domain
    const labComponentsDomain = await prisma.domain.findUnique({
      where: { name: 'Lab Components' }
    })

    if (!labComponentsDomain) {
      console.log('❌ Lab Components domain not found!')
      return
    }

    console.log(`✅ Found Lab Components domain: ${labComponentsDomain.id}`)

    // Get all lab components that don't have a domain
    const unassignedComponents = await prisma.labComponent.findMany({
      where: {
        domain_id: null
      }
    })

    console.log(`📋 Found ${unassignedComponents.length} unassigned components`)

    if (unassignedComponents.length === 0) {
      console.log('✅ All components are already assigned to domains')
      return
    }

    // Assign all components to the Lab Components domain
    const updatePromises = unassignedComponents.map(component => 
      prisma.labComponent.update({
        where: { id: component.id },
        data: { domain_id: labComponentsDomain.id }
      })
    )

    await Promise.all(updatePromises)

    console.log(`✅ Successfully assigned ${unassignedComponents.length} components to Lab Components domain`)

    // Verify the assignment
    const assignedComponents = await prisma.labComponent.findMany({
      where: { domain_id: labComponentsDomain.id },
      include: { domain: true }
    })

    console.log(`📋 Components now assigned to Lab Components domain:`)
    assignedComponents.forEach(c => {
      console.log(`  • ${c.component_name} -> ${c.domain?.name}`)
    })

  } catch (error) {
    console.error('❌ Error assigning components to domains:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignComponentsToDomains() 