import { prisma } from "@/lib/prisma";
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
    const filePath = path.join(process.cwd(), 'public', 'library-images', fileName)
    
    await writeFile(filePath, buffer)
    const imageUrl = `/library-images/${fileName}`
    
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const student_id = searchParams.get("student_id");

  let where: any = {};
  if (student_id) where.student_id = student_id;

  const requests = await prisma.libraryRequest.findMany({
    where,
    orderBy: { request_date: "desc" },
    include: { item: true },
  });
  return NextResponse.json({ requests });
} 