import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { action, rejection_reason } = await request.json();
    const { id } = params;
    let update: any = {};
    if (action === "approve") {
      update.status = "APPROVED";
      update.approved_by = userId;
      update.approved_at = new Date();
    } else if (action === "reject") {
      update.status = "REJECTED";
      update.approved_by = userId;
      update.approved_at = new Date();
      if (rejection_reason) update.rejection_reason = rejection_reason;
    } else if (action === "start") {
      update.status = "IN_PROGRESS";
    } else if (action === "done") {
      update.status = "DONE";
      update.completed_at = new Date();
    } else if (action === "complete") {
      update.status = "COMPLETED";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const insight = await prisma.insight.update({
      where: { id },
      data: update,
    });
    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Error updating insight:", error);
    return NextResponse.json({ error: "Failed to update insight" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const insight = await prisma.insight.findUnique({ where: { id } });
    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }
    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Error fetching insight:", error);
    return NextResponse.json({ error: "Failed to fetch insight" }, { status: 500 });
  }
} 