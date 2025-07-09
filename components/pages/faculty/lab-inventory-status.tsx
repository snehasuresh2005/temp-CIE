"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Package, Search, AlertTriangle, Cpu } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface LabComponent {
  id: string
  component_name: string
  component_category: string
  component_quantity: number
  component_location: string
}

export function LabInventoryStatus() {
  const { user } = useAuth()
  const [components, setComponents] = useState<LabComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchComponents()
  }, [])

  const fetchComponents = async () => {
    try {
      const response = await fetch("/api/lab-components")
      const data = await response.json()
      setComponents(data.components || [])
    } catch (error) {
      console.error("Error fetching lab components:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredComponents = components.filter(component =>
    component.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.component_category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getQuantityColor = (quantity: number) => {
    if (quantity === 0) return "bg-red-100 text-red-800"
    if (quantity < 10) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getQuantityText = (quantity: number) => {
    if (quantity === 0) return "Out of Stock"
    if (quantity < 10) return "Low Stock"
    return "Available"
  }

  if (loading) {
    return <div className="text-center py-4">Loading lab inventory...</div>
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search lab components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Components</p>
                <p className="text-2xl font-bold">{components.length}</p>
              </div>
              <Cpu className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {components.filter(comp => comp.component_quantity > 0).length}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {components.filter(comp => comp.component_quantity === 0).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {components.filter(comp => 
                    comp.component_quantity > 0 && 
                    comp.component_quantity < 10
                  ).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Components List */}
      <div className="grid gap-4">
        {filteredComponents.map((component) => (
          <Card key={component.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <Cpu className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{component.component_name}</h3>
                      <p className="text-sm text-gray-600">{component.component_category}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Qty: {component.component_quantity}
                    </p>
                    <p className="text-xs text-gray-500">{component.component_location}</p>
                  </div>
                  
                  <Badge className={getQuantityColor(component.component_quantity)}>
                    {getQuantityText(component.component_quantity)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredComponents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No components found</h3>
            <p className="text-gray-600">Try adjusting your search terms.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}