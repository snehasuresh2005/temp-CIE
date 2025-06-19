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
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Package, Trash2, RefreshCw, Edit, ChevronRight, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LabComponent {
  id: string
  name: string
  description: string
  category: string
  totalQuantity: number
  availableQuantity: number
  location: string
  specifications: string
  imageUrl: string | null
  backImageUrl?: string | null
  tagId?: string
  invoiceNumber?: string
  purchasedFrom?: string
  purchasedDate?: string
  purchasedValue?: number
  purchasedCurrency?: string
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
  const { toast } = useToast()

  const [newComponent, setNewComponent] = useState({
    name: "",
    description: "",
    category: "",
    totalQuantity: 1,
    location: "",
    specifications: "",
    tagId: "",
    invoiceNumber: "",
    purchasedFrom: "",
    purchasedDate: "",
    purchasedValue: 0,
    purchasedCurrency: "INR"
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

  useEffect(() => {
    fetchComponents()
    fetchCategories()
  }, [])

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
      (component.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (component.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (component.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()),
  )

  const handleAddComponent = async () => {
    if (!newComponent.name || !newComponent.category || !newComponent.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // If Tag ID is empty, check for duplicate
    if (!newComponent.tagId) {
      const formattedCategory = toTitleCase(newComponent.category)
      const formattedLocation = formatLocation(newComponent.location)
      const existing = components.find(
        c =>
          (c.name?.trim().toLowerCase() || '') === (newComponent.name?.trim().toLowerCase() || '') &&
          (c.category?.trim().toLowerCase() || '') === (formattedCategory?.trim().toLowerCase() || '') &&
          (c.location?.trim().toLowerCase() || '') === (formattedLocation?.trim().toLowerCase() || '')
      )
      if (existing) {
        if (!window.confirm("This item already exists. The quantity you add will be added to the existing one. Continue?")) {
          return
        }
        // Simulate updating the quantity in the frontend (no backend yet)
        setComponents(prev =>
          prev.map(c =>
            c.id === existing.id
              ? { ...c, totalQuantity: c.totalQuantity + newComponent.totalQuantity, availableQuantity: c.availableQuantity + newComponent.totalQuantity }
              : c
          )
        )
        toast({
          title: "Quantity Updated",
          description: "The quantity has been added to the existing component.",
        })
        // Reset form
        setNewComponent({
          name: "",
          description: "",
          category: "",
          totalQuantity: 1,
          location: "",
          specifications: "",
          tagId: "",
          invoiceNumber: "",
          purchasedFrom: "",
          purchasedDate: "",
          purchasedValue: 0,
          purchasedCurrency: "INR"
        })
        setFrontImageFile(null)
        setBackImageFile(null)
        setFrontImagePreview(null)
        setBackImagePreview(null)
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
        frontImageUrl = data.imageUrl
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
        backImageUrl = data.imageUrl
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
    const formattedCategory = toTitleCase(newComponent.category)
    const formattedLocation = formatLocation(newComponent.location)

    try {
      const response = await fetch("/api/lab-components", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newComponent,
          category: formattedCategory,
          location: formattedLocation,
          availableQuantity: newComponent.totalQuantity,
          imageUrl: frontImageUrl, // For now, use front image as primary
          backImageUrl: backImageUrl, // Add back image URL
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComponents((prev) => [...prev, data.component])
        
        // Reset form
        setNewComponent({
          name: "",
          description: "",
          category: "",
          totalQuantity: 1,
          location: "",
          specifications: "",
          tagId: "",
          invoiceNumber: "",
          purchasedFrom: "",
          purchasedDate: "",
          purchasedValue: 0,
          purchasedCurrency: "INR"
        })
        setFrontImageFile(null)
        setBackImageFile(null)
        setFrontImagePreview(null)
        setBackImagePreview(null)
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
    if (!confirm("Are you sure you want to delete this component?")) return

    try {
      const response = await fetch(`/api/lab-components/${componentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setComponents((prev) => prev.filter((component) => component.id !== componentId))
        toast({
          title: "Success",
          description: "Component deleted successfully",
        })
      } else {
        throw new Error("Failed to delete component")
      }
    } catch (error) {
      console.error("Error deleting component:", error)
      toast({
        title: "Error",
        description: "Failed to delete component",
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
        setNewComponent((prev) => ({ ...prev, category: formatted }))
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
      setNewComponent((prev) => ({ ...prev, location: formatted }))
      setNewLocation("")
      toast({ title: "Location added!", description: "New location added successfully." })
    } finally {
      setIsSavingLocation(false)
    }
  }

  const isFormValid =
    newComponent.name.trim() &&
    newComponent.category.trim() &&
    newComponent.location.trim() &&
    newComponent.totalQuantity > 0 &&
    frontImageFile &&
    backImageFile &&
    newComponent.description.trim()

  const handleEditComponent = async () => {
    if (!editingComponent) return
    
    if (!editingComponent.name || !editingComponent.category || !editingComponent.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    let frontImageUrl = editingComponent.imageUrl
    let backImageUrl = editingComponent.backImageUrl

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
        frontImageUrl = data.imageUrl
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
        backImageUrl = data.imageUrl
      } else {
        toast({
          title: "Error",
          description: "Back image upload failed",
          variant: "destructive",
        })
        return
      }
    }

    try {
      const response = await fetch(`/api/lab-components/${editingComponent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editingComponent,
          imageUrl: frontImageUrl,
          backImageUrl: backImageUrl,
          modifiedBy: "system", // TODO: Get from auth context
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
          <h1 className="text-3xl font-bold text-gray-900">Lab Components Management</h1>
          <p className="text-gray-600 mt-2">Manage laboratory equipment and components inventory</p>
        </div>

        <div className="flex space-x-2">
          <Button onClick={fetchComponents} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Lab Component</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 w-full">
                {/* Component Name */}
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Component Name *</Label>
                  <Input
                    id="name"
                    value={newComponent.name}
                    onChange={(e) => setNewComponent((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Arduino Uno R3"
                    className="mt-1"
                  />
                </div>

                {/* Basic Details Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="quantity" className="text-sm font-medium">Total Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newComponent.totalQuantity}
                      onChange={(e) => setNewComponent((prev) => ({ ...prev, totalQuantity: Number.parseInt(e.target.value) }))}
                      min="1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
                    <Select
                      open={showAddLocation || undefined}
                      value={newComponent.location}
                      onValueChange={(value) => {
                        if (value === '__add_new_location__') {
                          setShowAddLocation(true)
                        } else {
                          setNewComponent((prev) => ({ ...prev, location: value }))
                          setShowAddLocation(false)
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
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
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                    <Select
                      open={showAddCategory || undefined}
                      value={newComponent.category}
                      onValueChange={(value) => {
                        if (value === '__add_new__') {
                          setShowAddCategory(true)
                        } else {
                          setNewComponent((prev) => ({ ...prev, category: value }))
                          setShowAddCategory(false)
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
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
                  </div>
                  <div>
                    <Label htmlFor="tagId" className="text-sm font-medium">Tag ID (optional)</Label>
                    <Input
                      id="tagId"
                      value={newComponent.tagId}
                      onChange={e => setNewComponent((prev) => ({ ...prev, tagId: e.target.value }))}
                      placeholder="e.g. 123-XYZ"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Component Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="frontImage" className="text-sm font-medium">Front Image *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg h-10 p-1 flex items-center hover:border-gray-400 transition-colors">
                        <Input
                          id="frontImage"
                          type="file"
                          accept="image/*"
                          onChange={e => setFrontImageFile(e.target.files?.[0] || null)}
                          className="border-0 p-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
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
                      <div className="border-2 border-dashed border-gray-300 rounded-lg h-10 p-1 flex items-center hover:border-gray-400 transition-colors">
                        <Input
                          id="backImage"
                          type="file"
                          accept="image/*"
                          onChange={e => setBackImageFile(e.target.files?.[0] || null)}
                          className="border-0 p-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
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

                {/* Description and Gen Button Row */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="h-8"
                    >
                      gen
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={newComponent.description}
                    onChange={(e) => setNewComponent((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a detailed description of the component..."
                    rows={4}
                    className="mt-0"
                  />
                </div>

                {/* Specifications */}
                <div>
                  <Label htmlFor="specifications" className="text-sm font-medium">Specifications</Label>
                  <Textarea
                    id="specifications"
                    value={newComponent.specifications}
                    onChange={(e) => setNewComponent((prev) => ({ ...prev, specifications: e.target.value }))}
                    placeholder="Technical specifications, dimensions, power requirements, etc."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Purchase Details Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceNumber" className="text-sm font-medium">Invoice Number</Label>
                      <Input
                        id="invoiceNumber"
                        value={newComponent.invoiceNumber}
                        onChange={(e) => setNewComponent((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                        placeholder="INV-2025-001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="purchasedFrom" className="text-sm font-medium">Purchased From</Label>
                      <Input
                        id="purchasedFrom"
                        value={newComponent.purchasedFrom}
                        onChange={(e) => setNewComponent((prev) => ({ ...prev, purchasedFrom: e.target.value }))}
                        placeholder="Vendor/Supplier Name"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="purchasedDate" className="text-sm font-medium">Purchase Date</Label>
                      <Input
                        id="purchasedDate"
                        type="date"
                        value={newComponent.purchasedDate}
                        onChange={(e) => setNewComponent((prev) => ({ ...prev, purchasedDate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="purchasedValue" className="text-sm font-medium">Purchase Value</Label>
                      <Input
                        id="purchasedValue"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newComponent.purchasedValue}
                        onChange={(e) => setNewComponent((prev) => ({ ...prev, purchasedValue: Number(e.target.value) }))}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="purchasedCurrency" className="text-sm font-medium">Currency</Label>
                      <Select
                        value={newComponent.purchasedCurrency}
                        onValueChange={(value) => setNewComponent((prev) => ({ ...prev, purchasedCurrency: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
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
                  <Button
                    onClick={handleAddComponent}
                    disabled={!isFormValid}
                    className="px-6"
                  >
                    Add Component
                  </Button>
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
                    <h3 className="text-lg font-semibold">{component.name}</h3>
                  </div>
                  <Badge variant={component.availableQuantity > 0 ? "default" : "destructive"}>
                    {component.availableQuantity > 0 ? "Available" : "Out of Stock"}
                  </Badge>
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
                          alt={`Front view of ${component.name}`}
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
                            alt={`Back view of ${component.name}`}
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
                      <p className="text-sm font-medium text-gray-500">Total Quantity</p>
                      <p>{component.totalQuantity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Available</p>
                      <p>{component.availableQuantity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Category</p>
                      <p>{component.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p>{component.location}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{component.description}</p>
                  </div>

                  {component.specifications && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Specifications</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{component.specifications}</p>
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
                      onClick={() => handleDeleteComponent(component.id)}
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lab Component</DialogTitle>
            <DialogDescription>Modify the details of the lab component</DialogDescription>
          </DialogHeader>
          {editingComponent && (
            <div className="space-y-4 w-full">
              {/* Component Name */}
              <div>
                <Label htmlFor="edit-name" className="text-sm font-medium">Component Name *</Label>
                <Input
                  id="edit-name"
                  value={editingComponent.name}
                  onChange={(e) => setEditingComponent((prev) => prev ? ({ ...prev, name: e.target.value }) : null)}
                  placeholder="Arduino Uno R3"
                  className="mt-1"
                />
              </div>

              {/* Basic Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="edit-quantity" className="text-sm font-medium">Total Quantity *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={editingComponent.totalQuantity}
                    onChange={(e) => setEditingComponent((prev) => prev ? ({ ...prev, totalQuantity: Number(e.target.value) }) : null)}
                    min="1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location" className="text-sm font-medium">Location *</Label>
                  <Select
                    value={editingComponent.location}
                    onValueChange={(value) => setEditingComponent((prev) => prev ? ({ ...prev, location: value }) : null)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-category" className="text-sm font-medium">Category *</Label>
                  <Select
                    value={editingComponent.category}
                    onValueChange={(value) => setEditingComponent((prev) => prev ? ({ ...prev, category: value }) : null)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-tagId" className="text-sm font-medium">Tag ID (optional)</Label>
                  <Input
                    id="edit-tagId"
                    value={editingComponent.tagId || ""}
                    onChange={(e) => setEditingComponent((prev) => prev ? ({ ...prev, tagId: e.target.value }) : null)}
                    placeholder="e.g. 123-XYZ"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Component Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="edit-frontImage" className="text-sm font-medium">Front Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-10 p-1 flex items-center hover:border-gray-400 transition-colors">
                      <Input
                        id="edit-frontImage"
                        type="file"
                        accept="image/*"
                        onChange={e => setFrontImageFile(e.target.files?.[0] || null)}
                        className="border-0 p-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
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
                    <Label htmlFor="edit-backImage" className="text-sm font-medium">Back Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-10 p-1 flex items-center hover:border-gray-400 transition-colors">
                      <Input
                        id="edit-backImage"
                        type="file"
                        accept="image/*"
                        onChange={e => setBackImageFile(e.target.files?.[0] || null)}
                        className="border-0 p-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
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

              {/* Description */}
              <div>
                <Label htmlFor="edit-description" className="text-sm font-medium">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={editingComponent.description}
                  onChange={(e) => setEditingComponent((prev) => prev ? ({ ...prev, description: e.target.value }) : null)}
                  placeholder="Provide a detailed description of the component..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Specifications */}
              <div>
                <Label htmlFor="edit-specifications" className="text-sm font-medium">Specifications</Label>
                <Textarea
                  id="edit-specifications"
                  value={editingComponent.specifications}
                  onChange={(e) => setEditingComponent((prev) => prev ? ({ ...prev, specifications: e.target.value }) : null)}
                  placeholder="Technical specifications, dimensions, power requirements, etc."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Purchase Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Purchase Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-invoiceNumber" className="text-sm font-medium">Invoice Number</Label>
                    <Input
                      id="edit-invoiceNumber"
                      value={editingComponent.invoiceNumber || ""}
                      onChange={(e) => setEditingComponent((prev) => prev ? ({ ...prev, invoiceNumber: e.target.value }) : null)}
                      placeholder="INV-2025-001"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-purchasedFrom" className="text-sm font-medium">Purchased From</Label>
                    <Input
                      id="edit-purchasedFrom"
                      value={editingComponent.purchasedFrom || ""}
                      onChange={(e) => setEditingComponent((prev) => prev ? ({ ...prev, purchasedFrom: e.target.value }) : null)}
                      placeholder="Vendor/Supplier Name"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-purchasedDate" className="text-sm font-medium">Purchase Date</Label>
                    <Input
                      id="edit-purchasedDate"
                      type="date"
                      value={editingComponent.purchasedDate?.split('T')[0] || ""}
                      onChange={(e) => setEditingComponent((prev) => prev ? ({ ...prev, purchasedDate: e.target.value }) : null)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-purchasedValue" className="text-sm font-medium">Purchase Value</Label>
                    <Input
                      id="edit-purchasedValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingComponent.purchasedValue || 0}
                      onChange={(e) => setEditingComponent((prev) => prev ? ({ ...prev, purchasedValue: Number(e.target.value) }) : null)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-purchasedCurrency" className="text-sm font-medium">Currency</Label>
                    <Select
                      value={editingComponent.purchasedCurrency || "INR"}
                      onValueChange={(value) => setEditingComponent((prev) => prev ? ({ ...prev, purchasedCurrency: value }) : null)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingComponent(null)
                    setFrontImageFile(null)
                    setBackImageFile(null)
                    setFrontImagePreview(null)
                    setBackImagePreview(null)
                  }}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditComponent}
                  className="px-6"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
