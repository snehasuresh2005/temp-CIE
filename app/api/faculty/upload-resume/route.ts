import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getUserById } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "FACULTY") {
      return NextResponse.json({ error: "Access denied - Faculty only" }, { status: 403 })
    }

    // Only handle multipart/form-data
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }
    
    const formData = await request.formData()
    const file = formData.get('resume') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No resume file uploaded' }, { status: 400 })
    }

    // Validate file type (PDF)
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed for resumes' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Get faculty record
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: userId },
    })

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
    }

    // Generate unique filename with timestamp and faculty ID
    const timestamp = Date.now()
    const fileName = `${timestamp}_${faculty.faculty_id}_resume.pdf`
    const filePath = path.join(process.cwd(), 'public', 'resumes', fileName)

    // Delete old resume if exists
    if (faculty.resume_id) {
      try {
        const oldFilePath = path.join(process.cwd(), 'public', 'resumes', faculty.resume_id)
        await unlink(oldFilePath)
        console.log(`Deleted old resume: ${faculty.resume_id}`)
      } catch (error) {
        console.log(`Could not delete old resume file: ${faculty.resume_id}`)
      }
    }

    // Save new resume file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(filePath, buffer)
    
    // Update faculty record with new resume info
    const updatedFaculty = await prisma.faculty.update({
      where: { id: faculty.id },
      data: {
        resume_id: fileName,
        resume_path: 'resumes',
      },
    })

    const resumeUrl = `/resumes/${fileName}`
    
    return NextResponse.json({ 
      success: true,
      resumeUrl,
      resumeId: fileName,
      message: 'Resume uploaded successfully'
    })
  } catch (error) {
    console.error("Resume upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "FACULTY") {
      return NextResponse.json({ error: "Access denied - Faculty only" }, { status: 403 })
    }

    // Get faculty record
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: userId },
    })

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
    }

    if (!faculty.resume_id) {
      return NextResponse.json({ error: "No resume found to delete" }, { status: 404 })
    }

    // Delete resume file
    try {
      const filePath = path.join(process.cwd(), 'public', 'resumes', faculty.resume_id)
      await unlink(filePath)
      console.log(`Deleted resume file: ${faculty.resume_id}`)
    } catch (error) {
      console.log(`Could not delete resume file: ${faculty.resume_id}`)
    }

    // Update faculty record to remove resume info
    await prisma.faculty.update({
      where: { id: faculty.id },
      data: {
        resume_id: null,
        resume_path: null,
      },
    })

    return NextResponse.json({ 
      success: true,
      message: 'Resume deleted successfully'
    })
  } catch (error) {
    console.error("Resume delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 