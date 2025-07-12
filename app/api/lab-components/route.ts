import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain_id = searchParams.get('domain_id')
    
    let whereClause = {}
    if (domain_id) {
      whereClause = { domain_id }
    }

    const components = await prisma.labComponent.findMany({
      where: whereClause,
      include: {
        domain: true
      },
      orderBy: {
        created_at: "desc",
      },
    })

    // Get all projects to link them to components
    const projects = await prisma.project.findMany({
      where: {
        components_needed: {
          isEmpty: false,
        },
      },
      select: {
        id: true,
        name: true,
        components_needed: true,
      },
    })

    // Create a map of componentId -> projects
    const componentProjectsMap: Record<string, { id: string; name: string }[]> = {}
    projects.forEach((project) => {
      project.components_needed.forEach((componentId) => {
        if (!componentProjectsMap[componentId]) {
          componentProjectsMap[componentId] = []
        }
        componentProjectsMap[componentId].push({ id: project.id, name: project.name })
      })
    })

    // Get all approved component requests to calculate available quantity
    // Only count APPROVED and COLLECTED as "in use" - exclude RETURNED and USER_RETURNED components
    const approvedRequests = await prisma.componentRequest.findMany({
      where: {
        status: {
          in: ["APPROVED", "COLLECTED"],
        },
      },
      select: {
        component_id: true,
        quantity: true,
      },
    })

    // Calculate available quantity for each component
    const componentUsage = approvedRequests.reduce(
      (acc, request) => {
        acc[request.component_id] = (acc[request.component_id] || 0) + request.quantity
        return acc
      },
      {} as Record<string, number>,
    )

    // Transform the data to match frontend expectations
    const transformedComponents = components.map((component) => {
      const usedQuantity = componentUsage[component.id] || 0
      const availableQuantity = component.component_quantity - usedQuantity
      const associatedProjects = componentProjectsMap[component.id] || []

      return {
        // Add snake_case for the new info dialog
        ...component,

        // Add associated projects
        projects: associatedProjects,

        // Keep camelCase for existing frontend parts
        name: component.component_name,
        description: component.component_description,
        specifications: component.component_specification,
        totalQuantity: component.component_quantity,
        availableQuantity: availableQuantity,
        available_quantity: availableQuantity, // Add snake_case version for frontend
        category: component.component_category,
        location: component.component_location,
        tagId: component.component_tag_id,
        imageUrl: component.front_image_id ? `/lab-images/${component.front_image_id}` : null,
        backImageUrl: component.back_image_id ? `/lab-images/${component.back_image_id}` : null,
        image_url: component.front_image_id ? `/lab-images/${component.front_image_id}` : null, // Add snake_case version
        back_image_url: component.back_image_id ? `/lab-images/${component.back_image_id}` : null, // Add snake_case version
        invoiceNumber: component.invoice_number,
        purchasedFrom: component.purchased_from,
        purchasedDate: component.purchase_date,
        purchasedValue: component.purchase_value,
        purchasedCurrency: component.purchase_currency,
        createdAt: component.created_at,
        updatedAt: component.modified_at,
      }
    })

    return NextResponse.json({ components: transformedComponents })
  } catch (error) {
    console.error("Get lab components error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }
    
      const user = await getUserById(userId)
    if (!user || (user.role !== "ADMIN" && user.role !== "FACULTY")) {
      return NextResponse.json({ error: "Access denied - Admin or Faculty only" }, { status: 403 })
      }

    const data = await request.json()
    const userName = user.name

    console.log("POST /api/lab-components - Final userName being used:", userName)

    const component = await prisma.labComponent.create({
      data: {
        component_name: data.component_name,
        component_description: data.component_description,
        component_specification: data.component_specification,
        component_quantity: data.component_quantity,
        component_tag_id: data.component_tag_id,
        component_category: data.component_category,
        component_location: data.component_location,
        front_image_id: data.front_image_id,
        back_image_id: data.back_image_id,
        invoice_number: data.invoice_number,
        purchase_value: data.purchase_value ? parseFloat(data.purchase_value) : null,
        purchased_from: data.purchased_from,
        purchase_currency: data.purchase_currency || "INR",
        purchase_date: data.purchase_date ? new Date(data.purchase_date) : null,
        created_by: userName,
      },
    })

    console.log("POST /api/lab-components - Created component with created_by:", component.created_by)

    // Transform the response to match frontend expectations
    const transformedComponent = {
      // Add snake_case for the new info dialog
      ...component,

      // Keep camelCase for existing frontend parts
      name: component.component_name,
      description: component.component_description,
      specifications: component.component_specification,
      totalQuantity: component.component_quantity,
      availableQuantity: component.component_quantity,
      available_quantity: component.component_quantity, // Add snake_case version for frontend
      category: component.component_category,
      location: component.component_location,
      tagId: component.component_tag_id,
      imageUrl: component.front_image_id ? `/lab-images/${component.front_image_id}` : null,
      backImageUrl: component.back_image_id ? `/lab-images/${component.back_image_id}` : null,
      image_url: component.front_image_id ? `/lab-images/${component.front_image_id}` : null, // Add snake_case version
      back_image_url: component.back_image_id ? `/lab-images/${component.back_image_id}` : null, // Add snake_case version
      invoiceNumber: component.invoice_number,
      purchasedFrom: component.purchased_from,
      purchasedDate: component.purchase_date,
      purchasedValue: component.purchase_value,
      purchasedCurrency: component.purchase_currency,
      createdAt: component.created_at,
      updatedAt: component.modified_at,
    }

    return NextResponse.json({ component: transformedComponent })
  } catch (error) {
    console.error("Create lab component error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}