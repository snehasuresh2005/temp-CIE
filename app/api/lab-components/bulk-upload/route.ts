import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import csv from 'csv-parser'
import { Readable } from 'stream'
import { prisma } from '@/lib/prisma'
import { getUserById } from '@/lib/auth'

interface LabComponentCSV {
  component_name: string
  component_description: string
  component_specification?: string
  component_quantity: string
  component_tag_id?: string
  component_category: string
  component_location: string
  invoice_number?: string
  purchase_value?: string
  purchased_from?: string
  purchase_currency?: string
  purchase_date?: string
  front_image_id?: string
  back_image_id?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || (user.role !== "ADMIN" && user.role !== "FACULTY")) {
      return NextResponse.json({ error: "Access denied - Admin/Faculty only" }, { status: 403 })
    }

    // Parse FormData
    let formData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error('FormData parsing error:', error)
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }
    
    const file = formData.get('csv') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No CSV file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Read the CSV file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const csvContent = buffer.toString('utf-8')

    // Parse CSV content
    const results: LabComponentCSV[] = []
    const parser = csv()

    return new Promise((resolve) => {
      const stream = Readable.from(csvContent)
      
      stream.pipe(parser)
        .on('data', (data: LabComponentCSV) => {
          results.push(data)
        })
        .on('end', async () => {
          try {
            if (results.length === 0) {
              resolve(NextResponse.json({ error: 'No valid data found in CSV' }, { status: 400 }))
              return
            }

            // Validate and process each row
            const processedComponents = []
            const errors = []

            for (let i = 0; i < results.length; i++) {
              const row = results[i]
              const rowNumber = i + 2 // +2 because CSV has header and arrays are 0-indexed

              try {
                // Validate required fields
                if (!row.component_name?.trim()) {
                  errors.push(`Row ${rowNumber}: component_name is required`)
                  continue
                }

                if (!row.component_description?.trim()) {
                  errors.push(`Row ${rowNumber}: component_description is required`)
                  continue
                }

                if (!row.component_quantity?.trim()) {
                  errors.push(`Row ${rowNumber}: component_quantity is required`)
                  continue
                }

                if (!row.component_category?.trim()) {
                  errors.push(`Row ${rowNumber}: component_category is required`)
                  continue
                }

                if (!row.component_location?.trim()) {
                  errors.push(`Row ${rowNumber}: component_location is required`)
                  continue
                }

                // Parse quantity
                const quantity = parseInt(row.component_quantity)
                if (isNaN(quantity) || quantity < 0) {
                  errors.push(`Row ${rowNumber}: component_quantity must be a positive number`)
                  continue
                }

                // Parse purchase value if provided
                let purchaseValue = null
                if (row.purchase_value?.trim()) {
                  const parsedValue = parseFloat(row.purchase_value)
                  if (isNaN(parsedValue) || parsedValue < 0) {
                    errors.push(`Row ${rowNumber}: purchase_value must be a positive number`)
                    continue
                  }
                  purchaseValue = parsedValue
                }

                // Parse purchase date if provided
                let purchaseDate = null
                if (row.purchase_date?.trim()) {
                  const parsedDate = new Date(row.purchase_date)
                  if (isNaN(parsedDate.getTime())) {
                    errors.push(`Row ${rowNumber}: purchase_date must be a valid date`)
                    continue
                  }
                  purchaseDate = parsedDate
                }

                // Check if component already exists by name and tag_id
                const existingComponent = await prisma.labComponent.findFirst({
                  where: {
                    component_name: row.component_name.trim(),
                    component_tag_id: row.component_tag_id?.trim() || null
                  }
                })

                if (existingComponent) {
                  // Update existing component quantity
                  await prisma.labComponent.update({
                    where: { id: existingComponent.id },
                    data: {
                      component_quantity: existingComponent.component_quantity + quantity,
                      modified_by: userId,
                      modified_at: new Date()
                    }
                  })
                  processedComponents.push({
                    action: 'updated',
                    component_name: row.component_name,
                    component_tag_id: row.component_tag_id,
                    quantity_added: quantity
                  })
                } else {
                  // Create new component
                  await prisma.labComponent.create({
                    data: {
                      component_name: row.component_name.trim(),
                      component_description: row.component_description.trim(),
                      component_specification: row.component_specification?.trim() || null,
                      component_quantity: quantity,
                      component_tag_id: row.component_tag_id?.trim() || null,
                      component_category: row.component_category.trim(),
                      component_location: row.component_location.trim(),
                      invoice_number: row.invoice_number?.trim() || null,
                      purchase_value: purchaseValue,
                      purchased_from: row.purchased_from?.trim() || null,
                      purchase_currency: row.purchase_currency?.trim() || 'INR',
                      purchase_date: purchaseDate,
                      front_image_id: row.front_image_id?.trim() || null,
                      back_image_id: row.back_image_id?.trim() || null,
                      created_by: userId
                    }
                  })
                  processedComponents.push({
                    action: 'created',
                    component_name: row.component_name,
                    component_tag_id: row.component_tag_id,
                    quantity: quantity
                  })
                }

              } catch (error) {
                console.error(`Error processing row ${rowNumber}:`, error)
                errors.push(`Row ${rowNumber}: Processing error - ${error instanceof Error ? error.message : 'Unknown error'}`)
              }
            }

            // Return results
            const response = {
              success: true,
              total_rows: results.length,
              processed: processedComponents.length,
              errors: errors.length,
              error_details: errors,
              processed_components: processedComponents
            }

            resolve(NextResponse.json(response))

          } catch (error) {
            console.error('Bulk upload error:', error)
            resolve(NextResponse.json({ 
              error: "Internal server error",
              details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 }))
          }
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error)
          resolve(NextResponse.json({ 
            error: "CSV parsing error",
            details: error.message 
          }, { status: 400 }))
        })
    })

  } catch (error) {
    console.error("Bulk upload error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 