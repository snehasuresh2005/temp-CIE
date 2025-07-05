import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"
import { unlink } from "fs/promises"
import path from "path"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { id } = params

    // Get user from header
    const userId = request.headers.get("x-user-id")
    console.log("PATCH /api/lab-components/[id] - Received userId from header:", userId)
    
    let userName = "system"
    if (userId) {
      const user = await getUserById(userId)
      console.log("PATCH /api/lab-components/[id] - Retrieved user from getUserById:", user)
      if (user) {
        userName = user.name
        console.log("PATCH /api/lab-components/[id] - Using userName:", userName)
      }
    } else {
      console.log("PATCH /api/lab-components/[id] - No userId in header, using default 'system'")
    }

    console.log("PATCH /api/lab-components/[id] - Final userName being used:", userName)

    const component = await prisma.labComponent.update({
      where: { id },
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
        modified_by: userName,
      },
    })

    console.log("PATCH /api/lab-components/[id] - Updated component with modified_by:", component.modified_by)

    // Transform the response to match frontend expectations
    const transformedComponent = {
      ...component,
      name: component.component_name,
      description: component.component_description,
      specifications: component.component_specification,
      totalQuantity: component.component_quantity,
      availableQuantity: component.component_quantity, // For now, assume all are available
      category: component.component_category,
      location: component.component_location,
      tagId: component.component_tag_id,
      imageUrl: component.front_image_id ? `/lab-images/${component.front_image_id}` : null,
      backImageUrl: component.back_image_id ? `/lab-images/${component.back_image_id}` : null,
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
    console.error("Update component error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // First, find the component to get image IDs
    const component = await prisma.labComponent.findUnique({
      where: { id },
    })

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    console.log(`Deleting component: ${component.component_name}`)
    console.log(`Front image ID: ${component.front_image_id}`)
    console.log(`Back image ID: ${component.back_image_id}`)

    // Delete associated image files
    const imageIds = [component.front_image_id, component.back_image_id]
    for (const imageId of imageIds) {
      if (imageId) {
        try {
          const filePath = path.join(process.cwd(), "public", "lab-images", imageId)
          console.log(`Attempting to delete file: ${filePath}`)
          await unlink(filePath)
          console.log(`Successfully deleted file: ${imageId}`)
        } catch (fileError: any) {
          // Log error if file deletion fails, but don't block the process
          // This handles cases where the file might already be deleted
          if (fileError.code !== 'ENOENT') {
            console.error(`Failed to delete image file: ${imageId}`, fileError)
          } else {
            console.log(`File not found (already deleted): ${imageId}`)
          }
        }
      }
    }

    // Check if there are any component requests for this component
    const componentRequests = await prisma.componentRequest.findMany({
      where: { component_id: id },
      include: {
        student: {
          include: {
            user: true
          }
        },
        project: true
      }
    })

    if (componentRequests.length > 0) {
      console.log(`Found ${componentRequests.length} component requests for this component. Deleting them first.`)
      
      // Delete all related component requests first
      await prisma.componentRequest.deleteMany({
        where: { component_id: id }
      })
      
      console.log(`Deleted ${componentRequests.length} component requests`)
    }

    // Now, delete the component from the database
    await prisma.labComponent.delete({
      where: { id },
    })

    console.log(`Component deleted from database: ${id}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete component error:", error)
    
    // Handle foreign key constraint error specifically
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "Cannot delete component",
        details: "This component is being used by one or more component requests. Please resolve all requests before deleting."
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
