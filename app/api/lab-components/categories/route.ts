import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get unique categories from existing lab components
    const components = await prisma.labComponent.findMany({
      select: { component_category: true },
      distinct: ['component_category'],
    })
    
    const categories = components.map(c => c.component_category).filter(Boolean)
    
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json()
    
    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'Category is required and must be a string' },
        { status: 400 }
      )
    }
    
    // For now, we'll just return success since categories are stored in the component records
    // In a real app, you might want a separate categories table
    return NextResponse.json({ 
      success: true, 
      category: category.trim() 
    })
  } catch (error) {
    console.error('Error adding category:', error)
    return NextResponse.json(
      { error: 'Failed to add category' },
      { status: 500 }
    )
  }
} 