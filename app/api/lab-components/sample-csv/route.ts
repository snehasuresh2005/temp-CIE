import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    // Read the actual sample CSV file from the codebase
    const csvFilePath = path.join(process.cwd(), "sample-lab-components.csv")
    const csvContent = await readFile(csvFilePath, "utf-8")
    
    // Return the CSV file as a download
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=sample-lab-components.csv",
      },
    })
  } catch (error) {
    console.error("Error serving sample CSV:", error)
    return NextResponse.json(
      { error: "Failed to serve sample CSV file" },
      { status: 500 }
    )
  }
} 