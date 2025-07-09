// Script to check and clean up coordinator assignments
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCoordinatorAssignments() {
  try {
    console.log('Checking coordinator assignments...')
    
    // Get all coordinator assignments
    const assignments = await prisma.domainCoordinator.findMany({
      include: {
        faculty: {
          include: {
            user: true
          }
        },
        domain: true
      }
    })
    
    console.log(`Found ${assignments.length} coordinator assignments:`)
    
    assignments.forEach(assignment => {
      console.log(`- ${assignment.faculty.user.name} assigned to ${assignment.domain.name}`)
    })
    
    // Get all faculty members
    const allFaculty = await prisma.faculty.findMany({
      include: {
        user: true
      }
    })
    
    console.log(`\nTotal faculty members: ${allFaculty.length}`)
    console.log(`Faculty with coordinator assignments: ${assignments.length}`)
    
    // If there are too many assignments (more than 2-3), clean them up
    if (assignments.length > 3) {
      console.log('\nToo many coordinator assignments found. Cleaning up...')
      
      // Keep only the first assignment and remove the rest
      const assignmentsToDelete = assignments.slice(1)
      
      for (const assignment of assignmentsToDelete) {
        await prisma.domainCoordinator.delete({
          where: { id: assignment.id }
        })
        console.log(`Removed assignment: ${assignment.faculty.user.name} from ${assignment.domain.name}`)
      }
      
      console.log('Cleanup completed!')
    }
    
  } catch (error) {
    console.error('Error checking coordinator assignments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCoordinatorAssignments()