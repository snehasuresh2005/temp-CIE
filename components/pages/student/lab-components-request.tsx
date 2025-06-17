"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Package, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface LabComponent {
  id: string
  name: string
  description: string
  category: string
  quantity: number
  availableQuantity: number
  location: string
  specifications: string
}

interface ComponentRequest {
  id: string
  componentId: string
  component: LabComponent
  quantity: number
  purpose: string
  requestDate: string
  requiredDate: string
  status: string
  approvedDate: string | null
  returnDate: string | null
  notes: string | null
}

export function LabComponentsRequest() {
  const { user } = useAuth()
  const [components, setComponents] = useState<LabComponent[]>([])
  const [requests, setRequests] = useState<ComponentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<LabComponent | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [newRequest, setNewRequest] = useState({
    quantity: 1,
    purpose: "",
    requiredDate: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch available components
      const componentsResponse = await fetch("/api/lab-components")
      const componentsData = await componentsResponse.json()
      setComponents(componentsData.components || [])

      // Fetch user's requests
      const requestsResponse = await fetch("/api/component-requests")
      const requestsData = await requestsResponse.json()
      setRequests(requestsData.requests || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
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
      component.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleRequestComponent = async () => {
    if (!selectedComponent || !newRequest.purpose || !newRequest.requiredDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (newRequest.quantity > selectedComponent.availableQuantity) {
      toast({
        title: "Error",
        description: "Requested quantity exceeds available quantity",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/component-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          componentId: selectedComponent.id,
          quantity: newRequest.quantity,
          purpose: newRequest.purpose,
          requiredDate: newRequest.requiredDate,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRequests((prev) => [...prev, data.request])

        // Update component availability
        setComponents((prev) =>
          prev.map((comp) =>
            comp.id === selectedComponent.id
              ? { ...comp, availableQuantity: comp.availableQuantity - newRequest.quantity }
              : comp,
          ),
        )

        setNewRequest({
          quantity: 1,
          purpose: "",
          requiredDate: "",
        })
        setSelectedComponent(null)
        setIsRequestDialogOpen(false)

        toast({
          title: "Success",
          description: "Component request submitted successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit request")
      }
    } catch (error) {
      console.error("Error submitting request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit request",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "returned":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "returned":
        return <Package className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage === 0) return "bg-red-100 text-red-800"
    if (percentage < 30) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
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
          <h1 className="text-3xl font-bold text-gray-900">Lab Components Request</h1>
          <p className="text-gray-600 mt-2">Request lab equipment and components for your projects</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Components ({components.length})</TabsTrigger>
          <TabsTrigger value="requests">My Requests ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No components available</h3>
                  <p className="text-gray-600">Check back later for available components.</p>
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
                        {component.availableQuantity > 0 ? "Available" : "Out of Stock"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{component.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Available</Label>
                          <p className="font-medium">{component.availableQuantity}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Location</Label>
                          <p className="font-medium">{component.location}</p>
                        </div>
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

                      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full"
                            disabled={component.availableQuantity === 0}
                            onClick={() => setSelectedComponent(component)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Request Component
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Request Component</DialogTitle>
                            <DialogDescription>Request {selectedComponent?.name} for your project</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="quantity">Quantity *</Label>
                              <Input
                                id="quantity"
                                type="number"
                                value={newRequest.quantity}
                                onChange={(e) =>
                                  setNewRequest((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) }))
                                }
                                min="1"
                                max={selectedComponent?.availableQuantity || 1}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Available: {selectedComponent?.availableQuantity}
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="purpose">Purpose *</Label>
                              <Textarea
                                id="purpose"
                                value={newRequest.purpose}
                                onChange={(e) => setNewRequest((prev) => ({ ...prev, purpose: e.target.value }))}
                                placeholder="Describe how you plan to use this component..."
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label htmlFor="requiredDate">Required Date *</Label>
                              <Input
                                id="requiredDate"
                                type="date"
                                value={newRequest.requiredDate}
                                onChange={(e) => setNewRequest((prev) => ({ ...prev, requiredDate: e.target.value }))}
                                min={new Date().toISOString().split("T")[0]}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsRequestDialogOpen(false)
                                setSelectedComponent(null)
                                setNewRequest({ quantity: 1, purpose: "", requiredDate: "" })
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleRequestComponent}>Submit Request</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-gray-600">Submit your first component request to get started.</p>
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{request.component.name}</h3>
                          <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
                          <p className="text-xs text-gray-500">
                            Requested: {new Date(request.requestDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Required by: {new Date(request.requiredDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(request.status)}
                            <span>{request.status}</span>
                          </div>
                        </Badge>
                        {request.approvedDate && (
                          <p className="text-xs text-gray-500">
                            Approved: {new Date(request.approvedDate).toLocaleDateString()}
                          </p>
                        )}
                        {request.returnDate && (
                          <p className="text-xs text-gray-500">
                            Returned: {new Date(request.returnDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Purpose:</Label>
                      <p className="text-sm text-gray-600">{request.purpose}</p>
                      {request.notes && (
                        <div className="mt-2">
                          <Label className="text-sm font-medium">Notes:</Label>
                          <p className="text-sm text-gray-600">{request.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
