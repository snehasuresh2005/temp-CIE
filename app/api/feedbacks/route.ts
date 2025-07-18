import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

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

    // Check content type for multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const category = formData.get("category") as string | null;
      const imageFile = formData.get("image");

      if (!title || !description) {
        return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
      }

      let imagePath: string | null = null;
      if (imageFile && typeof imageFile === "object" && "arrayBuffer" in imageFile) {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public", "feedback-images");
        await fs.mkdir(uploadDir, { recursive: true });
        const fileName = `${Date.now()}_${imageFile.name}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        imagePath = `/feedback-images/${fileName}`;
      }

      const feedback = await prisma.feedback.create({
        data: {
          title,
          description,
          category: category || null,
          image: imagePath,
          created_by: userId,
        },
      });
      return NextResponse.json({ feedback }, { status: 201 });
    } else {
      // Fallback to JSON body (for backward compatibility)
      const { title, description, category } = await request.json();
      if (!title || !description) {
        return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
      }
      const feedback = await prisma.feedback.create({
        data: {
          title,
          description,
          category: category || null,
          created_by: userId,
        },
      });
      return NextResponse.json({ feedback }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 });
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
    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
  }
} 