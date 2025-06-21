import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  try {
    console.log('Starting database cleanup...')

    // Step 1: Get the project we want to keep
    const projectToKeep = await prisma.project.findFirst({
      where: { name: 'project 1' }
    })

    if (!projectToKeep) {
      console.log('Project "project 1" not found. Nothing to clean.')
      return
    }

    console.log(`Found project to keep: ${projectToKeep.name} (ID: ${projectToKeep.id})`)

    // Step 2: Get the component linked to this project
    const componentToKeep = await prisma.labComponent.findFirst({
      where: { id: { in: projectToKeep.components_needed } }
    })

    if (componentToKeep) {
      console.log(`Found component to keep: ${componentToKeep.component_name} (ID: ${componentToKeep.id})`)
    }

    // Step 3: Delete all project requests not linked to "project 1" (must be first due to FK constraints)
    const deleteProjectRequestsResult = await prisma.projectRequest.deleteMany({
      where: {
        project_id: { not: projectToKeep.id }
      }
    })
    console.log(`Deleted ${deleteProjectRequestsResult.count} project requests`)

    // Step 4: Delete all project submissions not linked to "project 1"
    const deleteProjectSubmissionsResult = await prisma.projectSubmission.deleteMany({
      where: {
        project_id: { not: projectToKeep.id }
      }
    })
    console.log(`Deleted ${deleteProjectSubmissionsResult.count} project submissions`)

    // Step 5: Delete all component requests not linked to "project 1"
    const deleteComponentRequestsResult = await prisma.componentRequest.deleteMany({
      where: {
        project_id: { not: projectToKeep.id }
      }
    })
    console.log(`Deleted ${deleteComponentRequestsResult.count} component requests`)

    // Step 6: Delete all projects except "project 1" (after related records are deleted)
    const deleteProjectsResult = await prisma.project.deleteMany({
      where: {
        id: { not: projectToKeep.id }
      }
    })
    console.log(`Deleted ${deleteProjectsResult.count} projects`)

    // Step 7: Delete all lab components except the one linked to "project 1"
    if (componentToKeep) {
      const deleteLabComponentsResult = await prisma.labComponent.deleteMany({
        where: {
          id: { not: componentToKeep.id }
        }
      })
      console.log(`Deleted ${deleteLabComponentsResult.count} lab components`)
    } else {
      // If no component is linked, delete all components
      const deleteAllLabComponentsResult = await prisma.labComponent.deleteMany({})
      console.log(`Deleted ${deleteAllLabComponentsResult.count} lab components (no linked component found)`)
    }

    // Step 8: Verify what's left
    const remainingProjects = await prisma.project.findMany()
    const remainingComponents = await prisma.labComponent.findMany()
    const remainingProjectRequests = await prisma.projectRequest.findMany()
    const remainingComponentRequests = await prisma.componentRequest.findMany()
    const remainingProjectSubmissions = await prisma.projectSubmission.findMany()

    console.log('\n✅ Database cleanup completed!')
    console.log('\nRemaining data:')
    console.log(`- Projects: ${remainingProjects.length}`)
    console.log(`- Lab Components: ${remainingComponents.length}`)
    console.log(`- Project Requests: ${remainingProjectRequests.length}`)
    console.log(`- Component Requests: ${remainingComponentRequests.length}`)
    console.log(`- Project Submissions: ${remainingProjectSubmissions.length}`)

    if (remainingProjects.length > 0) {
      console.log('\nRemaining project:')
      remainingProjects.forEach(project => {
        console.log(`  - ${project.name} (ID: ${project.id})`)
      })
    }

    if (remainingComponents.length > 0) {
      console.log('\nRemaining components:')
      remainingComponents.forEach(component => {
        console.log(`  - ${component.component_name} (ID: ${component.id})`)
      })
    }

  } catch (error) {
    console.error('Error cleaning database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase() 