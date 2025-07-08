"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, RotateCcw, Loader2 } from "lucide-react"
import { CheckCircle, Clock, AlertTriangle, Package, X, Plus, ChevronRight, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

// Utility functions - declared at module scope for hoisting
export function isOverdue(expectedReturnDate: string): boolean {
  return new Date(expectedReturnDate) < new Date();
}

export function getOverdueDays(expectedReturnDate: string): number {
  const diffMs = new Date().getTime() - new Date(expectedReturnDate).getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

interface LibraryItem {
  id: string
  item_name: string
  item_description: string
  image_url: string | null
  back_image_url?: string | null
  front_image_id?: string | null
  back_image_id?: string | null
  item_quantity: number
  available_quantity: number
  item_category: string
  item_location: string
  item_specification: string
  requests: LibraryRequest[]
}

interface LibraryRequest {
  id: string
  student_id?: string
  faculty_id?: string
  student?: {
    id: string
    user: {
      name: string
      email: string | null
    }
  }
  faculty?: {
    id: string
    user: {
      name: string
      email: string | null
    }
  }
  item_id: string
  quantity: number
  request_date: string
  required_date: string
  collection_date: string | null
  return_date: string | null
  status: string
  notes: string | null
  faculty_notes: string | null
  purpose: string
  item?: LibraryItem
}

export function LibraryManagement() {
  const { user } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [allItems, setAllItems] = useState<LibraryItem[]>([])
  const [requests, setRequests] = useState<LibraryRequest[]>([])
  const [myRequests, setMyRequests] = useState<LibraryRequest[]>([])
  const [requestDate, setRequestDate] = useState("")
  const [facultyNotes, setFacultyNotes] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)
  const [imageStates, setImageStates] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true)
      
      // Fetch all library items for requesting
      const allItemsResponse = await fetch(`/api/library-items`)
      const allItemsData = await allItemsResponse.json()
      const itemsArray = (allItemsData.items || []).map((item: LibraryItem) => ({
        ...item,
        image_url: item.front_image_id ? `/library-images/${item.front_image_id}` : null,
        back_image_url: item.back_image_id ? `/library-images/${item.back_image_id}` : null
      }))
      setAllItems(itemsArray)

      // Fetch items for management (if faculty has management permissions)
      const itemsResponse = await fetch(`/api/library-items?faculty_id=${user.id}`)
      const itemsData = await itemsResponse.json()
      setItems(itemsData.items || [])

      // Fetch student requests for management
      const requestsResponse = await fetch(`/api/library-requests?faculty_id=${user.id}`)
      const requestsData = await requestsResponse.json()
      setRequests(requestsData.requests || [])

      // Fetch my own requests as faculty
      const myRequestsResponse = await fetch(`/api/library-requests?faculty_id=${user.id}&my_requests=true`)
      const myRequestsData = await myRequestsResponse.json()
      setMyRequests(myRequestsData.requests || [])

    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load library items and requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter available items for requesting
  const filteredItems = allItems.filter(
    (item) =>
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle faculty making their own request
  const handleRequestItem = async () => {
    if (!user || !selectedItem) {
      toast({
        title: "Error",
        description: "No item selected",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      // Calculate return date (14 days from now)
      const returnDate = new Date()
      returnDate.setDate(returnDate.getDate() + 14)

      const response = await fetch("/api/library-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({
          item_id: selectedItem.id,
          quantity: 1,
          purpose: "Faculty library book request",
          required_date: returnDate.toISOString(),
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMyRequests((prev) => [...prev, data.request])
        setSelectedItem(null)
        setIsRequestDialogOpen(false)
        fetchData() // Refresh data

        toast({
          title: "Success",
          description: "Library item request submitted successfully",
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
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingRequests = requests.filter((req) => req.status === "PENDING")
  const activeRequests = requests.filter((req) => ["APPROVED", "COLLECTED"].includes(req.status))
  const pendingReturnRequests = requests.filter((req) => req.status === "PENDING_RETURN")
  const overdueRequests = requests.filter((req) => req.status === "COLLECTED" && isOverdue(req.required_date))
  const completedRequests = requests.filter((req) => ["RETURNED", "REJECTED", "EXPIRED"].includes(req.status))

  // Filter out expired requests (older than 30 days) for my requests
  const filterActiveRequests = (requests: LibraryRequest[]) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return requests.filter(request => {
      const requestDate = new Date(request.request_date)
      return requestDate > thirtyDaysAgo
    })
  }

  const activeMyRequests = filterActiveRequests(myRequests)

  // Add the missing updateRequestStatus function
  const updateRequestStatus = async (requestId: string, status: string) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/library-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({
          status: status,
          ...(status === "COLLECTED" && { collection_date: new Date().toISOString() }),
          ...(status === "RETURNED" && { return_date: new Date().toISOString() }),
        }),
      })
      if (response.ok) {
        setRequests((prev) =>
          prev.map((req) => 
            req.id === requestId 
              ? { 
                  ...req, 
                  status,
                  ...(status === "COLLECTED" && { collection_date: new Date().toISOString() }),
                  ...(status === "RETURNED" && { return_date: new Date().toISOString() }),
                } 
              : req
          ),
        )
        toast({
          title: "Status Updated",
          description: `Request has been marked as ${status.toLowerCase()}`,
        })
        fetchData() // Refresh data to update inventory if needed
      } else {
        throw new Error(`Failed to update status to ${status}`)
      }
    } catch (error) {
      console.error(`Error updating status to ${status}:`, error)
      toast({
        title: "Error",
        description: `Failed to update status to ${status}`,
        variant: "destructive",
      })
    }
  }

  const handleApproveRequest = async (requestId: string, notes?: string) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/library-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
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
          description: "Student has been notified and can collect the item",
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
    if (!user) return;
    try {
      const response = await fetch(`/api/library-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
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
    if (!user) return;
    try {
      const response = await fetch(`/api/library-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
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
        fetchData()
        toast({
          title: "Item Collected",
          description: "Item has been marked as collected",
        })
      } else {
        throw new Error("Failed to mark as collected")
      }
    } catch (error) {
      console.error("Error marking as collected:", error)
      toast({
        title: "Error",
        description: "Failed to mark item as collected",
        variant: "destructive",
      })
    }
  }

  const handleMarkReturned = async (requestId: string) => {
    if (!user) return;

    // locate request to send quantity for backend restock
    const reqToReturn = requests.find(r => r.id === requestId);
    if (!reqToReturn) return;

    try {
      const response = await fetch(`/api/library-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({
          status: "RETURNED",
          return_date: new Date().toISOString(),
          quantity: reqToReturn.quantity,
        }),
      })
      if (response.ok) {
        // Find the request details to know which item and quantity to restock
        const returnedReq = requests.find((r) => r.id === requestId)

        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: "RETURNED", return_date: new Date().toISOString() } : req,
          ),
        )

        if (returnedReq) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === returnedReq.item_id
                ? { ...it, available_quantity: it.available_quantity + returnedReq.quantity }
                : it,
            ),
          )
        }

        toast({
          title: "Item Returned",
          description: "Stock updated and item marked as returned",
        })
      } else {
        throw new Error("Failed to mark as returned")
      }
    } catch (error) {
      console.error("Error marking as returned:", error)
      toast({
        title: "Error",
        description: "Failed to mark item as returned",
        variant: "destructive",
      })
    }
  }

  const handleExpireRequest = async (requestId: string) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/library-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({
          status: "EXPIRED",
        }),
      })
      if (response.ok) {
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? { ...req, status: "EXPIRED" } : req)),
        )
        toast({
          title: "Request Expired",
          description: "The request has been marked as expired and books are available again",
        })
        fetchData() // Refresh to update inventory
      } else {
        throw new Error("Failed to expire request")
      }
    } catch (error) {
      console.error("Error expiring request:", error)
      toast({
        title: "Error",
        description: "Failed to expire request",
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
      case "PENDING_RETURN":
        return "bg-orange-100 text-orange-800"
      case "RETURNED":
        return "bg-purple-100 text-purple-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "OVERDUE":
        return "bg-red-100 text-red-800"
      case "EXPIRED":
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
      case "PENDING_RETURN":
        return <Clock className="h-4 w-4" />
      case "RETURNED":
        return <CheckCircle className="h-4 w-4" />
      case "REJECTED":
        return <X className="h-4 w-4" />
      case "OVERDUE":
        return <AlertTriangle className="h-4 w-4" />
      case "EXPIRED":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading library items...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Library Items Management</h1>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{activeRequests.length}</p>
                <p className="text-sm text-gray-600">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{pendingReturnRequests.length}</p>
                <p className="text-sm text-gray-600">Pending Returns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{overdueRequests.length}</p>
                <p className="text-sm text-gray-600">Overdue Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {items.reduce((sum, item) => sum + item.available_quantity, 0)}
                </p>
                <p className="text-sm text-gray-600">Available Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my-requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-requests">My Requests ({activeMyRequests.length})</TabsTrigger>
          <TabsTrigger value="request-item">Request New Item</TabsTrigger>
          <TabsTrigger value="ready-collection">Ready for Collection ({activeRequests.filter(req => req.status === "APPROVED").length})</TabsTrigger>
          <TabsTrigger value="active">Active Loans ({activeRequests.filter(req => req.status === "COLLECTED").length})</TabsTrigger>
          <TabsTrigger value="pending-returns">Pending Returns ({pendingReturnRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
        </TabsList>

        <TabsContent value="my-requests" className="space-y-4">
          <div className="grid gap-4">
            {activeMyRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active requests</h3>
                  <p className="text-gray-600">You haven't made any library requests yet.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]');
                      const requestTab = tabsList?.querySelector('[value="request-item"]') as HTMLElement;
                      requestTab?.click();
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Request Your First Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeMyRequests.map((request) => (
                <Card key={request.id} className={isOverdue(request.required_date) ? "border-red-200 bg-red-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={request.item?.image_url || "/placeholder.jpg"}
                            alt={request.item?.item_name || "Library Item"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg"
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium">{request.item?.item_name || "Unknown Item"}</h3>
                          <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
                          <p className="text-xs text-gray-500">
                            Requested: {new Date(request.request_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Required by: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          {request.collection_date && (
                            <p className="text-xs text-green-600">
                              Collected: {new Date(request.collection_date).toLocaleDateString()}
                            </p>
                          )}
                          {request.return_date && (
                            <p className="text-xs text-purple-600">
                              Returned: {new Date(request.return_date).toLocaleDateString()}
                            </p>
                          )}
                          {isOverdue(request.required_date) && request.status === "COLLECTED" && (
                            <p className="text-xs text-red-600 font-medium">
                              ⚠️ OVERDUE - {getOverdueDays(request.required_date)} days late
                            </p>
                          )}
                          {request.faculty_notes && (
                            <p className="text-xs text-blue-600 mt-1">
                              <strong>Faculty Notes:</strong> {request.faculty_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status.toLowerCase()}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="request-item" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Request Library Items</span>
              </CardTitle>
              <CardDescription>
                Browse available library items and submit requests for books you need.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <Input
                    placeholder="Search items by name, category, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                      <p className="text-gray-600">Try adjusting your search terms.</p>
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Item Image with flip functionality */}
                            <div 
                              className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer"
                              onClick={() => {
                                if (item.back_image_url) {
                                  setImageStates(prev => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
                                  }))
                                }
                              }}
                            >
                              <img
                                src={imageStates[item.id] && item.back_image_url ? item.back_image_url : (item.image_url || "/placeholder.jpg")}
                                alt={item.item_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.jpg"
                                }}
                              />
                              {item.back_image_url && (
                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded text-xs">
                                  {imageStates[item.id] ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <h3 className="font-medium text-sm">{item.item_name}</h3>
                              <p className="text-xs text-gray-600 mt-1">{item.item_category}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.item_description}</p>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs">
                              <span className={`font-medium ${item.available_quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                                {item.available_quantity > 0 ? `${item.available_quantity} available` : "Out of stock"}
                              </span>
                              <span className="text-gray-500">Total: {item.item_quantity}</span>
                            </div>
                            
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={item.available_quantity === 0}
                              onClick={() => {
                                setSelectedItem(item)
                                setIsRequestDialogOpen(true)
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Request Item
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ready-collection" className="space-y-4">
          <div className="grid gap-4">
            {activeRequests.filter(req => req.status === "APPROVED").length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items ready for collection</h3>
                  <p className="text-gray-600">When items are approved, they'll appear here for collection.</p>
                </CardContent>
              </Card>
            ) : (
              activeRequests.filter(req => req.status === "APPROVED").map((request) => (
                <Card key={request.id} className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={request.item?.image_url || "/placeholder.jpg"}
                            alt={request.item?.item_name || "Library Item"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg"
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium">{request.item?.item_name || "Unknown Item"}</h3>
                          <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
                          <p className="text-xs text-gray-500">
                            Approved: {new Date(request.approval_date || request.request_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Required by: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          {request.faculty_notes && (
                            <p className="text-xs text-blue-600 mt-1">
                              <strong>Faculty Notes:</strong> {request.faculty_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready for Collection
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, "COLLECTED")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Mark as Collected
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {activeRequests.filter(req => req.status === "COLLECTED").length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active loans</h3>
                  <p className="text-gray-600">Your collected items will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              activeRequests.filter(req => req.status === "COLLECTED").map((request) => (
                <Card key={request.id} className={isOverdue(request.required_date) ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={request.item?.image_url || "/placeholder.jpg"}
                            alt={request.item?.item_name || "Library Item"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg"
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium">{request.item?.item_name || "Unknown Item"}</h3>
                          <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
                          <p className="text-xs text-gray-500">
                            Collected: {new Date(request.collection_date || request.request_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          {isOverdue(request.required_date) && (
                            <p className="text-xs text-red-600 font-medium">
                              ⚠️ OVERDUE - {getOverdueDays(request.required_date)} days late
                            </p>
                          )}
                          {request.faculty_notes && (
                            <p className="text-xs text-blue-600 mt-1">
                              <strong>Faculty Notes:</strong> {request.faculty_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={isOverdue(request.required_date) ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                          <BookOpen className="h-3 w-3 mr-1" />
                          {isOverdue(request.required_date) ? "Overdue" : "On Loan"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRequestStatus(request.id, "RETURNED")}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Return Item
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending-returns" className="space-y-4">
          <div className="grid gap-4">
            {pendingReturnRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <RotateCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending returns</h3>
                  <p className="text-gray-600">Items marked for return will appear here for faculty approval.</p>
                </CardContent>
              </Card>
            ) : (
              pendingReturnRequests.map((request) => (
                <Card key={request.id} className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={request.item?.image_url || "/placeholder.jpg"}
                            alt={request.item?.item_name || "Library Item"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg"
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium">{request.item?.item_name || "Unknown Item"}</h3>
                          <p className="text-sm text-gray-600">
                            Requester: {request.student?.user?.name || request.faculty?.user?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
                          <p className="text-xs text-gray-500">
                            Return requested: {new Date(request.return_date || request.request_date).toLocaleDateString()}
                          </p>
                          {request.faculty_notes && (
                            <p className="text-xs text-blue-600 mt-1">
                              <strong>Notes:</strong> {request.faculty_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-100 text-purple-800">
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Return Pending
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, "COMPLETED")}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve Return
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {completedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed requests</h3>
                  <p className="text-gray-600">Completed library transactions will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              completedRequests.map((request) => (
                <Card key={request.id} className="border-gray-200 bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={request.item?.image_url || "/placeholder.jpg"}
                            alt={request.item?.item_name || "Library Item"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg"
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium">{request.item?.item_name || "Unknown Item"}</h3>
                          <p className="text-sm text-gray-600">
                            Requester: {request.student?.user?.name || request.faculty?.user?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
                          <p className="text-xs text-gray-500">
                            Completed: {new Date(request.return_date || request.request_date).toLocaleDateString()}
                          </p>
                          {request.faculty_notes && (
                            <p className="text-xs text-blue-600 mt-1">
                              <strong>Notes:</strong> {request.faculty_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-gray-100 text-gray-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>{item.item_name}</span>
                  </CardTitle>
                  <CardDescription>{item.item_category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Item Image */}
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={item.image_url || "/placeholder.jpg"}
                        alt={item.item_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg"
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-4 items-center text-sm text-gray-700 mb-2">
                      <div><span className="font-semibold">Total:</span> {item.item_quantity}</div>
                      <div><span className="font-semibold">Available:</span> {item.available_quantity}</div>
                      <div><span className="font-semibold">Category:</span> {item.item_category}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Library Item</DialogTitle>
            <DialogDescription>
              Submit a request for the selected library item.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedItem.image_url || "/placeholder.jpg"}
                    alt={selectedItem.item_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.jpg"
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-medium">{selectedItem.item_name}</h3>
                  <p className="text-sm text-gray-600">{selectedItem.item_category}</p>
                  <p className="text-sm text-green-600">{selectedItem.available_quantity} available</p>
                </div>
              </div>
              
              <form onSubmit={handleRequestItem} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    value={1}
                    min={1}
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Required Date</label>
                  <Input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Purpose/Notes (Optional)</label>
                  <Textarea
                    value={facultyNotes}
                    onChange={(e) => setFacultyNotes(e.target.value)}
                    placeholder="Brief description of why you need this item..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}