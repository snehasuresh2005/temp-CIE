"use client"

import React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { Plus, Package, Trash2, RefreshCw, Edit, ChevronRight, ChevronLeft, Info, Receipt, History, Image ,Search, Filter } from "lucide-react"
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

interface IndividualItem {
  id: string
  unique_id: string
}

interface SpecificationRow {
  id: string
  attribute: string
  value: string
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
  const [selectedCategory, setSelectedCategory] = useState("all")
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

  // Individual tracking state
  const [trackIndividual, setTrackIndividual] = useState(false)
  const [individualItems, setIndividualItems] = useState<IndividualItem[]>([])
  const [individualItemErrors, setIndividualItemErrors] = useState<Record<string, string>>({})
  
  // Specification table state
  const [specificationRows, setSpecificationRows] = useState<SpecificationRow[]>([
    { id: '1', attribute: '', value: '' },
    { id: '2', attribute: '', value: '' },
    { id: '3', attribute: '', value: '' },
    { id: '4', attribute: '', value: '' }
  ])

  const [frontImageFile, setFrontImageFile] = useState<File | null>(null)
  const [backImageFile, setBackImageFile] = useState<File | null>(null)
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null)
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<string[]>(["Electrical"])
  const [newCategory, setNewCategory] = useState("")
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false)
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [newLocation, setNewLocation] = useState("")
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null)
  const [isDeleteLocationDialogOpen, setIsDeleteLocationDialogOpen] = useState(false)
  const [locationOptions, setLocationOptions] = useState<string[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<LabComponent | null>(null)
  const [imageStates, setImageStates] = useState<Record<string, boolean>>({}) // false = front, true = back

  // Add form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // AI analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Bulk upload state
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false)
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null)
  const [isBulkUploading, setIsBulkUploading] = useState(false)

  // Refs for click-outside detection
  const locationInputRef = useRef<HTMLDivElement>(null)
  const categoryInputRef = useRef<HTMLDivElement>(null)

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchComponents()
    fetchCategories()
    fetchLocations()
  }, [])

  // Debug user information
  useEffect(() => {
    console.log("ManageLabComponents - Current user:", user)
    console.log("ManageLabComponents - User ID:", user?.id)
    console.log("ManageLabComponents - User name:", user?.name)
    console.log("ManageLabComponents - User role:", user?.role)
  }, [user])

  // Specification table management functions
  const addSpecificationRow = () => {
    const newRow: SpecificationRow = {
      id: Date.now().toString(),
      attribute: '',
      value: ''
    }
    setSpecificationRows(prev => [...prev, newRow])
  }
  
  const removeSpecificationRow = (id: string) => {
    setSpecificationRows(prev => prev.filter(row => row.id !== id))
  }
  
  const updateSpecificationRow = (id: string, field: 'attribute' | 'value', value: string) => {
    setSpecificationRows(prev =>
      prev.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    )
  }
  
  // Individual item management functions
  const addIndividualItem = () => {
    const newItem: IndividualItem = {
      id: Date.now().toString(),
      unique_id: ""
    }
    setIndividualItems(prev => [...prev, newItem])
  }

  const removeIndividualItem = (id: string) => {
    setIndividualItems(prev => prev.filter(item => item.id !== id))
    setIndividualItemErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[id]
      return newErrors
    })
  }

  const updateIndividualItem = (id: string, unique_id: string) => {
    setIndividualItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, unique_id } : item
      )
    )
    // Clear error when user starts typing
    if (unique_id.trim()) {
      setIndividualItemErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }

  // Update quantity when individual tracking changes
  useEffect(() => {
    if (trackIndividual) {
      const validItems = individualItems.filter(item => item.unique_id.trim())
      setNewComponent(prev => ({ ...prev, component_quantity: validItems.length }))
    }
  }, [trackIndividual, individualItems])

  // Click-outside detection for location input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showAddLocation &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowAddLocation(false)
        setNewLocation("")
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showAddLocation) {
        setShowAddLocation(false)
        setNewLocation("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscapeKey)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [showAddLocation])

  // Click-outside detection for category input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showAddCategory &&
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target as Node)
      ) {
        setShowAddCategory(false)
        setNewCategory("")
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showAddCategory) {
        setShowAddCategory(false)
        setNewCategory("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscapeKey)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [showAddCategory])

  const fetchComponents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/lab-components")
      const data = await response.json()
      setComponents(
        (data.components || []).map((component: LabComponent) => ({
          ...component,
          imageUrl: component.front_image_id ? `/lab-images/${component.front_image_id}` : null,
          backImageUrl: component.back_image_id ? `/lab-images/${component.back_image_id}` : null,
        }))
      )
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

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/lab-components/locations");
      if (res.ok) {
        const data = await res.json();
        setLocationOptions(data.locations || []);
      }
    } catch (e) {
      console.error("Error fetching locations:", e);
      // Set default locations as fallback
      setLocationOptions(["Lab A", "Lab B", "Lab C", "Storage Room", "Equipment Room"]);
    }
  };

  const filteredComponents = components.filter(
    (component) => {
      const matchesSearch = 
        (component.component_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (component.component_category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (component.component_location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === "all" || 
        (component.component_category?.toLowerCase() || '') === selectedCategory.toLowerCase()
      
      return matchesSearch && matchesCategory
    }
  )

  const handleAddComponent = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Already submitting, ignoring click')
      return
    }
    
    setIsSubmitting(true)
    console.log('Starting component submission...')
    
    try {
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

    // Prepare individual items for API payload
    let finalQuantity = newComponent.component_quantity
    let individualItemsPayload: IndividualItem[] = []
    
    if (trackIndividual) {
      const validItems = individualItems.filter(item => item.unique_id.trim())
      finalQuantity = validItems.length
      individualItemsPayload = validItems
    }

    console.log("Frontend - handleAddComponent - user object:", user)
    console.log("Frontend - handleAddComponent - user.id:", user?.id)
    console.log("Frontend - handleAddComponent - user.name:", user?.name)
    console.log("Frontend - handleAddComponent - trackIndividual:", trackIndividual)
    console.log("Frontend - handleAddComponent - finalQuantity:", finalQuantity)
    console.log("Frontend - handleAddComponent - individualItemsPayload:", individualItemsPayload)

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
          component_quantity: finalQuantity,
          component_specification: convertSpecificationsToString(),
          front_image_id: frontImageUrl,
          back_image_id: backImageUrl,
          created_by: user?.name || "system-fallback",
          track_individual: trackIndividual,
          individual_items: individualItemsPayload
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
    } finally {
      setIsSubmitting(false)
      console.log('Component submission finished')
    }
  }

  const handleDeleteComponent = async (componentId: string) => {
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
      const res = await fetch("/api/lab-components/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory.trim() })
      })
      
      if (res.ok) {
        const data = await res.json()
        const formattedCategory = data.category
        setCategoryOptions((prev) => [...prev, formattedCategory])
        setNewComponent((prev) => ({ ...prev, component_category: formattedCategory }))
        setNewCategory("")
        setShowAddCategory(false)
        toast({ title: "Category added!", description: "New category added successfully." })
      } else {
        const error = await res.json()
        toast({ 
          title: "Error", 
          description: error.error || "Failed to add category.", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast({ 
        title: "Error", 
        description: "Failed to add category.", 
        variant: "destructive" 
      })
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (category: string) => {
    try {
      const res = await fetch(`/api/lab-components/categories?category=${encodeURIComponent(category)}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        setCategoryOptions((prev) => prev.filter(cat => cat !== category))
        toast({ 
          title: "Category removed!", 
          description: "Category removed successfully." 
        })
      } else {
        const error = await res.json()
        if (error.componentsUsing) {
          toast({ 
            title: "Cannot delete category", 
            description: `Category is being used by ${error.count} component(s). Remove components first.`, 
            variant: "destructive" 
          })
        } else {
          toast({ 
            title: "Error", 
            description: error.error || "Failed to delete category.", 
            variant: "destructive" 
          })
        }
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({ 
        title: "Error", 
        description: "Failed to delete category.", 
        variant: "destructive" 
      })
    } finally {
      setIsDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return
    setIsSavingLocation(true)
    try {
      const res = await fetch("/api/lab-components/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: newLocation.trim() })
      })
      
      if (res.ok) {
        const data = await res.json()
        const formattedLocation = data.location
        setLocationOptions((prev) => [...prev, formattedLocation])
        setNewComponent((prev) => ({ ...prev, component_location: formattedLocation }))
        setNewLocation("")
        setShowAddLocation(false)
        toast({ title: "Location added!", description: "New location added successfully." })
      } else {
        const error = await res.json()
        toast({ 
          title: "Error", 
          description: error.error || "Failed to add location.", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("Error adding location:", error)
      toast({ 
        title: "Error", 
        description: "Failed to add location.", 
        variant: "destructive" 
      })
    } finally {
      setIsSavingLocation(false)
    }
  }

  const handleDeleteLocation = async (location: string) => {
    try {
      const res = await fetch(`/api/lab-components/locations?location=${encodeURIComponent(location)}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        setLocationOptions((prev) => prev.filter(loc => loc !== location))
        toast({ 
          title: "Location removed!", 
          description: "Location removed successfully." 
        })
      } else {
        const error = await res.json()
        if (error.componentsUsing) {
          toast({ 
            title: "Cannot delete location", 
            description: `Location is being used by ${error.count} component(s). Remove components first.`, 
            variant: "destructive" 
          })
        } else {
          toast({ 
            title: "Error", 
            description: error.error || "Failed to delete location.", 
            variant: "destructive" 
          })
        }
      }
    } catch (error) {
      console.error("Error deleting location:", error)
      toast({ 
        title: "Error", 
        description: "Failed to delete location.", 
        variant: "destructive" 
      })
    } finally {
      setIsDeleteLocationDialogOpen(false)
      setLocationToDelete(null)
    }
  }

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {}
    const individualErrors: Record<string, string> = {}

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

    // Individual tracking validation
    if (trackIndividual) {
      if (individualItems.length === 0) {
        errors.individualItems = "At least one individual item is required when individual tracking is enabled"
      } else {
        // Validate each individual item
        individualItems.forEach((item, index) => {
          if (!item.unique_id.trim()) {
            individualErrors[item.id] = "Unique ID is required"
          }
        })

        // Check for duplicate unique IDs
        const uniqueIds = individualItems.map(item => item.unique_id.trim()).filter(id => id)
        const duplicateIds = uniqueIds.filter((id, index) => uniqueIds.indexOf(id) !== index)
        
        if (duplicateIds.length > 0) {
          individualItems.forEach(item => {
            if (duplicateIds.includes(item.unique_id.trim())) {
              individualErrors[item.id] = "Duplicate Unique ID"
            }
          })
        }

        // Update quantity based on valid items
        const validItems = individualItems.filter(item => item.unique_id.trim())
        if (validItems.length === 0) {
          errors.component_quantity = "At least one individual item with valid Unique ID is required"
        } else {
          setNewComponent(prev => ({ ...prev, component_quantity: validItems.length }))
        }
      }
    } else {
      // Regular quantity validation when not tracking individually
      if (newComponent.component_quantity <= 0) {
        errors.component_quantity = "Quantity must be greater than 0"
      }
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
    setIndividualItemErrors(individualErrors)
    return Object.keys(errors).length === 0 && Object.keys(individualErrors).length === 0
  }

  // Check if form is valid for button state - using useMemo for reactivity
  const isAddFormValid = useMemo(() => {
    // Basic field validation
    const basicFieldsValid = !!(
      newComponent.component_name?.trim() &&
      newComponent.component_description?.trim() &&
      newComponent.component_category?.trim() &&
      newComponent.component_location?.trim() &&
      frontImageFile &&
      backImageFile
    )

    // Quantity validation based on tracking mode
    let quantityValid = false
    if (trackIndividual) {
      const validItems = individualItems.filter(item => item.unique_id.trim())
      quantityValid = validItems.length > 0
    } else {
      quantityValid = newComponent.component_quantity > 0
    }

    // Individual items validation
    let individualItemsValid = true
    if (trackIndividual) {
      individualItemsValid = individualItems.length > 0 && 
        individualItems.every(item => item.unique_id.trim()) &&
        // Check for duplicate unique IDs
        new Set(individualItems.map(item => item.unique_id.trim()).filter(id => id)).size === individualItems.filter(item => item.unique_id.trim()).length
    }

    const isValid = basicFieldsValid && quantityValid && individualItemsValid
    
    // Debug log to help troubleshoot
    console.log('Form validation check:', {
      name: !!newComponent.component_name?.trim(),
      description: !!newComponent.component_description?.trim(), 
      category: !!newComponent.component_category?.trim(),
      location: !!newComponent.component_location?.trim(),
      quantity: quantityValid,
      frontImage: !!frontImageFile,
      backImage: !!backImageFile,
      trackIndividual,
      individualItemsCount: individualItems.length,
      validIndividualItems: individualItems.filter(item => item.unique_id.trim()).length,
      individualItemsValid,
      isValid
    })
    
    return isValid
  }, [
    newComponent.component_name,
    newComponent.component_description,
    newComponent.component_category,
    newComponent.component_location,
    newComponent.component_quantity,
    frontImageFile,
    backImageFile,
    trackIndividual,
    individualItems
  ])

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
          component_specification: convertSpecificationsToString(),
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

  // AI Analysis function
  const handleAIAnalysis = async () => {
    if (!frontImageFile || !backImageFile) {
      toast({
        title: "Error",
        description: "Both front and back images are required for AI analysis",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    
    try {
      const formData = new FormData()
      formData.append('frontImage', frontImageFile)
      formData.append('backImage', backImageFile)
      formData.append('itemType', 'lab') // Specify this is for lab components

      const response = await fetch('/api/ai-analyze-images', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze images')
      }

      const data = await response.json()
      
      if (data.status === 'error') {
        // Handle validation errors (wrong item type)
        toast({
          title: "Invalid Item Type",
          description: data.error || "Please upload images of lab components only, not library items.",
          variant: "destructive",
        })
        return
      }
      
      if (data.status === 'success' && data.result) {
        setNewComponent(prev => ({
          ...prev,
          component_name: data.result.name,
          component_description: data.result.description,
          component_specification: data.result.specifications
        }))
        
        // Parse AI specifications into table format if possible
        if (data.result.specifications) {
          const parsedSpecs = parseSpecificationsToTable(data.result.specifications)
          setSpecificationRows(parsedSpecs)
        }
        
        toast({
          title: "AI Analysis Complete",
          description: "Component name, description and specifications have been generated successfully",
        })
      } else {
        throw new Error(data.error || 'AI analysis failed')
      }
      
    } catch (error) {
      console.error('AI Analysis Error:', error)
      toast({
        title: "AI Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze images",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Helper function to parse AI specifications into table format
  const parseSpecificationsToTable = (specs: string): SpecificationRow[] => {
    const rows: SpecificationRow[] = []
    let idCounter = 1
    
    // Check if specs are in pipe-separated format (from new AI)
    if (specs.includes('|')) {
      const attributes = specs.split('|').map(attr => attr.trim()).filter(attr => attr)
      attributes.forEach(attribute => {
        // Check if the attribute already contains a value (has colon or equals)
        const colonIndex = attribute.indexOf(':')
        const equalsIndex = attribute.indexOf('=')
        
        if (colonIndex > 0) {
          // Format: "Attribute: Value"
          rows.push({
            id: (idCounter++).toString(),
            attribute: attribute.substring(0, colonIndex).trim(),
            value: attribute.substring(colonIndex + 1).trim()
          })
        } else if (equalsIndex > 0) {
          // Format: "Attribute = Value"
          rows.push({
            id: (idCounter++).toString(),
            attribute: attribute.substring(0, equalsIndex).trim(),
            value: attribute.substring(equalsIndex + 1).trim()
          })
        } else {
          // Just attribute name, provide helpful placeholder value
          const getPlaceholderValue = (attr: string) => {
            const attrLower = attr.toLowerCase();
            if (attrLower.includes('dimension')) return 'e.g., 34mm x 26mm';
            if (attrLower.includes('voltage')) return 'e.g., 3.3V';
            if (attrLower.includes('current')) return 'e.g., 500mA';
            if (attrLower.includes('material')) return 'e.g., FR4 PCB';
            if (attrLower.includes('interface')) return 'e.g., USB Type-B';
            if (attrLower.includes('package')) return 'e.g., Through-hole';
            if (attrLower.includes('temperature')) return 'e.g., -10°C to +70°C';
            if (attrLower.includes('power')) return 'e.g., 20mA';
            return 'Please specify';
          };
          
          rows.push({
            id: (idCounter++).toString(),
            attribute: attribute,
            value: getPlaceholderValue(attribute)
          })
        }
      })
    } else {
      // Legacy format - split by common delimiters and parse
      const lines = specs.split(/[.\n;]/).filter(line => line.trim())
      
      lines.forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine) {
          // Try to extract attribute-value pairs
          const patterns = [
            /([^:]+):\s*(.+)/,  // "Attribute: Value"
            /([^=]+)=\s*(.+)/,  // "Attribute = Value"
            /(\w+(?:\s+\w+)*)\s+(.+)/  // "Attribute Value"
          ]
          
          for (const pattern of patterns) {
            const match = trimmedLine.match(pattern)
            if (match) {
              rows.push({
                id: (idCounter++).toString(),
                attribute: match[1].trim(),
                value: match[2].trim()
              })
              break
            }
          }
        }
      })
      
      // If no patterns matched, add the whole spec as a single row
      if (rows.length === 0) {
        rows.push({
          id: '1',
          attribute: 'Description',
          value: specs
        })
      }
    }
    
    // Ensure we have at least 4 rows with default lab specifications if needed
    const defaultLabSpecs = [
      'Dimensions', 'Operating Voltage', 'Current Rating', 'Material', 
      'Interface', 'Package Type', 'Temperature Range', 'Power Consumption'
    ]
    
    while (rows.length < 4) {
      const defaultSpec = defaultLabSpecs[rows.length] || ''
      rows.push({
        id: (idCounter++).toString(),
        attribute: defaultSpec,
        value: ''
      })
    }
    
    // Add more empty rows if we have fewer than 6 total
    while (rows.length < 6) {
      rows.push({
        id: (idCounter++).toString(),
        attribute: '',
        value: ''
      })
    }
    
    return rows
  }
  
  // Convert specification rows to string format for API
  const convertSpecificationsToString = (): string => {
    return specificationRows
      .filter(row => row.attribute.trim() || row.value.trim())
      .map(row => `${row.attribute}: ${row.value}`)
      .join('. ')
  }
  
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
    setIsSubmitting(false)
    setIsAnalyzing(false)
    // Reset individual tracking state
    setTrackIndividual(false)
    setIndividualItems([])
    setIndividualItemErrors({})
    // Reset specification table with default lab specs
    setSpecificationRows([
      { id: '1', attribute: 'Dimensions', value: '' },
      { id: '2', attribute: 'Operating Voltage', value: '' },
      { id: '3', attribute: 'Current Rating', value: '' },
      { id: '4', attribute: 'Material', value: '' },
      { id: '5', attribute: 'Interface', value: '' },
      { id: '6', attribute: 'Package Type', value: '' }
    ])
  }

  // Bulk upload functions
  const downloadSampleCSV = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    try {
      // Fetch the actual sample CSV from the API
      const response = await fetch('/api/lab-components/sample-csv')
      
      if (!response.ok) {
        throw new Error('Failed to download sample CSV')
      }
      
      // Get the CSV content as blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.setAttribute('hidden', '')
      a.setAttribute('href', url)
      a.setAttribute('download', 'sample-lab-components.csv')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Sample CSV downloaded successfully",
      })
    } catch (error) {
      console.error('Error downloading sample CSV:', error)
      toast({
        title: "Error",
        description: "Failed to download sample CSV",
        variant: "destructive",
      })
    }
  }

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) return
    
    setIsBulkUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('csv', bulkUploadFile)
      
      const response = await fetch('/api/lab-components/bulk-upload', {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '',
        },
        body: formData,
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Bulk upload completed! Processed: ${result.processed}, Errors: ${result.errors}`,
        })
        
        if (result.errors > 0) {
          console.log('Upload errors:', result.error_details)
        }
        
        // Refresh components list
        fetchComponents()
        
        // Close dialog and reset
        setIsBulkUploadDialogOpen(false)
        setBulkUploadFile(null)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Bulk upload error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload CSV",
        variant: "destructive",
      })
    } finally {
      setIsBulkUploading(false)
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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="admin-page-title">Lab Components Management</h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchComponents} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? "Editing..." : "Edit Mode"}
          </Button>
          <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Upload Lab Components</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to add multiple lab components at once. 
                  <br />
                  <a 
                    href="#" 
                    onClick={downloadSampleCSV}
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Download sample CSV template
                  </a>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setBulkUploadFile(file || null)
                      if (file) {
                        console.log(`Selected file: ${file.name} (${file.size} bytes)`)
                      }
                    }}
                    className="mt-1"
                  />
                  {bulkUploadFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {bulkUploadFile.name} ({(bulkUploadFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsBulkUploadDialogOpen(false)
                    setBulkUploadFile(null)
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkUpload} disabled={!bulkUploadFile || isBulkUploading}>
                    {isBulkUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
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
            <DialogContent className="max-w-[90vw] w-[1100px] max-h-[90vh] h-[750px] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Lab Component</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-y-auto">
                {/* Left Column: Basic Info & Images */}
                <div className="space-y-6 pr-3 pl-3">
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Label htmlFor="name">Component Name *</Label>
                        <Input id="name" value={newComponent.component_name} onChange={e => setNewComponent(prev => ({ ...prev, component_name: e.target.value }))} className={`mt-1 ${formErrors.component_name ? 'border-red-500' : ''}`} />
                        {formErrors.component_name && <p className="text-red-500 text-xs mt-1">{formErrors.component_name}</p>}
                  </div>
                      <div className="col-span-1">
                        <Label htmlFor="tagId">Tag ID (optional)</Label>
                        <Input id="tagId" value={newComponent.component_tag_id} onChange={e => setNewComponent(prev => ({ ...prev, component_tag_id: e.target.value }))} className="mt-1" />
                  </div>
                </div>
                  </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="location">Location *</Label>
                          <div className="flex space-x-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAddLocation(true)}
                              className="h-6 w-6 p-0"
                              title="Add location"
                              aria-label="Add location"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            {newComponent.component_location && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setLocationToDelete(newComponent.component_location)
                                  setIsDeleteLocationDialogOpen(true)
                                }}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                title="Delete location"
                                aria-label="Delete location"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {showAddLocation ? (
                          <div ref={locationInputRef} className="flex gap-2 mt-1">
                            <Input
                              placeholder="Enter location (e.g., Lab A, Storage Room)"
                              value={newLocation}
                              onChange={(e) => setNewLocation(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddLocation}
                              disabled={!newLocation.trim() || isSavingLocation}
                            >
                              {isSavingLocation ? "Adding..." : "Add"}
                            </Button>
                          </div>
                        ) : (
                          <Select value={newComponent.component_location} onValueChange={value => setNewComponent(prev => ({ ...prev, component_location: value }))}>
                            <SelectTrigger className={`mt-1 ${formErrors.component_location ? 'border-red-500' : ''}`}><SelectValue placeholder="Select Location
                            " /></SelectTrigger>
                            <SelectContent>
                              {locationOptions.map(location => (
                                <SelectItem key={location} value={location}>{location}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {formErrors.component_location && <p className="text-red-500 text-xs mt-1">{formErrors.component_location}</p>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="category">Category *</Label>
                          <div className="flex space-x-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAddCategory(true)}
                              className="h-6 w-6 p-0"
                              title="Add category"
                              aria-label="Add category"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            {newComponent.component_category && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCategoryToDelete(newComponent.component_category)
                                  setIsDeleteCategoryDialogOpen(true)
                                }}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                title="Delete category"
                                aria-label="Delete category"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {showAddCategory ? (
                          <div ref={categoryInputRef} className="flex gap-2 mt-1">
                            <Input
                              placeholder="Enter category (e.g., Electrical, Mechanical)"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddCategory}
                              disabled={!newCategory.trim() || isSavingCategory}
                            >
                              {isSavingCategory ? "Adding..." : "Add"}
                            </Button>
                          </div>
                        ) : (
                          <Select value={newComponent.component_category} onValueChange={value => setNewComponent(prev => ({ ...prev, component_category: value }))}>
                            <SelectTrigger className={`mt-1 ${formErrors.component_category ? 'border-red-500' : ''}`}><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {formErrors.component_category && <p className="text-red-500 text-xs mt-1">{formErrors.component_category}</p>}
                      </div>
                      <div className="w-20">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input 
                          id="quantity" 
                          type="number" 
                          value={newComponent.component_quantity} 
                          onChange={e => setNewComponent(prev => ({ ...prev, component_quantity: Number.parseInt(e.target.value) }))} 
                          min="1" 
                          disabled={trackIndividual}
                          className={`mt-1 ${formErrors.component_quantity ? 'border-red-500' : ''}`} 
                        />
                        {formErrors.component_quantity && <p className="text-red-500 text-xs mt-1">{formErrors.component_quantity}</p>}
                      </div>
                    </div>
                    
                    {/* Individual Tracking Toggle */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="track-individual"
                        checked={trackIndividual}
                        onCheckedChange={setTrackIndividual}
                      />
                      <Label htmlFor="track-individual" className="text-sm font-medium">
                        Track Individual Items
                      </Label>
                    </div>
                    
                    {/* Individual Items Section */}
                    {trackIndividual && (
                      <div className="space-y-2 border rounded-lg p-2 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Individual Items</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addIndividualItem}
                            className="h-6 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Item
                          </Button>
                        </div>
                        
                        {formErrors.individualItems && (
                          <p className="text-red-500 text-xs">{formErrors.individualItems}</p>
                        )}
                        
                        {individualItems.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-2">
                            No individual items added. Click "Add Item" to start tracking individual components.
                          </p>
                        ) : (
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {individualItems.map((item, index) => (
                              <div key={item.id} className="flex flex-col space-y-0.5">
                                <div className="flex items-center space-x-1">
                                  <Input
                                    placeholder={`Unique ID ${index + 1}`}
                                    value={item.unique_id}
                                    onChange={(e) => updateIndividualItem(item.id, e.target.value)}
                                    className={`flex-1 h-7 text-xs ${individualItemErrors[item.id] ? 'border-red-500 focus:border-red-500' : ''}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeIndividualItem(item.id)}
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                {individualItemErrors[item.id] && (
                                  <p className="text-red-500 text-xs ml-1">{individualItemErrors[item.id]}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {individualItems.length > 0 && (
                          <div className="text-xs text-gray-600">
                            Total items: {individualItems.filter(item => item.unique_id.trim()).length} / {individualItems.length}
                          </div>
                        )}
                      </div>
                    )}
                    
                  <div className="space-y-3">
                  <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Component Images</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        type="button" 
                        className="h-8"
                        onClick={handleAIAnalysis}
                        disabled={!frontImageFile || !backImageFile || isAnalyzing}
                        title={!frontImageFile || !backImageFile ? "Upload both front and back images first" : "Analyze images with AI"}
                      >
                        {isAnalyzing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <img src="/genAI_icon.png" alt="GenAI" className="h-7 w-7" />
                        )}
                    </Button>
                  </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="frontImage">Front Image *</Label>
                        <Input id="frontImage" type="file" accept="image/*" onChange={e => setFrontImageFile(e.target.files?.[0] || null)} className={`mt-1 ${formErrors.frontImage ? 'border-red-500' : ''}`} />
                        {formErrors.frontImage && <p className="text-red-500 text-xs mt-1">{formErrors.frontImage}</p>}
                      {frontImagePreview && (
                        <div className="mt-2">
                          <img
                            src={frontImagePreview}
                            alt="Front Preview"
                              className="w-full h-40 object-contain rounded-lg bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                      <div>
                        <Label htmlFor="backImage">Back Image *</Label>
                        <Input id="backImage" type="file" accept="image/*" onChange={e => setBackImageFile(e.target.files?.[0] || null)} className={`mt-1 ${formErrors.backImage ? 'border-red-500' : ''}`} />
                        {formErrors.backImage && <p className="text-red-500 text-xs mt-1">{formErrors.backImage}</p>}
                      {backImagePreview && (
                        <div className="mt-2">
                          <img
                            src={backImagePreview}
                            alt="Back Preview"
                              className="w-full h-40 object-contain rounded-lg bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>
                {/* Right Column: Details & Purchase Info */}
                <div className="space-y-6 pr-2">
                  <div className="space-y-3">
                  <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea id="description" value={newComponent.component_description} onChange={e => setNewComponent(prev => ({ ...prev, component_description: e.target.value }))} rows={4} className={`mt-1 resize-none leading-relaxed ${formErrors.component_description ? 'border-red-500' : ''}`} placeholder="Describe the component's purpose, key features, and functionality (max 250 characters)" maxLength={250} />
                      <div className="flex justify-between items-center mt-1">
                        {formErrors.component_description && <p className="text-red-500 text-xs">{formErrors.component_description}</p>}
                        <p className="text-xs text-gray-500 ml-auto">{newComponent.component_description.length}/250 characters</p>
                      </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Specifications</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSpecificationRow}
                        className="h-6 w-6 p-0"
                        title="Add specification row"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {specificationRows.map((row, index) => (
                        <div key={row.id} className="flex items-center space-x-2">
                          <Input
                            placeholder="Attribute (e.g., Dimensions)"
                            value={row.attribute}
                            onChange={(e) => updateSpecificationRow(row.id, 'attribute', e.target.value)}
                            className="flex-1 h-8 text-sm"
                          />
                          <Input
                            placeholder="Value (e.g., 68.6 mm x 53.4 mm)"
                            value={row.value}
                            onChange={(e) => updateSpecificationRow(row.id, 'value', e.target.value)}
                            className="flex-1 h-8 text-sm"
                          />
                          {specificationRows.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeSpecificationRow(row.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Purchase Details (Optional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="invoiceNumber">Invoice Number</Label>
                        <Input id="invoiceNumber" value={newComponent.invoice_number} onChange={e => setNewComponent(prev => ({ ...prev, invoice_number: e.target.value }))} className={`mt-1 ${formErrors.invoice_number ? 'border-red-500' : ''}`} />
                        {formErrors.invoice_number && <p className="text-red-500 text-xs mt-1">{formErrors.invoice_number}</p>}
                    </div>
                    <div>
                        <Label htmlFor="purchasedFrom">Purchased From</Label>
                        <Input id="purchasedFrom" value={newComponent.purchased_from} onChange={e => setNewComponent(prev => ({ ...prev, purchased_from: e.target.value }))} className={`mt-1 ${formErrors.purchased_from ? 'border-red-500' : ''}`} />
                        {formErrors.purchased_from && <p className="text-red-500 text-xs mt-1">{formErrors.purchased_from}</p>}
                    </div>
                  </div>
                    <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="purchasedDate">Purchase Date</Label>
                        <Input id="purchasedDate" type="date" value={newComponent.purchase_date} onChange={e => setNewComponent(prev => ({ ...prev, purchase_date: e.target.value }))} className={`mt-1 ${formErrors.purchase_date ? 'border-red-500' : ''}`} />
                        {formErrors.purchase_date && <p className="text-red-500 text-xs mt-1">{formErrors.purchase_date}</p>}
                    </div>
                    <div>
                        <Label htmlFor="purchasedValue">Purchase Value</Label>
                        <Input id="purchasedValue" type="number" min="0" step="0.01" value={newComponent.purchase_value} onChange={e => setNewComponent(prev => ({ ...prev, purchase_value: e.target.value }))} placeholder="0.00" className={`mt-1 ${formErrors.purchase_value ? 'border-red-500' : ''}`} />
                        {formErrors.purchase_value && <p className="text-red-500 text-xs mt-1">{formErrors.purchase_value}</p>}
                    </div>
                    <div>
                        <Label htmlFor="purchasedCurrency">Currency</Label>
                        <Select value={newComponent.purchase_currency} onValueChange={value => setNewComponent(prev => ({ ...prev, purchase_currency: value }))}>
                          <SelectTrigger className={`mt-1 ${formErrors.purchase_currency ? 'border-red-500' : ''}`}><SelectValue placeholder="Select currency" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                        {formErrors.purchase_currency && <p className="text-red-500 text-xs mt-1">{formErrors.purchase_currency}</p>}
                    </div>
                  </div>
                </div>
                </div>
              </div>
              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="px-6">Cancel</Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleAddComponent()
                          }} 
                          disabled={!isAddFormValid || isSubmitting}
                        >
                          {isSubmitting ? "Adding..." : "Add Component"}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isAddFormValid && (
                      <TooltipContent>
                        <p>
                          Please fill in all required fields: Component Name, Description, Category, Location, Front Image, and Back Image.
                          {trackIndividual 
                            ? " When individual tracking is enabled, add at least one individual item with a unique ID."
                            : " Quantity must be greater than 0."
                          }
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-4 pb-1">
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <Input
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-2 h-9 w-full text-sm"
          />
        </div>
        <span className="flex items-center ml-4 mr-1 text-gray-400"><Filter className="h-5 w-5" /></span>
        <span className="text-sm text-gray-600 font-medium ml-1">Category</span>
        <div className="w-40 flex flex-col">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Category">{selectedCategory !== "all" ? selectedCategory : undefined}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            <div key={component.id} className="admin-card hover:shadow-lg transition-shadow">
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
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Image Display with Fade Animation */}
                  {(component.imageUrl || component.backImageUrl) && (
                    <div className="relative w-full h-64 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden">
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


                  <div className="flex justify-end space-x-2">
                    {editMode && (
                      <>
                        <button
                          className="btn-edit"
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
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => {
                            setComponentToDelete(component)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[90vw] w-[1100px] max-h-[90vh] h-[750px] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Lab Component</DialogTitle>
          </DialogHeader>
          {editingComponent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-y-auto">
              {/* Left Column: Basic Info & Images */}
              <div className="space-y-6 pr-3 pl-3">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="edit-name">Component Name *</Label>
                      <Input 
                        id="edit-name" 
                        value={editingComponent.component_name} 
                        onChange={e => setEditingComponent(prev => prev ? { ...prev, component_name: e.target.value } : null)}
                        className="mt-1" 
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="edit-tagId">Tag ID (optional)</Label>
                      <Input 
                        id="edit-tagId" 
                        value={editingComponent.component_tag_id || ""} 
                        onChange={e => setEditingComponent(prev => prev ? { ...prev, component_tag_id: e.target.value } : null)}
                        className="mt-1" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor="edit-location">Location *</Label>
                      <Input 
                        id="edit-location" 
                        value={editingComponent.component_location} 
                        onChange={e => setEditingComponent(prev => prev ? { ...prev, component_location: e.target.value } : null)}
                        className="mt-1" 
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="edit-category">Category *</Label>
                      <Input 
                        id="edit-category" 
                        value={editingComponent.component_category} 
                        onChange={e => setEditingComponent(prev => prev ? { ...prev, component_category: e.target.value } : null)}
                        className="mt-1" 
                      />
                    </div>
                    <div className="w-20">
                      <Label htmlFor="edit-quantity">Quantity *</Label>
                      <Input 
                        id="edit-quantity" 
                        type="number" 
                        value={editingComponent.component_quantity} 
                        onChange={e => setEditingComponent(prev => prev ? { ...prev, component_quantity: Number.parseInt(e.target.value) } : null)}
                        min="1" 
                        className="mt-1" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Component Images</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-frontImage">Front Image</Label>
                      <Input 
                        id="edit-frontImage" 
                        type="file" 
                        accept="image/*" 
                        onChange={e => setFrontImageFile(e.target.files?.[0] || null)}
                        className="mt-1" 
                      />
                      {(frontImagePreview || editingComponent.imageUrl) && (
                        <div className="mt-2">
                          <img
                            src={frontImagePreview || editingComponent.imageUrl || ''}
                            alt="Front Preview"
                            className="w-full h-40 object-contain rounded-lg bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="edit-backImage">Back Image</Label>
                      <Input 
                        id="edit-backImage" 
                        type="file" 
                        accept="image/*" 
                        onChange={e => setBackImageFile(e.target.files?.[0] || null)}
                        className="mt-1" 
                      />
                      {(backImagePreview || editingComponent.backImageUrl) && (
                        <div className="mt-2">
                          <img
                            src={backImagePreview || editingComponent.backImageUrl || ''}
                            alt="Back Preview"
                            className="w-full h-40 object-contain rounded-lg bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column: Details & Purchase Info */}
              <div className="space-y-6 pr-2">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-description">Description *</Label>
                    <Textarea 
                      id="edit-description" 
                      value={editingComponent.component_description} 
                      onChange={e => setEditingComponent(prev => prev ? { ...prev, component_description: e.target.value } : null)}
                      rows={4} 
                      className="mt-1 resize-none leading-relaxed" 
                      placeholder="Describe the component's purpose, key features, and functionality (max 250 characters)"
                      maxLength={250}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">{editingComponent.component_description.length}/250 characters</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Specifications</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSpecificationRow}
                        className="h-6 w-6 p-0"
                        title="Add specification row"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {specificationRows.map((row, index) => (
                        <div key={row.id} className="flex items-center space-x-2">
                          <Input
                            placeholder="Attribute (e.g., Dimensions)"
                            value={row.attribute}
                            onChange={(e) => updateSpecificationRow(row.id, 'attribute', e.target.value)}
                            className="flex-1 h-8 text-sm"
                          />
                          <Input
                            placeholder="Value (e.g., 68.6 mm x 53.4 mm)"
                            value={row.value}
                            onChange={(e) => updateSpecificationRow(row.id, 'value', e.target.value)}
                            className="flex-1 h-8 text-sm"
                          />
                          {specificationRows.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeSpecificationRow(row.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Purchase Details (Optional)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-invoiceNumber">Invoice Number</Label>
                      <Input 
                        id="edit-invoiceNumber" 
                        value={editingComponent.invoice_number || ""} 
                        onChange={e => setEditingComponent(prev => prev ? { ...prev, invoice_number: e.target.value } : null)}
                        className="mt-1" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-purchasedFrom">Purchased From</Label>
                      <Input 
                        id="edit-purchasedFrom" 
                        value={editingComponent.purchased_from || ""} 
                        onChange={e => setEditingComponent(prev => prev ? { ...prev, purchased_from: e.target.value } : null)}
                        className="mt-1" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-purchaseDate">Purchase Date</Label>
                      <Input 
                        id="edit-purchaseDate" 
                        type="date" 
                        value={editingComponent.purchase_date ? new Date(editingComponent.purchase_date).toISOString().split('T')[0] : ''} 
                        onChange={e => setEditingComponent(prev => prev ? { ...prev, purchase_date: e.target.value } : null)}
                        className="mt-1" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-purchaseValue">Purchase Value</Label>
                      <Input 
                        id="edit-purchaseValue" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={editingComponent.purchase_value || ""} 
                        onChange={e => setEditingComponent(prev => prev ? { ...prev, purchase_value: e.target.value } : null)}
                        placeholder="0.00" 
                        className="mt-1" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-purchaseCurrency">Currency</Label>
                      <Select 
                        value={editingComponent.purchase_currency} 
                        onValueChange={value => setEditingComponent(prev => prev ? { ...prev, purchase_currency: value } : null)}
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
              </div>
              
              {/* Form Actions */}
              <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="px-6">Cancel</Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button 
                          type="button"
                          onClick={handleEditComponent} 
                          disabled={!isEditFormValid}
                        >
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
        <DialogContent className="max-w-4xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-blue-600" />
              Component Details
            </DialogTitle>
          </DialogHeader>
          {componentToView && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Basic Information */}
              <div className="bg-blue-50 rounded-lg p-3">
                <h3 className="text-base font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Component Name</Label>
                    <div className="text-sm font-medium text-gray-900">{componentToView.component_name}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Category</Label>
                    <div className="text-sm font-medium text-gray-900">{componentToView.component_category}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Location</Label>
                    <div className="text-sm font-medium text-gray-900">{componentToView.component_location}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Tag ID</Label>
                    <div className="text-sm font-medium text-gray-900">{componentToView.component_tag_id || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Total Quantity</Label>
                    <div className="text-sm font-medium text-gray-900">{componentToView.component_quantity}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Available Quantity</Label>
                    <div className="text-sm font-medium text-gray-900">{componentToView.availableQuantity || 0}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-xs font-medium text-gray-500">Description</Label>
                  <div className="text-xs text-gray-700 mt-1">{componentToView.component_description}</div>
                </div>
                {componentToView.component_specification && (
                  <div className="mt-2">
                    <Label className="text-xs font-medium text-gray-500">Specification</Label>
                    <div className="text-xs text-gray-700 mt-1">{componentToView.component_specification}</div>
                  </div>
                )}
              </div>
              
              {/* Right Column: Purchase Details and Audit Trail */}
              <div className="space-y-3">
                {/* Purchase Details */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Purchase Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Invoice Number</Label>
                      <div className="text-sm text-gray-900">{componentToView.invoice_number || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Purchased From</Label>
                      <div className="text-sm text-gray-900">{componentToView.purchased_from || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Purchase Date</Label>
                      <div className="text-sm text-gray-900">
                        {componentToView.purchase_date ? new Date(componentToView.purchase_date).toLocaleDateString() : '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Purchase Value</Label>
                      <div className="text-sm text-gray-900">
                        {componentToView.purchase_value ? `${componentToView.purchase_currency} ${typeof componentToView.purchase_value === 'number' ? componentToView.purchase_value.toLocaleString() : componentToView.purchase_value}` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Audit Trail */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Audit Trail
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Created By</Label>
                      <div className="text-sm text-gray-900">{componentToView.created_by || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Created At</Label>
                      <div className="text-sm text-gray-900">
                        {componentToView.created_at ? new Date(componentToView.created_at).toLocaleDateString() : '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Last Modified By</Label>
                      <div className="text-sm text-gray-900">{componentToView.modified_by || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Last Modified At</Label>
                      <div className="text-sm text-gray-900">
                        {componentToView.modified_at ? new Date(componentToView.modified_at).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Category
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone if the category is not being used by any components.
            </DialogDescription>
          </DialogHeader>
          {categoryToDelete && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">Category: {categoryToDelete}</p>
                <p className="text-sm text-gray-600 mt-1">
                  This will remove the category from the available options. Components currently using this category will not be affected.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteCategoryDialogOpen(false)
                    setCategoryToDelete(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Category
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Location Confirmation Dialog */}
      <Dialog open={isDeleteLocationDialogOpen} onOpenChange={setIsDeleteLocationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Location
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this location? This action cannot be undone if the location is not being used by any components.
            </DialogDescription>
          </DialogHeader>
          {locationToDelete && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">Location: {locationToDelete}</p>
                <p className="text-sm text-gray-600 mt-1">
                  This will remove the location from the available options. Components currently using this location will not be affected.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteLocationDialogOpen(false)
                    setLocationToDelete(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => locationToDelete && handleDeleteLocation(locationToDelete)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Location
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}