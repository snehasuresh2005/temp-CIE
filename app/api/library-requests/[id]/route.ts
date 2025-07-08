import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = params.id;
  try {
    const userId = req.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const body = await req.json();

    const currentRequest = await prisma.libraryRequest.findUnique({
      where: { id: requestId },
      include: { 
        item: { include: { domain: true } },
        student: { include: { user: true } }
      },
    })

    if (!currentRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // STUDENT: Allow return request with payment proof if overdue
    if (user.role === "STUDENT" && body.status === "PENDING_RETURN") {
      const student = await prisma.student.findUnique({ where: { user_id: userId } })
      if (!student || currentRequest.student_id !== student.id) {
        return NextResponse.json({ error: "Access denied - Not your request" }, { status: 403 })
      }

      // Calculate fine if overdue
      let fineAmount = 0
      if (currentRequest.due_date && new Date() > currentRequest.due_date) {
        const daysOverdue = Math.ceil((new Date().getTime() - currentRequest.due_date.getTime()) / (1000 * 60 * 60 * 24))
        fineAmount = daysOverdue * 5 // ₹5 per day
      }

      const updatedRequest = await prisma.libraryRequest.update({
        where: { id: requestId },
        data: {
          status: "PENDING_RETURN",
          fine_amount: fineAmount > 0 ? fineAmount : null,
          payment_proof: body.payment_proof || null,
        },
        include: {
          item: { include: { domain: true } },
          student: { include: { user: true } },
        },
      })
      return NextResponse.json({ request: updatedRequest })
    }

    // FACULTY/COORDINATOR: Check domain permissions
    if (user.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { user_id: userId },
        include: { domain_assignments: true }
      })

      if (!faculty) {
        return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
      }

      // Check if faculty is coordinator of the item's domain
      const isCoordinator = currentRequest.item.domain_id ? 
        faculty.domain_assignments.some(assignment => assignment.domain_id === currentRequest.item.domain_id) : 
        true // Allow access to items without specific domain

      if (!isCoordinator) {
        return NextResponse.json({ error: "Access denied - Not assigned to this domain" }, { status: 403 })
      }

      let updateData: any = {
        status: body.status,
        faculty_notes: body.faculty_notes || null,
        faculty_id: faculty.id
      }

      // Handle different status transitions
      switch (body.status) {
        case "APPROVED":
          if (currentRequest.status !== "PENDING") {
            return NextResponse.json({ error: "Can only approve pending requests" }, { status: 400 })
          }
          // Check if enough quantity is available
          const availableQuantity = currentRequest.item.available_quantity;
          if (availableQuantity < currentRequest.quantity) {
            return NextResponse.json({ error: "Insufficient quantity available" }, { status: 400 })
          }
          // Reserve the quantity by decreasing available_quantity when approved
          await prisma.libraryItem.update({
            where: { id: currentRequest.item_id },
            data: { available_quantity: { decrement: currentRequest.quantity } },
          });
          break

        case "COLLECTED":
          if (currentRequest.status !== "APPROVED") {
            return NextResponse.json({ error: "Can only mark approved requests as collected" }, { status: 400 })
          }
          updateData.collection_date = new Date()
          // Set due date (default 14 days for library items)
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 14)
          updateData.due_date = dueDate
          // No quantity change needed - already decremented when approved
          break

        case "RETURNED":
          if (!["COLLECTED", "PENDING_RETURN"].includes(currentRequest.status)) {
            return NextResponse.json({ error: "Can only mark collected items as returned" }, { status: 400 })
          }
          updateData.return_date = new Date()
          
          // Verify fine payment if required
          if (currentRequest.fine_amount && Number(currentRequest.fine_amount) > 0) {
            if (!body.payment_verified) {
              return NextResponse.json({ error: "Fine payment must be verified before return" }, { status: 400 })
            }
            updateData.fine_paid = true
          }

          // Increase available quantity when returned
          await prisma.libraryItem.update({
            where: { id: currentRequest.item_id },
            data: { available_quantity: { increment: currentRequest.quantity } },
          });
          break

        case "EXPIRED":
          // Mark request as expired (coordinator can manually expire uncollected requests)
          if (currentRequest.status !== "APPROVED") {
            return NextResponse.json({ error: "Can only expire approved requests" }, { status: 400 })
          }
          // Return the reserved quantity back to available inventory
          await prisma.libraryItem.update({
            where: { id: currentRequest.item_id },
            data: { available_quantity: { increment: currentRequest.quantity } },
          });
          break

        case "REJECTED":
          // Coordinator can reject pending or approved requests
          if (currentRequest.status === "APPROVED") {
            // If rejecting an approved request, return the reserved quantity
            await prisma.libraryItem.update({
              where: { id: currentRequest.item_id },
              data: { available_quantity: { increment: currentRequest.quantity } },
            });
          }
          break
      }

      const updatedRequest = await prisma.libraryRequest.update({
        where: { id: requestId },
        data: updateData,
        include: {
          item: { include: { domain: true } },
          student: { include: { user: true } },
          faculty: { include: { user: true } }
        },
      })

      return NextResponse.json({ request: updatedRequest })
    }

    // ADMIN: Full access to all requests
    if (user.role === "ADMIN") {
      let updateData: any = {
        status: body.status,
        faculty_notes: body.faculty_notes || null,
        collection_date: body.status === "COLLECTED" ? new Date() : undefined,
        return_date: body.status === "RETURNED" ? new Date() : undefined,
        due_date: body.status === "COLLECTED" ? (() => {
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 14)
          return dueDate
        })() : undefined,
        fine_paid: body.status === "RETURNED" && body.payment_verified ? true : undefined,
      }

      // Handle inventory changes for admin actions
      switch (body.status) {
        case "APPROVED":
          if (currentRequest.status === "PENDING") {
            // Reserve the quantity by decreasing available_quantity when approved
            await prisma.libraryItem.update({
              where: { id: currentRequest.item_id },
              data: { available_quantity: { decrement: currentRequest.quantity } },
            });
          }
          break

        case "COLLECTED":
          // No quantity change needed - already decremented when approved
          break

        case "RETURNED":
          if (["COLLECTED", "PENDING_RETURN"].includes(currentRequest.status)) {
            // Increase available quantity when returned
            await prisma.libraryItem.update({
              where: { id: currentRequest.item_id },
              data: { available_quantity: { increment: currentRequest.quantity } },
            });
          }
          break

        case "EXPIRED":
          if (currentRequest.status === "APPROVED") {
            // Return the reserved quantity back to available inventory
            await prisma.libraryItem.update({
              where: { id: currentRequest.item_id },
              data: { available_quantity: { increment: currentRequest.quantity } },
            });
          }
          break

        case "REJECTED":
          if (currentRequest.status === "APPROVED") {
            // If rejecting an approved request, return the reserved quantity
            await prisma.libraryItem.update({
              where: { id: currentRequest.item_id },
              data: { available_quantity: { increment: currentRequest.quantity } },
            });
          }
          break
      }

      const updatedRequest = await prisma.libraryRequest.update({
        where: { id: requestId },
        data: updateData,
        include: {
          item: { include: { domain: true } },
          student: { include: { user: true } },
        },
      })

      return NextResponse.json({ request: updatedRequest })
    }

    // Only allow faculty and admin to update requests
    if (user.role !== 'FACULTY' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  } catch (error) {
    console.error("Error updating library request:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentRequest = await prisma.libraryRequest.findUnique({
      where: { id: params.id },
      include: {
        item: true,
        student: {
          include: { user: true }
        },
        faculty: {
          include: { 
            user: true,
            domain_assignments: {
              include: { domain: true }
            }
          }
        }
      }
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'Library request not found' }, { status: 404 })
    }

    // Check authorization - faculty can only see requests for items in their domains
    const faculty = currentRequest.faculty
    const canAccess = faculty ? 
      faculty.domain_assignments.some((assignment: any) => assignment.domain_id === currentRequest.item.domain_id) :
      true // Allow if no faculty assigned yet

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check for overdue items and calculate fines
    if (currentRequest.status === 'COLLECTED' && currentRequest.due_date) {
      const now = new Date()
      const dueDate = new Date(currentRequest.due_date)
      
      if (now > dueDate && !currentRequest.fine_paid) {
        const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        const fineAmount = daysOverdue * 10 // ₹10 per day
        
        // Update the request with fine information
        await prisma.libraryRequest.update({
          where: { id: params.id },
          data: {
            status: 'OVERDUE',
            fine_amount: fineAmount
          }
        })
        
        // Refetch the updated request
        const updatedRequest = await prisma.libraryRequest.findUnique({
          where: { id: params.id },
          include: {
            item: true,
            student: {
              include: { user: true }
            },
            faculty: {
              include: { user: true }
            }
          }
        })
        
        return NextResponse.json(updatedRequest)
      }
    }

    return NextResponse.json(currentRequest)
  } catch (error) {
    console.error('Error fetching library request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch library request' },
      { status: 500 }
    )
  }
}
