"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  BookOpen, 
  Calendar,
  AlertTriangle,
  User,
  Mail,
  FileText,
  IndianRupee,
  Settings
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { LibraryManagement } from "@/components/pages/faculty/library-management"
import { LibraryInventoryStatus } from "@/components/pages/faculty/library-inventory-status"
import { LabInventoryStatus } from "@/components/pages/faculty/lab-inventory-status"
import { SimplifiedLibraryManagement } from "@/components/pages/faculty/simplified-library-management"

interface ComponentRequest {
  id: string
  student: {
    user: { name: string; email: string }
    student_id: string
  }
  component: {
    component_name: string
    domain?: { name: string }
  }
  project: { name: string }
  quantity: number
  request_date: string
  required_date: string
  due_date?: string
  collection_date?: string
  return_date?: string
  status: string
  notes?: string
  faculty_notes?: string
  purpose: string
  fine_amount?: number
  fine_paid?: boolean
  payment_proof?: string
}

interface LibraryRequest {
  id: string
  student: {
    user: { name: string; email: string }
    student_id: string
  }
  item: {
    item_name: string
    domain?: { name: string }
  }
  quantity: number
  request_date: string
  required_date: string
  due_date?: string
  collection_date?: string
  return_date?: string
  status: string
  notes?: string
  faculty_notes?: string
  purpose: string
  fine_amount?: number
  fine_paid?: boolean
  payment_proof?: string
}

type RequestUnion = ComponentRequest | LibraryRequest

function isComponentRequest(request: RequestUnion): request is ComponentRequest {
  return 'component' in request
}

function isLibraryRequest(request: RequestUnion): request is LibraryRequest {
  return 'item' in request
}

