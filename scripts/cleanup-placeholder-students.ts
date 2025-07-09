import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupPlaceholderStudents() {
  try {
    console.log('Starting cleanup of placeholder student records...')

    // Find all placeholder student records
    const placeholderStudents = await prisma.student.findMany({
      where: {
        OR: [
          { student_id: { contains: 'FACULTY_' } },
          { program: { contains: 'Faculty Library Access' } },
          { program: { contains: 'Faculty Program' } },
          { student_id: 'FACULTY_PLACEHOLDER' },
          { student_id: 'FACULTY_SYSTEM' }
        ]
      },
      include: {
        user: true,
        library_requests: true
      }
    })

    console.log(`Found ${placeholderStudents.length} placeholder student records`)

    for (const placeholderStudent of placeholderStudents) {
      await prisma.$transaction(async (tx) => {
        // Find all library requests associated with this placeholder student
        const libraryRequests = await tx.libraryRequest.findMany({
          where: { student_id: placeholderStudent.id }
        })

        console.log(`Processing ${libraryRequests.length} library requests for placeholder student ${placeholderStudent.student_id}`)

        // For each library request, try to find the actual faculty member and update the request
        for (const request of libraryRequests) {
          // Extract faculty ID from placeholder student ID
          let facultyId = null
          
          if (placeholderStudent.student_id.startsWith('FACULTY_') && placeholderStudent.student_id !== 'FACULTY_PLACEHOLDER' && placeholderStudent.student_id !== 'FACULTY_SYSTEM') {
            const facultyIdPart = placeholderStudent.student_id.replace('FACULTY_', '')
            
            // Find the actual faculty record
            const faculty = await tx.faculty.findFirst({
              where: { faculty_id: facultyIdPart }
            })

            if (faculty) {
              facultyId = faculty.id
              console.log(`Found faculty ${faculty.faculty_id} for request ${request.id}`)
            }
          }

          if (facultyId) {
            // Since we can't set student_id to null due to DB constraints,
            // we'll update the faculty_id and keep the placeholder student_id for now
            await tx.libraryRequest.update({
              where: { id: request.id },
              data: {
                faculty_id: facultyId,
                // Keep student_id as is due to NOT NULL constraint
              }
            })
            console.log(`Updated request ${request.id} to include faculty_id ${facultyId}`)
          } else {
            console.log(`Could not find faculty for placeholder student ${placeholderStudent.student_id}, deleting request ${request.id}`)
            // If we can't find the faculty, delete the corrupted request and restore item quantity
            const item = await tx.libraryItem.findUnique({
              where: { id: request.item_id }
            })
            
            if (item) {
              await tx.libraryItem.update({
                where: { id: request.item_id },
                data: {
                  available_quantity: {
                    increment: request.quantity
                  }
                }
              })
            }
            
            await tx.libraryRequest.delete({
              where: { id: request.id }
            })
          }
        }

        // Only delete placeholder students that have no remaining library requests
        const remainingRequests = await tx.libraryRequest.findMany({
          where: { student_id: placeholderStudent.id }
        })

        if (remainingRequests.length === 0) {
          // Delete the placeholder student record
          await tx.student.delete({
            where: { id: placeholderStudent.id }
          })

          // Delete the associated placeholder user record
          await tx.user.delete({
            where: { id: placeholderStudent.user_id }
          })

          console.log(`Deleted placeholder student ${placeholderStudent.student_id} and associated user`)
        } else {
          console.log(`Keeping placeholder student ${placeholderStudent.student_id} due to remaining requests`)
        }
      })
    }

    console.log('Cleanup completed successfully!')
  } catch (error) {
    console.error('Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupPlaceholderStudents()