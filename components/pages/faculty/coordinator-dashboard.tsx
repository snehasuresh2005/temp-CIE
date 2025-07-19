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
import { LabComponentsManagement } from "./lab-components-management"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import StatusBarChart from "@/components/StatusBarChart";
import PlatformManagerFeedbacks from "@/components/pages/faculty/platform-manager-feedbacks";
import DeveloperFeedbacks from "@/components/pages/faculty/developer-feedbacks";

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
  // Replace combinedFilter and filterOptions with a single filter state
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'due', 'not-due', 'student', 'faculty'
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

  // Update selectedRole state to include new roles
  const [selectedRole, setSelectedRole] = useState<'library' | 'lab' | 'platformManager' | 'developer' | null>(null)

  // In the CoordinatorDashboard component, add state for history search and filter:
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all"); // 'all', 'due', 'not-due', 'student', 'faculty'

  const [activeLoansPage, setActiveLoansPage] = useState(1);

  // Add detection for platform manager and developer roles
  const [hasPlatformManagerRole, setHasPlatformManagerRole] = useState(false);
  const [hasDeveloperRole, setHasDeveloperRole] = useState(false);

  useEffect(() => {
    fetchRequests()
    fetchCoordinatorDomains()
    // Replace roles array check with profileData flags
    if (user?.profileData) {
      setHasPlatformManagerRole(!!user.profileData.isPlatformManager);
      setHasDeveloperRole(!!user.profileData.isDeveloper);
    }
  }, [user])

  // Auto-select role if faculty has only one role
  useEffect(() => {
    if (!selectedRole) {
      const hasLibraryRole = coordinatorDomains.some(domain => domain.hasLibraryItems);
      const hasLabRole = coordinatorDomains.some(domain => domain.hasLabComponents);
      // Treat a domain named 'Platform Manager', 'Platform Management', or 'Developer' as special roles
      const hasPlatformManagerDomain = coordinatorDomains.some(domain => {
        const name = domain.name?.toLowerCase() || '';
        return name.includes('platform manager') || name.includes('platform management');
      });
      const hasDeveloperDomain = coordinatorDomains.some(domain => {
        const name = domain.name?.toLowerCase() || '';
        return name.includes('developer');
      });
      const hasPlatformManagerRoleUnified = hasPlatformManagerRole || hasPlatformManagerDomain;
      const hasDeveloperRoleUnified = hasDeveloperRole || hasDeveloperDomain;

      if (hasLibraryRole && !hasLabRole && !hasPlatformManagerRoleUnified && !hasDeveloperRoleUnified) {
        setSelectedRole('library');
      } else if (hasLabRole && !hasLibraryRole && !hasPlatformManagerRoleUnified && !hasDeveloperRoleUnified) {
        setSelectedRole('lab');
      } else if (hasPlatformManagerRoleUnified && !hasLibraryRole && !hasLabRole && !hasDeveloperRoleUnified) {
        setSelectedRole('platformManager');
      } else if (hasDeveloperRoleUnified && !hasLibraryRole && !hasLabRole && !hasPlatformManagerRoleUnified) {
        setSelectedRole('developer');
      }
      // If multiple roles exist, don't auto-select - let user choose
    }
  }, [coordinatorDomains, selectedRole, hasPlatformManagerRole, hasDeveloperRole]);

  // Reset activeTab to 'analytics' whenever selectedRole changes
  useEffect(() => {
    setActiveTab('analytics');
  }, [selectedRole]);

  const fetchCoordinatorDomains = async () => {
    try {
      console.log("[CoordinatorDashboard] Fetching coordinator domains for user:", user?.id);
      const response = await fetch("/api/coordinators/check", {
        headers: { "x-user-id": user?.id || "" }
      })
      const data = await response.json()
      console.log("[CoordinatorDashboard] /api/coordinators/check response:", JSON.stringify(data, null, 2));
      
      // Enhance domain data with inventory information
      const enhancedDomains = await Promise.all(
        (data.assignedDomains || []).map(async (domain: any) => {
          try {
            // Always show roles if assigned, regardless of inventory
            const hasLibraryItems = domain.name.toLowerCase().includes("library");
            const hasLabComponents = domain.name.toLowerCase().includes("lab");

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
      let baseDate;
      if (selectedRole === 'lab') {
        // Only extend if within 3 days of due date and not overdue
        const daysLeft = currentDueDate ? Math.ceil((new Date(currentDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
        const isOverdue = daysLeft !== null && daysLeft < 0;
        if (daysLeft === null || isOverdue || daysLeft > 3) {
          // Do nothing, toast is handled in button logic
          return;
        }
        baseDate = new Date(currentDueDate!);
        baseDate.setDate(baseDate.getDate() + 14); // Lab: Extend by 14 days from due date
      } else {
        baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + 14); // Library: Always today + 14 days
      }
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
          description: selectedRole === 'lab'
            ? `Due date extended to ${baseDate.toLocaleDateString()}`
            : `Due date set to ${baseDate.toLocaleDateString()}`
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

  // Check if faculty has multiple roles (coordinator, platform manager, developer)
  const hasAnyCoordinatorRole = coordinatorDomains.length > 0;
  const hasAnySpecialRole = hasPlatformManagerRole || hasDeveloperRole;
  const hasMultipleRoles = (
    (coordinatorDomains.some(domain => domain.hasLibraryItems) && coordinatorDomains.some(domain => domain.hasLabComponents)) ||
    (hasAnyCoordinatorRole && hasPlatformManagerRole) ||
    (hasAnyCoordinatorRole && hasDeveloperRole) ||
    (hasPlatformManagerRole && hasDeveloperRole)
  );

  // Role detection: build a list of all roles
  const hasLibraryRole = coordinatorDomains.some(domain => domain.hasLibraryItems);
  const hasLabRole = coordinatorDomains.some(domain => domain.hasLabComponents);
  const hasPlatformManagerDomain = coordinatorDomains.some(domain => {
    const name = domain.name?.toLowerCase() || '';
    return name.includes('platform manager') || name.includes('platform management');
  });
  const hasDeveloperDomain = coordinatorDomains.some(domain => {
    const name = domain.name?.toLowerCase() || '';
    return name.includes('developer');
  });
  const hasPlatformManagerRoleUnified = hasPlatformManagerRole || hasPlatformManagerDomain;
  const hasDeveloperRoleUnified = hasDeveloperRole || hasDeveloperDomain;
  // Use these unified flags everywhere below

  // Build roles array for card/toggle rendering
  const userRoles: Array<'library' | 'lab' | 'platformManager' | 'developer'> = [];
  if (hasLibraryRole) userRoles.push('library');
  if (hasLabRole) userRoles.push('lab');
  if (hasPlatformManagerRoleUnified) userRoles.push('platformManager');
  if (hasDeveloperRoleUnified) userRoles.push('developer');

  if (!loading && !hasAnyCoordinatorRole && !hasAnySpecialRole) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h1 className="faculty-page-title">CIE Team Coordinator Dashboard</h1>
        <div className="text-lg text-gray-600">You are not assigned as a coordinator, platform manager, or developer.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading coordinator dashboard...</div>
      </div>
    )
  }

  // Show role selection cards if user has any of the roles
  if ((userRoles.length > 1 || (!hasAnyCoordinatorRole && hasAnySpecialRole)) && !selectedRole) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="faculty-page-title">CIE Team Coordinator Dashboard</h1>
          <p className="text-gray-600">Choose which role you want to manage</p>
        </div>
        <div className="mt-10"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {userRoles.includes('library') && (
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-blue-50 hover:border-blue-300" onClick={() => setSelectedRole('library')}>
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
          )}
          {userRoles.includes('lab') && (
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-green-50 hover:border-green-300" onClick={() => setSelectedRole('lab')}>
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
          )}
          {userRoles.includes('platformManager') && (
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-indigo-50 hover:border-indigo-300" onClick={() => setSelectedRole('platformManager')}>
              <CardContent className="p-8 text-center">
                <Settings className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Platform Manager</h3>
                <p className="text-gray-600 mb-4">Review and approve faculty insights, assign to developers</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Settings className="h-4 w-4" />
                  <span>Insights Management</span>
                </div>
              </CardContent>
            </Card>
          )}
          {userRoles.includes('developer') && (
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-pink-50 hover:border-pink-300" onClick={() => setSelectedRole('developer')}>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-16 w-16 text-pink-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Developer</h3>
                <p className="text-gray-600 mb-4">Work on approved insights and mark as done</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <BarChart3 className="h-4 w-4" />
                  <span>Insights Tasks</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Always render the tabbed dashboard interface below
  return (
    <div className="space-y-6">
      {/* <div style={{ position: 'fixed', top: 60, right: 20, zIndex: 9999, background: '#fffbe6', color: '#333', padding: '8px 16px', border: '1px solid #ffe58f', borderRadius: 6, fontSize: 14 }}>
        Debug: selectedRole = {String(selectedRole)}
      </div> */}
      <div>
        <h1 className="faculty-page-title-global">CIE Team Coordinator Dashboard</h1>
      </div>

      {/* Role Selection - Show when faculty has multiple roles and no role is selected */}
      {hasMultipleRoles && !selectedRole && (
        <div className="space-y-6">
          <div className="text-center">
            
            <p className="text-gray-600">Choose which coordinator role you want to manage</p>
                </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
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
        {hasPlatformManagerRoleUnified && (
          <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-indigo-50 hover:border-indigo-300" onClick={() => setSelectedRole('platformManager')}>
            <CardContent className="p-8 text-center">
              <Settings className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Platform Manager</h3>
              <p className="text-gray-600 mb-4">Review and approve faculty insights, assign to developers</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Settings className="h-4 w-4" />
                <span>Insights Management</span>
              </div>
            </CardContent>
          </Card>
        )}
        {hasDeveloperRoleUnified && (
          <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-pink-50 hover:border-pink-300" onClick={() => setSelectedRole('developer')}>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-16 w-16 text-pink-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Developer</h3>
              <p className="text-gray-600 mb-4">Work on approved insights and mark as done</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <BarChart3 className="h-4 w-4" />
                <span>Insights Tasks</span>
              </div>
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      )}

      {/* Role Selection Buttons - Show when role is selected to allow switching */}
      {userRoles.length > 1 && selectedRole && (
        <div className="flex flex-wrap gap-4 mb-4">
          {userRoles.map(role => (
            <Button
              key={role}
              variant={selectedRole === role ? 'default' : 'outline'}
              onClick={() => setSelectedRole(role)}
              className="flex items-center space-x-2"
            >
              {role === 'library' && <BookOpen className="h-4 w-4" />}
              {role === 'lab' && <Package className="h-4 w-4" />}
              {role === 'platformManager' && <Settings className="h-4 w-4" />}
              {role === 'developer' && <BarChart3 className="h-4 w-4" />}
              <span>
                {role === 'library' && 'Library Coordinator'}
                {role === 'lab' && 'Lab Coordinator'}
                {role === 'platformManager' && 'Platform Manager'}
                {role === 'developer' && 'Developer'}
              </span>
            </Button>
          ))}
        </div>
      )}

      {/* Role-Specific Dashboard Content */}
      {selectedRole && (
        <>


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
          {activeTab === 'analytics' && (selectedRole === 'library' || selectedRole === 'lab') && (
            <Card>
              <CardHeader>
                <CardTitle>{roleName} Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Minimal Stat Cards Row - outside the graph section */}
                <div className="flex flex-row flex-wrap gap-2 mb-2 justify-center">
                  <div className="flex-1 min-w-[100px] max-w-[140px] bg-white rounded shadow-sm px-2 py-1 flex flex-col items-center justify-center text-center border border-gray-200">
                    <div className="text-xs text-gray-500 font-medium mb-0.5">Total Requests</div>
                    <div className="text-lg font-bold leading-tight">{requests.length}</div>
                  </div>
                  <div className="flex-1 min-w-[100px] max-w-[140px] bg-white rounded shadow-sm px-2 py-1 flex flex-col items-center justify-center text-center border border-gray-200">
                    <div className="text-xs text-gray-500 font-medium mb-0.5">Active Loans</div>
                    <div className="text-lg font-bold leading-tight">{returnRequests.length}</div>
                  </div>
                  <div className="flex-1 min-w-[100px] max-w-[140px] bg-white rounded shadow-sm px-2 py-1 flex flex-col items-center justify-center text-center border border-gray-200">
                    <div className="text-xs text-gray-500 font-medium mb-0.5">Overdue</div>
                    <div className="text-lg font-bold leading-tight text-red-600">{returnRequests.filter(isOverdue).length}</div>
                  </div>
                </div>
                {/* Request Status Overview - Only the graph in the card, no extra border or div below */}
                <div className="bg-white shadow rounded-t-lg px-4 pt-4 pb-2">
                  <StatusBarChart
                    title={''}
                    data={[
                      { label: 'Pending', count: pendingRequests.length, color: '#FFC107' },
                      { label: 'Awaiting', count: collectionRequests.length, color: '#2196F3' },
                      { label: 'Collected', count: returnRequests.length, color: '#4CAF50' },
                      { label: 'Returned', count: requests.filter(req => req.status === "RETURNED").length, color: '#757575' },
                      { label: 'Rejected', count: requests.filter(req => req.status === "REJECTED").length, color: '#F44336' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'collection' && selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle>{roleName} Collection Management</CardTitle>
              </CardHeader>
              <CardContent>
                {collectionRequests.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No items awaiting collection</h3>
                      <p className="text-gray-600">All approved {roleName.toLowerCase()} items have been collected.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-left text-black font-bold">Requester</TableHead>
                            <TableHead className="text-left text-black font-bold">{roleName} Item</TableHead>
                            <TableHead className="text-center text-black font-bold">Qty</TableHead>
                            <TableHead className="text-center text-black font-bold">Request Date</TableHead>
                            <TableHead className="text-center text-black font-bold">Required Date</TableHead>
                            <TableHead className="text-center text-black font-bold">Status</TableHead>
                            <TableHead className="text-center text-black font-bold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {collectionRequests.map((request) => {
                            const requesterId = request.student?.student_id || "N/A";
                            const requesterType = getRequesterType(request);
                            
                            return (
                              <TableRow key={request.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium text-sm text-left">
                                  <div>
                                    <div className="font-medium text-sm">{getRequesterName(request)}</div>
                                    <div className="text-xs text-gray-500">
                                      {requesterType === "Student" ? `SRN: ${requesterId}` : requesterType}
                                    </div>
                                    <div className="text-xs text-gray-500">{getRequesterEmail(request)}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-sm text-left">{getItemName(request)}</TableCell>
                                <TableCell className="text-sm font-medium text-center">{request.quantity}</TableCell>
                                <TableCell className="text-sm text-center">
                                  {new Date(request.request_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm text-center">
                                  {new Date(request.required_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getStatusBadge(request.status)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center items-center space-x-1">
                                    <Button 
                                      size="sm"
                                      onClick={() => {
                                        if (selectedRole === 'library') {
                                          handleUpdateLibraryRequest(request.id, "COLLECTED")
                                        } else {
                                          handleMarkAsCollected(request)
                                        }
                                      }}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Collect
                                    </Button>
                                    
                                    <Button 
                                      size="sm"
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
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'returns' && selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle>{roleName} Active Loans</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Define filteredActiveLoans here */}
                {(() => {
                  let activeLoans = returnRequests;
                  // --- Filtering Logic for Active Loans ---
                  if (searchTerm.trim() !== "") {
                    const lower = searchTerm.toLowerCase();
                    activeLoans = activeLoans.filter(request => {
                      const name = getRequesterName(request).toLowerCase();
                      const srn = request.student?.student_id?.toLowerCase?.() || "";
                      const item = getItemName(request).toLowerCase();
                      return name.includes(lower) || srn.includes(lower) || item.includes(lower);
                    });
                  }
                  if (activeFilter === "due") {
                    activeLoans = activeLoans.filter(request => isOverdue(request.due_date));
                  } else if (activeFilter === "not-due") {
                    activeLoans = activeLoans.filter(request => !isOverdue(request.due_date));
                  } else if (activeFilter === "student") {
                    activeLoans = activeLoans.filter(request => request.student);
                  } else if (activeFilter === "faculty") {
                    activeLoans = activeLoans.filter(request => !request.student);
                  }
                  const filteredActiveLoans = activeLoans;
                  const hasAnyLoans = returnRequests.length > 0;

                  if (!hasAnyLoans) {
                    return (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No active {roleName.toLowerCase()} loans</h3>
                          <p className="text-gray-600">All {roleName.toLowerCase()} items have been returned.</p>
                        </CardContent>
                      </Card>
                    );
                  }

                  const activeLoansRowsPerPage = 8;
                  const activeLoansTotalPages = Math.ceil(filteredActiveLoans.length / activeLoansRowsPerPage);
                  const paginatedActiveLoans = filteredActiveLoans.slice((activeLoansPage - 1) * activeLoansRowsPerPage, activeLoansPage * activeLoansRowsPerPage);

                  return (
                    <div className="space-y-4">
                      {/* Search and Filter Bar */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Search className="h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Search by name or item..."
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
                                {activeFilter === 'all' ? 'All' :
                                 activeFilter === 'due' ? 'Due' :
                                 activeFilter === 'not-due' ? 'Not Due' :
                                 activeFilter === 'student' ? 'Student' :
                                 'Faculty'}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {['all', 'due', 'not-due', 'student', 'faculty'].map((filter) => (
                              <DropdownMenuItem
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={activeFilter === filter ? 'bg-gray-100' : ''}
                              >
                                {filter === 'all' ? 'All' :
                                 filter === 'due' ? 'Due' :
                                 filter === 'not-due' ? 'Not Due' :
                                 filter === 'student' ? 'Student' :
                                 'Faculty'}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <Card>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-left text-black font-bold">Borrower</TableHead>
                                <TableHead className="text-left text-black font-bold">{roleName} Item</TableHead>
                                <TableHead className="text-center text-black font-bold">Qty</TableHead>
                                <TableHead className="text-center text-black font-bold">Status</TableHead>
                                <TableHead className="text-center text-black font-bold">Collected</TableHead>
                                <TableHead className="text-center text-black font-bold">Due Date</TableHead>
                                <TableHead className="text-center text-black font-bold">Fine</TableHead>
                                <TableHead className="text-center text-black font-bold">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedActiveLoans.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    No results found for the current search/filter.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                paginatedActiveLoans.map((request) => {
                                  const overdue = isOverdue(request.due_date)
                                  const daysOverdue = getDaysOverdue(request.due_date)
                                  const borrower = request.student?.user?.name || request.faculty?.user?.name || "Unknown"
                                  const borrowerId = request.student?.student_id || "Faculty"
                                  return (
                                    <TableRow key={request.id} className="hover:bg-gray-50">
                                      <TableCell className="font-medium text-sm text-left">
                                        <div>
                                          <div className="font-medium text-sm">{borrower}</div>
                                          <div className="text-xs text-gray-500">
                                            {request.student ? `SRN: ${borrowerId}` : 'Faculty'}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-medium text-sm text-left">{getItemName(request)}</TableCell>
                                      <TableCell className="text-sm font-medium text-center">{request.quantity}</TableCell>
                                      <TableCell className="text-center">
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
                                      <TableCell className="text-sm text-center">
                                        <span className="text-sm">
                                          {request.collection_date ? new Date(request.collection_date).toLocaleDateString() : "-"}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-sm text-center">
                                        <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : ''}`}>
                                          {request.due_date ? new Date(request.due_date).toLocaleDateString() : "-"}
                                        </span>
                                        {overdue && (
                                          <div className="text-xs text-red-600">
                                            {daysOverdue} days late
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
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
                                      <TableCell className="text-center">
                                        <div className="flex justify-center items-center space-x-1">
                                          {request.status === "COLLECTED" && (
                                            <>
                                              <Button 
                                                size="sm"
                                                variant="outline"
                                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                onClick={() => {
                                                  const daysLeft = request.due_date ? Math.ceil((new Date(request.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                                                  const isOverdue = daysLeft !== null && daysLeft < 0;
                                                  if (selectedRole === 'lab') {
                                                    if (isOverdue) {
                                                      toast({
                                                        title: "Cannot renew overdue items",
                                                        description: "This item is already overdue.",
                                                        variant: "destructive",
                                                      });
                                                      return;
                                                    }
                                                    if (daysLeft !== null && daysLeft > 3) {
                                                      toast({
                                                        title: "Renewal not allowed yet",
                                                        description: `Due date is already set to ${request.due_date ? new Date(request.due_date).toLocaleDateString() : '-'}`,
                                                        variant: "default",
                                                      });
                                                      return;
                                                    }
                                                  }
                                                  handleRenewRequest(request.id, request.due_date);
                                                }}
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
                                })
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                      {/* Pagination Controls for Active Loans */}
                      <div className="flex justify-between items-center p-2 border-t bg-gray-50">
                        <button
                          className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                          onClick={() => setActiveLoansPage((p) => Math.max(1, p - 1))}
                          disabled={activeLoansPage === 1}
                        >
                          Previous
                        </button>
                        <span className="text-xs text-gray-600">
                          Page {activeLoansPage} of {activeLoansTotalPages}
                        </span>
                        <button
                          className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                          onClick={() => setActiveLoansPage((p) => Math.min(activeLoansTotalPages, p + 1))}
                          disabled={activeLoansPage === activeLoansTotalPages}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle>{roleName} Request History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search by borrower, item, or SRN..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center space-x-2">
                        <Filter className="h-4 w-4" />
                        <span>
                          {historyFilter === 'all' ? 'All' :
                            historyFilter === 'due' ? 'Due' :
                            historyFilter === 'not-due' ? 'Not Due' :
                            historyFilter === 'student' ? 'Student' :
                            'Faculty'}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {['all', 'due', 'not-due', 'student', 'faculty'].map((filter) => (
                        <DropdownMenuItem
                          key={filter}
                          onClick={() => setHistoryFilter(filter)}
                          className={historyFilter === filter ? 'bg-gray-100' : ''}
                        >
                          {filter === 'all' ? 'All' :
                            filter === 'due' ? 'Due' :
                            filter === 'not-due' ? 'Not Due' :
                            filter === 'student' ? 'Student' :
                            'Faculty'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <HistoryTable data={historyRequests} roleName={roleName} searchTerm={historySearchTerm} filter={historyFilter} isOverdue={isOverdue} />
              </CardContent>
            </Card>
          )}
          {selectedRole === 'platformManager' && (
            <PlatformManagerFeedbacks />
          )}
          {selectedRole === 'developer' && (
            <DeveloperFeedbacks />
          )}
        </>
      )}
    </div>
  )
}



type HistoryTableProps = {
  data: RequestUnion[];
  roleName: string;
  searchTerm?: string;
  filter?: string;
  isOverdue: (dueDate?: string) => boolean;
};

function HistoryTable({ data, roleName, searchTerm = "", filter = "all", isOverdue }: HistoryTableProps) {
  const [page, setPage] = useState<number>(1);
  const rowsPerPage = 8;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  let filteredData = data;
  if (searchTerm.trim() !== "") {
    const lower = searchTerm.toLowerCase();
    filteredData = filteredData.filter(req => {
      const name = (req as any).student?.user?.name?.toLowerCase?.() || (req as any).requesting_faculty?.user?.name?.toLowerCase?.() || (req as any).faculty?.user?.name?.toLowerCase?.() || "";
      const srn = (req as any).student?.student_id?.toLowerCase?.() || "";
      const item = (req as any).component?.component_name?.toLowerCase?.() || (req as any).item?.item_name?.toLowerCase?.() || "";
      return name.includes(lower) || srn.includes(lower) || item.includes(lower);
    });
  }
  if (filter === "due") {
    filteredData = filteredData.filter(req => req.due_date && isOverdue(req.due_date));
  } else if (filter === "not-due") {
    filteredData = filteredData.filter(req => req.due_date && !isOverdue(req.due_date));
  } else if (filter === "student") {
    filteredData = filteredData.filter(req => (req as any).student);
  } else if (filter === "faculty") {
    filteredData = filteredData.filter(req => !(req as any).student);
  }
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600';
      case 'APPROVED': return 'text-blue-600';
      case 'COLLECTED': return 'text-green-600';
      case 'RETURNED': return 'text-gray-600';
      case 'REJECTED': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left font-bold text-gray-700 px-4 py-3">Borrower</th>
            <th className="text-left font-bold text-gray-700 px-4 py-3">{roleName === 'Lab' ? 'Lab Item' : 'Item'}</th>
            <th className="text-left font-bold text-gray-700 px-4 py-3">Qty</th>
            <th className="text-left font-bold text-gray-700 px-4 py-3">Status</th>
            <th className="text-left font-bold text-gray-700 px-4 py-3">Collected</th>
            <th className="text-left font-bold text-gray-700 px-4 py-3">Due Date</th>
            <th className="text-left font-bold text-gray-700 px-4 py-3">Fine</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-400">No history found.</td>
            </tr>
          ) : (
            paginatedData.map((req: RequestUnion) => {
              const borrower = (req as any).student?.user?.name || (req as any).requesting_faculty?.user?.name || (req as any).faculty?.user?.name || 'Unknown';
              const borrowerId = (req as any).student?.student_id || 'Faculty';
              const item = (req as any).component?.component_name || (req as any).item?.item_name || '-';
              const qty = (req as any).quantity;
              const status = (req as any).status;
              const collected = (req as any).collection_date ? new Date((req as any).collection_date).toLocaleDateString() : '-';
              const dueDate = (req as any).due_date ? new Date((req as any).due_date).toLocaleDateString() : '-';
              const fine = (req as any).fine_amount && (req as any).fine_amount > 0 ? `₹${(req as any).fine_amount}` : '-';
              return (
                <tr key={req.id} className="border-t">
                  <td className="px-4 py-3 align-top truncate">
                    <div className="font-medium text-sm truncate">{borrower}</div>
                    <div className="text-xs text-gray-500 truncate">{(req as any).student ? `SRN: ${borrowerId}` : 'Faculty'}</div>
                  </td>
                  <td className="px-4 py-3 align-top font-medium text-sm truncate">{item}</td>
                  <td className="px-4 py-3 align-top text-sm">{qty}</td>
                  <td className={`px-4 py-3 align-top font-medium text-sm ${getStatusColor(status)}`}>{status}</td>
                  <td className="px-4 py-3 align-top text-sm whitespace-nowrap">{collected}</td>
                  <td className="px-4 py-3 align-top text-sm whitespace-nowrap">{dueDate}</td>
                  <td className="px-4 py-3 align-top text-sm">{fine}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {/* Pagination Controls */}
      <div className="flex justify-between items-center p-2 border-t bg-gray-50">
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="text-xs text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default CoordinatorDashboard;