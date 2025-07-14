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
    
    // Format the category using title case
    const toTitleCase = (str: string) => {
      return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
    }
    
    const formattedCategory = toTitleCase(category.trim())
    
    // Check if category already exists
    const existingComponent = await prisma.labComponent.findFirst({
      where: { component_category: formattedCategory }
    })
    
    if (existingComponent) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 409 }
      )
    }
    
    // Return success with formatted category
    return NextResponse.json({ 
      success: true, 
      category: formattedCategory 
    })
  } catch (error) {
    console.error('Error adding category:', error)
    return NextResponse.json(
      { error: 'Failed to add category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      )
    }
    
    // Check if any components are using this category
    const componentsUsingCategory = await prisma.labComponent.findMany({
      where: { component_category: category },
      select: { 
        id: true, 
        component_name: true,
        component_category: true 
      }
    })
    
    if (componentsUsingCategory.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category. It is currently being used by components.',
          componentsUsing: componentsUsingCategory,
          count: componentsUsingCategory.length
        },
        { status: 409 }
      )
    }
    
    // If no components are using this category, it's safe to "delete"
    // Since categories are stored in component records, there's nothing to actually delete
    // The category will automatically disappear from the unique list
    return NextResponse.json({ 
      success: true, 
      message: 'Category removed successfully' 
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
} 