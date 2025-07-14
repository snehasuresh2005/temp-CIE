import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get unique location types from existing locations
    const locations = await prisma.location.findMany({
      select: { location_type: true },
      distinct: ['location_type'],
    })
    
    const types = locations.map(l => l.location_type).filter(Boolean)
    
    return NextResponse.json({ types })
  } catch (error) {
    console.error('Error fetching location types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()
    
    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: 'Location type is required and must be a string' },
        { status: 400 }
      )
    }
    
    // Format the type using title case and convert to uppercase for enum
    const toTitleCase = (str: string) => {
      return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
    }
    
    const formattedType = toTitleCase(type.trim()).toUpperCase().replace(/\s+/g, '_')
    
    // Check if type already exists
    const existingLocation = await prisma.location.findFirst({
      where: { location_type: formattedType as any }
    })
    
    if (existingLocation) {
      return NextResponse.json(
        { error: 'Location type already exists' },
        { status: 409 }
      )
    }
    
    // Return success with formatted type
    return NextResponse.json({ 
      success: true, 
      type: formattedType 
    })
  } catch (error) {
    console.error('Error adding location type:', error)
    return NextResponse.json(
      { error: 'Failed to add location type' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    if (!type) {
      return NextResponse.json(
        { error: 'Location type parameter is required' },
        { status: 400 }
      )
    }
    
    // Check if any locations are using this type
    const locationsUsingType = await prisma.location.findMany({
      where: { location_type: type as any },
      select: { 
        id: true, 
        name: true,
        location_type: true 
      }
    })
    
    if (locationsUsingType.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete location type. It is currently being used by locations.',
          componentsUsing: locationsUsingType,
          count: locationsUsingType.length
        },
        { status: 409 }
      )
    }
    
    // If no locations are using this type, it's safe to "delete"
    // Since types are stored in location records, there's nothing to actually delete
    // The type will automatically disappear from the unique list
    return NextResponse.json({ 
      success: true, 
      message: 'Location type removed successfully' 
    })
  } catch (error) {
    console.error('Error deleting location type:', error)
    return NextResponse.json(
      { error: 'Failed to delete location type' },
      { status: 500 }
    )
  }
} 