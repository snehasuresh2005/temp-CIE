"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Settings,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Filter,
  Search
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { LibraryManagement } from "@/components/pages/faculty/library-management"
import { LibraryInventoryStatus } from "@/components/pages/faculty/library-inventory-status"
import { LabInventoryStatus } from "@/components/pages/faculty/lab-inventory-status"
import { SimplifiedLibraryManagement } from "@/components/pages/faculty/simplified-library-management"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [activeTab, setActiveTab] = useState("analytics")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "due" | "not-due">("all")

  // Add coordinator domains state with enhanced type
  const [coordinatorDomains, setCoordinatorDomains] = useState<Array<{
    id: string; 
    name: string; 
    description?: string;
    hasLibraryItems?: boolean;
    hasLabComponents?: boolean;
  }>>([])

  // New state for selected domain
  const [selectedDomain, setSelectedDomain] = useState(coordinatorDomains[0])

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
      setSelectedDomain(enhancedDomains[0]) // Set default selected domain
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

  // Add renewal functionality
  const handleRenewRequest = async (requestId: string) => {
    try {
      const newDueDate = new Date()
      newDueDate.setDate(newDueDate.getDate() + 14) // Extend by 14 days
      
      const response = await fetch(`/api/library-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || ""
        },
        body: JSON.stringify({ 
          due_date: newDueDate.toISOString(),
          faculty_notes: `Renewed for 14 days by coordinator on ${new Date().toLocaleDateString()}`
        })
      })

      if (response.ok) {
        await fetchRequests()
        toast({
          title: "Item Renewed",
          description: `Due date extended to ${newDueDate.toLocaleDateString()}`
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to renew item",
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

  // Filter out expired requests from collection views
  const filterActiveRequests = (requests: any[]) => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    return requests.filter(request => {
      // If status is already EXPIRED, definitely filter out
      if (request.status === "EXPIRED") return false
      
      // If status is APPROVED, check if it should be expired
      if (request.status === "APPROVED") {
        // Check updatedAt or fall back to request_date
        const checkDate = new Date(request.updatedAt || request.request_date)
        return checkDate > twoMinutesAgo
      }
      
      return true
    })
  }

  const pendingComponentRequests = componentRequests.filter(req => req.status === "PENDING")
  const collectionComponentRequests = filterActiveRequests(componentRequests.filter(req => req.status === "APPROVED"))
  const returnComponentRequests = componentRequests.filter(req => ["COLLECTED", "PENDING_RETURN"].includes(req.status))
  
  const pendingLibraryRequests = libraryRequests.filter(req => req.status === "PENDING")
  const collectionLibraryRequests = filterActiveRequests(libraryRequests.filter(req => req.status === "APPROVED"))
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

  // Filtered active loans based on search term and status filter
  const filteredActiveLoans = [...returnComponentRequests, ...returnLibraryRequests].filter(request => {
    const borrowerName = request.student?.user?.name?.toLowerCase() || ""
    const srn = request.student?.student_id?.toLowerCase() || ""
    const itemName = getItemName(request).toLowerCase()
    const searchTermLower = searchTerm.toLowerCase()
    
    // Search filter (borrower name, SRN, or book name)
    const matchesSearch = borrowerName.includes(searchTermLower) || 
                         srn.includes(searchTermLower) || 
                         itemName.includes(searchTermLower)
    
    // Status filter
    if (statusFilter === "all") {
      return matchesSearch
    } else if (statusFilter === "due") {
      return matchesSearch && isOverdue(request.due_date)
    } else if (statusFilter === "not-due") {
      return matchesSearch && !isOverdue(request.due_date)
    }
    
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CIE Team Coordinator Dashboard</h1>
      </div>

      {/* Domain Selection Tabs */}
      {coordinatorDomains.length > 1 && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {coordinatorDomains.map((domain) => (
              <button
                key={domain.id}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  selectedDomain?.id === domain.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setSelectedDomain(domain)}
              >
                <div className="flex items-center space-x-2">
                  {domain.hasLibraryItems && <BookOpen className="h-4 w-4" />}
                  {domain.hasLabComponents && <Package className="h-4 w-4" />}
                  <span>{domain.name}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Show current domain info for single domain or selected domain */}
      {(coordinatorDomains.length === 1 || selectedDomain) && (
        <div className="text-sm text-gray-600">
          Coordinating: {selectedDomain?.name || coordinatorDomains[0]?.name}
          {(selectedDomain?.hasLibraryItems || coordinatorDomains[0]?.hasLibraryItems) && 
           (selectedDomain?.hasLabComponents || coordinatorDomains[0]?.hasLabComponents) && (
            <span className="ml-2">
              (Library & Lab)
            </span>
          )}
        </div>
      )}

      {/* Clickable Summary Cards with Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-purple-100 hover:border-purple-300 ${
            activeTab === 'analytics' ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-200' : 'hover:ring-1 hover:ring-purple-200'
          }`}
          onClick={() => setActiveTab('analytics')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 className={`h-5 w-5 transition-colors duration-200 ${
                activeTab === 'analytics' ? 'text-purple-600' : 'text-purple-500 group-hover:text-purple-700'
              }`} />
              <p className={`text-lg font-medium transition-colors duration-200 ${
                activeTab === 'analytics' ? 'text-purple-600' : 'text-gray-600'
              }`}>Analytics</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-blue-100 hover:border-blue-300 ${
            activeTab === 'collection' ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'hover:ring-1 hover:ring-blue-200'
          }`}
          onClick={() => setActiveTab('collection')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className={`h-5 w-5 transition-colors duration-200 ${
                activeTab === 'collection' ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-700'
              }`} />
              <p className={`text-lg font-medium transition-colors duration-200 ${
                activeTab === 'collection' ? 'text-blue-600' : 'text-gray-600'
              }`}>Awaiting Collection</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-green-100 hover:border-green-300 ${
            activeTab === 'returns' ? 'ring-2 ring-green-500 bg-green-50 border-green-200' : 'hover:ring-1 hover:ring-green-200'
          }`}
          onClick={() => setActiveTab('returns')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <Package className={`h-5 w-5 transition-colors duration-200 ${
                activeTab === 'returns' ? 'text-green-600' : 'text-green-500 group-hover:text-green-700'
              }`} />
              <p className={`text-lg font-medium transition-colors duration-200 ${
                activeTab === 'returns' ? 'text-green-600' : 'text-gray-600'
              }`}>Active Loans</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-orange-100 hover:border-orange-300 ${
            activeTab === 'history' ? 'ring-2 ring-orange-500 bg-orange-50 border-orange-200' : 'hover:ring-1 hover:ring-orange-200'
          }`}
          onClick={() => setActiveTab('history')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <Clock className={`h-5 w-5 transition-colors duration-200 ${
                activeTab === 'history' ? 'text-orange-600' : 'text-orange-500 group-hover:text-orange-700'
              }`} />
              <p className={`text-lg font-medium transition-colors duration-200 ${
                activeTab === 'history' ? 'text-orange-600' : 'text-gray-600'
              }`}>History</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Content Based on Selected Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
          <p className="text-gray-600">Insights and statistics for your coordinator domains</p>
          
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{componentRequests.length + libraryRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  Library: {libraryRequests.length} | Lab: {componentRequests.length}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{returnComponentRequests.length + returnLibraryRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  Currently borrowed items
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {[...returnComponentRequests, ...returnLibraryRequests].filter(req => isOverdue(req.due_date)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items past due date
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Request Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Request Status Overview</CardTitle>
              <CardDescription>Distribution of all requests by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { status: 'PENDING', count: pendingComponentRequests.length + pendingLibraryRequests.length, color: 'bg-yellow-500' },
                  { status: 'APPROVED', count: collectionComponentRequests.length + collectionLibraryRequests.length, color: 'bg-blue-500' },
                  { status: 'COLLECTED', count: returnComponentRequests.length + returnLibraryRequests.length, color: 'bg-green-500' },
                  { status: 'RETURNED', count: [...componentRequests, ...libraryRequests].filter(req => req.status === "RETURNED").length, color: 'bg-gray-500' },
                  { status: 'REJECTED', count: [...componentRequests, ...libraryRequests].filter(req => req.status === "REJECTED").length, color: 'bg-red-500' },
                ].map(({ status, count, color }) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700 capitalize">{status}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mx-3">
                      <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${(count / (componentRequests.length + libraryRequests.length)) * 100}%` }}></div>
                    </div>
                    <div className="text-sm font-medium text-gray-700">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'collection' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Collection Management</h2>
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
                      <span className="font-medium">
                        {request.student?.user?.name || request.faculty?.user?.name || "Unknown User"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {request.student?.student_id ? `SRN: ${request.student.student_id}` : "Faculty Request"}
                      </span>
                    </div>
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
      )}

      {activeTab === 'returns' && (
        <div className="space-y-4">
          {[...returnComponentRequests, ...returnLibraryRequests].length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active loans</h3>
                <p className="text-gray-600">All items have been returned.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Search and Filter Bar */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by borrower name, SRN, or book name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Filter className="h-4 w-4" />
                      <span>
                        {statusFilter === "all" ? "All Status" : 
                         statusFilter === "due" ? "Due Only" : 
                         "Not Due Only"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setStatusFilter("all")}
                      className={statusFilter === "all" ? "bg-gray-100" : ""}
                    >
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setStatusFilter("due")}
                      className={statusFilter === "due" ? "bg-gray-100" : ""}
                    >
                      Due Only
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setStatusFilter("not-due")}
                      className={statusFilter === "not-due" ? "bg-gray-100" : ""}
                    >
                      Not Due Only
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Borrower</TableHead>
                        <TableHead className="w-[200px]">Item</TableHead>
                        <TableHead className="w-[80px]">Qty</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[100px]">Collected</TableHead>
                        <TableHead className="w-[100px]">Due Date</TableHead>
                        <TableHead className="w-[100px]">Fine</TableHead>
                        <TableHead className="w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActiveLoans.map((request) => {
                        const overdue = isOverdue(request.due_date)
                        const daysOverdue = getDaysOverdue(request.due_date)
                        const borrower = request.student?.user?.name || request.faculty?.user?.name || "Unknown"
                        const borrowerId = request.student?.student_id || "Faculty"
                        
                        return (
                          <TableRow key={request.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{borrower}</div>
                                <div className="text-xs text-gray-500">
                                  {request.student ? `SRN: ${borrowerId}` : 'Faculty'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">{getItemName(request)}</div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{request.quantity}</span>
                            </TableCell>
                            <TableCell>
                              {overdue ? (
                                <Badge className="bg-red-100 text-red-800 font-medium">
                                  Due
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 font-medium">
                                  Not Due
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {request.collection_date ? new Date(request.collection_date).toLocaleDateString() : "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : ''}`}>
                                {request.due_date ? new Date(request.due_date).toLocaleDateString() : "-"}
                              </span>
                              {overdue && (
                                <div className="text-xs text-red-600">
                                  {daysOverdue} days late
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {request.fine_amount && request.fine_amount > 0 ? (
                                <div className="text-sm">
                                  <span className="text-red-600">₹{request.fine_amount}</span>
                                  <div className="text-xs text-gray-500">
                                    {request.fine_paid ? "Paid" : "Pending"}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  onClick={() => handleRenewRequest(request.id)}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Renew
                                </Button>
                                
                                {request.status === "PENDING_RETURN" && request.fine_amount && request.fine_amount > 0 ? (
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
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Return
                                  </Button>
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
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Return
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <SimplifiedLibraryManagement />
        </div>
      )}
    </div>
  )
}