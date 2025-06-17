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
import { Plus, Package, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LabComponent {
  id: string
  name: string
  description: string
  category: string
  quantity: number
  availableQuantity: number
  location: string
  specifications: string
  imageUrl: string | null
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
    quantity: 1,
    location: "",
    specifications: "",
  })

  useEffect(() => {
    fetchComponents()
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

  const filteredComponents = components.filter(
    (component) =>
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.location.toLowerCase().includes(searchTerm.toLowerCase()),
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

    try {
      const response = await fetch("/api/lab-components", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newComponent,
          availableQuantity: newComponent.quantity,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComponents((prev) => [...prev, data.component])
        setNewComponent({
          name: "",
          description: "",
          category: "",
          quantity: 1,
          location: "",
          specifications: "",
        })
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

  const categories = ["Electronics", "Mechanical", "Chemical", "Software", "Tools", "Consumables"]
  const locations = ["Lab A", "Lab B", "Lab C", "Storage Room", "Equipment Room"]

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Lab Component</DialogTitle>
                <DialogDescription>Enter the details for the new lab component</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Component Name *</Label>
                  <Input
                    id="name"
                    value={newComponent.name}
                    onChange={(e) => setNewComponent((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Arduino Uno R3"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(value) => setNewComponent((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newComponent.quantity}
                    onChange={(e) =>
                      setNewComponent((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) }))
                    }
                    min="1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newComponent.description}
                    onChange={(e) => setNewComponent((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Component description..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Select onValueChange={(value) => setNewComponent((prev) => ({ ...prev, location: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="specifications">Specifications</Label>
                  <Input
                    id="specifications"
                    value={newComponent.specifications}
                    onChange={(e) => setNewComponent((prev) => ({ ...prev, specifications: e.target.value }))}
                    placeholder="Technical specifications"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddComponent}>Add Component</Button>
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
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>{component.name}</span>
                    </CardTitle>
                    <CardDescription>{component.category}</CardDescription>
                  </div>
                  <Badge className={getAvailabilityColor(component.availableQuantity, component.quantity)}>
                    {getAvailabilityText(component.availableQuantity, component.quantity)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{component.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Total Quantity</Label>
                      <p className="font-medium">{component.quantity}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Available</Label>
                      <p className="font-medium">{component.availableQuantity}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm text-gray-600">{component.location}</p>
                  </div>

                  {component.specifications && (
                    <div>
                      <Label className="text-sm font-medium">Specifications</Label>
                      <p className="text-sm text-gray-600">{component.specifications}</p>
                    </div>
                  )}

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(component.availableQuantity / component.quantity) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {Math.round((component.availableQuantity / component.quantity) * 100)}% Available
                  </div>

                  <div className="flex justify-end space-x-2">
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
    </div>
  )
}
