import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { title, description } = await request.json();
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }
    const insight = await prisma.insight.create({
      data: {
        title,
        description,
        created_by: userId,
      },
    });
    return NextResponse.json({ insight }, { status: 201 });
  } catch (error) {
    console.error("Error creating insight:", error);
    return NextResponse.json({ error: "Failed to create insight" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const url = new URL(request.url);
    const created_by = url.searchParams.get("created_by");
    const status = url.searchParams.get("status");
    const developer_id = url.searchParams.get("developer_id");
    let where: any = {};
    if (created_by === "me") where.created_by = userId;
    if (status) where.status = status;
    // For developer dashboard: show all tasks for all developers
    if (developer_id === "me") {
      where.status = { in: ["APPROVED", "IN_PROGRESS", "DONE", "REJECTED", "COMPLETED"] };
    }
    const insights = await prisma.insight.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
} 