import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const resumesDir = path.join(process.cwd(), 'public', 'resumes');
    await fs.mkdir(resumesDir, { recursive: true });

    const form = formidable({
      uploadDir: resumesDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: false,
      filter: ({ mimetype }) => mimetype === 'application/pdf',
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Failed to upload file' });
      }
      const file = files.file || files.resume;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const uploadedFile = Array.isArray(file) ? file[0] : file;
      if (uploadedFile.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Only PDF files are allowed' });
      }
      const fileName = path.basename(uploadedFile.filepath || uploadedFile.path);
      const url = `/resumes/${fileName}`;
      return res.status(200).json({ url });
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
} 