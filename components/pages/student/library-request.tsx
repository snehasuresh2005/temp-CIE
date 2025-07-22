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
import { Plus, Package, Clock, CheckCircle, XCircle, RefreshCw, ChevronRight, ChevronLeft, AlertTriangle, Info, Search, Filter } from "lucide-react"
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


interface LibraryItem {
  id: string
  item_name: string
  item_description: string
  item_category: string
  item_quantity: number
  available_quantity: number
  item_location: string
  item_specification: string
  image_url: string | null
  back_image_url?: string | null
  front_image_id?: string | null
  back_image_id?: string | null
}

interface LibraryRequest {
  id: string
  item_id: string
  item?: LibraryItem | null
  quantity: number
  purpose: string
  request_date: string
  required_date: string
  status: string
  approved_date: string | null
  return_date: string | null
  notes: string | null
}

export function LibraryRequest() {
  const { user } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [requests, setRequests] = useState<LibraryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [facultyList, setFacultyList] = useState<{ id: string; name: string }[]>([])

  const [newRequest, setNewRequest] = useState({
    quantity: 1,
    purpose: "",
    required_date: "",
  })

  const [imageStates, setImageStates] = useState<Record<string, boolean>>({}) // false = front, true = back
  const [showBack, setShowBack] = useState(false)

  const [returnDialogOpen, setReturnDialogOpen] = useState<string | null>(null)
  const [infoDialogOpen, setInfoDialogOpen] = useState<string | null>(null)

  // State for tracking viewed expired requests
  const [viewedExpiredRequests, setViewedExpiredRequests] = useState<Set<string>>(new Set())
  const [expiredRequestsToShow, setExpiredRequestsToShow] = useState<LibraryRequest[]>([])

  const [categoryFilter, setCategoryFilter] = useState<string>("All")
  // Remove locationFilter state

  const fetchData = async () => {
    if (!user) return
    try {
      setLoading(true)

      // Fetch available library items
      const itemsResponse = await fetch("/api/library-items")
      const itemsData = await itemsResponse.json()
      const itemsArray = (itemsData.items || []).map((item: LibraryItem) => ({
          ...item,
          image_url: item.front_image_id ? `/library-images/${item.front_image_id}` : null,
          back_image_url: item.back_image_id ? `/library-images/${item.back_image_id}` : null
        }));
      setItems(itemsArray)

      // Fetch user's library requests based on role
      let requestsResponse;
      if (user.role === "STUDENT" as any) {
        requestsResponse = await fetch(`/api/library-requests?student_id=${user.id}`)
      } else if (user.role === "FACULTY" as any) {
        requestsResponse = await fetch(`/api/library-requests?faculty_id=${user.id}`)
      } else {
        requestsResponse = await fetch(`/api/library-requests?student_id=${user.id}`)
      }
      
      const requestsData = await requestsResponse.json()
      // If API does not include item details, attach from items list
      const enriched = (requestsData.requests || []).map((req: any) => ({
        ...req,
        item: req.item ?? itemsArray.find((it: LibraryItem) => it.id === req.item_id) ?? null,
      }))
      setRequests(enriched)

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

  useEffect(() => {
    fetchData()
  }, [user])

  useEffect(() => {
    setShowBack(false);
  }, [infoDialogOpen]);

  useEffect(() => {
    // load faculty list once
    const fetchFaculty = async () => {
      const res = await fetch('/api/faculty')
      if (res.ok) {
        const data = await res.json()
        setFacultyList(data.faculty || [])
      }
    }
    fetchFaculty()
  }, [])

  // Validation functions
  const isFormValid = () => {
    return (
      newRequest.quantity > 0 &&
      newRequest.purpose.trim() !== "" &&
      newRequest.required_date !== ""
    )
  }

  // Get unique categories and locations
  const categories = ["All", ...Array.from(new Set(items.map(i => i.item_category)).values())]
  // Remove locations array

  // Updated filtering logic
  const filteredItems = items.filter(
    (item) => {
      const matchesSearch =
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "All" || item.item_category === categoryFilter
      // Remove location filtering
      return matchesSearch && matchesCategory
    }
  )

  const handleRequestItem = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to make a request.",
        variant: "destructive",
      })
      return
    }

    if (!selectedItem) {
      toast({
        title: "Error",
        description: "No item selected",
        variant: "destructive",
      })
      return
    }

    try {
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
          quantity: 1, // Default to 1
          purpose: "Library book request", // Default purpose
          required_date: returnDate.toISOString(),
        })
      })
      if (response.ok) {
        const data = await response.json()
        setRequests((prev) => [...prev, data.request])

        // Don't update item availability here - it will be updated when faculty approves the request
        // The quantity should only be decremented when the request is approved, not when it's submitted

        setSelectedItem(null)
        setIsRequestDialogOpen(false)

        toast({
          title: "Success",
          description: "Book request submitted successfully",
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

  const handleMarkCollected = async (requestId: string) => {
    if (!user) return;
    
    try {
      // Optimistic update - update local state immediately
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: "COLLECTED", collection_date: new Date().toISOString() } 
          : req
      ))

      const response = await fetch(`/api/library-requests/${requestId}`, {
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
        toast({
          title: "Item Collected",
          description: "Marked as collected. Remember to return on time!",
        })
      } else {
        // Revert optimistic update on error
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: "APPROVED", collection_date: null } 
            : req
        ))
        throw new Error("Failed to mark as collected")
      }
    } catch (error) {
      console.error("Error marking as collected:", error)
      toast({
        title: "Error",
        description: "Failed to mark as collected",
        variant: "destructive",
      })
    }
  }

  // Existing return handler
  const handleReturnItem = async (requestId: string) => {
    if (!user) return;
    
    try {
      // Optimistic update - update local state immediately
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: "PENDING_RETURN", return_date: new Date().toISOString() } 
          : req
      ))

      const response = await fetch(`/api/library-requests/${requestId}`, {
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
        toast({
          title: "Return Request Submitted",
          description: "Your return request has been submitted and is pending faculty approval",
        })
      } else {
        // Revert optimistic update on error
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: "COLLECTED", return_date: null } 
            : req
        ))
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "collected":
        return "bg-green-100 text-green-800"
      case "approved":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "collected":
        return <CheckCircle className="h-3 w-3" />
      case "approved":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "collected":
        return "Collected"
      case "approved":
        return "Not Collected"
      default:
        return "Processing"
    }
  }

  // Don't filter out expired requests - let them show in the requests section
  const filterActiveRequests = (requests: LibraryRequest[]) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return requests.filter(request => {
      // Keep expired requests in the list so they can be dismissed manually
      // Only filter by date for very old requests
      const requestDate = new Date(request.request_date)
      return requestDate > thirtyDaysAgo
    })
  }

  const activeRequests = filterActiveRequests(requests)

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

  // Effect to handle showing expired requests notifications
  useEffect(() => {
    // Filter for OVERDUE status requests that haven't been viewed yet
    const expiredRequests = requests.filter(req => 
      req.status === "OVERDUE" && !viewedExpiredRequests.has(req.id)
    )
    setExpiredRequestsToShow(expiredRequests)
  }, [requests, viewedExpiredRequests])

  const handleViewExpiredRequests = () => {
    // Mark all expired requests as viewed so they disappear
    const expiredRequestIds = expiredRequestsToShow.map(req => req.id)
    setViewedExpiredRequests(new Set([...viewedExpiredRequests, ...expiredRequestIds]))
    
    // Clear the notification
    setExpiredRequestsToShow([])
    
    toast({
      title: "Expired Reservations",
      description: "Your reservations have expired and were not collected in time. The items are now available for others to reserve.",
      variant: "destructive",
    })
  }

  // Function to dismiss an expired request
  const handleDismissExpiredRequest = async (requestId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/library-requests/${requestId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
      })

      if (response.ok) {
        // Remove the expired request from the local state
        setRequests(prev => prev.filter(req => req.id !== requestId))
        
        toast({
          title: "Request Dismissed",
          description: "Expired request has been permanently removed.",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to dismiss request")
      }
    } catch (error) {
      console.error("Error dismissing expired request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to dismiss request",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading book...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Library</h1>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Items ({items.length})</TabsTrigger>
          <TabsTrigger value="requests">My Requests ({activeRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center mb-4 pb-1">
            <div className="relative w-[22rem]">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <Input
                placeholder="Search items..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
                <CardHeader className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center space-x-2 text-sm">
                        <Package className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.item_name}</span>
                      </CardTitle>
                      <CardDescription className="text-xs">{item.item_category}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Badge className={`${getAvailabilityColor(item.available_quantity, item.item_quantity)} text-xs px-1 py-0.5`}>
                        {getAvailabilityText(item.available_quantity, item.item_quantity)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-gray-600"
                        onClick={() => setInfoDialogOpen(item.id)}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col p-3 pt-0">
                  <div className="space-y-3 flex-grow">
                    {/* Image Display */}
                    {(item.front_image_id || item.back_image_id) && (
                      <div className="relative w-full h-48">
                        {/* Front Image */}
                        <div 
                          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${imageStates[item.id] ? 'opacity-0' : 'opacity-100'}`}
                        >
                          <img
                            src={item.image_url || '/placeholder.jpg'}
                            alt={`Front view of ${item.item_name}`}
                            className="w-full h-full object-contain rounded-md bg-gray-50"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg"
                            }}
                          />
                        </div>
                        {/* Back Image */}
                        {item.back_image_id && (
                          <div 
                            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${imageStates[item.id] ? 'opacity-100' : 'opacity-0'}`}
                          >
                            <img
                              src={item.back_image_url || '/placeholder.jpg'}
                              alt={`Back view of ${item.item_name}`}
                              className="w-full h-full object-contain rounded-md bg-gray-50"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.jpg"
                              }}
                            />
                          </div>
                        )}
                        {/* Navigation Buttons */}
                        {item.back_image_id && (
                          <>
                            {!imageStates[item.id] && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/80 hover:bg-white shadow-sm z-10"
                                onClick={() => setImageStates(prev => ({ ...prev, [item.id]: true }))}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            )}
                            {imageStates[item.id] && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/80 hover:bg-white shadow-sm z-10"
                                onClick={() => setImageStates(prev => ({ ...prev, [item.id]: false }))}
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                        {/* Image Indicators */}
                        {item.back_image_id && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                            <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${!imageStates[item.id] ? 'bg-white' : 'bg-white/50'}`} />
                            <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${imageStates[item.id] ? 'bg-white' : 'bg-white/50'}`} />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                        <div><span className="font-medium">Total:</span> {item.item_quantity}</div>
                        <div><span className="font-medium">Available:</span> {item.available_quantity}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Location:</span> {item.item_location}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Dialog open={isRequestDialogOpen && selectedItem?.id === item.id} onOpenChange={(isOpen) => {
                      setIsRequestDialogOpen(isOpen)
                      if (!isOpen) {
                        setSelectedItem(null)
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs"
                          disabled={item.available_quantity === 0}
                          onClick={() => setSelectedItem(item)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {item.available_quantity === 0 ? "Out of Stock" : "Request"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        {selectedItem && (
                          <>
                            <DialogHeader>
                              <DialogTitle>Request Book</DialogTitle>
                              <DialogDescription>
                                Confirm your request for this library book
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              {/* Item Details */}
                              <div className="space-y-4">
                                {/* Item Image */}
                                {selectedItem.image_url && (
                                  <div className="w-full h-48 flex justify-center">
                                    <img
                                      src={selectedItem.image_url}
                                      alt={selectedItem.item_name}
                                      className="h-full object-contain rounded-lg"
                                      onError={(e) => {
                                        e.currentTarget.src = "/placeholder.jpg"
                                      }}
                                    />
                                  </div>
                                )}
                                
                                {/* Item Info */}
                                <div className="space-y-3">
                                  <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedItem.item_name}</h2>
                                    <p className="text-sm text-gray-500">{selectedItem.item_category}</p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium text-gray-600">Available:</span>
                                      <span className="text-sm font-semibold text-green-600">
                                        {selectedItem.available_quantity} of {selectedItem.item_quantity}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium text-gray-600">Location:</span>
                                      <span className="text-sm text-gray-900">{selectedItem.item_location}</span>
                                    </div>
                                  </div>
                                  
                                  {selectedItem.item_description && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-1">Description:</p>
                                      <p className="text-sm text-gray-700">{selectedItem.item_description}</p>
                                    </div>
                                  )}
                                  
                                  {selectedItem.item_specification && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-1">Specifications:</p>
                                      <p className="text-sm text-gray-700">{selectedItem.item_specification}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Request Notice */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <div className="flex items-start space-x-2">
                                    <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-blue-800">Request Information</p>
                                      <p className="text-sm text-blue-600 mt-1">
                                        Your request will be automatically approved and ready for collection. 
                                        You'll receive notification once processed.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsRequestDialogOpen(false)
                                    setSelectedItem(null)
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleRequestItem}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Confirm Request
                                </Button>
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
        </TabsContent>

        <TabsContent value="requests" className="space-y-1">
          {activeRequests.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-1">No active requests</h3>
                <p className="text-sm text-gray-600">Submit a book request to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
              {activeRequests.filter(Boolean).map((request) => (
                <div key={request.id} className={`bg-white border rounded-md p-2 hover:shadow-sm transition-shadow ${
                  request.status === "OVERDUE" ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Package className="h-3 w-3 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs text-gray-900 truncate">{request.item?.item_name ?? "Unknown"}</h4>
                        <p className="text-xs text-gray-500">Due: {new Date(request.required_date).toLocaleDateString()}</p>
                        {request.status === "OVERDUE" && (
                          <p className="text-xs text-red-600 font-medium">Reservation expired - not collected in time</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge className={`${getStatusColor(request.status)} text-xs px-1 py-0.5`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(request.status)}
                          <span className="text-xs">{request.status === "OVERDUE" ? "Expired" : getStatusText(request.status)}</span>
                        </div>
                      </Badge>
                      {request.status === "OVERDUE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs border-red-300 text-red-700 hover:bg-red-100"
                          onClick={() => handleDismissExpiredRequest(request.id)}
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Library Item Info Dialog */}
      <Dialog open={!!infoDialogOpen} onOpenChange={(open) => !open && setInfoDialogOpen(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Book Details</DialogTitle>
            <DialogDescription>
              Complete information about this book
            </DialogDescription>
          </DialogHeader>
          {infoDialogOpen && (() => {
            const item = items.find(i => i.id === infoDialogOpen)
            if (!item) return null
            
            return (
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Details */}
                <div className="flex-1 min-w-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-500" />
                        {item.item_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.available_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.available_quantity > 0 ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                    <div className="flex flex-row items-end justify-center pl-8">
                      <div>
                        <h4 className="font-medium text-sm">Total Quantity</h4>
                        <p className="text-lg font-semibold text-gray-900 text-center">{item.item_quantity}</p>
                      </div>
                      <div className="ml-16 text-center">
                        <h4 className="font-medium text-sm">Available</h4>
                        <p className={`text-lg font-semibold ${item.available_quantity === 0 ? 'text-red-600' : 'text-green-600'} text-center`}>
                          {item.available_quantity}
                        </p>
                      </div>
                    </div>
                    {item.item_specification && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Specifications</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{item.item_specification}</p>
                      </div>
                    )}
                    {item.item_description && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Description</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{item.item_description}</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Right: Image Preview */}
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <div className="relative w-full max-w-xs aspect-square bg-gray-50 rounded-lg border flex items-center justify-center overflow-hidden">
                    {item.image_url || item.back_image_url ? (
                      <>
                        <img
                          src={showBack && item.back_image_url ? item.back_image_url : item.image_url || '/placeholder.jpg'}
                          alt={showBack ? `Back view of ${item.item_name}` : `Front view of ${item.item_name}`}
                          className="object-contain w-full h-full"
                          onError={e => { e.currentTarget.src = '/placeholder.jpg'; }}
                        />
                        {item.back_image_url && item.image_url && (
                          <>
                            {/* Left arrow (show only when on back) */}
                            {showBack && (
                              <button
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center border z-10"
                                onClick={() => setShowBack(false)}
                                type="button"
                                aria-label="Show Front"
                              >
                                <ChevronLeft className="h-6 w-6" />
                              </button>
                            )}
                            {/* Right arrow (show only when on front) */}
                            {!showBack && (
                              <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center border z-10"
                                onClick={() => setShowBack(true)}
                                type="button"
                                aria-label="Show Back"
                              >
                                <ChevronRight className="h-6 w-6" />
                              </button>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-gray-400">
                        <Package className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">No image available</p>
                      </div>
                    )}
                  </div>
                  {/* Image indicator */}
                  {item.image_url && item.back_image_url && (
                    <div className="flex justify-center mt-3 space-x-2">
                      <button
                        onClick={() => setShowBack(false)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          !showBack ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                        aria-label="Front view"
                      />
                      <button
                        onClick={() => setShowBack(true)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          showBack ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                        aria-label="Back view"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}