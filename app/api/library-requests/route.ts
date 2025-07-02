import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true });
}
