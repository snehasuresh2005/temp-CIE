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
import { LabComponentsManagement } from "./lab-components-management"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ComponentRequest {
  id: string
  student?: {
    user: { name: string; email: string }
    student_id: string
  }
  requesting_faculty?: {
    user: { name: string; email: string }
  }
  component: {
    component_name: string
    domain?: { name: string }
  }
  quantity: number
  request_date: string
  required_date: string
  status: string
  notes?: string
  faculty_notes?: string
  purpose: string
  project?: {
    name: string
    completion_date?: string
  }
  due_date?: string
  collection_date?: string
  return_date?: string
  faculty?: {
    user: { name: string; email: string }
  }
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
  faculty?: {
    user: { name: string; email: string }
  }
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
  // Set default tab to 'analytics'
  const [activeTab, setActiveTab] = useState('analytics')
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

  // Add role selection state
  const [selectedRole, setSelectedRole] = useState<'library' | 'lab' | null>(null)

  useEffect(() => {
    fetchRequests()
    fetchCoordinatorDomains()
  }, [])

  // Auto-select role if faculty has only one role
  useEffect(() => {
    if (coordinatorDomains.length > 0 && !selectedRole) {
      const hasLibraryRole = coordinatorDomains.some(domain => domain.hasLibraryItems)
      const hasLabRole = coordinatorDomains.some(domain => domain.hasLabComponents)
      
      if (hasLibraryRole && !hasLabRole) {
        setSelectedRole('library')
      } else if (hasLabRole && !hasLibraryRole) {
        setSelectedRole('lab')
      }
      // If both roles exist, don't auto-select - let user choose
    }
  }, [coordinatorDomains, selectedRole])

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

  const handleMarkAsCollected = async (request: any) => {
    try {
      const today = new Date();
      // Use the original required_date as the due date
      let dueDate = request.required_date ? new Date(request.required_date) : today;
      const response = await fetch(`/api/component-requests/${request.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || ""
        },
        body: JSON.stringify({
          status: "COLLECTED",
          collection_date: today.toISOString(),
          due_date: dueDate.toISOString(),
          faculty_notes: `Marked as collected on ${today.toLocaleDateString()}`
        })
      });
      if (response.ok) {
        await fetchRequests();
        toast({
          title: "Marked as Collected",
          description: `Collected on ${today.toLocaleDateString()} with due date ${dueDate.toLocaleDateString()}`
        });
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark as collected",
        variant: "destructive",
      });
    }
  };

  const handleRenewRequest = async (requestId: string, currentDueDate?: string) => {
    try {
      let baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
      baseDate.setDate(baseDate.getDate() + 14); // Extend by 14 days
      let response;
      if (selectedRole === 'lab') {
        response = await fetch(`/api/component-requests/${requestId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || ""
          },
          body: JSON.stringify({
            due_date: baseDate.toISOString(),
            faculty_notes: `Renewed for 14 days by coordinator on ${new Date().toLocaleDateString()}`
          })
        });
      } else {
        response = await fetch(`/api/library-requests/${requestId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || ""
          },
          body: JSON.stringify({
            due_date: baseDate.toISOString(),
            faculty_notes: `Renewed for 14 days by coordinator on ${new Date().toLocaleDateString()}`
          })
        });
      }
      if (response.ok) {
        await fetchRequests();
        toast({
          title: "Item Renewed",
          description: `Due date extended to ${baseDate.toLocaleDateString()}`
        });
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to renew item",
        variant: "destructive",
      });
    }
  };

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
      case "USER_RETURNED":
        return <Badge className={`bg-purple-100 text-purple-800 ${baseClass}`}>Student Confirmed Return</Badge>
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

  const getRequesterName = (request: RequestUnion): string => {
    if (isComponentRequest(request)) {
      return request.student?.user.name || request.requesting_faculty?.user.name || "Unknown"
    } else {
      return request.student?.user.name || request.faculty?.user.name || "Unknown"
    }
  }

  const getRequesterEmail = (request: RequestUnion): string => {
    if (isComponentRequest(request)) {
      return request.student?.user.email || request.requesting_faculty?.user.email || "Unknown"
    } else {
      return request.student?.user.email || request.faculty?.user.email || "Unknown"
    }
  }

  const getRequesterType = (request: RequestUnion): string => {
    if (isComponentRequest(request)) {
      return request.student ? "Student" : "Faculty"
    } else {
      return request.student ? "Student" : "Faculty"
    }
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

  // Determine if user is a lab coordinator
  const isLabCoordinator = coordinatorDomains.some(domain => domain.hasLabComponents)

  // Determine if user is a library coordinator
  const isLibraryCoordinator = coordinatorDomains.some(domain => domain.hasLibraryItems)

  // Add tabs for management based on selected coordinator role
  const dashboardTabs = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'collection', label: 'Awaiting Collection' },
    { id: 'returns', label: 'Active Loans' },
    { id: 'history', label: 'History' },
  ];
  
  // Add lab-specific tabs for lab coordinators
  if (selectedRole === 'lab' && isLabCoordinator) {
    dashboardTabs.splice(1, 0, { id: 'pending-requests', label: 'Pending Requests' });
  }
  
  if (selectedRole === 'library' && isLibraryCoordinator) {
    dashboardTabs.push({ id: 'library-management', label: 'Library Management' });
  }

  // Helper: get assigned lab domain IDs and names
  const assignedLabDomainIds = coordinatorDomains.filter(d => d.hasLabComponents && d.id).map(d => d.id);
  const assignedLabDomainNames = coordinatorDomains.filter(d => d.hasLabComponents && d.name).map(d => d.name?.toLowerCase?.());

  // Role-based data filtering functions
  const getRoleSpecificRequests = () => {
    if (selectedRole === 'library') {
      return {
        requests: libraryRequests as RequestUnion[],
        pendingRequests: pendingLibraryRequests as RequestUnion[],
        collectionRequests: collectionLibraryRequests as RequestUnion[],
        returnRequests: returnLibraryRequests as RequestUnion[],
        historyRequests: libraryRequests.filter(req => req.status === 'RETURNED' || req.status === 'REJECTED') as RequestUnion[],
        roleName: 'Library'
      }
    } else if (selectedRole === 'lab') {
      // Filter componentRequests to only those for assigned lab domains
      const filteredComponentRequests = componentRequests.filter(req => {
        const domain = req.component?.domain;
        if (!domain) {
          console.log('Request has no domain:', req.id, req.component?.component_name);
          return false;
        }
        
        const domainId = (domain as any).id || (domain as any).domain_id;
        const domainName = (domain as any).name?.toLowerCase?.();
        
        const hasMatchingDomainId = domainId && assignedLabDomainIds.includes(domainId);
        const hasMatchingDomainName = domainName && assignedLabDomainNames.includes(domainName);
        
        const isMatch = hasMatchingDomainId || hasMatchingDomainName;
        
        if (!isMatch) {
          console.log('Request filtered out:', req.id, req.component?.component_name, 'Domain:', domainName, 'Assigned domains:', assignedLabDomainNames);
        }
        
        return isMatch;
      });
      
      console.log('Total component requests:', componentRequests.length);
      console.log('Filtered component requests:', filteredComponentRequests.length);
      console.log('Assigned lab domain IDs:', assignedLabDomainIds);
      console.log('Assigned lab domain names:', assignedLabDomainNames);
      
      // Lab component request status mapping:
      // Pending Requests: PENDING
      // Awaiting Collection: APPROVED
      // Active Loans: COLLECTED, USER_RETURNED (for coordinator confirmation)
      // Pending Returns: PENDING_RETURN
      // History: RETURNED, REJECTED
      const pending = filteredComponentRequests.filter(req => req.status === 'PENDING') as RequestUnion[];
      const collection = filteredComponentRequests.filter(req => req.status === 'APPROVED') as RequestUnion[];
      const active = filteredComponentRequests.filter(req => req.status === 'COLLECTED' || req.status === 'USER_RETURNED') as RequestUnion[];
      const pendingReturns = filteredComponentRequests.filter(req => req.status === 'PENDING_RETURN') as RequestUnion[];
      const history = filteredComponentRequests.filter(req => req.status === 'RETURNED' || req.status === 'REJECTED') as RequestUnion[];
      
      console.log('Pending requests:', pending.length);
      console.log('Collection requests:', collection.length);
      console.log('Active requests:', active.length);
      console.log('Pending returns:', pendingReturns.length);
      console.log('History requests:', history.length);
      
      return {
        requests: filteredComponentRequests as RequestUnion[],
        pendingRequests: pending,
        collectionRequests: collection,
        returnRequests: active,
        pendingReturnRequests: pendingReturns,
        historyRequests: history,
        roleName: 'Lab'
      }
    }
    return {
      requests: [] as RequestUnion[],
      pendingRequests: [] as RequestUnion[],
      collectionRequests: [] as RequestUnion[],
      returnRequests: [] as RequestUnion[],
      pendingReturnRequests: [] as RequestUnion[],
      historyRequests: [] as RequestUnion[],
      roleName: ''
    }
  }

  const { requests, pendingRequests, collectionRequests, returnRequests, pendingReturnRequests, historyRequests, roleName } = getRoleSpecificRequests()

  // Check if faculty has multiple roles
  const hasMultipleRoles = coordinatorDomains.some(domain => domain.hasLibraryItems) && 
                          coordinatorDomains.some(domain => domain.hasLabComponents)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading coordinator dashboard...</div>
      </div>
    )
  }

  // Always render the tabbed dashboard interface below
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CIE Team Coordinator Dashboard</h1>
      </div>

      {/* Role Selection - Show when faculty has multiple roles and no role is selected */}
      {hasMultipleRoles && !selectedRole && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Your Coordinator Role</h2>
            <p className="text-gray-600">Choose which coordinator role you want to manage</p>
                </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card 
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => setSelectedRole('library')}
            >
              <CardContent className="p-8 text-center">
                <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Library Coordinator</h3>
                <p className="text-gray-600 mb-4">Manage library items, requests, and inventory</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Package className="h-4 w-4" />
                  <span>Library Management</span>
            </div>
          </CardContent>
        </Card>
        
        <Card 
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-green-50 hover:border-green-300"
              onClick={() => setSelectedRole('lab')}
            >
              <CardContent className="p-8 text-center">
                <Package className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Lab Coordinator</h3>
                <p className="text-gray-600 mb-4">Manage lab components, requests, and inventory</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Package className="h-4 w-4" />
                  <span>Lab Components Management</span>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      )}

      {/* Role Selection Buttons - Show when role is selected to allow switching */}
      {hasMultipleRoles && selectedRole && (
        <div className="flex flex-wrap gap-4">
          <Button
            variant={selectedRole === 'library' ? 'default' : 'outline'}
            onClick={() => setSelectedRole('library')}
            className="flex items-center space-x-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>Library Coordinator</span>
          </Button>
          <Button
            variant={selectedRole === 'lab' ? 'default' : 'outline'}
            onClick={() => setSelectedRole('lab')}
            className="flex items-center space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>Lab Coordinator</span>
          </Button>
            </div>
      )}

      {/* Role-Specific Dashboard Content */}
      {selectedRole && (
        <>
          <div className="text-sm text-gray-600">
            Currently managing: <span className="font-medium">{roleName} Coordinator</span>
          </div>

          {/* Debug Information for Lab Coordinators */}
          {/* Removed debug card as per user request */}

          {/* Clickable Summary Cards with Hover Effects */}
          {/* Dashboard Horizontal Pill Cards for Library and Lab Coordinators */}
          {(selectedRole === 'library' && isLibraryCoordinator) || (selectedRole === 'lab' && isLabCoordinator) ? (
            <div className="flex flex-row gap-6 justify-center items-center my-6">
              <button
                className={`flex flex-col items-center justify-center px-8 py-6 rounded-2xl border transition-all duration-200 shadow-sm min-w-[220px] max-w-[260px] h-[110px] text-center select-none
                  ${activeTab === 'analytics' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-400 text-purple-600' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 bg-white text-gray-800'}`}
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart3 className={`h-6 w-6 mb-1 ${activeTab === 'analytics' ? 'text-purple-600' : 'text-purple-400'}`} />
                <span className={`text-base font-medium ${activeTab === 'analytics' ? 'text-purple-600' : 'text-gray-800'}`}>Analytics</span>
              </button>
              <button
                className={`flex flex-col items-center justify-center px-8 py-6 rounded-2xl border transition-all duration-200 shadow-sm min-w-[220px] max-w-[260px] h-[110px] text-center select-none
                  ${activeTab === 'collection' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400 text-blue-600' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 bg-white text-gray-800'}`}
                onClick={() => setActiveTab('collection')}
              >
                <CheckCircle className={`h-6 w-6 mb-1 ${activeTab === 'collection' ? 'text-blue-600' : 'text-blue-400'}`} />
                <span className={`text-base font-medium ${activeTab === 'collection' ? 'text-blue-600' : 'text-gray-800'}`}>Awaiting Collection</span>
              </button>
              <button
                className={`flex flex-col items-center justify-center px-8 py-6 rounded-2xl border transition-all duration-200 shadow-sm min-w-[220px] max-w-[260px] h-[110px] text-center select-none
                  ${activeTab === 'returns' ? 'border-green-500 bg-green-50 ring-2 ring-green-400 text-green-600' : 'border-gray-200 hover:border-green-300 hover:bg-green-50 bg-white text-gray-800'}`}
                onClick={() => setActiveTab('returns')}
              >
                <Package className={`h-6 w-6 mb-1 ${activeTab === 'returns' ? 'text-green-600' : 'text-green-400'}`} />
                <span className={`text-base font-medium ${activeTab === 'returns' ? 'text-green-600' : 'text-gray-800'}`}>Active Loans</span>
              </button>
              <button
                className={`flex flex-col items-center justify-center px-8 py-6 rounded-2xl border transition-all duration-200 shadow-sm min-w-[220px] max-w-[260px] h-[110px] text-center select-none
                  ${activeTab === 'history' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-400 text-orange-600' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 bg-white text-gray-800'}`}
          onClick={() => setActiveTab('history')}
        >
                <Clock className={`h-6 w-6 mb-1 ${activeTab === 'history' ? 'text-orange-600' : 'text-orange-400'}`} />
                <span className={`text-base font-medium ${activeTab === 'history' ? 'text-orange-600' : 'text-gray-800'}`}>History</span>
              </button>
            </div>
          ) : null}

          {/* Dashboard Tabs - removed as per user request, navigation is now only via cards */}

          {/* Tab Content */}
          {activeTab === 'analytics' && selectedRole && (
        <div className="space-y-4">
              <h2 className="text-xl font-semibold">{roleName} Analytics Dashboard</h2>
              <p className="text-gray-600">Insights and statistics for your {roleName.toLowerCase()} coordinator domains</p>
          
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total {roleName} Requests</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold">{requests.length}</div>
                <p className="text-xs text-muted-foreground">
                      {roleName} requests only
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active {roleName} Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold">{returnRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                      Currently borrowed {roleName.toLowerCase()} items
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue {roleName} Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                      {returnRequests.filter(req => isOverdue(req.due_date)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                      {roleName} items past due date
                </p>
              </CardContent>
            </Card>
          </div>

              {/* Request Status Overview */}
          <Card>
            <CardHeader>
                  <CardTitle>{roleName} Request Status Overview</CardTitle>
                  <CardDescription>Distribution of {roleName.toLowerCase()} requests by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                      { status: 'PENDING', count: pendingRequests.length, color: 'bg-yellow-500' },
                      { status: 'APPROVED', count: collectionRequests.length, color: 'bg-blue-500' },
                      { status: 'COLLECTED', count: returnRequests.length, color: 'bg-green-500' },
                      { status: 'RETURNED', count: requests.filter(req => req.status === "RETURNED").length, color: 'bg-gray-500' },
                      { status: 'REJECTED', count: requests.filter(req => req.status === "REJECTED").length, color: 'bg-red-500' },
                ].map(({ status, count, color }) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700 capitalize">{status}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mx-3">
                          <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${requests.length > 0 ? (count / requests.length) * 100 : 0}%` }}></div>
                    </div>
                    <div className="text-sm font-medium text-gray-700">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

          {activeTab === 'collection' && selectedRole && (
        <div className="space-y-4">
              <h2 className="text-xl font-semibold">{roleName} Collection Management</h2>
              <p className="text-gray-600">Verify if students have collected their approved {roleName.toLowerCase()} items</p>
              
              {collectionRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items awaiting collection</h3>
                    <p className="text-gray-600">All approved {roleName.toLowerCase()} items have been collected.</p>
                  </CardContent>
                </Card>
              ) : (
                collectionRequests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-blue-400">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {getItemName(request)}
                  </CardTitle>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
                    <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Requester Details</h4>
                          <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                              <span>{getRequesterName(request)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span>{getRequesterEmail(request)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                              <span>{getRequesterType(request)}</span>
                    </div>
                  </div>
                    </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                          <div className="space-y-1 text-sm">
                            <div>Quantity: {request.quantity}</div>
                            <div>Purpose: {request.purpose}</div>
                            <div>Request Date: {new Date(request.request_date).toLocaleDateString()}</div>
                            <div>Required Date: {new Date(request.required_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                      <div className="mt-4 flex space-x-2">
                  <Button 
                    onClick={() => {
                            if (selectedRole === 'library') {
                              handleUpdateLibraryRequest(request.id, "COLLECTED")
                      } else {
                              handleMarkAsCollected(request)
                      }
                    }}
                          className="bg-green-600 hover:bg-green-700"
                  >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Collected
                  </Button>
                  
                  <Button 
                          variant="outline"
                    onClick={() => {
                            if (selectedRole === 'library') {
                              handleUpdateLibraryRequest(request.id, "REJECTED")
                      } else {
                              handleUpdateComponentRequest(request.id, "REJECTED")
                      }
                    }}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Request
                  </Button>
                </div>
              </CardContent>
            </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'returns' && selectedRole && (
        <div className="space-y-4">
              {/* Define filteredActiveLoans here */}
              {(() => {
                // Combine all active loans for the selected role
                let activeLoans = returnRequests;
                // Filter by search term
                if (searchTerm.trim() !== "") {
                  const lower = searchTerm.toLowerCase();
                  activeLoans = activeLoans.filter(request => {
                    const name = getRequesterName(request).toLowerCase();
                    const srn = request.student?.student_id?.toLowerCase?.() || "";
                    const item = getItemName(request).toLowerCase();
                    return name.includes(lower) || srn.includes(lower) || item.includes(lower);
                  });
                }
                // Filter by due status
                if (statusFilter === "due") {
                  activeLoans = activeLoans.filter(request => isOverdue(request.due_date));
                } else if (statusFilter === "not-due") {
                  activeLoans = activeLoans.filter(request => !isOverdue(request.due_date));
                }
                // Assign to local variable for rendering
                const filteredActiveLoans = activeLoans;
                return (
                  filteredActiveLoans.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No active {roleName.toLowerCase()} loans</h3>
                        <p className="text-gray-600">All {roleName.toLowerCase()} items have been returned.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
                      <h2 className="text-xl font-semibold">{roleName} Active Loans</h2>
                      <p className="text-gray-600">Manage currently borrowed {roleName.toLowerCase()} items</p>
                      
              {/* Search and Filter Bar */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                            placeholder={`Search by borrower name, SRN, or ${roleName.toLowerCase()} name...`}
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
                                <TableHead className="w-[200px]">{roleName} Item</TableHead>
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
                                        {request.status === "COLLECTED" && (
                                          <>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  onClick={() => handleRenewRequest(request.id, request.due_date)}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Renew
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-zinc-900 hover:bg-zinc-800 text-white"
                                  onClick={() => selectedRole === 'library' ? handleUpdateLibraryRequest(request.id, "RETURNED") : handleUpdateComponentRequest(request.id, "RETURNED")}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Mark as Returned
                                </Button>
                                          </>
                                        )}
                                        
                                        {request.status === "USER_RETURNED" && (
                                          // Student has confirmed return, coordinator can confirm collection
                                  <Button 
                                    size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                              if (selectedRole === 'library') {
                                        handleUpdateLibraryRequest(request.id, "RETURNED")
                                              } else {
                                                handleUpdateComponentRequest(request.id, "RETURNED")
                                      }
                                    }}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                            Confirm Return
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
                  )
                );
              })()}
            </div>
          )}

          {activeTab === 'history' && selectedRole && (
        <div className="space-y-4">
              <h2 className="text-xl font-semibold">{roleName} History</h2>
              <p className="text-gray-600">View historical {roleName.toLowerCase()} requests and transactions</p>
              {historyRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No historical requests</h3>
                    <p className="text-gray-600">No completed or rejected {roleName.toLowerCase()} requests found.</p>
                  </CardContent>
                </Card>
              ) : (
                historyRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-gray-400">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {getItemName(request)}
                        </CardTitle>
                        {getStatusBadge(request.status)}
        </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Requester Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span>{getRequesterName(request)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span>{getRequesterEmail(request)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span>{getRequesterType(request)}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                          <div className="space-y-1 text-sm">
                            <div>Quantity: {request.quantity}</div>
                            <div>Purpose: {request.purpose}</div>
                            <div>Request Date: {new Date(request.request_date).toLocaleDateString()}</div>
                            <div>Required Date: {new Date(request.required_date).toLocaleDateString()}</div>
                            {request.return_date && (
                              <div>Returned: {new Date(request.return_date).toLocaleDateString()}</div>
                            )}
                            {request.status === 'REJECTED' && (
                              <div className="text-red-600">Rejected</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}