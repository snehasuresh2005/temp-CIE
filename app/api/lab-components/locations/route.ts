import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get unique locations from existing lab components
    const components = await prisma.labComponent.findMany({
      select: { component_location: true },
      distinct: ['component_location'],
    })
    
    const locations = components.map(c => c.component_location).filter(Boolean)
    
    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { location } = await request.json()
    
    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        { error: 'Location is required and must be a string' },
        { status: 400 }
      )
    }
    
    // Format the location using the same logic as the frontend
    const formatLocation = (str: string) => {
      // Words to always capitalize fully
      const allCaps = ["lab", "rack", "room"]
      return str
        .split(/\s+/)
        .map((word) => {
          if (allCaps.includes(word.toLowerCase())) return word.toUpperCase()
          // Zero-pad numbers
          if (/^\d+$/.test(word)) return word.padStart(2, "0")
          // Title case for other words
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join(" ")
    }
    
    const formattedLocation = formatLocation(location.trim())
    
    // Check if location already exists
    const existingComponent = await prisma.labComponent.findFirst({
      where: { component_location: formattedLocation }
    })
    
    if (existingComponent) {
      return NextResponse.json(
        { error: 'Location already exists' },
        { status: 409 }
      )
    }
    
    // Return success with formatted location
    return NextResponse.json({ 
      success: true, 
      location: formattedLocation 
    })
  } catch (error) {
    console.error('Error adding location:', error)
    return NextResponse.json(
      { error: 'Failed to add location' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      )
    }
    
    // Check if any components are using this location
    const componentsUsingLocation = await prisma.labComponent.findMany({
      where: { component_location: location },
      select: { 
        id: true, 
        component_name: true,
        component_location: true 
      }
    })
    
    if (componentsUsingLocation.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete location. It is currently being used by components.',
          componentsUsing: componentsUsingLocation,
          count: componentsUsingLocation.length
        },
        { status: 409 }
      )
    }
    
    // If no components are using this location, it's safe to "delete"
    // Since locations are stored in component records, there's nothing to actually delete
    // The location will automatically disappear from the unique list
    return NextResponse.json({ 
      success: true, 
      message: 'Location removed successfully' 
    })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}