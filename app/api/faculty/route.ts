import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        user: true,
      },
    })

    return NextResponse.json({ faculty })
  } catch (error) {
    console.error("Get faculty error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
