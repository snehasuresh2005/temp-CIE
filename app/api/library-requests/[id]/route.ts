import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH: Update request status or dates
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = params.id;
  try {
    const body = await req.json();

    // Whitelist updatable fields
    const updatable: any = {};
    if (body.status) updatable.status = body.status;
    if (body.collection_date) updatable.collection_date = new Date(body.collection_date);
    if (body.return_date) updatable.return_date = new Date(body.return_date);
    if (body.notes !== undefined) updatable.notes = body.notes;
    if (body.faculty_notes !== undefined) updatable.faculty_notes = body.faculty_notes;

    const updated = await prisma.libraryRequest.update({
      where: { id: requestId },
      data: updatable,
      include: {
        item: true,
        student: { include: { user: true } },
      },
    });

    // If marking returned, increment available_quantity
    if (body.status === "RETURNED" && body.quantity) {
      await prisma.libraryItem.update({
        where: { id: updated.item_id },
        data: { available_quantity: { increment: updated.quantity } },
      });
    }

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Error updating library request:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
