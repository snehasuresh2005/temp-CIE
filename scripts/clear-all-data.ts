import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllData() {
  try {
    console.log('Starting to clear all data...')

    // Clear component requests first (due to foreign key constraints)
    console.log('Clearing component requests...')
    const deletedComponentRequests = await prisma.componentRequest.deleteMany({})
    console.log(`Deleted ${deletedComponentRequests.count} component requests`)

    // Clear project submissions
    console.log('Clearing project submissions...')
    const deletedProjectSubmissions = await prisma.projectSubmission.deleteMany({})
    console.log(`Deleted ${deletedProjectSubmissions.count} project submissions`)

    // Clear project requests
    console.log('Clearing project requests...')
    const deletedProjectRequests = await prisma.projectRequest.deleteMany({})
    console.log(`Deleted ${deletedProjectRequests.count} project requests`)

    // Clear projects
    console.log('Clearing projects...')
    const deletedProjects = await prisma.project.deleteMany({})
    console.log(`Deleted ${deletedProjects.count} projects`)

    // Clear lab components
    console.log('Clearing lab components...')
    const deletedLabComponents = await prisma.labComponent.deleteMany({})
    console.log(`Deleted ${deletedLabComponents.count} lab components`)

    console.log('✅ All data cleared successfully!')
  } catch (error) {
    console.error('Error clearing data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllData() 