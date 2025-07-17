import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

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
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = `${Date.now()}_${file.name}`
    
    // Ensure the lab-images directory exists
    const labImagesDir = path.join(process.cwd(), 'public', 'lab-images')
    if (!existsSync(labImagesDir)) {
      await mkdir(labImagesDir, { recursive: true })
    }
    
    const filePath = path.join(labImagesDir, fileName)
    
    await writeFile(filePath, buffer)
    const imageUrl = `/lab-images/${fileName}`
    
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 