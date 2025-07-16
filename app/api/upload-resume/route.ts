import { NextRequest, NextResponse } from 'next/server';
import { createWriteStream } from 'fs';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  // @ts-ignore
  const fileType = file.type;
  if (fileType !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 });
  }
  // @ts-ignore
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${Date.now()}_${randomBytes(6).toString('hex')}.pdf`;
  const filePath = join(process.cwd(), 'public', 'resumes', fileName);
  try {
    await new Promise<void>((resolve, reject) => {
      const stream = createWriteStream(filePath);
      stream.on('finish', () => resolve());
      stream.on('error', reject);
      stream.end(buffer);
    });
    const url = `/resumes/${fileName}`;
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save file', details: error }, { status: 500 });
  }
} 