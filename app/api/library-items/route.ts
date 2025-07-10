import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET: List all library items
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain_id = searchParams.get('domain_id')
    
    let whereClause = {}
    if (domain_id) {
      whereClause = { domain_id }
    }

    const items = await prisma.libraryItem.findMany({
      where: whereClause,
      include: {
        domain: true
      },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching library items:', error);
    return NextResponse.json({ error: 'Failed to fetch library items' }, { status: 500 });
  }
}

// POST: Create a new library item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // faculty_id is now optional
    // Safely handle purchase_date and purchase_value
    let purchaseDate = null;
    if (body.purchase_date) {
      const date = new Date(body.purchase_date);
      purchaseDate = isNaN(date.getTime()) ? null : date;
    }
    let purchaseValue = null;
    if (body.purchase_value !== undefined && body.purchase_value !== null && body.purchase_value !== "") {
      const num = Number(body.purchase_value);
      purchaseValue = isNaN(num) ? null : num;
    }
    const item = await prisma.libraryItem.create({
      data: {
        item_name: body.item_name,
        item_description: body.item_description,
        item_category: body.item_category,
        item_quantity: Number(body.item_quantity),
        available_quantity: Number(body.item_quantity),
        item_location: body.item_location,
        item_specification: body.item_specification || '',
        faculty_id: body.faculty_id || null,
        
        invoice_number: body.invoice_number || '',
        purchased_from: body.purchased_from || '',
        purchase_date: purchaseDate,
        purchase_value: purchaseValue !== null ? new Prisma.Decimal(purchaseValue) : undefined,
        purchase_currency: body.purchase_currency || 'INR',
        front_image_id: body.front_image_id || '',
        back_image_id: body.back_image_id || '',
        created_by: body.created_by || 'system',
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error creating library item:', error);
    // In development, return the error message for easier debugging
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}