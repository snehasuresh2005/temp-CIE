import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { id } = params

    // Extract image IDs from URLs if provided
    let frontImageId = null
    let backImageId = null
    
    if (data.imageUrl) {
      const urlParts = data.imageUrl.split('/')
      frontImageId = urlParts[urlParts.length - 1]
    }
    
    if (data.backImageUrl) {
      const urlParts = data.backImageUrl.split('/')
      backImageId = urlParts[urlParts.length - 1]
    }

    const component = await prisma.labComponent.update({
      where: { id },
      data: {
        component_name: data.name,
        component_description: data.description,
        component_specification: data.specifications,
        component_quantity: data.totalQuantity,
        component_tag_id: data.tagId,
        component_category: data.category,
        component_location: data.location,
        front_image_id: frontImageId,
        back_image_id: backImageId,
        invoice_number: data.invoiceNumber,
        purchase_value: data.purchasedValue ? parseFloat(data.purchasedValue) : null,
        purchased_from: data.purchasedFrom,
        purchase_currency: data.purchasedCurrency || "INR",
        purchase_date: data.purchasedDate ? new Date(data.purchasedDate) : null,
        modified_by: data.modifiedBy || "system", // TODO: Get from auth context
      },
    })

    // Transform the response to match frontend expectations
    const transformedComponent = {
      id: component.id,
      name: component.component_name,
      description: component.component_description,
      specifications: component.component_specification,
      totalQuantity: component.component_quantity,
      availableQuantity: component.component_quantity, // For now, assume all are available
      category: component.component_category,
      location: component.component_location,
      tagId: component.component_tag_id,
      imageUrl: component.front_image_id ? `${component.image_path}/${component.front_image_id}` : null,
      backImageUrl: component.back_image_id ? `${component.image_path}/${component.back_image_id}` : null,
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

    await prisma.labComponent.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete component error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
