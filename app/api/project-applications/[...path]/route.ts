import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path
    const filePath = path.join(process.cwd(), "public", "project-applications", ...params.path)
    
    // Security check - ensure the path is within the project-applications directory
    const normalizedPath = path.normalize(filePath)
    const allowedBasePath = path.join(process.cwd(), "public", "project-applications")
    
    if (!normalizedPath.startsWith(allowedBasePath)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Read the file
    const fileBuffer = await readFile(normalizedPath)
    
    // Return the file with appropriate headers
    const response = new NextResponse(fileBuffer)
    response.headers.set("Content-Type", "application/pdf")
    response.headers.set("Content-Disposition", `inline; filename="${path.basename(normalizedPath)}"`)
    
    return response
  } catch (error) {
    console.error("Error serving resume file:", error)
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
