import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSubmission() {
  try {
    // Get a student
    const student = await prisma.student.findFirst({
      include: {
        user: true
      }
    })
    
    if (!student) {
      console.log('No student found')
      return
    }
    
    console.log('Student:', student.user.name)
    
    // Get a project
    const project = await prisma.project.findFirst({
      where: {
        status: 'ONGOING'
      }
    })
    
    if (!project) {
      console.log('No ongoing project found')
      return
    }
    
    console.log('Project:', project.name)
    
    // Check existing submission
    const existingSubmission = await prisma.projectSubmission.findUnique({
      where: {
        project_id_student_id: {
          project_id: project.id,
          student_id: student.id
        }
      }
    })
    
    console.log('Existing submission:', existingSubmission)
    
    // Create or update submission
    const submission = await prisma.projectSubmission.upsert({
      where: {
        project_id_student_id: {
          project_id: project.id,
          student_id: student.id
        }
      },
      update: {
        content: 'Test submission content',
        attachments: ['/submissions/test.pdf'],
        status: 'SUBMITTED',
        submission_date: new Date(),
      },
      create: {
        project_id: project.id,
        student_id: student.id,
        content: 'Test submission content',
        attachments: ['/submissions/test.pdf'],
        status: 'SUBMITTED',
        submission_date: new Date(),
      }
    })
    
    console.log('Submission created/updated:', submission)
    
    // Verify submission was saved
    const savedSubmission = await prisma.projectSubmission.findUnique({
      where: {
        project_id_student_id: {
          project_id: project.id,
          student_id: student.id
        }
      }
    })
    
    console.log('Saved submission:', savedSubmission)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSubmission() 