import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllDataExceptUsers() {
  try {
    console.log('🔄 Clearing all data except users...')

    // Clear all data tables in the correct order (respecting foreign key constraints)
    console.log('Clearing component requests...')
    await prisma.componentRequest.deleteMany()

    console.log('Clearing project submissions...')
    await prisma.projectSubmission.deleteMany()

    console.log('Clearing project requests...')
    await prisma.projectRequest.deleteMany()

    console.log('Clearing projects...')
    await prisma.project.deleteMany()

    console.log('Clearing student attendance...')
    await prisma.studentAttendance.deleteMany()

    console.log('Clearing attendance records...')
    await prisma.attendanceRecord.deleteMany()

    console.log('Clearing class schedules...')
    await prisma.classSchedule.deleteMany()

    console.log('Clearing enrollments...')
    await prisma.enrollment.deleteMany()

    console.log('Clearing courses...')
    await prisma.course.deleteMany()

    console.log('Clearing lab components...')
    await prisma.labComponent.deleteMany()

    console.log('Clearing locations...')
    await prisma.location.deleteMany()

    // Count remaining users to confirm they're preserved
    const userCount = await prisma.user.count()
    const adminCount = await prisma.admin.count()
    const facultyCount = await prisma.faculty.count()
    const studentCount = await prisma.student.count()

    console.log('✅ Database cleared successfully!')
    console.log(`📊 Preserved data counts:`)
    console.log(`   - Users: ${userCount}`)
    console.log(`   - Admins: ${adminCount}`)
    console.log(`   - Faculty: ${facultyCount}`)
    console.log(`   - Students: ${studentCount}`)

  } catch (error) {
    console.error('❌ Error clearing database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
clearAllDataExceptUsers()
  .then(() => {
    console.log('🎉 Database clearing completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Database clearing failed:', error)
    process.exit(1)
  }) 