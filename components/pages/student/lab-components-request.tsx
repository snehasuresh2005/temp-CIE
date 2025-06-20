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
import { Plus, Package, Clock, CheckCircle, XCircle, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

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
  facultyId: string | null
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

  const [facultyList, setFacultyList] = useState<any[]>([])
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("")
  const [imageStates, setImageStates] = useState<Record<string, boolean>>({}) // false = front, true = back

  useEffect(() => {
    fetchData()
    fetchFaculty()
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

  const fetchFaculty = async () => {
    try {
      const res = await fetch('/api/faculty')
      const data = await res.json()
      setFacultyList(data.faculty || [])
    } catch (e) {
      // ignore
    }
  }

  const filteredComponents = components.filter(
    (component) =>
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleRequestComponent = async () => {
    if (!selectedComponent || !newRequest.purpose || !newRequest.requiredDate || !selectedFacultyId) {
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
          facultyId: selectedFacultyId,
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

  const handleReturnComponent = async (requestId: string) => {
    if (!confirm("Are you sure you want to mark this component as returned? This will be reviewed by faculty.")) return

    try {
      const response = await fetch(`/api/component-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PENDING_RETURN",
          returnDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        // Refresh data to update the UI
        fetchData()
        toast({
          title: "Return Request Submitted",
          description: "Your return request has been submitted and is pending faculty approval",
        })
      } else {
        throw new Error("Failed to submit return request")
      }
    } catch (error) {
      console.error("Error submitting return request:", error)
      toast({
        title: "Error",
        description: "Failed to submit return request",
        variant: "destructive",
      })
    }
  }

  const isOverdue = (expectedReturnDate: string) => {
    return new Date(expectedReturnDate) < new Date()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "collected":
        return "bg-blue-100 text-blue-800"
      case "pending_return":
        return "bg-orange-100 text-orange-800"
      case "returned":
        return "bg-purple-100 text-purple-800"
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
      case "collected":
        return <Package className="h-4 w-4" />
      case "pending_return":
        return <Clock className="h-4 w-4" />
      case "returned":
        return <CheckCircle className="h-4 w-4" />
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
                      <Badge className={getAvailabilityColor(component.availableQuantity, component.totalQuantity)}>
                        {component.availableQuantity > 0 ? "Available" : "Out of Stock"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Image Display with Fade Animation */}
                      {(component.imageUrl || component.backImageUrl) && (
                        <div className="relative w-full h-48">
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
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.jpg"
                              }}
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
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.jpg"
                                }}
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
                      
                      <p className="text-sm text-gray-600 line-clamp-2">{component.description}</p>
                      <div className="text-xs text-gray-500">Location: {component.location}</div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Total Quantity</Label>
                          <p className="font-medium">{component.totalQuantity}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Available</Label>
                          <p className="font-medium">{component.availableQuantity}</p>
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
                            width: `${(component.availableQuantity / component.totalQuantity) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        {Math.round((component.availableQuantity / component.totalQuantity) * 100)}% Available
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
                              <Label htmlFor="faculty">Faculty *</Label>
                              <select
                                id="faculty"
                                className="w-full border rounded px-2 py-1"
                                value={selectedFacultyId}
                                onChange={e => setSelectedFacultyId(e.target.value)}
                              >
                                <option value="">Select Faculty</option>
                                {facultyList.map(fac => (
                                  <option key={fac.id} value={fac.id}>{fac.user?.name || fac.id}</option>
                                ))}
                              </select>
                            </div>
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
                            Return by: {new Date(request.requiredDate).toLocaleDateString()}
                          </p>
                          {request.facultyId && (
                            <p className="text-xs text-blue-600">
                              Faculty: {facultyList.find(f => f.id === request.facultyId)?.user?.name || 'Unknown'}
                            </p>
                          )}
                          {request.status === "COLLECTED" && isOverdue(request.requiredDate) && (
                            <p className="text-xs text-red-600 font-medium">
                              ⚠️ OVERDUE - Please return immediately
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(request.status)}
                            <span>{request.status}</span>
                          </div>
                        </Badge>
                        {request.status === "APPROVED" && (
                          <p className="text-xs text-green-600">
                            ✓ Ready for collection
                          </p>
                        )}
                        {request.status === "COLLECTED" && (
                          <p className="text-xs text-blue-600">
                            📦 In your possession
                          </p>
                        )}
                        {request.status === "RETURNED" && (
                          <p className="text-xs text-gray-600">
                            ✅ Successfully returned
                          </p>
                        )}
                        {request.status === "REJECTED" && (
                          <p className="text-xs text-red-600">
                            ❌ Request rejected
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      {request.status === "COLLECTED" && (
                        <Button
                          variant="outline"
                          onClick={() => handleReturnComponent(request.id)}
                          className={isOverdue(request.requiredDate) ? "border-red-500 text-red-600 hover:bg-red-50" : ""}
                        >
                          {isOverdue(request.requiredDate) ? "⚠️ Return Overdue Item" : "Return Component"}
                        </Button>
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
