import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getUserById } from '@/lib/auth'
import { formidable } from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper function to parse JSON body for PUT requests
const parseJsonBody = (req: NextApiRequest): any => {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(data))
      } catch (error) {
        reject(error)
      }
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method

  if (method === 'GET') {
    try {
      // Auth
      const userId = req.headers['x-user-id'] as string
      if (!userId) return res.status(401).json({ error: 'User not authenticated' })
      const user = await getUserById(userId)
      if (!user) return res.status(403).json({ error: 'Access denied' })

      if (user.role === "FACULTY") {
        // Faculty can see submissions for projects in their courses
        const faculty = await prisma.faculty.findUnique({ where: { user_id: userId } })
        if (!faculty) return res.status(404).json({ error: 'Faculty profile not found' })

        console.log('Faculty ID:', faculty.id)
        console.log('Faculty user ID:', userId)

        // Get faculty's courses
        const facultyCourses = await prisma.course.findMany({
          where: { created_by: userId },
          select: { id: true, course_name: true }
        })
        console.log('Faculty courses:', facultyCourses)

        const submissions = await prisma.projectSubmission.findMany({
          where: {
            project: {
              course_id: {
                in: facultyCourses.map(c => c.id)
              }
            }
          },
          include: {
            student: { 
              include: { 
                user: { select: { name: true, email: true } } 
              } 
            },
            project: { 
              select: { 
                name: true, 
                description: true,
                course_id: true
              } 
            },
          },
          orderBy: { submission_date: 'desc' }
        })

        console.log('Found submissions:', submissions.length)

        // Get course details for each submission
        const courseIds = [...new Set(submissions.map(s => s.project.course_id))]
        const courses = await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, course_name: true, course_code: true }
        })
        const courseMap = new Map(courses.map(c => [c.id, c]))

        const submissionsWithCourses = submissions.map(submission => ({
          ...submission,
          project: {
            ...submission.project,
            course: courseMap.get(submission.project.course_id)
          }
        }))

        return res.status(200).json({ submissions: submissionsWithCourses })
      } else if (user.role === "STUDENT") {
        // Students can see their own submissions
        const student = await prisma.student.findUnique({ where: { user_id: userId } })
        if (!student) return res.status(404).json({ error: 'Student profile not found' })

        const submissions = await prisma.projectSubmission.findMany({
          where: { student_id: student.id },
          include: {
            project: { 
              select: { 
                name: true, 
                description: true,
                course_id: true
              } 
            },
          },
          orderBy: { submission_date: 'desc' }
        })

        // Get course details for each submission
        const courseIds = [...new Set(submissions.map(s => s.project.course_id))]
        const courses = await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, course_name: true, course_code: true }
        })
        const courseMap = new Map(courses.map(c => [c.id, c]))

        const submissionsWithCourses = submissions.map(submission => ({
          ...submission,
          project: {
            ...submission.project,
            course: courseMap.get(submission.project.course_id)
          }
        }))

        return res.status(200).json({ submissions: submissionsWithCourses })
      } else {
        return res.status(403).json({ error: 'Access denied - Faculty or Student only' })
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
      return res.status(500).json({ error: 'Failed to fetch submissions' })
    }
  } else if (method === 'POST') {
    try {
      // Auth
      const userId = req.headers['x-user-id'] as string
      if (!userId) return res.status(401).json({ error: 'User not authenticated' })
      const user = await getUserById(userId)
      if (!user || user.role !== "STUDENT") return res.status(403).json({ error: 'Access denied - Students only' })
      const student = await prisma.student.findUnique({ where: { user_id: userId } })
      if (!student) return res.status(404).json({ error: 'Student profile not found' })

      // Parse form
      await fs.mkdir(path.join(process.cwd(), 'public/submissions'), { recursive: true })
      const form = formidable({ multiples: true, uploadDir: path.join(process.cwd(), 'public/submissions'), keepExtensions: true })
      form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: 'Failed to parse form' })
        
        console.log('Form fields:', fields)
        console.log('Form files:', files)
        
        const projectId = Array.isArray(fields.projectId) ? fields.projectId[0] : fields.projectId
        const content = Array.isArray(fields.content) ? fields.content[0] : fields.content || ''
        let attachments: string[] = []
        if (files && files.file) {
          const fileArr = Array.isArray(files.file) ? files.file : [files.file]
          attachments = fileArr.map((f: any) => {
            const filename = path.basename(f.filepath || f.originalFilename || '')
            console.log('File info:', {
              filepath: f.filepath,
              originalFilename: f.originalFilename,
              basename: filename
            })
            return `/submissions/${filename}`
          })
        } else if (files && Object.keys(files).length > 0) {
          // Fallback: check for any file field
          const fileField = Object.values(files)[0] as any
          const fileArr = Array.isArray(fileField) ? fileField : [fileField]
          attachments = fileArr.map((f: any) => {
            const filename = path.basename(f.filepath || f.originalFilename || '')
            console.log('File info (fallback):', {
              filepath: f.filepath,
              originalFilename: f.originalFilename,
              basename: filename
            })
            return `/submissions/${filename}`
          })
        }
        console.log('Attachments to save:', attachments)
        if (!projectId || !content) return res.status(400).json({ error: 'Missing required fields' })

        // Verify project exists and is approved
        const project = await prisma.project.findUnique({
          where: { id: projectId }
        })
        if (!project) return res.status(404).json({ error: 'Project not found' })
        if (project.status !== 'ONGOING' && project.status !== 'PENDING') {
          return res.status(400).json({ error: 'Project must be pending or ongoing before submission' })
        }

        // Check if submission already exists
        const existingSubmission = await prisma.projectSubmission.findUnique({
          where: {
            project_id_student_id: {
              project_id: projectId,
              student_id: student.id
            }
          }
        })

        let submission
        if (existingSubmission) {
          // Update existing submission
          submission = await prisma.projectSubmission.update({
            where: { id: existingSubmission.id },
            data: {
              content,
              attachments,
              status: 'SUBMITTED',
              submission_date: new Date(),
            },
            include: {
              student: { 
                include: { 
                  user: { select: { name: true, email: true } } 
                } 
              },
              project: { 
                select: { 
                  name: true, 
                  description: true,
                  course_id: true
                } 
              },
            },
          })
        } else {
          // Create new submission
          submission = await prisma.projectSubmission.create({
            data: {
              project_id: projectId,
              student_id: student.id,
              content,
              attachments,
              status: 'SUBMITTED',
              submission_date: new Date(),
            },
            include: {
              student: { 
                include: { 
                  user: { select: { name: true, email: true } } 
                } 
              },
              project: { 
                select: { 
                  name: true, 
                  description: true,
                  course_id: true
                } 
              },
            },
          })
        }

        // Get course details
        const course = await prisma.course.findUnique({
          where: { id: submission.project.course_id },
          select: { id: true, course_name: true, course_code: true }
        })

        const submissionWithCourse = {
          ...submission,
          project: {
            ...submission.project,
            course
          }
        }

        return res.status(200).json({ submission: submissionWithCourse })
      })
    } catch (error) {
      console.error('Error creating submission:', error)
      return res.status(500).json({ error: 'Failed to create submission' })
    }
  } else if (method === 'PUT') {
    try {
      // Auth - Faculty only for grading
      const userId = req.headers['x-user-id'] as string
      if (!userId) return res.status(401).json({ error: 'User not authenticated' })
      const user = await getUserById(userId)
      if (!user || user.role !== "FACULTY") return res.status(403).json({ error: 'Access denied - Faculty only' })
      
      // Parse JSON body for PUT requests
      const body = await parseJsonBody(req)
      const { submissionId, marks, feedback } = body
      
      if (!submissionId || marks === undefined) return res.status(400).json({ error: 'Missing required fields' })

      // Verify faculty owns the course for this submission
      const faculty = await prisma.faculty.findUnique({ where: { user_id: userId } })
      if (!faculty) return res.status(404).json({ error: 'Faculty profile not found' })

      const submission = await prisma.projectSubmission.findUnique({
        where: { id: submissionId },
        include: {
          project: true
        }
      })

      if (!submission) return res.status(404).json({ error: 'Submission not found' })

      // Check if faculty owns the course
      const course = await prisma.course.findUnique({
        where: { id: submission.project.course_id }
      })

      if (!course || course.created_by !== userId) {
        return res.status(403).json({ error: 'Access denied - You can only grade submissions for your courses' })
      }

      const updatedSubmission = await prisma.projectSubmission.update({
        where: { id: submissionId },
        data: {
          marks: parseInt(marks),
          feedback: feedback || null,
          status: 'GRADED'
        },
        include: {
          student: { 
            include: { 
              user: { select: { name: true, email: true } } 
            } 
          },
          project: { 
            select: { 
              name: true, 
              description: true,
              course_id: true
            } 
          },
        }
      })

      // Get course details
      const courseDetails = await prisma.course.findUnique({
        where: { id: updatedSubmission.project.course_id },
        select: { course_name: true, course_code: true }
      })

      const submissionWithCourse = {
        ...updatedSubmission,
        project: {
          ...updatedSubmission.project,
          course: courseDetails
        }
      }

      return res.status(200).json({ submission: submissionWithCourse })
    } catch (error) {
      console.error('Error grading submission:', error)
      return res.status(500).json({ error: 'Failed to grade submission' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
} 