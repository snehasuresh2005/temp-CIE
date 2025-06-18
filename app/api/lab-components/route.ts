import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const components = await prisma.labComponent.findMany({
      include: {
        requests: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ components })
  } catch (error) {
    console.error("Get lab components error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const component = await prisma.labComponent.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl || "/placeholder.svg?height=200&width=200",
        totalQuantity: data.totalQuantity || data.quantity,
        availableQuantity: data.availableQuantity || data.quantity,
        category: data.category,
      },
    })

    return NextResponse.json({ component })
  } catch (error) {
    console.error("Create lab component error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
