"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

interface UploadResult {
  success: boolean
  total_rows: number
  processed: number
  errors: number
  error_details: string[]
  processed_components: Array<{
    action: 'created' | 'updated'
    component_name: string
    component_tag_id?: string
    quantity?: number
    quantity_added?: number
  }>
}

export default function BulkUploadLabComponents() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Please select a valid CSV file')
        setFile(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setIsUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('csv', file)

      const response = await fetch('/api/lab-components/bulk-upload', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const downloadSampleCSV = () => {
    const csvContent = `component_name,component_description,component_specification,component_quantity,component_tag_id,component_category,component_location,invoice_number,purchase_value,purchased_from,purchase_currency,purchase_date
Arduino Uno R3,Arduino Uno is an open-source microcontroller board based on the ATmega328P,ATmega328P MCU 14 digital I/O pins 6 analog inputs 16 MHz clock speed,10,ARDU001,Electrical,LAB A,INV001,2500.00,Electronics Store,INR,2024-01-15
Raspberry Pi 4 Model B,Single-board computer with quad-core ARM Cortex-A72 processor,Quad-core ARM Cortex-A72 4GB RAM 1.5GHz clock speed,5,RPI001,Computer Hardware,LAB B,INV002,4500.00,Online Store,INR,2024-01-20
Breadboard 830 Points,Prototyping board for electronic circuits,830 connection points 6.5 x 2.1 inches,20,BB001,Electrical,LAB C,INV003,150.00,Local Supplier,INR,2024-01-25`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-lab-components.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bulk Upload Lab Components</h1>
        <Button onClick={downloadSampleCSV} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Sample CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload CSV File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with lab component data. The file should include headers for: component_name, component_description, component_specification, component_quantity, component_tag_id, component_category, component_location, invoice_number, purchase_value, purchased_from, purchase_currency, purchase_date
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Components
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.total_rows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.processed}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {result.processed_components.filter(c => c.action === 'created').length}
                </div>
                <div className="text-sm text-muted-foreground">New Components</div>
              </div>
            </div>

            {result.error_details && result.error_details.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600">Errors:</h3>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.error_details.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.processed_components && result.processed_components.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-green-600">Processed Components:</h3>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.processed_components.map((component, index) => (
                    <div key={index} className="text-sm bg-green-50 p-2 rounded">
                      <span className="font-medium">{component.component_name}</span>
                      {component.component_tag_id && ` (${component.component_tag_id})`} - 
                      <span className="text-green-600"> {component.action}</span>
                      {component.action === 'created' && component.quantity && ` - Quantity: ${component.quantity}`}
                      {component.action === 'updated' && component.quantity_added && ` - Added: ${component.quantity_added}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 