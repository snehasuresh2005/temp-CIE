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
import { Plus, Package, Clock, CheckCircle, XCircle, RefreshCw, ChevronRight, ChevronLeft, ClipboardCheck, AlertTriangle, Info, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Utility functions - declared at module scope for hoisting
export function isOverdue(expectedReturnDate: string): boolean {
  return new Date(expectedReturnDate) < new Date();
}

export function getOverdueDays(expectedReturnDate: string): number {
  const diffMs = new Date().getTime() - new Date(expectedReturnDate).getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

type ViewType = 'available' | 'requests' | 'active' | 'overdue'

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
  faculty_notes: any
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



  const [userReturnDialogOpen, setUserReturnDialogOpen] = useState<string | null>(null)
  const [infoDialogOpen, setInfoDialogOpen] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("All")


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
      const requestsResponse = await fetch("/api/component-requests", {
        headers: {
          "x-user-id": user.id,
        },
      })
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

  // Get unique categories
  const categories = ["All", ...Array.from(new Set(components.map(i => i.component_category)).values())]

  // Updated filtering logic
  const filteredComponents = components.filter(
    (component) => {
      const matchesSearch =
        component.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.component_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.component_description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "All" || component.component_category === categoryFilter
      return matchesSearch && matchesCategory
    }
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
        // Refetch all data to ensure consistency
        fetchData()

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
          status: "USER_RETURNED",  // Student confirms they have returned the component
          return_date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        fetchData()
        toast({
          title: "Return Confirmed",
          description: "You have confirmed returning the component. Awaiting coordinator verification.",
        })
      } else {
        throw new Error("Failed to confirm return")
      }
    } catch (error) {
      console.error("Error confirming return:", error)
      toast({
        title: "Error",
        description: "Failed to confirm return",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "COLLECTED":
        return "bg-blue-100 text-blue-800"
    case "USER_RETURNED":
      return "bg-purple-100 text-purple-800"
    case "RETURNED":
      return "bg-gray-100 text-gray-800"
    case "OVERDUE":
      return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />
      case "REJECTED":
        return <XCircle className="h-4 w-4" />
      case "COLLECTED":
        return <Package className="h-4 w-4" />
    case "USER_RETURNED":
      return <CheckCircle className="h-4 w-4" />
    case "RETURNED":
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

  const activeRequests = requests.filter(r => r.status === "APPROVED" || r.status === "COLLECTED")
  const overdueRequests = requests.filter(r => r.status === "COLLECTED" && isOverdue(r.required_date))

  const [currentView, setCurrentView] = useState<ViewType>('available')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading lab components...</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lab Components</h1>
          </div>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Clickable Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-purple-100 hover:border-purple-300 ${
              currentView === 'available' ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-200' : 'hover:ring-1 hover:ring-purple-200'
            }`}
            onClick={() => setCurrentView('available')}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className={`h-5 w-5 transition-colors duration-200 ${
                  currentView === 'available' ? 'text-purple-600' : 'text-purple-500 group-hover:text-purple-700'
                }`} />
                <div>
                  <p className={`text-2xl font-bold transition-colors duration-200 ${
                    currentView === 'available' ? 'text-purple-700' : 'text-gray-900'
                  }`}>
                    {components.length}
                  </p>
                  <p className={`text-sm transition-colors duration-200 ${
                    currentView === 'available' ? 'text-purple-600' : 'text-gray-600'
                  }`}>Available Components</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-blue-100 hover:border-blue-300 ${
              currentView === 'requests' ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'hover:ring-1 hover:ring-blue-200'
            }`}
            onClick={() => setCurrentView('requests')}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ClipboardCheck className={`h-5 w-5 transition-colors duration-200 ${
                  currentView === 'requests' ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-700'
                }`} />
                <div>
                  <p className={`text-2xl font-bold transition-colors duration-200 ${
                    currentView === 'requests' ? 'text-blue-700' : 'text-gray-900'
                  }`}>{requests.length}</p>
                  <p className={`text-sm transition-colors duration-200 ${
                    currentView === 'requests' ? 'text-blue-600' : 'text-gray-600'
                  }`}>My Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-green-100 hover:border-green-300 ${
              currentView === 'active' ? 'ring-2 ring-green-500 bg-green-50 border-green-200' : 'hover:ring-1 hover:ring-green-200'
            }`}
            onClick={() => setCurrentView('active')}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className={`h-5 w-5 transition-colors duration-200 ${
                  currentView === 'active' ? 'text-green-600' : 'text-green-500 group-hover:text-green-700'
                }`} />
                <div>
                  <p className={`text-2xl font-bold transition-colors duration-200 ${
                    currentView === 'active' ? 'text-green-700' : 'text-gray-900'
                  }`}>{activeRequests.length}</p>
                  <p className={`text-sm transition-colors duration-200 ${
                    currentView === 'active' ? 'text-green-600' : 'text-gray-600'
                  }`}>Active Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-red-100 hover:border-red-300 ${
              currentView === 'overdue' ? 'ring-2 ring-red-500 bg-red-50 border-red-200' : 'hover:ring-1 hover:ring-red-200'
            }`}
            onClick={() => setCurrentView('overdue')}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`h-5 w-5 transition-colors duration-200 ${
                  currentView === 'overdue' ? 'text-red-600' : 'text-red-500 group-hover:text-red-700'
                }`} />
                <div>
                  <p className={`text-2xl font-bold transition-colors duration-200 ${
                    currentView === 'overdue' ? 'text-red-700' : 'text-gray-900'
                  }`}>{overdueRequests.length}</p>
                  <p className={`text-sm transition-colors duration-200 ${
                    currentView === 'overdue' ? 'text-red-600' : 'text-gray-600'
                  }`}>Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Content Based on Selected View */}
        {currentView === 'available' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Available Lab Components</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 items-center mb-4 pb-1">
                    <div className="relative w-56">
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
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Category">{categoryFilter !== "All" ? categoryFilter : undefined}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredComponents.map((component) => (
                <Card key={component.id} className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="flex items-center space-x-2 text-sm">
                                    <Package className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{component.component_name}</span>
                                  </CardTitle>
                                  <CardDescription className="text-xs">{component.component_category}</CardDescription>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <Badge className={`${getAvailabilityColor(component.available_quantity, component.component_quantity)} text-xs px-1 py-0.5`}>
                                    {getAvailabilityText(component.available_quantity, component.component_quantity)}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                    onClick={() => setInfoDialogOpen(component.id)}
                                  >
                                    <Info className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col p-3 pt-0">
                              <div className="space-y-3 flex-grow">
                                {/* Image Display */}
                                {(component.image_url || component.back_image_url) && (
                                  <div className="relative w-full h-32">
                                    {/* Front Image */}
                                    <div 
                                      className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                                        imageStates[component.id] ? 'opacity-0' : 'opacity-100'
                                      }`}
                                    >
                                      <img
                                        src={component.image_url || '/placeholder.jpg'}
                                        alt={`Front view of ${component.component_name}`}
                                        className="w-full h-full object-contain rounded-md bg-gray-50"
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
                                          className="w-full h-full object-contain rounded-md bg-gray-50"
                                          onError={(e) => {
                                            e.currentTarget.src = "/placeholder.jpg"
                                          }}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Navigation Buttons */}
                                    {component.back_image_url && (
                                      <>
                                        {!imageStates[component.id] && (
                                          <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/80 hover:bg-white shadow-sm z-10"
                                            onClick={() => setImageStates(prev => ({ ...prev, [component.id]: true }))}
                                          >
                                            <ChevronRight className="h-3 w-3" />
                                          </Button>
                                        )}
                                        {imageStates[component.id] && (
                                          <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/80 hover:bg-white shadow-sm z-10"
                                            onClick={() => setImageStates(prev => ({ ...prev, [component.id]: false }))}
                                          >
                                            <ChevronLeft className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </>
                                    )}

                                    {/* Image Indicator */}
                                    {component.back_image_url && (
                                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                                        <div 
                                          className={`w-1 h-1 rounded-full transition-colors duration-300 ${
                                            !imageStates[component.id] ? 'bg-white' : 'bg-white/50'
                                          }`}
                                        />
                                        <div 
                                          className={`w-1 h-1 rounded-full transition-colors duration-300 ${
                                            imageStates[component.id] ? 'bg-white' : 'bg-white/50'
                                          }`}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <div className="space-y-1">
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                    <div><span className="font-medium">Available:</span> {component.available_quantity}</div>
                                    <div><span className="font-medium">Total:</span> {component.component_quantity}</div>
                                  </div>
                                  
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">Location:</span> {component.component_location}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3">
                                <Dialog open={isRequestDialogOpen && selectedComponent?.id === component.id} onOpenChange={(isOpen) => {
                                  setIsRequestDialogOpen(isOpen)
                                  if (!isOpen) {
                                    setSelectedComponent(null)
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="w-full h-8 text-xs"
                                      disabled={
                                        component.available_quantity === 0 || !hasApprovedProject(component)
                                      }
                                      onClick={() => setSelectedComponent(component)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      {component.available_quantity === 0
                                        ? "Out of Stock"
                                        : !hasApprovedProject(component)
                                          ? "No Approved Projects"
                                          : "Request"
                                      }
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-lg">
                                    {selectedComponent && (
                                      <>
                                        <DialogHeader>
                                          <DialogTitle>Request Component</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 py-4">
                                          {/* Top row: Name and Quantity */}
                                          <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
                                            <div className="flex-1 mb-2 md:mb-0">
                                              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedComponent.component_name}</h2>
                                              <p className="text-sm text-gray-500">{selectedComponent.component_category}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Label htmlFor="quantity" className="mb-0">Quantity *</Label>
                                              <Input
                                                id="quantity"
                                                type="number"
                                                value={newRequest.quantity}
                                                onChange={(e) => setNewRequest((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) }))}
                                                min="1"
                                                max={selectedComponent.available_quantity || 1}
                                                className="w-20 px-2 py-1 text-sm"
                                              />
                                              <span className="text-xs text-gray-500 ml-2">Available: {selectedComponent.available_quantity}</span>
                                            </div>
                                          </div>
                                          {/* Purpose textarea */}
                                          <div className="space-y-2">
                                            <Label htmlFor="purpose">Purpose *</Label>
                                            <Textarea
                                              id="purpose"
                                              value={newRequest.purpose}
                                              onChange={(e) => setNewRequest((prev) => ({ ...prev, purpose: e.target.value }))}
                                              placeholder="Describe how you plan to use this component..."
                                              rows={5}
                                              className="w-full text-base p-3 min-h-[120px] resize-vertical border border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                          </div>
                                          {/* Required date and project */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="required_date">Return Date *</Label>
                                              <Input
                                                id="required_date"
                                                type="date"
                                                value={newRequest.required_date}
                                                onChange={(e) => setNewRequest((prev) => ({ ...prev, required_date: e.target.value }))}
                                                min={new Date().toISOString().split("T")[0]}
                                                className="text-base py-2 border-gray-200 rounded-lg"
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
                                          {/* Action buttons */}
                                          <div className="flex justify-end space-x-2 pt-4">
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {currentView === 'requests' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClipboardCheck className="h-5 w-5" />
                  <span>My Requests</span>
                </CardTitle>
                <CardDescription>
                  View all your component requests and their current status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
              {requests.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900 mb-1">No requests yet</h3>
                    <p className="text-sm text-gray-600">Submit your first component request to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                requests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-orange-400">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate text-sm">{request.component.component_name}</h3>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                              <span>Qty: {request.quantity}</span>
                              <span>Requested: {new Date(request.request_date).toLocaleDateString()}</span>
                              <span className={isOverdue(request.required_date) ? "text-red-600 font-medium" : ""}>
                                Due: {new Date(request.required_date).toLocaleDateString()}
                              </span>
                            </div>
                            {request.project_id && (
                              <div className="mt-1">
                                <p className="text-xs text-orange-600">
                                  Project: {projects.find(p => p.id === request.project_id)?.name || 'Unknown'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(request.status)} text-xs px-2 py-1`}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(request.status)}
                              <span>{request.status}</span>
                            </div>
                          </Badge>
                          
                          {/* Status-specific actions and messages */}
                          <div className="text-right min-w-0">
                            {request.status === "COLLECTED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setUserReturnDialogOpen(request.id)}
                                className="text-xs"
                              >
                                I Returned It
                              </Button>
                            )}

                            {request.status === "USER_RETURNED" && (
                              <div className="text-xs text-purple-600 font-medium">
                                Waiting for coordinator verification
                              </div>
                            )}
                            
                            {request.status === "RETURNED" && (
                              <p className="text-xs text-green-600">
                                ✅ Returned
                              </p>
                            )}
                            
                            {request.status === "REJECTED" && (
                              <p className="text-xs text-red-600">
                                ❌ Rejected
                              </p>
                            )}

                            {/* Show overdue warning for collected items */}
                            {request.status === "COLLECTED" && isOverdue(request.required_date) && (
                              <p className="text-xs text-red-600 font-medium mt-1">
                                ⚠️ {getOverdueDays(request.required_date)}d overdue
                              </p>
                            )}
                          </div>
                        </div>
                        
                      </div>
                      {request.faculty_notes && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          <strong>Faculty Notes:</strong> {request.faculty_notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {currentView === 'active' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Active Requests</span>
                </CardTitle>
                <CardDescription>
                  View your currently active component requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
              {activeRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900 mb-1">No active requests</h3>
                    <p className="text-sm text-gray-600">You have no active component requests.</p>
                  </CardContent>
                </Card>
              ) : (
                activeRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-green-400">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate text-sm">{request.component.component_name}</h3>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                              <span>Qty: {request.quantity}</span>
                              <span>Requested: {new Date(request.request_date).toLocaleDateString()}</span>
                              <span className={isOverdue(request.required_date) ? "text-red-600 font-medium" : ""}>
                                Due: {new Date(request.required_date).toLocaleDateString()}
                              </span>
                            </div>
                            {request.project_id && (
                              <div className="mt-1">
                                <p className="text-xs text-green-600">
                                  Project: {projects.find(p => p.id === request.project_id)?.name || 'Unknown'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(request.status)} text-xs px-2 py-1`}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(request.status)}
                              <span>{request.status}</span>
                            </div>
                          </Badge>
                          
                          {/* Status-specific actions and messages */}
                          <div className="text-right min-w-0">
                            {request.status === "COLLECTED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setUserReturnDialogOpen(request.id)}
                                className="text-xs"
                              >
                                I Returned It
                              </Button>
                            )}

                            {request.status === "USER_RETURNED" && (
                              <div className="text-xs text-purple-600 font-medium">
                                Waiting for coordinator verification
                              </div>
                            )}
                            
                            {request.status === "RETURNED" && (
                              <p className="text-xs text-green-600">
                                ✅ Returned
                              </p>
                            )}
                            
                            {request.status === "REJECTED" && (
                              <p className="text-xs text-red-600">
                                ❌ Rejected
                              </p>
                            )}

                            {/* Show overdue warning for collected items */}
                            {request.status === "COLLECTED" && isOverdue(request.required_date) && (
                              <p className="text-xs text-red-600 font-medium mt-1">
                                ⚠️ {getOverdueDays(request.required_date)}d overdue
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {request.faculty_notes && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          <strong>Faculty Notes:</strong> {request.faculty_notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {currentView === 'overdue' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Overdue Requests</span>
                </CardTitle>
                <CardDescription>
                  View your overdue component requests that need attention.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {overdueRequests.length === 0 ? (
                    <Card>
                      <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <h3 className="font-medium text-gray-900 mb-1">No overdue requests</h3>
                        <p className="text-sm text-gray-600">You have no overdue component requests.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    overdueRequests.map((request) => (
                      <Card key={request.id} className="border-l-4 border-l-red-400">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate text-sm">{request.component.component_name}</h3>
                                <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                                  <span>Qty: {request.quantity}</span>
                                  <span>Requested: {new Date(request.request_date).toLocaleDateString()}</span>
                                  <span className={isOverdue(request.required_date) ? "text-red-600 font-medium" : ""}>
                                    Due: {new Date(request.required_date).toLocaleDateString()}
                                  </span>
                                </div>
                                {request.project_id && (
                                  <div className="mt-1">
                                    <p className="text-xs text-red-600">
                                      Project: {projects.find(p => p.id === request.project_id)?.name || 'Unknown'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${getStatusColor(request.status)} text-xs px-2 py-1`}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(request.status)}
                                  <span>{request.status}</span>
                                </div>
                              </Badge>
                              {/* Status-specific actions and messages */}
                              <div className="text-right min-w-0">
                                {request.status === "COLLECTED" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setUserReturnDialogOpen(request.id)}
                                    className="text-xs"
                                  >
                                    I Returned It
                                  </Button>
                                )}
                                {request.status === "USER_RETURNED" && (
                                  <div className="text-xs text-purple-600 font-medium">
                                    Waiting for coordinator verification
                                  </div>
                                )}
                                {request.status === "RETURNED" && (
                                  <p className="text-xs text-green-600">
                                    ✅ Returned
                                  </p>
                                )}
                                {request.status === "REJECTED" && (
                                  <p className="text-xs text-red-600">
                                    ❌ Rejected
                                  </p>
                                )}
                                {/* Show overdue warning for collected items */}
                                {request.status === "COLLECTED" && isOverdue(request.required_date) && (
                                  <p className="text-xs text-red-600 font-medium mt-1">
                                    ⚠️ {getOverdueDays(request.required_date)}d overdue
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {request.faculty_notes && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                              <strong>Faculty Notes:</strong> {request.faculty_notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

                  {/* User Returned Dialog */}
                  <Dialog open={!!userReturnDialogOpen} onOpenChange={(open) => !open && setUserReturnDialogOpen(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Component Return</DialogTitle>
                        <DialogDescription>
                          Please confirm that you have physically returned this component to the lab. The coordinator will then verify and complete the return process.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setUserReturnDialogOpen(null)}>
                          Cancel
                        </Button>
                        <Button onClick={() => {
                          if (userReturnDialogOpen) {
                            handleReturnComponent(userReturnDialogOpen)
                            setUserReturnDialogOpen(null)
                          }
                        }}>
                          Yes, I Returned It
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Component Info Dialog */}
                  <Dialog open={!!infoDialogOpen} onOpenChange={(open) => !open && setInfoDialogOpen(null)}>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Component Details</DialogTitle>
                      </DialogHeader>
                      {infoDialogOpen && (() => {
                        const component = components.find(c => c.id === infoDialogOpen)
                        if (!component) return null
                        
                        return (
                          <div className="space-y-4">
                            {/* Component Name and Category */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Package className="h-5 w-5 text-gray-500" />
                                <h3 className="text-lg font-semibold">{component.component_name}</h3>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {component.component_category}
                              </Badge>
                            </div>

                            {/* Description */}
                            {/* <div className="space-y-2">
                              <h4 className="font-medium text-sm">Description</h4>
                              <p className="text-sm text-gray-600">{component.component_description}</p>
                            </div> */}

                            {/* Specifications */}
                            {/* <div className="space-y-2">
                              <h4 className="font-medium text-sm">Specifications</h4>
                              <p className="text-sm text-gray-600">{component.component_specification}</p>
                            </div> */}

                            {/* Availability */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <h4 className="font-medium text-sm">Total Quantity</h4>
                                <p className="text-lg font-semibold text-gray-900">{component.component_quantity}</p>
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-medium text-sm">Available</h4>
                                <p className={`text-lg font-semibold ${component.available_quantity === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {component.available_quantity}
                                </p>
                              </div>
                            </div>

                            {/* On Loan */}
                            <div className="space-y-1">
                              <h4 className="font-medium text-sm">Currently On Loan</h4>
                              <p className="text-lg font-semibold text-blue-600">
                                {component.component_quantity - component.available_quantity}
                              </p>
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Location</h4>
                              <p className="text-sm text-gray-600">{component.component_location}</p>
                            </div>

                            {/* Associated Projects */}
                            {component.projects && component.projects.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Associated Projects</h4>
                                <div className="space-y-1">
                                  {component.projects.map((project) => (
                                    <Badge key={project.id} variant="outline" className="text-xs mr-1">
                                      {project.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Availability Status */}
                            <div className="pt-2 border-t">
                              <Badge className={`${getAvailabilityColor(component.available_quantity, component.component_quantity)}`}>
                                {getAvailabilityText(component.available_quantity, component.component_quantity)}
                              </Badge>
                            </div>
                          </div>
                        )
                      })()}
                    </DialogContent>
                  </Dialog>
    </>

  )
}
