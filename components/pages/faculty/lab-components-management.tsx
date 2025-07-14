"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle, Clock, AlertTriangle, Package, X, Check, RefreshCw, Wrench, ClipboardCheck, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

// Utility functions
export function isOverdue(expectedReturnDate: string): boolean {
  return new Date(expectedReturnDate) < new Date();
}

export function getOverdueDays(expectedReturnDate: string): number {
  const diffMs = new Date().getTime() - new Date(expectedReturnDate).getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

type ViewType = 'pending' | 'active' | 'overdue' | 'inventory'

interface LabComponent {
  id: string
  component_name: string
  component_description: string
  image_url: string | null
  component_quantity: number
  available_quantity: number
  component_category: string
  component_location: string
  requests: ComponentRequest[]
}

interface Project {
  id: string;
  name: string;
}

interface ComponentRequest {
  id: string
  student_id?: string
  faculty_id?: string
  component_id: string
  quantity: number
  request_date: string
  required_date: string
  collection_date: string | null
  return_date: string | null
  status: string
  notes: string | null
  faculty_notes: string | null
  purpose: string
  component?: LabComponent
  project: Project
  student?: {
    user: {
      name: string
      email: string
    }
  }
  faculty?: {
    user: {
      name: string
      email: string
    }
  }
}

export function LabComponentsManagement() {
  const { user } = useAuth()
  const [components, setComponents] = useState<LabComponent[]>([])
  const [requests, setRequests] = useState<ComponentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewType>('pending')
  const [searchTerm, setSearchTerm] = useState("")
  const [facultyNotes, setFacultyNotes] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<ComponentRequest | null>(null)
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    try {
      setLoading(true)

      // Fetch all lab components for inventory management
      const componentsResponse = await fetch("/api/lab-components")
      const componentsData = await componentsResponse.json()
      setComponents(componentsData.components || [])

      // Fetch all component requests for management (faculty coordinator view)
      const requestsResponse = await fetch("/api/component-requests?all=true", {
        headers: {
          "x-user-id": user.id,
        },
      })
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

  const handleApproveRequest = async (requestId: string, notes?: string) => {
    if (!user) return
    try {
      const response = await fetch(`/api/component-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          status: "APPROVED",
          faculty_notes: notes || null,
        }),
      })

      if (response.ok) {
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? { ...req, status: "APPROVED", faculty_notes: notes || null } : req)),
        )
        toast({
          title: "Request Approved",
          description: "Student has been notified and can collect the component",
        })
      } else {
        throw new Error("Failed to approve request")
      }
    } catch (error) {
      console.error("Error approving request:", error)
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      })
    }
  }

  const handleRejectRequest = async (requestId: string, notes?: string) => {
    if (!user) return
    try {
      const response = await fetch(`/api/component-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          status: "REJECTED",
          faculty_notes: notes || null,
        }),
      })

      if (response.ok) {
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? { ...req, status: "REJECTED", faculty_notes: notes || null } : req)),
        )
        toast({
          title: "Request Rejected",
          description: "Student has been notified",
          variant: "destructive",
        })
      } else {
        throw new Error("Failed to reject request")
      }
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      })
    }
  }

  const handleMarkCollected = async (requestId: string) => {
    if (!user) return
    try {
      const response = await fetch(`/api/component-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          status: "COLLECTED",
          collection_date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: "COLLECTED", collection_date: new Date().toISOString() } : req,
          ),
        )
        fetchData() // Refresh to update inventory
        toast({
          title: "Component Collected",
          description: "Component has been marked as collected",
        })
      } else {
        throw new Error("Failed to mark as collected")
      }
    } catch (error) {
      console.error("Error marking as collected:", error)
      toast({
        title: "Error",
        description: "Failed to mark component as collected",
        variant: "destructive",
      })
    }
  }

  const handleMarkReturned = async (requestId: string) => {
    if (!user) return
    try {
      const response = await fetch(`/api/component-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          status: "RETURNED",
          return_date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: "RETURNED", return_date: new Date().toISOString() } : req,
          ),
        )
        fetchData() // Refresh to update inventory
        toast({
          title: "Component Returned",
          description: "Stock updated and component marked as returned",
        })
      } else {
        throw new Error("Failed to mark as returned")
      }
    } catch (error) {
      console.error("Error marking as returned:", error)
      toast({
        title: "Error",
        description: "Failed to mark component as returned",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "COLLECTED":
        return "bg-blue-100 text-blue-800"
      case "USER_RETURNED":
        return "bg-purple-100 text-purple-800"
      case "RETURNED":
        return "bg-gray-100 text-gray-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />
      case "COLLECTED":
        return <Package className="h-4 w-4" />
      case "USER_RETURNED":
        return <CheckCircle className="h-4 w-4" />
      case "RETURNED":
        return <CheckCircle className="h-4 w-4" />
      case "REJECTED":
        return <X className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Calculate stats for the dashboard
  const pendingRequests = requests.filter((req) => req.status === "PENDING")
  const activeRequests = requests.filter((req) => ["APPROVED", "COLLECTED"].includes(req.status))
  const overdueRequests = requests.filter((req) => req.status === "COLLECTED" && isOverdue(req.required_date))
  const totalInventory = components.reduce((sum, comp) => sum + comp.component_quantity, 0)

  // Filter requests based on current view and search
  const getFilteredRequests = () => {
    let filtered: ComponentRequest[] = []
    
    switch (currentView) {
      case 'pending':
        filtered = pendingRequests
        break
      case 'active':
        filtered = activeRequests
        break
      case 'overdue':
        filtered = overdueRequests
        break
      default:
        filtered = []
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(req => {
        const requesterName = (req.student?.user?.name || req.faculty?.user?.name || "").toLowerCase()
        const componentName = (req.component?.component_name || "").toLowerCase()
        const projectName = (req.project?.name || "").toLowerCase()
        return requesterName.includes(searchLower) || 
               componentName.includes(searchLower) || 
               projectName.includes(searchLower)
      })
    }

    return filtered
  }

  const filteredComponents = components.filter(comp => 
    comp.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.component_category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading lab components management...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Components Management</h1>
          <p className="text-gray-600">Manage lab component requests and inventory</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Clickable Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-yellow-100 hover:border-yellow-300 ${
            currentView === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-50 border-yellow-200' : 'hover:ring-1 hover:ring-yellow-200'
          }`}
          onClick={() => setCurrentView('pending')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className={`h-5 w-5 transition-colors duration-200 ${
                currentView === 'pending' ? 'text-yellow-600' : 'text-yellow-500 group-hover:text-yellow-700'
              }`} />
              <div>
                <p className={`text-2xl font-bold transition-colors duration-200 ${
                  currentView === 'pending' ? 'text-yellow-700' : 'text-gray-900'
                }`}>
                  {pendingRequests.length}
                </p>
                <p className={`text-sm transition-colors duration-200 ${
                  currentView === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                }`}>Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-blue-100 hover:border-blue-300 ${
            currentView === 'active' ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'hover:ring-1 hover:ring-blue-200'
          }`}
          onClick={() => setCurrentView('active')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className={`h-5 w-5 transition-colors duration-200 ${
                currentView === 'active' ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-700'
              }`} />
              <div>
                <p className={`text-2xl font-bold transition-colors duration-200 ${
                  currentView === 'active' ? 'text-blue-700' : 'text-gray-900'
                }`}>{activeRequests.length}</p>
                <p className={`text-sm transition-colors duration-200 ${
                  currentView === 'active' ? 'text-blue-600' : 'text-gray-600'
                }`}>Active Loans</p>
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
                }`}>Overdue Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-green-100 hover:border-green-300 ${
            currentView === 'inventory' ? 'ring-2 ring-green-500 bg-green-50 border-green-200' : 'hover:ring-1 hover:ring-green-200'
          }`}
          onClick={() => setCurrentView('inventory')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className={`h-5 w-5 transition-colors duration-200 ${
                currentView === 'inventory' ? 'text-green-600' : 'text-green-500 group-hover:text-green-700'
              }`} />
              <div>
                <p className={`text-2xl font-bold transition-colors duration-200 ${
                  currentView === 'inventory' ? 'text-green-700' : 'text-gray-900'
                }`}>{totalInventory}</p>
                <p className={`text-sm transition-colors duration-200 ${
                  currentView === 'inventory' ? 'text-green-600' : 'text-gray-600'
                }`}>Total Inventory</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder={currentView === 'inventory' ? "Search components..." : "Search requests by name, component, or project..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Dynamic Content Based on Selected View */}
      {currentView === 'pending' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Approvals</h2>
          <div className="grid gap-4">
            {getFilteredRequests().length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">All component requests have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              getFilteredRequests().map((request) => (
                <Card key={request.id} className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {(request.student?.user?.name || request.faculty?.user?.name || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{request.student?.user?.name || request.faculty?.user?.name || "Unknown"}</h3>
                          <p className="text-sm text-gray-600">
                            {request.component?.component_name || "Unknown Component"} - Qty: {request.quantity}
                          </p>
                          <p className="text-xs text-gray-500">
                            Requested: {new Date(request.request_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Required by: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          {request.project && (
                            <p className="text-xs text-blue-600">
                              Project: {request.project.name}
                            </p>
                          )}
                          {request.purpose && (
                            <p className="text-xs text-gray-600 mt-1">
                              Purpose: {request.purpose}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request)
                                setFacultyNotes("")
                              }}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Component Request</DialogTitle>
                              <DialogDescription>
                                Review and approve or reject this component request.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium">Request Details</h4>
                                <p className="text-sm text-gray-600">
                                  {request.component?.component_name} - {request.quantity} units
                                </p>
                                <p className="text-sm text-gray-600">
                                  Requester: {request.student?.user?.name || request.faculty?.user?.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Purpose: {request.purpose}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="faculty-notes">Faculty Notes (Optional)</Label>
                                <Textarea
                                  id="faculty-notes"
                                  value={facultyNotes}
                                  onChange={(e) => setFacultyNotes(e.target.value)}
                                  placeholder="Add any notes for the student..."
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleRejectRequest(request.id, facultyNotes)}
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleApproveRequest(request.id, facultyNotes)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {currentView === 'active' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Loans</h2>
          <div className="grid gap-4">
            {getFilteredRequests().length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active loans</h3>
                  <p className="text-gray-600">No components are currently on loan.</p>
                </CardContent>
              </Card>
            ) : (
              getFilteredRequests().map((request) => (
                <Card key={request.id} className={isOverdue(request.required_date) ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {(request.student?.user?.name || request.faculty?.user?.name || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{request.student?.user?.name || request.faculty?.user?.name || "Unknown"}</h3>
                          <p className="text-sm text-gray-600">
                            {request.component?.component_name || "Unknown Component"} - Qty: {request.quantity}
                          </p>
                          <p className="text-xs text-gray-500">
                            Collected: {request.collection_date ? new Date(request.collection_date).toLocaleDateString() : "Approved"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          {isOverdue(request.required_date) && (
                            <p className="text-xs text-red-600 font-medium">
                              ⚠️ {getOverdueDays(request.required_date)} days overdue
                            </p>
                          )}
                          {request.faculty_notes && (
                            <p className="text-xs text-blue-600 mt-1">
                              Notes: {request.faculty_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(request.status)}
                            <span>{request.status}</span>
                          </div>
                        </Badge>
                        {request.status === "APPROVED" && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkCollected(request.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Package className="h-3 w-3 mr-1" />
                            Mark Collected
                          </Button>
                        )}
                        {(request.status === "COLLECTED" || request.status === "USER_RETURNED") && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkReturned(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Returned
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {currentView === 'overdue' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Overdue Items</h2>
          <div className="grid gap-4">
            {getFilteredRequests().length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No overdue items</h3>
                  <p className="text-gray-600">All components have been returned on time.</p>
                </CardContent>
              </Card>
            ) : (
              getFilteredRequests().map((request) => (
                <Card key={request.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {(request.student?.user?.name || request.faculty?.user?.name || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{request.student?.user?.name || request.faculty?.user?.name || "Unknown"}</h3>
                          <p className="text-sm text-gray-600">
                            {request.component?.component_name || "Unknown Component"} - Qty: {request.quantity}
                          </p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-red-600 font-medium">
                            ⚠️ {getOverdueDays(request.required_date)} days overdue
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleMarkReturned(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Returned
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {currentView === 'inventory' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Inventory Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredComponents.map((component) => (
              <Card key={component.id}>
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Wrench className="h-4 w-4" />
                    <span>{component.component_name}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">{component.component_category}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total:</span>
                      <span className="font-medium">{component.component_quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Available:</span>
                      <span className={`font-medium ${component.available_quantity === 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {component.available_quantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>On Loan:</span>
                      <span className="font-medium">{component.component_quantity - component.available_quantity}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Location: {component.component_location}
                    </div>
                    {component.available_quantity === 0 && (
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}