import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get("status")

    let requests: any[] = []

    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { user_id: userId } })
      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
      }

      requests = await prisma.componentRequest.findMany({
        where: { 
          student_id: student.id,
          ...(status && { status: status as any })
        },
        include: {
          component: true,
          student: { include: { user: true } },
          faculty: { include: { user: true } },
          requesting_faculty: { include: { user: true } },
          project: true,
        },
        orderBy: { request_date: "desc" },
      })
    }

    if (user.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { user_id: userId },
        include: { domain_assignments: true }
      })

      if (!faculty) {
        return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
      }

      // Faculty can see requests for their assigned domains (as coordinator) or their own requests
      if (faculty && faculty.domain_assignments.length > 0) {
        const domainIds = faculty.domain_assignments.map((assignment: any) => assignment.domain_id)
        
        requests = await prisma.componentRequest.findMany({
          where: {
            OR: [
              // Requests for components in their assigned domains (as coordinator)
              {
                component: {
                  domain_id: { in: domainIds }
                }
              },
              // Their own requests (if they made any)
              { faculty_id: faculty.id }
            ],
            ...(status && { status: status as any })
          },
          include: {
            component: {
              include: {
                domain: true
              }
            },
            student: { include: { user: true } },
            faculty: { include: { user: true } },
            requesting_faculty: { include: { user: true } },
            project: true,
          },
          orderBy: { request_date: "desc" },
        })
      } else {
        // Faculty without domain assignments can see their own requests only
        requests = await prisma.componentRequest.findMany({
          where: { 
            faculty_id: faculty.id,
            ...(status && { status: status as any })
          },
          include: {
            component: {
              include: {
                domain: true
              }
            },
            student: { include: { user: true } },
            faculty: { include: { user: true } },
            requesting_faculty: { include: { user: true } },
            project: true,
          },
          orderBy: { request_date: "desc" },
        })
      }
    }

    if (user.role === "ADMIN") {
      requests = await prisma.componentRequest.findMany({
        where: status ? { status: status as any } : {},
        include: {
          component: true,
          student: { include: { user: true } },
          faculty: { include: { user: true } },
          requesting_faculty: { include: { user: true } },
          project: true,
        },
        orderBy: { request_date: "desc" },
      })
    }

    const transformedRequests = requests.map(request => ({
      ...request,
      component_name: request.component.component_name,
      student_name: request.student?.user?.name || null,
      student_email: request.student?.user?.email || null,
      faculty_name: request.faculty?.user?.name || null,
      requesting_faculty_name: request.requesting_faculty?.user?.name || null,
      project_name: request.project?.name || null,
    }))

    return NextResponse.json({ requests: transformedRequests })
  } catch (error) {
    console.error("Error fetching component requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || !["STUDENT", "FACULTY"].includes(user.role)) {
      return NextResponse.json({ error: "Only students and faculty can create component requests" }, { status: 403 })
    }

    let student = null
    let faculty = null

    if (user.role === "STUDENT") {
      student = await prisma.student.findUnique({ where: { user_id: userId } })
      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
      }
    } else if (user.role === "FACULTY") {
      faculty = await prisma.faculty.findUnique({ where: { user_id: userId } })
      if (!faculty) {
        return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
      }
    }

    const { component_id, quantity, notes, project_id, purpose, required_date } = await req.json()

    if (!component_id || !quantity) {
      return NextResponse.json({ error: "Component ID and quantity are required" }, { status: 400 })
    }

    // Check if component exists and has sufficient quantity
    const component = await prisma.labComponent.findUnique({
      where: { id: component_id },
      include: { domain: true }
    })

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    if (component.component_quantity < quantity) {
      return NextResponse.json({ error: "Insufficient component quantity available" }, { status: 400 })
    }

    // Find the coordinator for this component's domain
    let coordinatorId = null
    if (component.domain_id) {
      const coordinator = await prisma.domainCoordinator.findFirst({
        where: { domain_id: component.domain_id }
      })
      if (coordinator) {
        coordinatorId = coordinator.faculty_id
      }
    }

    // If no coordinator found, reject the request
    if (!coordinatorId) {
      return NextResponse.json({ error: "No coordinator available for this component domain" }, { status: 400 })
    }

    const requestData: any = {
      component_id,
      quantity,
      notes,
      project_id,
      purpose: purpose || `${user.role === "STUDENT" ? "Student" : "Faculty"} component request`,
      required_date: required_date ? new Date(required_date) : null,
      approved_by: coordinatorId, // Assign to coordinator
      status: "APPROVED", // Set status directly to APPROVED to skip PENDING
    }

    if (user.role === "STUDENT") {
      requestData.student_id = student!.id
    } else if (user.role === "FACULTY") {
      requestData.faculty_id = faculty!.id
    }

    const newRequest = await prisma.componentRequest.create({
      data: requestData,
      include: {
        component: true,
        student: { include: { user: true } },
        faculty: { include: { user: true } },
        project: true,
      },
    })

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error("Error creating component request:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
