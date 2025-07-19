import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // Look up the student record by user_id
    const student = await prisma.student.findUnique({ where: { user_id: userId } });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    const studentId = student.id;
    const { opportunityId, resumePath } = req.body;
    if (!opportunityId || !resumePath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      // Prevent duplicate opportunityApplications
      const existing = await prisma.opportunityApplication.findFirst({ where: { studentId, opportunityId } });
      if (existing) {
        return res.status(400).json({ error: 'Already applied to this opportunity' });
      }
      const opportunityApplication = await prisma.opportunityApplication.create({
        data: {
          opportunityId,
          studentId,
          resumePath,
        },
      });
      return res.status(200).json({ opportunityApplication });
    } catch (error: any) {
      console.error('API /api/applications error:', error);
      console.error('Request body:', req.body);
      return res.status(500).json({ error: error.message || 'Failed to submit application' });
    }
  }
  res.status(405).json({ error: 'Method not allowed' });
} 