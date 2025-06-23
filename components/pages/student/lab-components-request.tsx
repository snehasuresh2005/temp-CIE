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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LabComponent {
  id: string
  component_name: string
  component_description: string
  component_category: string
  component_quantity: number
  available_quantity: number
  component_location: string
  component_specification: string
  image_url: string | null
  back_image_url?: string | null
  projects: { id: string; name: string }[]
}

interface Project {
  id: string;
  name: string;
  components_needed: string[];
  status: string;
}

interface ComponentRequest {
  id: string
  component_id: string
  component: LabComponent
  quantity: number
  purpose: string
  request_date: string
  required_date: string
  status: string
  approved_date: string | null
  return_date: string | null
  notes: string | null
  project_id: string
  project: Project
}

export function LabComponentsRequest() {
  const { user } = useAuth()
  const [components, setComponents] = useState<LabComponent[]>([])
  const [requests, setRequests] = useState<ComponentRequest[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<LabComponent | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [newRequest, setNewRequest] = useState({
    quantity: 1,
    purpose: "",
    required_date: "",
    project_id: ""
  })

  const [imageStates, setImageStates] = useState<Record<string, boolean>>({}) // false = front, true = back

  const [returnDialogOpen, setReturnDialogOpen] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [user])

  // Validation functions
  const isFormValid = () => {
    return (
      newRequest.quantity > 0 &&
      newRequest.purpose.trim() !== "" &&
      newRequest.required_date !== "" &&
      newRequest.project_id !== ""
    )
  }

  const isProjectApproved = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project && project.status === "ONGOING"
  }

  const canSubmitRequest = () => {
    return isFormValid() && isProjectApproved(newRequest.project_id)
  }

  const getProjectStatusText = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return "Project not found"
    
    switch (project.status) {
      case "PENDING":
        return "Project pending faculty approval"
      case "ONGOING":
        return "Project approved and active"
      case "COMPLETED":
        return "Project completed"
      case "OVERDUE":
        return "Project overdue"
      case "REJECTED":
        return "Project rejected"
      default:
        return "Unknown project status"
    }
  }

  const getProjectStatusColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return "text-gray-500"
    
    switch (project.status) {
      case "PENDING":
        return "text-yellow-600"
      case "ONGOING":
        return "text-green-600"
      case "COMPLETED":
        return "text-blue-600"
      case "OVERDUE":
        return "text-red-600"
      case "REJECTED":
        return "text-red-600"
      default:
        return "text-gray-500"
    }
  }

  const fetchData = async () => {
    if (!user) return
    try {
      setLoading(true)

      // Fetch available components
      const componentsResponse = await fetch("/api/lab-components")
      const componentsData = await componentsResponse.json()
      setComponents(componentsData.components || [])

      // Fetch user's component requests
      const requestsResponse = await fetch(`/api/component-requests?student_id=${user.id}`)
      const requestsData = await requestsResponse.json()
      setRequests(requestsData.requests || [])

      // Fetch user's projects
      const projectsResponse = await fetch(`/api/student/projects`, {
        headers: {
          "x-user-id": user.id,
        },
      })
      const projectsData = await projectsResponse.json()
      setProjects(projectsData.projects || [])

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
      component.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.component_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.component_description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleRequestComponent = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to make a request.",
        variant: "destructive",
      })
      return
    }

    if (!selectedComponent || !newRequest.purpose || !newRequest.required_date || !newRequest.project_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!isProjectApproved(newRequest.project_id)) {
      toast({
        title: "Error",
        description: "You can only request components for approved projects",
        variant: "destructive",
      })
      return
    }

    if (newRequest.quantity > selectedComponent.available_quantity) {
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
          "x-user-id": user.id
        },
        body: JSON.stringify({
          component_id: selectedComponent.id,
          project_id: newRequest.project_id,
          quantity: newRequest.quantity,
          purpose: newRequest.purpose,
          required_date: newRequest.required_date,
          notes: "",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRequests((prev) => [...prev, data.request])

        // Update component availability
        setComponents((prev) =>
          prev.map((comp) =>
            comp.id === selectedComponent.id
              ? { ...comp, available_quantity: comp.available_quantity - newRequest.quantity }
              : comp,
          ),
        )

        setNewRequest({
          quantity: 1,
          purpose: "",
          required_date: "",
          project_id: ""
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
    if (!user) return;
    try {
      const response = await fetch(`/api/component-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({
          status: "PENDING_RETURN",
          return_date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
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

  const getAvailabilityText = (available: number, total: number) => {
    if (available === 0) return "Out of Stock"
    if (available < total * 0.3) return "Low Stock"
    return "Available"
  }

  const hasApprovedProject = (component: LabComponent) => {
    return component.projects.some(compProject => {
      const fullProject = projects.find(p => p.id === compProject.id)
      return fullProject?.status === "ONGOING"
    })
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
            <div className="w-80">
              <Input placeholder="Search components..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComponents.map((component) => (
              <Card key={component.id} className="flex flex-col h-full hover:shadow-lg hover:scale-105 transition-all duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Package className="h-5 w-5" />
                        <span>{component.component_name}</span>
                      </CardTitle>
                      <CardDescription>{component.component_category}</CardDescription>
                    </div>
                    <Badge className={getAvailabilityColor(component.available_quantity, component.component_quantity)}>
                      {getAvailabilityText(component.available_quantity, component.component_quantity)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <div className="space-y-4 flex-grow">
                    {/* Image Display with Fade Animation */}
                    {(component.image_url || component.back_image_url) && (
                      <div className="relative w-full h-48">
                        {/* Front Image */}
                        <div 
                          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                            imageStates[component.id] ? 'opacity-0' : 'opacity-100'
                          }`}
                        >
                          <img
                            src={component.image_url || '/placeholder.jpg'}
                            alt={`Front view of ${component.component_name}`}
                            className="w-full h-full object-contain rounded-lg bg-gray-50"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg"
                            }}
                          />
                        </div>
                        
                        {/* Back Image */}
                        {component.back_image_url && (
                          <div 
                            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                              imageStates[component.id] ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            <img
                              src={component.back_image_url}
                              alt={`Back view of ${component.component_name}`}
                              className="w-full h-full object-contain rounded-lg bg-gray-50"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.jpg"
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Navigation Buttons */}
                        {component.back_image_url && (
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
                        {component.back_image_url && (
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
                    
                    <p className="text-sm text-gray-600 line-clamp-2">{component.component_description}</p>
                    <div className="text-xs text-gray-500">Location: {component.component_location}</div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Total Quantity</Label>
                        <p className="font-medium">{component.component_quantity}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Available</Label>
                        <p className="font-medium">{component.available_quantity}</p>
                      </div>
                    </div>

                    {component.component_specification && (
                      <div>
                        <Label className="text-sm font-medium">Specifications</Label>
                        <p className="text-sm text-gray-600">{component.component_specification}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(component.available_quantity / component.component_quantity) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {Math.round((component.available_quantity / component.component_quantity) * 100)}% Available
                    </div>

                    {/* Project Availability Indicator */}
                    {component.projects.length > 0 && (
                      <div className="mb-2">
                        {hasApprovedProject(component) ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                            ✓ Projects available for requests
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                            ⚠️ Projects pending approval
                          </Badge>
                        )}
                      </div>
                    )}

                    <Dialog open={isRequestDialogOpen && selectedComponent?.id === component.id} onOpenChange={(isOpen) => {
                      setIsRequestDialogOpen(isOpen)
                      if (!isOpen) {
                        setSelectedComponent(null)
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full mt-3"
                          disabled={
                            component.available_quantity === 0 || !hasApprovedProject(component)
                          }
                          onClick={() => setSelectedComponent(component)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {component.available_quantity === 0
                            ? "Out of Stock"
                            : !hasApprovedProject(component)
                              ? "No Approved Projects"
                              : "Request Component"
                          }
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        {selectedComponent && (
                          <>
                            <DialogHeader>
                              <DialogTitle>Request Component</DialogTitle>
                              <DialogDescription>
                                Select the quantity and specify the purpose for your request.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                              <div>
                                <h3 className="text-lg font-semibold mb-2">{selectedComponent.component_name}</h3>
                                <p className="text-sm text-muted-foreground">{selectedComponent.component_description}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4 items-end">
                                <div className="space-y-2">
                                  <Label htmlFor="quantity">Quantity *</Label>
                                  <Input
                                    id="quantity"
                                    type="number"
                                    value={newRequest.quantity}
                                    onChange={(e) =>
                                      setNewRequest((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) }))
                                    }
                                    min="1"
                                    max={selectedComponent.available_quantity || 1}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Available: {selectedComponent.available_quantity}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="purpose">Purpose *</Label>
                                  <Textarea
                                    id="purpose"
                                    value={newRequest.purpose}
                                    onChange={(e) => setNewRequest((prev) => ({ ...prev, purpose: e.target.value }))}
                                    placeholder="Describe how you plan to use this component..."
                                    rows={3}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 items-end">
                                <div className="space-y-2">
                                  <Label htmlFor="required_date">Required Date *</Label>
                                  <Input
                                    id="required_date"
                                    type="date"
                                    value={newRequest.required_date}
                                    onChange={(e) => setNewRequest((prev) => ({ ...prev, required_date: e.target.value }))}
                                    min={new Date().toISOString().split("T")[0]}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="project">Project *</Label>
                                  <Select
                                    value={newRequest.project_id}
                                    onValueChange={(value) => setNewRequest((prev) => ({ ...prev, project_id: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedComponent.projects.length > 0 ? (
                                        selectedComponent.projects.map((componentProject) => {
                                          const fullProject = projects.find(p => p.id === componentProject.id)
                                          return (
                                            <SelectItem
                                              key={componentProject.id}
                                              value={componentProject.id}
                                              className={fullProject?.status !== "ONGOING" ? "opacity-50" : ""}
                                            >
                                              <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                  <span>{componentProject.name}</span>
                                                  {fullProject?.status === "ONGOING" && (
                                                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                                      Available
                                                    </Badge>
                                                  )}
                                                </div>
                                                <span className={`text-xs ${getProjectStatusColor(componentProject.id)}`}>
                                                  {getProjectStatusText(componentProject.id)}
                                                </span>
                                              </div>
                                            </SelectItem>
                                          )
                                        })
                                      ) : (
                                        <div className="p-4 text-sm text-center text-gray-500">
                                          No projects associated with this component.
                                        </div>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsRequestDialogOpen(false)
                                  setSelectedComponent(null)
                                }}
                              >
                                Cancel
                              </Button>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                      <Button
                                        onClick={handleRequestComponent}
                                        disabled={!canSubmitRequest()}
                                        className={!canSubmitRequest() ? "opacity-50 cursor-not-allowed" : ""}
                                      >
                                        Submit Request
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {!canSubmitRequest() && (
                                    <TooltipContent>
                                      <div className="max-w-xs">
                                        {!isFormValid() && (
                                          <p>Please fill in all required fields (quantity, purpose, required date, and project)</p>
                                        )}
                                        {isFormValid() && !isProjectApproved(newRequest.project_id) && (
                                          <p>You can only request components for projects with "ONGOING" status (approved by faculty)</p>
                                        )}
                                        {selectedComponent.projects.length === 0 && (
                                          <p>No projects are associated with this component.</p>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                          <h3 className="font-medium">{request.component.component_name}</h3>
                          <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
                          <p className="text-xs text-gray-500">
                            Requested: {new Date(request.request_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Return by: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          {request.project_id && (
                            <div className="space-y-1">
                              <p className="text-xs text-blue-600">
                                Project: {projects.find(p => p.id === request.project_id)?.name || 'Unknown'}
                              </p>
                              <p className={`text-xs ${getProjectStatusColor(request.project_id)}`}>
                                Status: {getProjectStatusText(request.project_id)}
                              </p>
                            </div>
                          )}
                          {request.status === "COLLECTED" && isOverdue(request.required_date) && (
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
                        <Dialog open={returnDialogOpen === request.id} onOpenChange={(open) => setReturnDialogOpen(open ? request.id : null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className={isOverdue(request.required_date) ? "border-red-500 text-red-600 hover:bg-red-50" : ""}
                            >
                              {isOverdue(request.required_date) ? "⚠️ Return Overdue Item" : "Return Component"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Return</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to mark this component as returned? This will notify the faculty for confirmation.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end space-x-2 mt-4">
                              <Button variant="outline" onClick={() => setReturnDialogOpen(null)}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={async () => {
                                  await handleReturnComponent(request.id)
                                  setReturnDialogOpen(null)
                                }}
                              >
                                Confirm Return
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
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