export function CoordinatorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [componentRequests, setComponentRequests] = useState<ComponentRequest[]>([])
  const [libraryRequests, setLibraryRequests] = useState<LibraryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [facultyNotes, setFacultyNotes] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  // Add coordinator domains state with enhanced type
  const [coordinatorDomains, setCoordinatorDomains] = useState<Array<{
    id: string; 
    name: string; 
    description?: string;
    hasLibraryItems?: boolean;
    hasLabComponents?: boolean;
  }>>([])

  useEffect(() => {
    fetchRequests()
    fetchCoordinatorDomains()
  }, [])

  const fetchCoordinatorDomains = async () => {
    try {
      const response = await fetch("/api/coordinators/check", {
        headers: { "x-user-id": user?.id || "" }
      })
      const data = await response.json()
      
      // Enhance domain data with inventory information
      const enhancedDomains = await Promise.all(
        (data.assignedDomains || []).map(async (domain: any) => {
          try {
            // Check if this domain has library items
            const libraryResponse = await fetch(`/api/library-items?domain_id=${domain.id}`, {
              headers: { "x-user-id": user?.id || "" }
            })
            const libraryData = await libraryResponse.json()
            const hasLibraryItems = (libraryData.items || []).length > 0

            // Check if this domain has lab components
            const labResponse = await fetch(`/api/lab-components?domain_id=${domain.id}`, {
              headers: { "x-user-id": user?.id || "" }
            })
            const labData = await labResponse.json()
            const hasLabComponents = (labData.components || []).length > 0

            return {
              ...domain,
              hasLibraryItems,
              hasLabComponents
            }
          } catch (error) {
            console.error(`Error checking inventory for domain ${domain.name}:`, error)
            return { ...domain, hasLibraryItems: false, hasLabComponents: false }
          }
        })
      )
      
      setCoordinatorDomains(enhancedDomains)
    } catch (error) {
      console.error("Error fetching coordinator domains:", error)
    }
  }

  const fetchRequests = async () => {
    try {
      setLoading(true)
      
      // Fetch component requests for coordinator's domains
      const componentResponse = await fetch("/api/component-requests", {
        headers: { "x-user-id": user?.id || "" }
      })
      const componentData = await componentResponse.json()
      setComponentRequests(componentData.requests || [])

      // Fetch library requests for coordinator's domains
      const libraryResponse = await fetch("/api/library-requests", {
        headers: { "x-user-id": user?.id || "" }
      })
      const libraryData = await libraryResponse.json()
      setLibraryRequests(libraryData.requests || [])
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date() > new Date(dueDate)
  }

  const getDaysOverdue = (dueDate?: string) => {
    if (!dueDate) return 0
    const overdue = new Date().getTime() - new Date(dueDate).getTime()
    return Math.ceil(overdue / (1000 * 60 * 60 * 24))
  }

  const handleUpdateComponentRequest = async (requestId: string, status: string, notes?: string, paymentVerified?: boolean) => {
    try {
      const response = await fetch(`/api/component-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || ""
        },
        body: JSON.stringify({ 
          status, 
          faculty_notes: notes,
          payment_verified: paymentVerified
        })
      })

      if (response.ok) {
        await fetchRequests()
        setFacultyNotes("")
        toast({
          title: "Success",
          description: `Request ${status.toLowerCase()} successfully`
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update request",
        variant: "destructive",
      })
    }
  }

  const handleUpdateLibraryRequest = async (requestId: string, status: string, notes?: string, paymentVerified?: boolean) => {
    try {
      const response = await fetch(`/api/library-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || ""
        },
        body: JSON.stringify({ 
          status, 
          faculty_notes: notes,
          payment_verified: paymentVerified
        })
      })

      if (response.ok) {
        await fetchRequests()
        setFacultyNotes("")
        toast({
          title: "Success",
          description: `Request ${status.toLowerCase()} successfully`
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update request",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string, isOverdueItem?: boolean) => {
    const baseClass = "font-medium"
    switch (status) {
      case "PENDING":
        return <Badge className={`bg-yellow-100 text-yellow-800 ${baseClass}`}>Pending Review</Badge>
      case "APPROVED":
        return <Badge className={`bg-blue-100 text-blue-800 ${baseClass}`}>Approved - Awaiting Collection</Badge>
      case "COLLECTED":
        return isOverdueItem ? 
          <Badge className={`bg-red-100 text-red-800 ${baseClass}`}>Collected - Overdue</Badge> :
          <Badge className={`bg-green-100 text-green-800 ${baseClass}`}>Collected</Badge>
      case "PENDING_RETURN":
        return <Badge className={`bg-orange-100 text-orange-800 ${baseClass}`}>Return Requested</Badge>
      case "RETURNED":
        return <Badge className={`bg-green-100 text-green-800 ${baseClass}`}>Returned</Badge>
      case "REJECTED":
        return <Badge className={`bg-red-100 text-red-800 ${baseClass}`}>Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingComponentRequests = componentRequests.filter(req => req.status === "PENDING")
  const collectionComponentRequests = componentRequests.filter(req => req.status === "APPROVED")
  const returnComponentRequests = componentRequests.filter(req => ["COLLECTED", "PENDING_RETURN"].includes(req.status))
  
  const pendingLibraryRequests = libraryRequests.filter(req => req.status === "PENDING")
  const collectionLibraryRequests = libraryRequests.filter(req => req.status === "APPROVED")
  const returnLibraryRequests = libraryRequests.filter(req => ["COLLECTED", "PENDING_RETURN"].includes(req.status))

  const getItemName = (request: RequestUnion): string => {
    return isComponentRequest(request) ? request.component.component_name : request.item.item_name
  }

  const getDomainName = (request: RequestUnion): string => {
    const domainName = isComponentRequest(request) ? request.component.domain?.name : request.item.domain?.name
    return domainName || "Unassigned"
  }

  // Helper functions to determine what to show based on domain assignments
  const shouldShowLibraryInventory = () => {
    return coordinatorDomains.some(domain => domain.hasLibraryItems)
  }

  const shouldShowLabInventory = () => {
    return coordinatorDomains.some(domain => domain.hasLabComponents)
  }

  // Get assigned domain names for display
  const getAssignedDomainNames = () => {
    return coordinatorDomains.map(d => d.name).join(', ')
  }

  // Get domains with library items
  const getLibraryDomains = () => {
    return coordinatorDomains.filter(domain => domain.hasLibraryItems)
  }

  // Get domains with lab components
  const getLabDomains = () => {
    return coordinatorDomains.filter(domain => domain.hasLabComponents)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading coordinator dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CIE Team Coordinator Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage requests for your assigned domains
          {coordinatorDomains.length > 0 && (
            <span className="ml-2 text-sm">
              ({getAssignedDomainNames()})
            </span>
          )}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold">{pendingComponentRequests.length + pendingLibraryRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Awaiting Collection</p>
                <p className="text-2xl font-bold">{collectionComponentRequests.length + collectionLibraryRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold">{returnComponentRequests.length + returnLibraryRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue Items</p>
                <p className="text-2xl font-bold">
                  {[...returnComponentRequests, ...returnLibraryRequests].filter(req => isOverdue(req.due_date)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
          <TabsTrigger value="collection">Collection Verification</TabsTrigger>
          <TabsTrigger value="returns">Return Management</TabsTrigger>
          <TabsTrigger value="library-management">Library Management</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Inventory Status</h2>
            <p className="text-gray-600">Overview of available items in your assigned domains</p>
            
            {/* Show Library Inventory if any assigned domain has library items */}
            {shouldShowLibraryInventory() && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Library Inventory
                  <span className="ml-2 text-sm text-gray-500">
                    ({getLibraryDomains().map(d => d.name).join(', ')})
                  </span>
                </h3>
                <LibraryInventoryStatus />
              </div>
            )}
            
            {/* Show Lab Components Inventory if any assigned domain has lab components */}
            {shouldShowLabInventory() && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Lab Components Inventory
                  <span className="ml-2 text-sm text-gray-500">
                    ({getLabDomains().map(d => d.name).join(', ')})
                  </span>
                </h3>
                <LabInventoryStatus />
              </div>
            )}

            {/* Show message if no domains assigned or no inventory in assigned domains */}
            {!shouldShowLibraryInventory() && !shouldShowLabInventory() && (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {coordinatorDomains.length === 0 ? "No Domains Assigned" : "No Inventory in Assigned Domains"}
                  </h3>
                  <p className="text-gray-600">
                    {coordinatorDomains.length === 0 
                      ? "You are not currently assigned to any domains. Please contact the administrator to get domain assignments."
                      : `Your assigned domains (${getAssignedDomainNames()}) don't currently have any inventory items. Items will appear here once they are added to your domains.`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="collection" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Collection Verification</h2>
            <p className="text-gray-600">Verify if students have collected their approved items</p>
            
            {[...collectionComponentRequests, ...collectionLibraryRequests].map((request) => (
              <Card key={request.id} className="border-l-4 border-l-blue-400">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {getItemName(request)}
                    </CardTitle>
                    {getStatusBadge(request.status)}
                  </div>
                  <CardDescription>
                    Domain: {getDomainName(request)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{request.student.user.name}</span>
                      </div>
                      {/* Only show SRN for students, not faculty */}
                      {request.student.student_id && !request.student.student_id.includes('FACULTY') && (
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">SRN: {request.student.student_id}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Quantity: {request.quantity}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Required: {new Date(request.required_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600"
                      onClick={() => {
                        if (isComponentRequest(request)) {
                          handleUpdateComponentRequest(request.id, "REJECTED", "Student did not collect item")
                        } else {
                          handleUpdateLibraryRequest(request.id, "REJECTED", "Student did not collect item")
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Not Collected
                    </Button>
                    
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (isComponentRequest(request)) {
                          handleUpdateComponentRequest(request.id, "COLLECTED")
                        } else {
                          handleUpdateLibraryRequest(request.id, "COLLECTED")
                        }
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Collected
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {collectionComponentRequests.length === 0 && collectionLibraryRequests.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items awaiting collection</h3>
                  <p className="text-gray-600">All approved items have been collected.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Return Management</h2>
            <p className="text-gray-600">Manage item returns and verify fine payments</p>
            
            {[...returnComponentRequests, ...returnLibraryRequests].map((request) => {
              const overdue = isOverdue(request.due_date)
              const daysOverdue = getDaysOverdue(request.due_date)
              
              return (
                <Card key={request.id} className={`border-l-4 ${overdue ? 'border-l-red-400' : 'border-l-green-400'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {getItemName(request)}
                      </CardTitle>
                      {getStatusBadge(request.status, overdue)}
                    </div>
                    <CardDescription>
                      Domain: {getDomainName(request)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{request.student.user.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">SRN: {request.student.student_id}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            Collected: {request.collection_date ? new Date(request.collection_date).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : ''}`}>
                            Due: {request.due_date ? new Date(request.due_date).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {overdue && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-700">
                            Overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {request.fine_amount && (
                          <div className="flex items-center space-x-2 mt-1">
                            <IndianRupee className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">
                              Fine: ₹{request.fine_amount} {request.fine_paid ? "(Paid)" : "(Pending)"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {request.status === "PENDING_RETURN" && (
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <Label className="text-sm font-medium text-orange-700">Student has requested return</Label>
                        {request.payment_proof && (
                          <div className="mt-2">
                            <Label className="text-xs text-orange-600">Payment proof provided</Label>
                            <Button size="sm" variant="outline" className="ml-2">
                              <FileText className="h-3 w-3 mr-1" />
                              View Proof
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {request.status === "PENDING_RETURN" && request.fine_amount && request.fine_amount > 0 ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600"
                            onClick={() => {
                              if (isComponentRequest(request)) {
                                handleUpdateComponentRequest(request.id, "COLLECTED", "Payment verification failed")
                              } else {
                                handleUpdateLibraryRequest(request.id, "COLLECTED", "Payment verification failed")
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject Payment
                          </Button>
                          
                          <Button 
                            size="sm"
                            onClick={() => {
                              if (isComponentRequest(request)) {
                                handleUpdateComponentRequest(request.id, "RETURNED", undefined, true)
                              } else {
                                handleUpdateLibraryRequest(request.id, "RETURNED", undefined, true)
                              }
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify & Return
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (isComponentRequest(request)) {
                              handleUpdateComponentRequest(request.id, "RETURNED")
                            } else {
                              handleUpdateLibraryRequest(request.id, "RETURNED")
                            }
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Returned
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {returnComponentRequests.length === 0 && returnLibraryRequests.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active loans</h3>
                  <p className="text-gray-600">All items have been returned.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="library-management" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Library Management System</h2>
            </div>
            <p className="text-gray-600">Complete transaction records and system operations</p>
            <SimplifiedLibraryManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}