import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserById } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const { status, faculty_notes, collection_date, return_date } = body

    const currentRequest = await prisma.componentRequest.findUnique({
      where: { id: params.id },
      include: {
        component: {
          include: {
            domain: true
          }
        },
        student: { include: { user: true } },
        requesting_faculty: { include: { user: true } }
      }
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Basic permission checks
    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { user_id: userId } })
      if (!student || currentRequest.student_id !== student.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      // Students can request return (PENDING_RETURN) for collected items or confirm return (USER_RETURNED) for pending return items
      if (status === 'PENDING_RETURN' && currentRequest.status !== 'COLLECTED') {
        return NextResponse.json({ error: 'Can only request return for collected items' }, { status: 400 })
      }
      if (status === 'USER_RETURNED' && currentRequest.status !== 'PENDING_RETURN') {
        return NextResponse.json({ error: 'Can only confirm return for pending return requests' }, { status: 400 })
      }
      if (!['PENDING_RETURN', 'USER_RETURNED'].includes(status)) {
        return NextResponse.json({ error: 'Students can only request return or confirm return' }, { status: 400 })
      }
    } else if (user.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { user_id: userId },
        include: { domain_assignments: true }
      })

      if (!faculty) {
        return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 })
      }

      // Allow faculty to request return or confirm return for their own requests
      if (['PENDING_RETURN', 'USER_RETURNED'].includes(status) && currentRequest.faculty_id === faculty.id) {
        if (status === 'PENDING_RETURN' && currentRequest.status !== 'COLLECTED') {
          return NextResponse.json({ error: 'Can only request return for collected items' }, { status: 400 })
        }
        if (status === 'USER_RETURNED' && currentRequest.status !== 'PENDING_RETURN') {
          return NextResponse.json({ error: 'Can only confirm return for pending return requests' }, { status: 400 })
        }
      } else {
        // For other status updates, check if faculty is coordinator of the component's domain
        const isCoordinator = currentRequest.component.domain_id ? 
          faculty.domain_assignments.some(assignment => assignment.domain_id === currentRequest.component.domain_id) : 
          true // Allow access to components without specific domain

        if (!isCoordinator) {
          return NextResponse.json({ error: 'Access denied - Not assigned to this domain' }, { status: 403 })
        }
        
        // Coordinators can only mark as RETURNED when user has confirmed return (USER_RETURNED)
        if (status === 'RETURNED' && currentRequest.status !== 'USER_RETURNED') {
          return NextResponse.json({ error: 'Can only mark as returned after user confirms return' }, { status: 400 })
        }
      }
    } else if (user.role !== "ADMIN") {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Prepare update data
    let updateData: any = {
      status,
      faculty_notes: faculty_notes || currentRequest.faculty_notes
    }

    // Handle status-specific updates
    if (status === 'COLLECTED' && collection_date) {
      updateData.collection_date = new Date(collection_date)
    }

    if (status === 'RETURNED' && return_date) {
      updateData.return_date = new Date(return_date)
    }

    const updatedRequest = await prisma.componentRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        component: true,
        student: { include: { user: true } },
        faculty: { include: { user: true } }
      }
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating component request:', error)
    return NextResponse.json(
      { error: 'Failed to update component request' },
      { status: 500 }
    )
  }
}
