import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { id } = params

    const component = await prisma.labComponent.update({
      where: { id },
      data: {
        totalQuantity: data.totalQuantity,
        availableQuantity: data.availableQuantity,
      },
    })

    return NextResponse.json({ component })
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
