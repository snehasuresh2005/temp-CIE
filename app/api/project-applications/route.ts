import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied - Students only" }, { status: 403 })
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { user_id: userId },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const project_id = formData.get("project_id") as string
    const faculty_id = formData.get("faculty_id") as string
    const student_notes = formData.get("student_notes") as string
    const resume = formData.get("resume") as File

    if (!project_id || !faculty_id || !resume) {
      return NextResponse.json({ 
        error: "Project ID, Faculty ID, and resume are required" 
      }, { status: 400 })
    }

    // Validate file type
    if (!resume.type.includes("pdf")) {
      return NextResponse.json({ 
        error: "Only PDF files are allowed for resume" 
      }, { status: 400 })
    }

    // Check if the project exists and enrollment is open
    const project = await prisma.project.findUnique({
      where: { id: project_id },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // For faculty-assigned projects, check enrollment status
    if (project.type === "FACULTY_ASSIGNED") {
      if (project.status !== "APPROVED") {
        return NextResponse.json({ 
          error: "Project must be approved before students can apply" 
        }, { status: 400 })
      }

      if (project.enrollment_status !== "OPEN") {
        return NextResponse.json({ 
          error: "Enrollment is not open for this project" 
        }, { status: 400 })
      }
    }

    // Check if student has already applied
    const existingRequest = await prisma.projectRequest.findUnique({
      where: {
        project_id_student_id: {
          project_id: project_id,
          student_id: student.id
        }
      }
    })

    if (existingRequest) {
      return NextResponse.json({ 
        error: "You have already applied for this project" 
      }, { status: 400 })
    }

    // Create unique directory for this project applications
    const projectDir = path.join(process.cwd(), "public", "project-applications", project_id)
    
    try {
      await mkdir(projectDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Generate unique filename
    const resumeId = uuidv4()
    const fileExtension = path.extname(resume.name)
    const fileName = `${student.student_id}_${resumeId}${fileExtension}`
    const filePath = path.join(projectDir, fileName)
    
    // Save the file
    const bytes = await resume.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create project request with resume information
    const projectRequest = await prisma.projectRequest.create({
      data: {
        project_id,
        student_id: student.id,
        faculty_id,
        request_date: new Date(),
        status: "PENDING",
        student_notes: student_notes || null,
        resume_id: resumeId,
        resume_path: `project-applications/${project_id}/${fileName}`,
      },
      include: {
        project: true,
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        faculty: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ 
      projectRequest,
      message: "Application submitted successfully with resume"
    })

  } catch (error) {
    console.error("Error creating project application:", error)
    return NextResponse.json({ 
      error: "Failed to submit application" 
    }, { status: 500 })
  }
}
