import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

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
    const contentType = request.headers.get("content-type") || "";
    let action = "";
    let rejection_reason = "";
    let rectifiedImagePath: string | null = null;
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      action = formData.get("action") as string;
      rejection_reason = formData.get("rejection_reason") as string;
      const rectifiedImage = formData.get("rectifiedImage");
      if (rectifiedImage && typeof rectifiedImage === "object" && "arrayBuffer" in rectifiedImage) {
        const buffer = Buffer.from(await rectifiedImage.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public", "feedback-images");
        await fs.mkdir(uploadDir, { recursive: true });
        const fileName = `${Date.now()}_${rectifiedImage.name}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        rectifiedImagePath = `/feedback-images/${fileName}`;
      }
    } else {
      const body = await request.json();
      action = body.action;
      rejection_reason = body.rejection_reason;
    }
    const { id } = params;
    let update: any = {};
    if (action === "approve") {
      update.status = "APPROVED";
      update.approved_by = userId;
      update.approved_at = new Date();
    } else if (action === "reject") {
      // Only require rejection reason if status is DONE (final approval), not for pending
      const feedback = await prisma.feedback.findUnique({ where: { id: params.id } });
      const isFinalApproval = feedback?.status === "DONE";
      if (isFinalApproval && (!rejection_reason || rejection_reason.trim() === "")) {
        return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
      }
      update.status = "REJECTED";
      update.approved_by = userId;
      update.approved_at = new Date();
      if (rejection_reason) update.rejectionReason = rejection_reason;
    } else if (action === "start") {
      update.status = "IN_PROGRESS";
    } else if (action === "done") {
      update.status = "DONE";
      update.completed_at = new Date();
      if (rectifiedImagePath) {
        update.rectifiedImage = rectifiedImagePath;
      }
    } else if (action === "complete") {
      update.status = "COMPLETED";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const feedback = await prisma.feedback.update({
      where: { id },
      data: update,
    });
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
} 