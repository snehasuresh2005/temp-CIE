import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const internshipId = params.id;

    // Check if internship exists
    const existingInternship = await prisma.internshipProject.findUnique({
      where: { id: internshipId },
    });

    if (!existingInternship) {
      return NextResponse.json({ error: 'Internship not found' }, { status: 404 });
    }

    // Delete the internship
    await prisma.internshipProject.delete({
      where: { id: internshipId },
    });

    return NextResponse.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship:', error);
    return NextResponse.json(
      { error: 'Failed to delete internship' },
      { status: 500 }
    );
  }
} 