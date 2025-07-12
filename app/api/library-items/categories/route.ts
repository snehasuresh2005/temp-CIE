import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get unique categories from existing library items
    const items = await prisma.libraryItem.findMany({
      select: { item_category: true },
      distinct: ['item_category'],
    })
    
    const categories = items.map(i => i.item_category).filter(Boolean)
    
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
    const existingItem = await prisma.libraryItem.findFirst({
      where: { item_category: formattedCategory }
    })
    
    if (existingItem) {
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
    
    // Check if any items are using this category
    const itemsUsingCategory = await prisma.libraryItem.findMany({
      where: { item_category: category },
      select: { 
        id: true, 
        item_name: true,
        item_category: true 
      }
    })
    
    if (itemsUsingCategory.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category. It is currently being used by items.',
          componentsUsing: itemsUsingCategory,
          count: itemsUsingCategory.length
        },
        { status: 409 }
      )
    }
    
    // If no items are using this category, it's safe to "delete"
    // Since categories are stored in item records, there's nothing to actually delete
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