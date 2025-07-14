import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearCoordinatorAssignments() {
  try {
    console.log('🧹 Clearing all hardcoded coordinator assignments...')

    // Remove all existing coordinator assignments
    const deletedAssignments = await prisma.domainCoordinator.deleteMany({
      where: {
        assigned_by: 'system'
      }
    })

    console.log(`✅ Removed ${deletedAssignments.count} hardcoded coordinator assignments`)

    // Keep domains but remove the hardcoded assignments
    console.log('✅ Domains preserved for dynamic assignment through admin panel')
    
    console.log('\n🎉 Cleanup completed successfully!')
    console.log('You can now assign coordinators dynamically through the admin panel.')

  } catch (error) {
    console.error('❌ Error clearing coordinator assignments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearCoordinatorAssignments()