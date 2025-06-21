import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const components = await prisma.labComponent.findMany({
      orderBy: {
        created_date: "desc",
      },
    })

    // Transform the data to match frontend expectations
    const transformedComponents = components.map(component => ({
      // Add snake_case for the new info dialog
      ...component,

      // Keep camelCase for existing frontend parts
      name: component.component_name,
      description: component.component_description,
      specifications: component.component_specification,
      totalQuantity: component.component_quantity,
      availableQuantity: component.component_quantity, // TODO: This needs to be calculated
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
    }))

    return NextResponse.json({ components: transformedComponents })
  } catch (error) {
    console.error("Get lab components error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Get user from header
    const userId = request.headers.get("x-user-id")
    let userName = "system"
    if (userId) {
      const user = await getUserById(userId)
      if (user) {
        userName = user.name
      }
    }

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
    console.error("Create lab component error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
