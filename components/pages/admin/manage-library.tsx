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
import { Plus, Package, Trash2, RefreshCw, Edit, ChevronRight, ChevronLeft, Info, Receipt, History, Image } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LibraryItem {
  id: string
  item_name: string
  item_description: string
  item_specification?: string
  item_quantity: number
  item_tag_id?: string
  item_category: string
  item_location: string
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
  faculty_id?: string
  facultyName?: string
}

// Utility functions for formatting
function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

function formatLocation(str: string) {
  // Words to always capitalize fully
  const allCaps = ["library", "rack", "room"]
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

export function ManageLibrary() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<LibraryItem | null>(null)
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)
  const [itemToView, setItemToView] = useState<LibraryItem | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const [newItem, setNewItem] = useState({
    item_name: "",
    item_description: "",
    item_category: "",
    item_quantity: 1,
    item_location: "",
    item_specification: "",
    item_tag_id: "",
    invoice_number: "",
    purchased_from: "",
    purchase_date: "",
    purchase_value: "",
    purchase_currency: "INR",
    faculty_id: "",
  })

  const [frontImageFile, setFrontImageFile] = useState<File | null>(null)
  const [backImageFile, setBackImageFile] = useState<File | null>(null)
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null)
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<string[]>(["General"])
  const [facultyOptions, setFacultyOptions] = useState<{ id: string; name: string }[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [newLocation, setNewLocation] = useState("")
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [locationOptions, setLocationOptions] = useState<string[]>(["Library A", "Library B", "Reading Room", "Storage Room"])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null)
  const [imageStates, setImageStates] = useState<Record<string, boolean>>({}) // false = front, true = back

  // Add form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchItems()
    fetchCategories()
    fetchFaculty()
  }, [])

  // Debug user information
  useEffect(() => {
    console.log("ManageLibrary - Current user:", user)
    console.log("ManageLibrary - User ID:", user?.id)
    console.log("ManageLibrary - User name:", user?.name)
    console.log("ManageLibrary - User role:", user?.role)
  }, [user])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/library-items")
      const data = await response.json()
      setItems(
        (data.items || []).map((item: LibraryItem) => ({
          ...item,
          imageUrl: item.front_image_id ? `/library-images/${item.front_image_id}` : null,
          backImageUrl: item.back_image_id ? `/library-images/${item.back_image_id}` : null,
        }))
      )
    } catch (error) {
      console.error("Error fetching items:", error)
      toast({
        title: "Error",
        description: "Failed to load library items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const defaultCategories = ["General"]

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/library-items/categories");
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

  // Fetch faculty list
  const fetchFaculty = async () => {
    try {
      const res = await fetch("/api/faculty");
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.faculty || []).map((f: any) => ({ id: f.id, name: f.user?.name || "Unnamed" }));
        setFacultyOptions(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch faculty", e);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      (item.item_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.item_category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.item_location?.toLowerCase() || '').includes(searchTerm.toLowerCase()),
  )

  const handleAddItem = async () => {
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
    if (!newItem.item_tag_id) {
      const formattedCategory = toTitleCase(newItem.item_category)
      const formattedLocation = formatLocation(newItem.item_location)
      const existing = items.find(
        i =>
          (i.item_name?.trim().toLowerCase() || '') === (newItem.item_name?.trim().toLowerCase() || '') &&
          (i.item_category?.trim().toLowerCase() || '') === (formattedCategory?.trim().toLowerCase() || '') &&
          (i.item_location?.trim().toLowerCase() || '') === (formattedLocation?.trim().toLowerCase() || '')
      )
      if (existing) {
        if (!window.confirm("This item already exists. The quantity you add will be added to the existing one. Continue?")) {
          return
        }
        // Simulate updating the quantity in the frontend (no backend yet)
        setItems(prev =>
          prev.map(i =>
            i.id === existing.id
              ? { ...i, item_quantity: i.item_quantity + newItem.item_quantity, availableQuantity: (i.availableQuantity || 0) + newItem.item_quantity }
              : i
          )
        )
        toast({
          title: "Quantity Updated",
          description: "The quantity has been added to the existing item.",
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
      const uploadRes = await fetch('/api/library-items/upload', {
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
      const uploadRes = await fetch('/api/library-items/upload', {
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
    const formattedCategory = toTitleCase(newItem.item_category)
    const formattedLocation = formatLocation(newItem.item_location)

    try {
      const response = await fetch("/api/library-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          ...newItem,
          item_category: formattedCategory,
          item_location: formattedLocation,
          front_image_id: frontImageUrl,
          back_image_id: backImageUrl,
          created_by: user?.name || "system-fallback"
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setItems((prev) => [...prev, data.item])
        
        // Reset form
        resetForm()
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Library item added successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add item")
      }
    } catch (error) {
      console.error("Error adding item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setNewItem({
      item_name: "",
      item_description: "",
      item_category: "",
      item_quantity: 1,
      item_location: "",
      item_specification: "",
      item_tag_id: "",
      invoice_number: "",
      purchased_from: "",
      purchase_date: "",
      purchase_value: "",
      purchase_currency: "INR",
      faculty_id: "",
    })
    setFrontImageFile(null)
    setBackImageFile(null)
    setFrontImagePreview(null)
    setBackImagePreview(null)
    setCategoryOptions(["General"])
    setNewCategory("")
    setIsSavingCategory(false)
    setShowAddCategory(false)
    setShowAddLocation(false)
    setNewLocation("")
    setIsSavingLocation(false)
    setLocationOptions(["Library A", "Library B", "Reading Room", "Storage Room"])
    setIsEditDialogOpen(false)
    setEditingItem(null)
    setImageStates({})
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!newItem.item_name) errors.item_name = "Item name is required"
    if (!newItem.item_category) errors.item_category = "Item category is required"
    if (!newItem.item_location) errors.item_location = "Item location is required"
    if (!newItem.item_quantity) errors.item_quantity = "Item quantity is required"
    if (!newItem.item_specification) errors.item_specification = "Item specification is required"
    if (!newItem.item_tag_id) errors.item_tag_id = "Item tag ID is required"
    if (!newItem.invoice_number) errors.invoice_number = "Invoice number is required"
    if (!newItem.purchase_value) errors.purchase_value = "Purchase value is required"
    if (!newItem.purchase_currency) errors.purchase_currency = "Purchase currency is required"
    if (!newItem.purchase_date) errors.purchase_date = "Purchase date is required"
    if (!newItem.purchased_from) errors.purchased_from = "Purchased from is required"
    if (!newItem.faculty_id) errors.faculty_id = "Faculty is required"

  setFormErrors(errors)
  return Object.keys(errors).length === 0
  }

  const handleEditItem = async () => {
    if (!editingItem) return
    if (!editingItem.item_name || !editingItem.item_category || !editingItem.item_location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    let frontImageId = editingItem.front_image_id
    let backImageId = editingItem.back_image_id
    // Upload front image if changed
    if (frontImageFile) {
      const formData = new FormData()
      formData.append('image', frontImageFile)
      const uploadRes = await fetch('/api/library-items/upload', {
        method: 'POST',
        body: formData,
      })
      if (uploadRes.ok) {
        const data = await uploadRes.json()
        frontImageId = data.imageUrl.split('/').pop()
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
      const uploadRes = await fetch('/api/library-items/upload', {
        method: 'POST',
        body: formData,
      })
      if (uploadRes.ok) {
        const data = await uploadRes.json()
        backImageId = data.imageUrl.split('/').pop()
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
      const response = await fetch(`/api/library-items/${editingItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          ...editingItem,
          front_image_id: frontImageId,
          back_image_id: backImageId,
          modified_by: user?.name || "system-fallback",
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? data.item : i)))
        setEditingItem(null)
        setFrontImageFile(null)
        setBackImageFile(null)
        setFrontImagePreview(null)
        setBackImagePreview(null)
        setIsEditDialogOpen(false)
        toast({
          title: "Success",
          description: "Library item updated successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update item")
      }
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive",
      })
    }
  }

  const isAddFormValid = () => {
    return (
      (editingItem
        ? editingItem.item_name?.trim() &&
          editingItem.item_category?.trim() &&
          editingItem.item_location?.trim() &&
          editingItem.item_quantity > 0
        : newItem.item_name?.trim() &&
          newItem.item_category?.trim() &&
          newItem.item_location?.trim() &&
          (newItem.item_quantity > 0 && newItem.faculty_id)
      ) &&
      frontImageFile &&
      backImageFile
    )
  }

  // Delete handler for library items
  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/library-items/${itemId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== itemId))
        toast({
          title: "Success",
          description: "Item deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setItemToDelete(null)
      } else {
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading library items...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">Library Items Management</h3>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchItems} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Library Item" : "Add New Library Item"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {/* Left: Details and Images (2 columns) */}
                <div className="md:col-span-2 space-y-6">
                  {/* Basic Details Row - Name, Tag ID, Quantity */}
                  <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-4">
                    <div className="flex-1">
                      <Label htmlFor="name" className="text-sm font-medium">Item Name *</Label>
                      <Input
                        id="name"
                        value={editingItem ? editingItem.item_name : newItem.item_name}
                        onChange={(e) => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, item_name: e.target.value })
                          : setNewItem((prev) => ({ ...prev, item_name: e.target.value }))}
                        placeholder="NodeMCU ESP8266 Development Board"
                        className={`mt-1 w-full h-9 text-sm ${formErrors.item_name ? 'border-red-500' : ''}`}
                      />
                      {formErrors.item_name && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.item_name}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="tagId" className="text-sm font-medium">Tag ID (optional)</Label>
                      <Input
                        id="tagId"
                        value={editingItem ? editingItem.item_tag_id : newItem.item_tag_id}
                        onChange={e => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, item_tag_id: e.target.value })
                          : setNewItem((prev) => ({ ...prev, item_tag_id: e.target.value }))}
                        placeholder="845"
                        className="mt-1 w-full h-9 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="quantity" className="text-sm font-medium">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={editingItem ? editingItem.item_quantity : newItem.item_quantity}
                        onChange={(e) => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, item_quantity: Number.parseInt(e.target.value) })
                          : setNewItem((prev) => ({ ...prev, item_quantity: Number.parseInt(e.target.value) }))}
                        min="1"
                        className={`mt-1 w-full h-9 text-sm ${formErrors.item_quantity ? 'border-red-500' : ''}`}
                      />
                      {formErrors.item_quantity && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.item_quantity}</p>
                      )}
                    </div>
                  </div>
                  {/* Location, Category and Faculty Row */}
                  <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-4">
                    <div className="flex-1 min-w-[180px] md:min-w-[220px]">
                      <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
                      <Select
                        value={editingItem ? editingItem.item_location : newItem.item_location}
                        onValueChange={(value) => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, item_location: value })
                          : setNewItem((prev) => ({ ...prev, item_location: value }))}
                      >
                        <SelectTrigger className={`mt-1 ${formErrors.item_location ? 'border-red-500' : ''}`}>
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
                      {formErrors.item_location && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.item_location}</p>
                      )}
                    </div>
                    <div className="flex-1 min-w-[180px] md:min-w-[220px]">
                      <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                      <Select
                        value={editingItem ? editingItem.item_category : newItem.item_category}
                        onValueChange={(value) => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, item_category: value })
                          : setNewItem((prev) => ({ ...prev, item_category: value }))}
                      >
                        <SelectTrigger className={`mt-1 ${formErrors.item_category ? 'border-red-500' : ''}`}>
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
                      {formErrors.item_category && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.item_category}</p>
                      )}
                    </div>
                    {/* Faculty select */}
                    <div className="flex-1 min-w-[180px] md:min-w-[220px]">
                      <Label htmlFor="faculty" className="text-sm font-medium">Faculty *</Label>
                      <Select
                        value={editingItem ? (editingItem as any).faculty_id : newItem.faculty_id}
                        onValueChange={(value) => editingItem
                          ? setEditingItem((prev) => prev && ({ ...(prev as any), faculty_id: value }))
                          : setNewItem((prev) => ({ ...prev, faculty_id: value }))}
                      >
                        <SelectTrigger className={`mt-1 ${formErrors.faculty_id ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select faculty" />
                        </SelectTrigger>
                        <SelectContent>
                          {facultyOptions.map((fac) => (
                            <SelectItem key={fac.id} value={fac.id}>{fac.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.faculty_id && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.faculty_id}</p>
                      )}
                    </div>
                  </div>
                  {/* Description and Specification Row */}
                  <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-4">
                    <div className="flex-1">
                      <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
                      <Textarea
                        id="description"
                        value={editingItem ? editingItem.item_description : newItem.item_description}
                        onChange={e => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, item_description: e.target.value })
                          : setNewItem((prev) => ({ ...prev, item_description: e.target.value }))}
                        placeholder="The NodeMCU is an open-source IoT platform..."
                        className={`mt-1 w-full text-sm ${formErrors.item_description ? 'border-red-500' : ''}`}
                        rows={4}
                      />
                      {formErrors.item_description && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.item_description}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="specification" className="text-sm font-medium">Specifications</Label>
                      <Textarea
                        id="specification"
                        value={editingItem ? editingItem.item_specification : newItem.item_specification}
                        onChange={e => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, item_specification: e.target.value })
                          : setNewItem((prev) => ({ ...prev, item_specification: e.target.value }))}
                        placeholder=""
                        className="mt-1 w-full text-sm"
                        rows={4}
                      />
                    </div>
                  </div>
                  {/* Component Images Section */}
                  <div>
                    <div className="font-semibold mb-2">Component Images</div>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Front Image *</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0] || null
                            setFrontImageFile(file)
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (ev) => setFrontImagePreview(ev.target?.result as string)
                              reader.readAsDataURL(file)
                            } else {
                              setFrontImagePreview(null)
                            }
                          }}
                        />
                        {frontImagePreview && (
                          <img src={frontImagePreview} alt="Front Preview" className="mt-2 w-full h-40 object-contain rounded-lg bg-gray-50" />
                        )}
                        {formErrors.frontImage && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.frontImage}</p>
                        )}
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Back Image *</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0] || null
                            setBackImageFile(file)
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (ev) => setBackImagePreview(ev.target?.result as string)
                              reader.readAsDataURL(file)
                            } else {
                              setBackImagePreview(null)
                            }
                          }}
                        />
                        {backImagePreview && (
                          <img src={backImagePreview} alt="Back Preview" className="mt-2 w-full h-40 object-contain rounded-lg bg-gray-50" />
                        )}
                        {formErrors.backImage && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.backImage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right: Purchase Details */}
                <div className="md:col-span-1 space-y-6">
                  <div className="font-semibold mb-2">Purchase Details (Optional)</div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invoice_number" className="text-sm font-medium">Invoice Number</Label>
                      <Input
                        id="invoice_number"
                        value={editingItem ? editingItem.invoice_number : newItem.invoice_number}
                        onChange={e => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, invoice_number: e.target.value })
                          : setNewItem((prev) => ({ ...prev, invoice_number: e.target.value }))}
                        placeholder="inv334452"
                        className="mt-1 w-full h-9 text-sm"
                      />
                      {formErrors.invoice_number && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.invoice_number}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="purchased_from" className="text-sm font-medium">Purchased From</Label>
                      <Input
                        id="purchased_from"
                        value={editingItem ? editingItem.purchased_from : newItem.purchased_from}
                        onChange={e => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, purchased_from: e.target.value })
                          : setNewItem((prev) => ({ ...prev, purchased_from: e.target.value }))}
                        placeholder="amazon"
                        className="mt-1 w-full h-9 text-sm"
                      />
                      {formErrors.purchased_from && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.purchased_from}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="purchase_date" className="text-sm font-medium">Purchase Date</Label>
                      <Input
                        id="purchase_date"
                        type="date"
                        value={editingItem ? editingItem.purchase_date : newItem.purchase_date}
                        onChange={e => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, purchase_date: e.target.value })
                          : setNewItem((prev) => ({ ...prev, purchase_date: e.target.value }))}
                        className="mt-1 w-full h-9 text-sm"
                      />
                      {formErrors.purchase_date && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.purchase_date}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="purchase_value" className="text-sm font-medium">Purchase Value</Label>
                      <Input
                        id="purchase_value"
                        type="number"
                        value={editingItem ? editingItem.purchase_value : newItem.purchase_value}
                        onChange={e => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, purchase_value: e.target.value })
                          : setNewItem((prev) => ({ ...prev, purchase_value: e.target.value }))}
                        placeholder="137"
                        className="mt-1 w-full h-9 text-sm"
                      />
                      {formErrors.purchase_value && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.purchase_value}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="purchase_currency" className="text-sm font-medium">Currency</Label>
                      <Input
                        id="purchase_currency"
                        value={editingItem ? editingItem.purchase_currency : newItem.purchase_currency}
                        onChange={e => editingItem
                          ? setEditingItem((prev) => prev && { ...prev, purchase_currency: e.target.value })
                          : setNewItem((prev) => ({ ...prev, purchase_currency: e.target.value }))}
                        placeholder="INR - Indian Rupee"
                        className="mt-1 w-full h-9 text-sm"
                      />
                      {formErrors.purchase_currency && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.purchase_currency}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setIsEditDialogOpen(false)
                    resetForm()
                  }}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingItem ? handleEditItem : handleAddItem}
                  disabled={!isAddFormValid()}
                >
                  {editingItem ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Inventory Tab */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Add your first library item to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold">{item.item_name}</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setItemToView(item)
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
                  {(item.imageUrl || item.backImageUrl) && (
                    <div className="relative w-full h-64">
                      {/* Front Image */}
                      <div 
                        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                          imageStates[item.id] ? 'opacity-0' : 'opacity-100'
                        }`}
                      >
                        <img
                          src={item.imageUrl || '/placeholder.jpg'}
                          alt={`Front view of ${item.item_name}`}
                          className="w-full h-full object-contain rounded-lg bg-gray-50"
                        />
                      </div>
                      {/* Back Image */}
                      {item.backImageUrl && (
                        <div 
                          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                            imageStates[item.id] ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <img
                            src={item.backImageUrl}
                            alt={`Back view of ${item.item_name}`}
                            className="w-full h-full object-contain rounded-lg bg-gray-50"
                          />
                        </div>
                      )}
                      {/* Navigation Buttons */}
                      {item.backImageUrl && (
                        <>
                          {/* Show right arrow when on front image */}
                          {!imageStates[item.id] && (
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md z-10"
                              onClick={() => setImageStates(prev => ({ ...prev, [item.id]: true }))}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Show left arrow when on back image */}
                          {imageStates[item.id] && (
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md z-10"
                              onClick={() => setImageStates(prev => ({ ...prev, [item.id]: false }))}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                      {/* Image Indicator */}
                      {item.backImageUrl && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                          <div 
                            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                              !imageStates[item.id] ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                          <div 
                            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                              imageStates[item.id] ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mb-2">
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.item_description}</p>
                  </div>
                  {item.item_specification && (
                    <div className="mb-2">
                      <Label className="text-sm font-medium text-gray-500">Specifications</Label>
                      <p className="text-sm text-gray-700">{item.item_specification}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 items-center text-sm text-gray-700 mb-2">
                    <div><span className="font-semibold">Total:</span> {item.item_quantity}</div>
                    <div><span className="font-semibold">Available:</span> {item.availableQuantity}</div>
                    <div><span className="font-semibold">Location:</span> {item.item_location}</div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setItemToDelete(item)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Item Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about the library item including purchase details and audit trail.
            </DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Name</Label>
                    <div className="text-base font-medium text-gray-900">{itemToView.item_name}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Category</Label>
                    <div className="text-base font-medium text-gray-900">{itemToView.item_category}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Location</Label>
                    <div className="text-base font-medium text-gray-900">{itemToView.item_location}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Tag ID</Label>
                    <div className="text-base font-medium text-gray-900">{itemToView.item_tag_id || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Total Quantity</Label>
                    <div className="text-base font-medium text-gray-900">{itemToView.item_quantity}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Available</Label>
                    <div className="text-base font-medium text-gray-900">{itemToView.availableQuantity}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-xs font-medium text-gray-500">Description</Label>
                  <div className="text-sm text-gray-700">{itemToView.item_description}</div>
                </div>
                {itemToView.item_specification && (
                  <div className="mt-2">
                    <Label className="text-xs font-medium text-gray-500">Specification</Label>
                    <div className="text-sm text-gray-700">{itemToView.item_specification}</div>
                  </div>
                )}
              </div>
              {/* Purchase Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Purchase Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Invoice Number</Label>
                    <div className="text-base text-gray-900">{itemToView.invoice_number || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Purchased From</Label>
                    <div className="text-base text-gray-900">{itemToView.purchased_from || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Purchase Date</Label>
                    <div className="text-base text-gray-900">{itemToView.purchase_date || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Purchase Value</Label>
                    <div className="text-base text-gray-900">{itemToView.purchase_value || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Currency</Label>
                    <div className="text-base text-gray-900">{itemToView.purchase_currency || '-'}</div>
                  </div>
                </div>
              </div>
              {/* Audit Trail */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Audit Trail
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Created By</Label>
                    <div className="text-base text-gray-900">{itemToView.created_by || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Created At</Label>
                    <div className="text-base text-gray-900">{itemToView.created_at || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Last Modified By</Label>
                    <div className="text-base text-gray-900">{itemToView.modified_by || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Last Modified At</Label>
                    <div className="text-base text-gray-900">{itemToView.modified_at || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Library Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => itemToDelete && handleDeleteItem(itemToDelete.id)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 