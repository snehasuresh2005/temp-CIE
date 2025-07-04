"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Package, Trash2, RefreshCw, Edit, ChevronRight, ChevronLeft, Info, Receipt, History, Image, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LabComponent {
  id: string
  component_name: string
  component_description: string
  component_specification?: string
  component_quantity: number
  component_tag_id?: string
  component_category: string
  component_location: string
  image_path: string
  front_image_id?: string
  back_image_id?: string
  invoice_number?: string
  purchase_value?: number | string
  purchased_from?: string
  purchase_currency: string
  purchase_date?: string
  created_by: string
  created_at: string
  modified_at: string
  modified_by?: string
  // Computed fields for display
  imageUrl?: string | null
  backImageUrl?: string | null
  availableQuantity?: number
}

// Utility functions for formatting
function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

function formatLocation(str: string) {
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

export function ManageLabComponents() {
  const [components, setComponents] = useState<LabComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [componentToDelete, setComponentToDelete] = useState<LabComponent | null>(null)
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)
  const [componentToView, setComponentToView] = useState<LabComponent | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const [newComponent, setNewComponent] = useState({
    component_name: "",
    component_description: "",
    component_category: "",
    component_quantity: 1,
    component_location: "",
    component_specification: "",
    component_tag_id: "",
    invoice_number: "",
    purchased_from: "",
    purchase_date: "",
    purchase_value: "",
    purchase_currency: "INR"
  })

  const [frontImageFile, setFrontImageFile] = useState<File | null>(null)
  const [backImageFile, setBackImageFile] = useState<File | null>(null)
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null)
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<string[]>(["Electrical"])
  const [newCategory, setNewCategory] = useState("")
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [newLocation, setNewLocation] = useState("")
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [locationOptions, setLocationOptions] = useState<string[]>(["Lab A", "Lab B", "Lab C", "Storage Room", "Equipment Room"])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<LabComponent | null>(null)
  const [imageStates, setImageStates] = useState<Record<string, boolean>>({}) // false = front, true = back

  // Add form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Bulk upload state
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false)
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null)
  const [isBulkUploading, setIsBulkUploading] = useState(false)
  const [bulkUploadResult, setBulkUploadResult] = useState<any>(null)

  useEffect(() => {
    fetchComponents()
    fetchCategories()
  }, [])

  // Debug user information
  useEffect(() => {
    console.log("ManageLabComponents - Current user:", user)
    console.log("ManageLabComponents - User ID:", user?.id)
    console.log("ManageLabComponents - User name:", user?.name)
    console.log("ManageLabComponents - User role:", user?.role)
  }, [user])

  const fetchComponents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/lab-components")
      const data = await response.json()
      setComponents(data.components || [])
    } catch (error) {
      console.error("Error fetching components:", error)
      toast({
        title: "Error",
        description: "Failed to load lab components",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const defaultCategories = ["Electrical"]

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/lab-components/categories");
      if (res.ok) {
        const data = await res.json();
        // Merge, dedupe, and format
        const merged = Array.from(
          new Set([
            ...defaultCategories,
            ...(data.categories || [])
          ].map(toTitleCase))
        );
        setCategoryOptions(merged);
      }
    } catch (e) {
      setCategoryOptions(defaultCategories);
    }
  };

  const filteredComponents = components.filter(
    (component) =>
      (component.component_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (component.component_category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (component.component_location?.toLowerCase() || '').includes(searchTerm.toLowerCase()),
  )

  const handleAddComponent = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      })
      return
    }

    // If Tag ID is empty, check for duplicate
    if (!newComponent.component_tag_id) {
      const formattedCategory = toTitleCase(newComponent.component_category)
      const formattedLocation = formatLocation(newComponent.component_location)
      const existing = components.find(
        c =>
          (c.component_name?.trim().toLowerCase() || '') === (newComponent.component_name?.trim().toLowerCase() || '') &&
          (c.component_category?.trim().toLowerCase() || '') === (formattedCategory?.trim().toLowerCase() || '') &&
          (c.component_location?.trim().toLowerCase() || '') === (formattedLocation?.trim().toLowerCase() || '')
      )
      if (existing) {
        if (!window.confirm("This item already exists. The quantity you add will be added to the existing one. Continue?")) {
          return
        }
        // Simulate updating the quantity in the frontend (no backend yet)
        setComponents(prev =>
          prev.map(c =>
            c.id === existing.id
              ? { ...c, component_quantity: c.component_quantity + newComponent.component_quantity, availableQuantity: (c.availableQuantity || 0) + newComponent.component_quantity }
              : c
          )
        )
        toast({
          title: "Quantity Updated",
          description: "The quantity has been added to the existing component.",
        })
        // Reset form
        resetForm()
        setIsAddDialogOpen(false)
        return
      }
    }

    let frontImageUrl = undefined
    let backImageUrl = undefined

    // Upload front image
    if (frontImageFile) {
      const formData = new FormData()
      formData.append('image', frontImageFile)
      const uploadRes = await fetch('/api/lab-components/upload', {
        method: 'POST',
        body: formData,
      })
      if (uploadRes.ok) {
        const data = await uploadRes.json()
        frontImageUrl = data.imageUrl.split('/').pop() // Get file name from URL
      } else {
        toast({
          title: "Error",
          description: "Front image upload failed",
          variant: "destructive",
        })
        return
      }
    }

    // Upload back image
    if (backImageFile) {
      const formData = new FormData()
      formData.append('image', backImageFile)
      const uploadRes = await fetch('/api/lab-components/upload', {
        method: 'POST',
        body: formData,
      })
      if (uploadRes.ok) {
        const data = await uploadRes.json()
        backImageUrl = data.imageUrl.split('/').pop() // Get file name from URL
      } else {
        toast({
          title: "Error",
          description: "Back image upload failed",
          variant: "destructive",
        })
        return
      }
    }

    // Format category and location before sending
    const formattedCategory = toTitleCase(newComponent.component_category)
    const formattedLocation = formatLocation(newComponent.component_location)

    console.log("Frontend - handleAddComponent - user object:", user)
    console.log("Frontend - handleAddComponent - user.id:", user?.id)
    console.log("Frontend - handleAddComponent - user.name:", user?.name)

    try {
      const response = await fetch("/api/lab-components", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          ...newComponent,
          component_category: formattedCategory,
          component_location: formattedLocation,
          front_image_id: frontImageUrl,
          back_image_id: backImageUrl,
          created_by: user?.name || "system-fallback"
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComponents((prev) => [...prev, data.component])
        
        // Reset form
        resetForm()
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Lab component added successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add component")
      }
    } catch (error) {
      console.error("Error adding component:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add component",
        variant: "destructive",
      })
    }
  }

  const handleDeleteComponent = async (componentId: string) => {
    if (!window.confirm("Are you sure you want to delete this component? This will also delete all related component requests.")) {
      return
    }

    try {
      const response = await fetch(`/api/lab-components/${componentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setComponents((prev) => prev.filter((component) => component.id !== componentId))
        toast({
          title: "Success",
          description: "Component and all related requests deleted successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete component")
      }
    } catch (error) {
      console.error("Error deleting component:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete component",
        variant: "destructive",
      })
    }
  }

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage === 0) return "bg-red-100 text-red-800"
    if (percentage < 30) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getAvailabilityText = (available: number, total: number) => {
    if (available === 0) return "Out of Stock"
    if (available < total * 0.3) return "Low Stock"
    return "Available"
  }

  // Image preview handlers
  useEffect(() => {
    if (frontImageFile) {
      const reader = new FileReader()
      reader.onload = (e) => setFrontImagePreview(e.target?.result as string)
      reader.readAsDataURL(frontImageFile)
    } else {
      setFrontImagePreview(null)
    }
  }, [frontImageFile])

  useEffect(() => {
    if (backImageFile) {
      const reader = new FileReader()
      reader.onload = (e) => setBackImagePreview(e.target?.result as string)
      reader.readAsDataURL(backImageFile)
    } else {
      setBackImagePreview(null)
    }
  }, [backImageFile])

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    setIsSavingCategory(true)
    try {
      const formatted = toTitleCase(newCategory.trim())
      // Save new category to backend
      const res = await fetch("/api/lab-components/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: formatted })
      })
      if (res.ok) {
        setCategoryOptions((prev) => [...prev, formatted])
        setNewComponent((prev) => ({ ...prev, component_category: formatted }))
        setNewCategory("")
        toast({ title: "Category added!", description: "New category added successfully." })
      } else {
        toast({ title: "Error", description: "Failed to add category.", variant: "destructive" })
      }
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return
    setIsSavingLocation(true)
    try {
      const formatted = formatLocation(newLocation.trim())
      setLocationOptions((prev) => [...prev, formatted])
      setNewComponent((prev) => ({ ...prev, component_location: formatted }))
      setNewLocation("")
      toast({ title: "Location added!", description: "New location added successfully." })
    } finally {
      setIsSavingLocation(false)
    }
  }

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Required fields validation
    if (!newComponent.component_name?.trim()) {
      errors.component_name = "Component name is required"
    }

    if (!newComponent.component_description?.trim()) {
      errors.component_description = "Description is required"
    }

    if (!newComponent.component_category?.trim()) {
      errors.component_category = "Category is required"
    }

    if (!newComponent.component_location?.trim()) {
      errors.component_location = "Location is required"
    }

    if (newComponent.component_quantity <= 0) {
      errors.component_quantity = "Quantity must be greater than 0"
    }

    if (!frontImageFile) {
      errors.frontImage = "Front image is required"
    }

    if (!backImageFile) {
      errors.backImage = "Back image is required"
    }

    // Purchase details validation (optional but if one is filled, others should be too)
    const hasPurchaseDetails = newComponent.invoice_number || newComponent.purchased_from || newComponent.purchase_date || newComponent.purchase_value
    
    if (hasPurchaseDetails) {
      if (!newComponent.invoice_number?.trim()) {
        errors.invoice_number = "Invoice number is required when purchase details are provided"
      }
      if (!newComponent.purchased_from?.trim()) {
        errors.purchased_from = "Vendor/supplier is required when purchase details are provided"
      }
      if (!newComponent.purchase_date) {
        errors.purchase_date = "Purchase date is required when purchase details are provided"
      }
      if (!newComponent.purchase_value || Number(newComponent.purchase_value) <= 0) {
        errors.purchase_value = "Valid purchase value is required when purchase details are provided"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Check if form is valid for button state
  const isAddFormValid = () => {
    return (
      newComponent.component_name?.trim() &&
      newComponent.component_description?.trim() &&
      newComponent.component_category?.trim() &&
      newComponent.component_location?.trim() &&
      newComponent.component_quantity > 0 &&
      frontImageFile &&
      backImageFile
    )
  }

  const handleEditComponent = async () => {
    if (!editingComponent) return
    
    if (!editingComponent.component_name || !editingComponent.component_category || !editingComponent.component_location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    let frontImageId = editingComponent.front_image_id
    let backImageId = editingComponent.back_image_id

    // Upload front image if changed
    if (frontImageFile) {
      const formData = new FormData()
      formData.append('image', frontImageFile)
      const uploadRes = await fetch('/api/lab-components/upload', {
        method: 'POST',
        body: formData,
      })
      if (uploadRes.ok) {
        const data = await uploadRes.json()
        frontImageId = data.imageUrl.split('/').pop() // Get file name from URL
      } else {
        toast({
          title: "Error",
          description: "Front image upload failed",
          variant: "destructive",
        })
        return
      }
    }

    // Upload back image if changed
    if (backImageFile) {
      const formData = new FormData()
      formData.append('image', backImageFile)
      const uploadRes = await fetch('/api/lab-components/upload', {
        method: 'POST',
        body: formData,
      })
      if (uploadRes.ok) {
        const data = await uploadRes.json()
        backImageId = data.imageUrl.split('/').pop() // Get file name from URL
      } else {
        toast({
          title: "Error",
          description: "Back image upload failed",
          variant: "destructive",
        })
        return
      }
    }

    console.log("Frontend - handleEditComponent - user object:", user)
    console.log("Frontend - handleEditComponent - user.id:", user?.id)
    console.log("Frontend - handleEditComponent - user.name:", user?.name)

    try {
      const response = await fetch(`/api/lab-components/${editingComponent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          ...editingComponent,
          front_image_id: frontImageId,
          back_image_id: backImageId,
          modified_by: user?.name || "system-fallback",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComponents((prev) => 
          prev.map((c) => (c.id === editingComponent.id ? data.component : c))
        )
        
        // Reset form
        setEditingComponent(null)
        setFrontImageFile(null)
        setBackImageFile(null)
        setFrontImagePreview(null)
        setBackImagePreview(null)
        setIsEditDialogOpen(false)

        toast({
          title: "Success",
          description: "Lab component updated successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update component")
      }
    } catch (error) {
      console.error("Error updating component:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update component",
        variant: "destructive",
      })
    }
  }

  const isEditFormValid =
    !!editingComponent &&
    editingComponent.component_name.trim() !== "" &&
    editingComponent.component_category.trim() !== "" &&
    editingComponent.component_location.trim() !== ""

  // Reset form and errors
  const resetForm = () => {
    setNewComponent({
      component_name: "",
      component_description: "",
      component_category: "",
      component_quantity: 1,
      component_location: "",
      component_specification: "",
      component_tag_id: "",
      invoice_number: "",
      purchased_from: "",
      purchase_date: "",
      purchase_value: "",
      purchase_currency: "INR"
    })
    setFrontImageFile(null)
    setBackImageFile(null)
    setFrontImagePreview(null)
    setBackImagePreview(null)
    setFormErrors({})
    setShowAddCategory(false)
    setShowAddLocation(false)
    setNewCategory("")
    setNewLocation("")
  }

  // Bulk upload functions
  const handleBulkUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setBulkUploadFile(file)
        console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type)
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a valid CSV file",
          variant: "destructive",
        })
        setBulkUploadFile(null)
      }
    } else {
      setBulkUploadFile(null)
    }
  }

  const handleBulkUpload = async () => {
    if (!bulkUploadFile || !user) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      })
      return
    }

    // Additional validation
    if (bulkUploadFile.size === 0) {
      toast({
        title: "Empty File",
        description: "The selected file is empty",
        variant: "destructive",
      })
      return
    }

    console.log('Uploading file:', bulkUploadFile.name, 'Size:', bulkUploadFile.size, 'Type:', bulkUploadFile.type)

    setIsBulkUploading(true)
    setBulkUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('csv', bulkUploadFile)

      const response = await fetch('/api/lab-components/bulk-upload', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
        },
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setBulkUploadResult(result)
        toast({
          title: "Bulk Upload Successful",
          description: `Processed ${result.processed} components with ${result.errors} errors`,
        })
        // Refresh the components list
        fetchComponents()
        setIsBulkUploadDialogOpen(false)
        // Reset the file input
        setBulkUploadFile(null)
      } else {
        toast({
          title: "Bulk Upload Failed",
          description: result.error || 'Upload failed',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Bulk upload error:', error)
      toast({
        title: "Bulk Upload Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setIsBulkUploading(false)
    }
  }

  const downloadSampleCSV = () => {
    const csvContent = `component_name,component_description,component_specification,component_quantity,component_tag_id,component_category,component_location,invoice_number,purchase_value,purchased_from,purchase_currency,purchase_date,front_image_id,back_image_id
"Arduino Uno R3","Arduino Uno is an open-source microcontroller board based on the ATmega328P, designed for building interactive electronics projects with ease.","ATmega328P MCU, 14 digital I/O pins, 6 analog inputs, 16 MHz clock speed, USB-powered, 5V operating voltage.",10,445RO,Electrical,"LAB C",inv2233444,300,amazon,INR,2025-06-10,"1751346972100_arduino -front.jpg","1751346972405_arduino-back.jpg"
"NodeMCU","NodeMCU ESP8266 is a low-power, Wi-Fi-enabled microcontroller board ideal for IoT applications, offering GPIOs, serial communication, and easy programming via USB.","ESP8266 Wi-Fi SoC, 80 MHz clock, 4MB flash, 11 digital GPIOs, USB-to-serial, operates at 3.3V logic.",8,ESP8266,Electrical,"Storage ROOM",invc223387,120,Flipcart,INR,2025-06-06,"1750845469301_WhatsApp Image 2025-06-19 at 21.50.45.jpeg","1750845469275_WhatsApp Image 2025-06-19 at 21.50.39.jpeg"
"Breadboard","High-quality breadboard for electronic prototyping and circuit testing.","830 tie points, 65 rows, 2 power rails, 0.1 inch spacing, compatible with Arduino and other microcontrollers.",5,BRD001,Electrical,"LAB C",inv2025001,50,amazon,INR,2025-01-15,"1751347927009_breadboard-front.jpg","1751347927531_breadboard-back.jpg"`

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading lab components...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">Lab Components Management</h3>
        </div>

        <div className="flex space-x-2">
          <Button onClick={fetchComponents} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Dialog open={isBulkUploadDialogOpen} onOpenChange={(open) => {
            setIsBulkUploadDialogOpen(open)
            if (!open) {
              // Reset bulk upload state when dialog closes
              setBulkUploadFile(null)
              setBulkUploadResult(null)
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Upload Lab Components</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to add multiple lab components at once.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUploadFileChange}
                    disabled={isBulkUploading}
                  />
                  {bulkUploadFile && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ File selected: {bulkUploadFile.name} ({(bulkUploadFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    The CSV should include headers for: component_name, component_description, component_specification, component_quantity, component_tag_id, component_category, component_location, invoice_number, purchase_value, purchased_from, purchase_currency, purchase_date, front_image_id, back_image_id
                  </p>
                </div>
                <Button onClick={downloadSampleCSV} variant="outline" size="sm">
                  Download Sample CSV
                </Button>
                {bulkUploadResult && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Upload Results:</h4>
                    <div className="text-sm space-y-1">
                      <div>Total Rows: {bulkUploadResult.total_rows}</div>
                      <div>Processed: {bulkUploadResult.processed}</div>
                      <div>Errors: {bulkUploadResult.errors}</div>
                    </div>
                    {bulkUploadResult.error_details && bulkUploadResult.error_details.length > 0 && (
                      <div className="max-h-20 overflow-y-auto text-xs text-red-600">
                        {bulkUploadResult.error_details.map((error: string, index: number) => (
                          <div key={index}>{error}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleBulkUpload}
                  disabled={!bulkUploadFile || isBulkUploading}
                >
                  {isBulkUploading ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Lab Component</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 w-fill">
                {/* Basic Details Row - Name and Quantity */}
                <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-4">
                  <div className="flex-1">
                    <Label htmlFor="name" className="text-sm font-medium">Component Name *</Label>
                    <Input
                      id="name"
                      value={newComponent.component_name}
                      onChange={(e) => setNewComponent((prev) => ({ ...prev, component_name: e.target.value }))}
                      placeholder="Arduino Uno R3"
                      className={`mt-1 w-full h-9 text-sm ${formErrors.component_name ? 'border-red-500' : ''}`}
                    />
                    {formErrors.component_name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.component_name}</p>
                    )}
                  </div>
                  <div className="flex flex-col justify-center w-40 md:w-48">
                    <Label htmlFor="quantity" className="text-sm font-medium">Total Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newComponent.component_quantity}
                      onChange={(e) => setNewComponent((prev) => ({ ...prev, component_quantity: Number.parseInt(e.target.value) }))}
                      min="1"
                      className={`mt-1 w-full h-9 text-sm ${formErrors.component_quantity ? 'border-red-500' : ''}`}
                    />
                    {formErrors.component_quantity && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.component_quantity}</p>
                    )}
                  </div>
                </div>
                {/* Basic Details Row - Location, Tag ID, Category */}
                <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-4">
                  <div className="flex-1 min-w-[180px] md:min-w-[220px]">
                    <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
                    <Select
                      open={showAddLocation || undefined}
                      value={newComponent.component_location}
                      onValueChange={(value) => {
                        if (value === '__add_new_location__') {
                          setShowAddLocation(true)
                        } else {
                          setNewComponent((prev) => ({ ...prev, component_location: value }))
                          setShowAddLocation(false)
                        }
                      }}
                    >
                      <SelectTrigger className={`mt-1 ${formErrors.component_location ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locationOptions.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                        <SelectItem value="__add_new_location__" className="text-blue-600">+ Add new location…</SelectItem>
                        {showAddLocation && (
                          <div className="flex items-center gap-2 px-2 py-2 bg-gray-50 border-t">
                            <Input
                              value={newLocation}
                              onChange={e => setNewLocation(e.target.value)}
                              placeholder="Enter new location name"
                              className="flex-1 h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={async () => {
                                await handleAddLocation();
                                setShowAddLocation(false);
                              }}
                              disabled={isSavingLocation || !newLocation.trim()}
                              className="px-3"
                            >
                              {isSavingLocation ? "Adding..." : "Add"}
                            </Button>
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {formErrors.component_location && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.component_location}</p>
                    )}
                  </div>
                  <div className="flex-1 min-w-[180px] md:min-w-[220px]">
                    <Label htmlFor="tagId" className="text-sm font-medium">Tag ID (optional)</Label>
                    <Input
                      id="tagId"
                      value={newComponent.component_tag_id}
                      onChange={e => setNewComponent((prev) => ({ ...prev, component_tag_id: e.target.value }))}
                      placeholder="e.g. 123-XYZ"
                      className="mt-1 w-full h-9 text-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px] md:min-w-[220px]">
                    <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                    <Select
                      open={showAddCategory || undefined}
                      value={newComponent.component_category}
                      onValueChange={(value) => {
                        if (value === '__add_new__') {
                          setShowAddCategory(true)
                        } else {
                          setNewComponent((prev) => ({ ...prev, component_category: value }))
                          setShowAddCategory(false)
                        }
                      }}
                    >
                      <SelectTrigger className={`mt-1 ${formErrors.component_category ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="__add_new__" className="text-blue-600">+ Add new category…</SelectItem>
                        {showAddCategory && (
                          <div className="flex items-center gap-2 px-2 py-2 bg-gray-50 border-t">
                            <Input
                              value={newCategory}
                              onChange={e => setNewCategory(e.target.value)}
                              placeholder="Enter new category name"
                              className="flex-1 h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={async () => {
                                await handleAddCategory();
                                setShowAddCategory(false);
                              }}
                              disabled={isSavingCategory || !newCategory.trim()}
                              className="px-3"
                            >
                              {isSavingCategory ? "Adding..." : "Add"}
                            </Button>
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {formErrors.component_category && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.component_category}</p>
                    )}
                  </div>
                </div>

                {/* Image Upload Section with Gen Button */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Component Images</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="h-8"
                    >
                      gen
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="frontImage" className="text-sm font-medium">Front Image *</Label>
                      <div className={`border-2 border-dashed rounded-lg h-10 p-1 flex items-center hover:border-gray-400 transition-colors ${formErrors.frontImage ? 'border-red-500' : 'border-gray-300'}`}> 
                        <Input
                          id="frontImage"
                          type="file"
                          accept="image/*"
                          onChange={e => setFrontImageFile(e.target.files?.[0] || null)}
                          className="border-0 p-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      {formErrors.frontImage && (
                        <p className="text-red-500 text-xs">{formErrors.frontImage}</p>
                      )}
                      {frontImagePreview && (
                        <div className="mt-2">
                          <Label className="text-xs font-medium text-gray-600">Preview:</Label>
                          <img
                            src={frontImagePreview}
                            alt="Front Preview"
                            className="mt-1 w-full h-64 object-contain rounded-lg bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="backImage" className="text-sm font-medium">Back Image *</Label>
                      <div className={`border-2 border-dashed rounded-lg h-10 p-1 flex items-center hover:border-gray-400 transition-colors ${formErrors.backImage ? 'border-red-500' : 'border-gray-300'}`}> 
                        <Input
                          id="backImage"
                          type="file"
                          accept="image/*"
                          onChange={e => setBackImageFile(e.target.files?.[0] || null)}
                          className="border-0 p-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      {formErrors.backImage && (
                        <p className="text-red-500 text-xs">{formErrors.backImage}</p>
                      )}
                      {backImagePreview && (
                        <div className="mt-2">
                          <Label className="text-xs font-medium text-gray-600">Preview:</Label>
                          <img
                            src={backImagePreview}
                            alt="Back Preview"
                            className="mt-1 w-full h-64 object-contain rounded-lg bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description and Specifications Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
                    <Textarea
                      id="description"
                      value={newComponent.component_description}
                      onChange={(e) => setNewComponent((prev) => ({ ...prev, component_description: e.target.value }))}
                      placeholder="Provide a detailed description of the component..."
                      rows={4}
                      className={`mt-0 ${formErrors.component_description ? 'border-red-500' : ''}`}
                    />
                    {formErrors.component_description && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.component_description}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="specifications" className="text-sm font-medium">Specifications</Label>
                    <Textarea
                      id="specifications"
                      value={newComponent.component_specification}
                      onChange={(e) => setNewComponent((prev) => ({ ...prev, component_specification: e.target.value }))}
                      placeholder="Technical specifications, dimensions, power requirements, etc."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Purchase Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Purchase Details (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceNumber" className="text-sm font-medium">Invoice Number</Label>
                      <Input
                        id="invoiceNumber"
                        value={newComponent.invoice_number}
                        onChange={(e) => setNewComponent((prev) => ({ ...prev, invoice_number: e.target.value }))}
                        placeholder="INV-2025-001"
                        className={`mt-1 ${formErrors.invoice_number ? 'border-red-500' : ''}`}
                      />
                      {formErrors.invoice_number && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.invoice_number}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="purchasedFrom" className="text-sm font-medium">Purchased From</Label>
                      <Input
                        id="purchasedFrom"
                        value={newComponent.purchased_from}
                        onChange={(e) => setNewComponent((prev) => ({ ...prev, purchased_from: e.target.value }))}
                        placeholder="Vendor/Supplier Name"
                        className={`mt-1 ${formErrors.purchased_from ? 'border-red-500' : ''}`}
                      />
                      {formErrors.purchased_from && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.purchased_from}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="purchasedDate" className="text-sm font-medium">Purchase Date</Label>
                      <Input
                        id="purchasedDate"
                        type="date"
                        value={newComponent.purchase_date}
                        onChange={(e) => setNewComponent((prev) => ({ ...prev, purchase_date: e.target.value }))}
                        className={`mt-1 ${formErrors.purchase_date ? 'border-red-500' : ''}`}
                      />
                      {formErrors.purchase_date && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.purchase_date}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="purchasedValue" className="text-sm font-medium">Purchase Value</Label>
                      <Input
                        id="purchasedValue"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newComponent.purchase_value}
                        onChange={(e) => setNewComponent((prev) => ({ ...prev, purchase_value: e.target.value }))}
                        placeholder="0.00"
                        className={`mt-1 ${formErrors.purchase_value ? 'border-red-500' : ''}`}
                      />
                      {formErrors.purchase_value && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.purchase_value}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="purchasedCurrency" className="text-sm font-medium">Currency</Label>
                      <Select
                        value={newComponent.purchase_currency}
                        onValueChange={(value) => setNewComponent((prev) => ({ ...prev, purchase_currency: value }))}
                      >
                        <SelectTrigger className={`mt-1 ${formErrors.purchase_currency ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.purchase_currency && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.purchase_currency}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0}>
                          <Button onClick={handleAddComponent} disabled={!isAddFormValid()}>
                            Add Component
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!isAddFormValid() && (
                        <TooltipContent>
                          <p>Please fill in all required fields: Component Name, Description, Category, Location, Quantity, Front Image, and Back Image.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredComponents.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No components found</h3>
              <p className="text-gray-600">Add your first lab component to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredComponents.map((component) => (
            <Card key={component.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold">{component.component_name}</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setComponentToView(component)
                      setIsInfoDialogOpen(true)
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Image Display with Fade Animation */}
                  {(component.imageUrl || component.backImageUrl) && (
                    <div className="relative w-full h-64">
                      {/* Front Image */}
                      <div 
                        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                          imageStates[component.id] ? 'opacity-0' : 'opacity-100'
                        }`}
                      >
                        <img
                          src={component.imageUrl || '/placeholder.jpg'}
                          alt={`Front view of ${component.component_name}`}
                          className="w-full h-full object-contain rounded-lg bg-gray-50"
                        />
                      </div>
                      
                      {/* Back Image */}
                      {component.backImageUrl && (
                        <div 
                          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                            imageStates[component.id] ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <img
                            src={component.backImageUrl}
                            alt={`Back view of ${component.component_name}`}
                            className="w-full h-full object-contain rounded-lg bg-gray-50"
                          />
                        </div>
                      )}
                      
                      {/* Navigation Buttons */}
                      {component.backImageUrl && (
                        <>
                          {/* Show right arrow when on front image */}
                          {!imageStates[component.id] && (
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md z-10"
                              onClick={() => setImageStates(prev => ({ ...prev, [component.id]: true }))}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Show left arrow when on back image */}
                          {imageStates[component.id] && (
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md z-10"
                              onClick={() => setImageStates(prev => ({ ...prev, [component.id]: false }))}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}

                      {/* Image Indicator */}
                      {component.backImageUrl && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                          <div 
                            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                              !imageStates[component.id] ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                          <div 
                            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                              imageStates[component.id] ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Component Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-700">Total Quantity</p>
                      <p>{component.component_quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Available</p>
                      <p>{component.availableQuantity || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Category</p>
                      <p>{component.component_category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Location</p>
                      <p>{component.component_location}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-700">Description :</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{component.component_description}</p>
                  </div>

                  {component.component_specification && (
                    <div>
                      <p className="text-sm font-bold text-gray-700">Specifications :</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{component.component_specification}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingComponent(component)
                        setIsEditDialogOpen(true)
                        // Set image previews if images exist
                        if (component.imageUrl) {
                          setFrontImagePreview(component.imageUrl)
                        }
                        if (component.backImageUrl) {
                          setBackImagePreview(component.backImageUrl)
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setComponentToDelete(component)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Component</DialogTitle>
            <DialogDescription>Update the details of the lab component.</DialogDescription>
          </DialogHeader>
          {editingComponent && (
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
              <div className="grid gap-8 py-4">
                {/* Form Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* General Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle>General Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Component Name *</Label>
                          <Input
                            id="edit-name"
                            value={editingComponent.component_name}
                            onChange={(e) =>
                              setEditingComponent({ ...editingComponent, component_name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={editingComponent.component_description}
                            onChange={(e) =>
                              setEditingComponent({ ...editingComponent, component_description: e.target.value })
                            }
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-specifications">Specifications</Label>
                          <Textarea
                            id="edit-specifications"
                            value={editingComponent.component_specification || ""}
                            onChange={(e) =>
                              setEditingComponent({ ...editingComponent, component_specification: e.target.value })
                            }
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stock & Location */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Stock & Location</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-quantity">Total Quantity *</Label>
                            <Input
                              id="edit-quantity"
                              type="number"
                              value={editingComponent.component_quantity}
                              onChange={(e) =>
                                setEditingComponent({
                                  ...editingComponent,
                                  component_quantity: Number.parseInt(e.target.value),
                                })
                              }
                              min="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-tagId">Tag ID</Label>
                            <Input
                              id="edit-tagId"
                              value={editingComponent.component_tag_id || ""}
                              onChange={(e) =>
                                setEditingComponent({ ...editingComponent, component_tag_id: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-category">Category *</Label>
                            <Input
                              id="edit-category"
                              value={editingComponent.component_category}
                              onChange={(e) =>
                                setEditingComponent({ ...editingComponent, component_category: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-location">Location *</Label>
                            <Input
                              id="edit-location"
                              value={editingComponent.component_location}
                              onChange={(e) =>
                                setEditingComponent({ ...editingComponent, component_location: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Purchase Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Purchase Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-invoice">Invoice Number</Label>
                          <Input
                            id="edit-invoice"
                            value={editingComponent.invoice_number || ""}
                            onChange={(e) =>
                              setEditingComponent({ ...editingComponent, invoice_number: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-value">Purchase Value</Label>
                            <Input
                              id="edit-value"
                              type="number"
                              value={editingComponent.purchase_value || ""}
                              onChange={(e) =>
                                setEditingComponent({ ...editingComponent, purchase_value: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-currency">Currency</Label>
                            <Input
                              id="edit-currency"
                              value={editingComponent.purchase_currency}
                              onChange={(e) =>
                                setEditingComponent({ ...editingComponent, purchase_currency: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-purchasedFrom">Purchased From</Label>
                          <Input
                            id="edit-purchasedFrom"
                            value={editingComponent.purchased_from || ""}
                            onChange={(e) =>
                              setEditingComponent({ ...editingComponent, purchased_from: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-purchaseDate">Purchase Date</Label>
                          <Input
                            id="edit-purchaseDate"
                            type="date"
                            value={
                              editingComponent.purchase_date
                                ? new Date(editingComponent.purchase_date).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              setEditingComponent({ ...editingComponent, purchase_date: e.target.value })
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Images */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Images</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Placeholder for image uploads */}
                        <div className="text-sm text-gray-500">Image upload is not available during edit.</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Footer */}
                <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0}>
                          <Button onClick={handleEditComponent} disabled={!isEditFormValid}>
                            Save Changes
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!isEditFormValid && (
                        <TooltipContent>
                          <p>Please fill in all required fields: Name, Category, and Location.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Lab Component
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the lab component and all associated data.
            </DialogDescription>
          </DialogHeader>
          {componentToDelete && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{componentToDelete.component_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <p className="font-medium">{componentToDelete.component_category}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <p className="font-medium">{componentToDelete.component_location}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Quantity:</span>
                    <p className="font-medium">{componentToDelete.component_quantity}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Available:</span>
                    <p className="font-medium">{componentToDelete.availableQuantity || 0}</p>
                  </div>
                </div>
                {componentToDelete.component_description && (
                  <div>
                    <span className="text-gray-500 text-sm">Description:</span>
                    <p className="text-sm mt-1">{componentToDelete.component_description}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setComponentToDelete(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await handleDeleteComponent(componentToDelete.id)
                    setIsDeleteDialogOpen(false)
                    setComponentToDelete(null)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Component
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Component Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about the lab component including purchase details and audit trail.
            </DialogDescription>
          </DialogHeader>
          {componentToView && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-blue-700">Component Name:</span>
                    <p className="text-blue-900 font-semibold">{componentToView.component_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-700">Category:</span>
                    <p className="text-blue-900">{componentToView.component_category}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-700">Location:</span>
                    <p className="text-blue-900">{componentToView.component_location}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-700">Tag ID:</span>
                    <p className="text-blue-900">{componentToView.component_tag_id || "Not assigned"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-700">Total Quantity:</span>
                    <p className="text-blue-900 font-semibold">{componentToView.component_quantity}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-700">Available Quantity:</span>
                    <p className="text-blue-900 font-semibold">{componentToView.availableQuantity || 0}</p>
                  </div>
                </div>
                {componentToView.component_description && (
                  <div className="mt-4">
                    <span className="text-sm font-medium text-blue-700">Description:</span>
                    <p className="text-blue-900 mt-1">{componentToView.component_description}</p>
                  </div>
                )}
                {componentToView.component_specification && (
                  <div className="mt-4">
                    <span className="text-sm font-medium text-blue-700">Specifications:</span>
                    <p className="text-blue-900 mt-1">{componentToView.component_specification}</p>
                  </div>
                )}
              </div>

              {/* Purchase Information */}
              {(componentToView.invoice_number || componentToView.purchased_from || componentToView.purchase_value) && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Purchase Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {componentToView.invoice_number && (
                      <div>
                        <span className="text-sm font-medium text-green-700">Invoice Number:</span>
                        <p className="text-green-900 font-mono">{componentToView.invoice_number}</p>
                      </div>
                    )}
                    {componentToView.purchased_from && (
                      <div>
                        <span className="text-sm font-medium text-green-700">Purchased From:</span>
                        <p className="text-green-900">{componentToView.purchased_from}</p>
                      </div>
                    )}
                    {componentToView.purchase_date && (
                      <div>
                        <span className="text-sm font-medium text-green-700">Purchase Date:</span>
                        <p className="text-green-900">{new Date(componentToView.purchase_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {componentToView.purchase_value && (
                      <div>
                        <span className="text-sm font-medium text-green-700">Purchase Value:</span>
                        <p className="text-green-900 font-semibold">
                          {componentToView.purchase_currency} {typeof componentToView.purchase_value === 'number' ? componentToView.purchase_value.toLocaleString() : componentToView.purchase_value}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Audit Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Audit Trail
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Created By:</span>
                    <p className="text-gray-900">{componentToView.created_by || "Unknown"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Created Date:</span>
                    <p className="text-gray-900">
                      {componentToView.created_at 
                        ? new Date(componentToView.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        : "Unknown"
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Last Modified By:</span>
                    <p className="text-gray-900">{componentToView.modified_by || "Not modified"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Last Modified Date:</span>
                    <p className="text-gray-900">
                      {componentToView.modified_at 
                        ? new Date(componentToView.modified_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        : "Not modified"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Images */}
              {(componentToView.imageUrl || componentToView.backImageUrl) && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Component Images
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {componentToView.imageUrl && (
                      <div>
                        <span className="text-sm font-medium text-purple-700">Front Image:</span>
                        <img
                          src={componentToView.imageUrl}
                          alt="Front view"
                          className="mt-2 w-full h-48 object-contain rounded-lg bg-white"
                        />
                      </div>
                    )}
                    {componentToView.backImageUrl && (
                      <div>
                        <span className="text-sm font-medium text-purple-700">Back Image:</span>
                        <img
                          src={componentToView.backImageUrl}
                          alt="Back view"
                          className="mt-2 w-full h-48 object-contain rounded-lg bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {
                    setIsInfoDialogOpen(false)
                    setComponentToView(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
