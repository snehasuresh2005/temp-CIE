import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const requests = await prisma.componentRequest.findMany({
      include: {
        student: {
          include: {
            user: true,
          },
        },
        component: true,
        project: true,
      },
      orderBy: {
        request_date: "desc",
      },
    })

    // Convert to snake_case for consistency
    const snakeCaseRequests = requests.map(request => ({
      id: request.id,
      student_id: request.student_id,
      component_id: request.component_id,
      project_id: request.project_id,
      quantity: request.quantity,
      purpose: request.purpose,
      request_date: request.request_date,
      required_date: request.required_date,
      status: request.status,
      approved_date: request.approved_date,
      return_date: request.return_date,
      notes: request.notes,
      approved_by: request.approved_by,
      student: {
        id: request.student.id,
        user: {
          name: request.student.user.name,
          email: request.student.user.email,
        }
      },
      component: request.component,
      project: request.project,
    }));

    return NextResponse.json({ requests: snakeCaseRequests })
  } catch (error) {
    console.error("Get component requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const student = await prisma.student.findFirst();
    if (!student) {
      return NextResponse.json({ error: "No students found in database" }, { status: 400 })
    }
    const student_id = student.id

    const component = await prisma.labComponent.findUnique({
      where: { id: data.component_id },
    })

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    if (component.component_quantity < data.quantity) {
      return NextResponse.json({ error: "Insufficient quantity available" }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: data.project_id },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Validate that the component is assigned to this project
    if (!project.components_needed.includes(data.component_id)) {
      return NextResponse.json({ 
        error: "Component is not assigned to this project. Only components listed in the project can be requested." 
      }, { status: 400 })
    }

    // If student-proposed project, check for approved project request
    if (project.type === "STUDENT_PROPOSED") {
      const projectRequest = await prisma.projectRequest.findFirst({
        where: {
          project_id: project.id,
          student_id: student_id,
          status: "APPROVED"
        }
      });
      if (!projectRequest) {
        return NextResponse.json({
          error: "Project is not approved yet. You cannot request components for this project."
        }, { status: 400 })
      }
    }

    // Determine faculty_id based on project type
    let faculty_id = null;
    
    if (project.type === "FACULTY_ASSIGNED") {
      // For faculty-assigned projects, faculty ID is in created_by
      faculty_id = project.created_by;
      console.log(`Faculty-assigned project: using created_by faculty ID: ${faculty_id}`);
    } else if (project.type === "STUDENT_PROPOSED") {
      // For student-proposed projects, faculty ID is in accepted_by
      faculty_id = project.accepted_by;
      console.log(`Student-proposed project: using accepted_by faculty ID: ${faculty_id}`);
    } else {
      console.log(`Unknown project type: ${project.type}, project data:`, project);
    }

    // Validate that we have a faculty ID
    if (!faculty_id) {
      return NextResponse.json({ 
        error: "Unable to determine faculty for approval. Project type: " + project.type 
      }, { status: 400 })
    }

    // Verify the faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: faculty_id },
    });

    if (!faculty) {
      return NextResponse.json({ 
        error: "Faculty not found for ID: " + faculty_id 
      }, { status: 404 })
    }

    console.log(`Creating component request with faculty ID: ${faculty_id}`);

    // Create the request
    const request = await prisma.componentRequest.create({
      data: {
        student_id: student_id,
        component_id: data.component_id,
        project_id: data.project_id,
        approved_by: faculty_id,
        quantity: data.quantity,
        purpose: data.purpose,
        required_date: new Date(data.required_date),
        notes: data.notes,
        status: "PENDING",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        component: true,
        project: true,
      },
    })

    return NextResponse.json({ request })
  } catch (error) {
    console.error("Create component request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
