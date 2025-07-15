import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: opportunityId } = params;
  const formData = await req.formData();
  const file = formData.get('resume');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const resumesDir = path.join(process.cwd(), 'private_resumes');
  await fs.mkdir(resumesDir, { recursive: true });
  const filePath = path.join(resumesDir, fileName);
  await fs.writeFile(filePath, buffer);
  return NextResponse.json({ filePath: `/private_resumes/${fileName}` });
}