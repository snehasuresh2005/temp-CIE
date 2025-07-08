import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role');
  let where = {};
  if (role) {
    where = { role };
  }
  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true },
  });
  return NextResponse.json({ users });
} 