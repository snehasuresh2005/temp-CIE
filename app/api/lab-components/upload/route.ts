import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Only handle multipart/form-data
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }
    
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = `${Date.now()}_${file.name}`
    const filePath = path.join(process.cwd(), 'public', 'lab-images', fileName)
    
    await writeFile(filePath, buffer)
    const imageUrl = `/lab-images/${fileName}`
    
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 