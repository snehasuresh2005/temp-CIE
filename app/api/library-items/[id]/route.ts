import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/library-items/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const itemId = params.id;
  try {
    // Deleting LibraryItem will cascade to LibraryRequest via onDelete: Cascade
    await prisma.libraryItem.delete({ where: { id: itemId } });
    return NextResponse.json({ message: "Library item deleted" });
  } catch (error: any) {
    console.error("Delete library item error", error);
    return NextResponse.json({ error: error?.message ?? "Failed to delete item" }, { status: 500 });
  }
}
