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
    let userName = "system"
    if (userId) {
      const user = await getUserById(userId)
      if (user) {
        userName = user.name
      }
    }

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
      createdAt: component.created_date,
      updatedAt: component.modified_date,
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

    // Delete associated image files
    const imageIds = [component.front_image_id, component.back_image_id]
    for (const imageId of imageIds) {
      if (imageId) {
        try {
          const filePath = path.join(process.cwd(), "public", "lab-images", imageId)
          await unlink(filePath)
        } catch (fileError: any) {
          // Log error if file deletion fails, but don't block the process
          // This handles cases where the file might already be deleted
          if (fileError.code !== 'ENOENT') {
            console.error(`Failed to delete image file: ${imageId}`, fileError)
          }
        }
      }
    }

    // Now, delete the component from the database
    await prisma.labComponent.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete component error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
