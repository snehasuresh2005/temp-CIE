"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  BookOpen, 
  Package, 
  AlertTriangle, 
  Clock, 
  Search,
  Plus,
  RefreshCw,
  CheckCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react"

// Utility functions
export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}

export function getOverdueDays(dueDate: string): number {
  const diffMs = new Date().getTime() - new Date(dueDate).getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function getTimeUntilExpiry(requestDate: string): { expired: boolean, timeLeft: string, minutesLeft: number } {
  const reservationTime = new Date(requestDate)
  const expiryTime = new Date(reservationTime.getTime() + 120 * 1000) // Add 2 hours
  const now = new Date()
  const timeLeft = expiryTime.getTime() - now.getTime()
  
  if (timeLeft <= 0) {
    return { expired: true, timeLeft: "Expired", minutesLeft: 0 }
  }
  
  const hours = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const totalMinutes = Math.floor(timeLeft / (1000 * 60))
  
  if (hours > 0) {
    return { expired: false, timeLeft: `${hours}h ${minutes}m`, minutesLeft: totalMinutes }
  } else {
    return { expired: false, timeLeft: `${minutes}m`, minutesLeft: totalMinutes }
  }
}

interface LibraryItem {
  id: string
  item_name: string
  item_description: string
  item_category: string
  item_quantity: number
  available_quantity: number
  item_location: string
  image_url: string | null
  back_image_url?: string | null
  front_image_id?: string | null
  back_image_id?: string | null
  item_specification?: string // Added for new dialog
}

interface LibraryRequest {
  id: string
  item_id: string
  quantity: number
  purpose?: string
  request_date: string
  required_date: string
  status: string
  collection_date?: string
  return_date?: string
  due_date?: string
  notes?: string
  faculty_notes?: string
  fine_amount?: number
  fine_paid?: boolean
  item?: LibraryItem
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

type ViewType = 'browse' | 'reserved' | 'active' | 'overdue'

export function LibraryDashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [requests, setRequests] = useState<LibraryRequest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('browse')
  const [currentTime, setCurrentTime] = useState(new Date())
  const { toast } = useToast()

  // Add state for info dialog and image toggle
  const [infoDialogOpen, setInfoDialogOpen] = useState<string | null>(null);
  const [imageStates, setImageStates] = useState<Record<string, boolean>>({}); // false = front, true = back
  const [categoryFilter, setCategoryFilter] = useState<string>("All")

  // Update time every minute for countdown display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    try {
      setLoading(true)
      
      // Fetch available library items
      const itemsResponse = await fetch(`/api/library-items`)
      const itemsData = await itemsResponse.json()
      const itemsArray = (itemsData.items || []).map((item: LibraryItem) => ({
        ...item,
        image_url: item.front_image_id ? `/library-images/${item.front_image_id}` : null,
        back_image_url: item.back_image_id ? `/library-images/${item.back_image_id}` : null
      }))
      setItems(itemsArray)

      // Fetch user's requests - fix the endpoint for faculty
      const endpoint = (user.role as any) === "STUDENT" 
        ? `/api/library-requests?student_id=${user.id}`
        : `/api/library-requests?my_requests=true`
      
      const requestsResponse = await fetch(endpoint, {
        headers: { "x-user-id": user.id }
      })
      const requestsData = await requestsResponse.json()
      
      // Map image URLs to requests based on items data
      const enrichedRequests = (requestsData.requests || []).map((request: LibraryRequest) => {
        const matchingItem = itemsArray.find((item: LibraryItem) => item.id === request.item_id)
        if (matchingItem && request.item) {
          request.item.image_url = matchingItem.image_url
          request.item.back_image_url = matchingItem.back_image_url
        }
        return request
      })
      
      setRequests(enrichedRequests)

    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load library data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestItem = async () => {
    if (!user || !selectedItem) return

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
          purpose: `${(user.role as any) === "STUDENT" ? "Student" : "Faculty"} library request`,
          required_date: returnDate.toISOString(),
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRequests((prev) => [...prev, data.request])
        setSelectedItem(null)
        setIsRequestDialogOpen(false)
        fetchData() // Refresh data
        
        toast({
          title: "Success",
          description: "Item reserved successfully! It will appear in your Reserved section.",
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

  // Function to dismiss an expired request
  const handleDismissExpiredRequest = async (requestId: string) => {
    if (!user) return;
    
    try {
      console.log('Starting dismiss process for request:', requestId);
      
      // First, update the status to EXPIRED before deletion
      const updateResponse = await fetch(`/api/library-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({
          status: "EXPIRED"
        })
      })

      console.log('Update response status:', updateResponse.status);
      
      if (updateResponse.ok) {
        console.log('Status updated successfully, now deleting...');
        
        // Now delete the expired request
        const deleteResponse = await fetch(`/api/library-requests/${requestId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id
          },
        })

        console.log('Delete response status:', deleteResponse.status);

        if (deleteResponse.ok) {
          // Remove the expired request from the local state
          setRequests(prev => prev.filter(req => req.id !== requestId))
          
          toast({
            title: "Request Dismissed",
            description: "Expired reservation has been permanently removed.",
          })
        } else {
          const errorData = await deleteResponse.json()
          console.error('Delete error data:', errorData);
          throw new Error(errorData.error || "Failed to delete request")
        }
      } else {
        const errorData = await updateResponse.json()
        console.error('Update error data:', errorData);
        throw new Error(errorData.error || "Failed to update request status")
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

  // Filter requests by status
  const reservedItems = requests.filter((req) => req.status === "APPROVED")
  const activeLoans = requests.filter((req) => req.status === "COLLECTED")
  const overdueItems = activeLoans.filter((req) => req.due_date && isOverdue(req.due_date))

  // Get list of book IDs that user has already borrowed (reserved, active, or overdue)
  const reservedBookIds = new Set(
    requests
      .filter((req) => req.status === "APPROVED")
      .map((req) => req.item_id)
  )
  
  const borrowedBookIds = new Set(
    requests
      .filter((req) => req.status === "COLLECTED")
      .map((req) => req.item_id)
  )

  // Get unique categories
  const categories = ["All", ...Array.from(new Set(items.map(i => i.item_category)).values())]

  // Updated filtering logic
  const filteredItems = items.filter(
    (item) => {
      const matchesSearch =
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "All" || item.item_category === categoryFilter
      return matchesSearch && matchesCategory
    }
  )

  // Check if user can borrow a specific book
  const canBorrowBook = (item: LibraryItem) => {
    return item.available_quantity > 0 && !reservedBookIds.has(item.id) && !borrowedBookIds.has(item.id)
  }

  const getStatusBadge = (status: string, overdue?: boolean) => {
    if (status === "COLLECTED" && overdue) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    }
    
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-blue-100 text-blue-800">Reserved</Badge>
      case "COLLECTED":
        return <Badge className="bg-green-100 text-green-800">Active Loan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderContent = () => {
    switch (currentView) {
      case 'reserved':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Reserved Items</h2>
            {reservedItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reserved items</h3>
                  <p className="text-gray-600">Items you reserve will appear here, ready for collection.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {reservedItems.map((request) => {
                  const expiryInfo = getTimeUntilExpiry(request.request_date)
                  const isUrgent = expiryInfo.minutesLeft <= 30 && !expiryInfo.expired
                  
                  return (
                    <Card key={request.id} className={`flex flex-col h-full hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-200 bg-white ${
                      expiryInfo.expired 
                        ? 'border-red-300 bg-red-50' 
                        : isUrgent 
                          ? 'border-orange-300 bg-orange-50' 
                          : ''
                    }`}>
                      <CardHeader className="p-3 pb-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                              <Package className="h-5 w-5 flex-shrink-0 text-purple-600" />
                              <span className="truncate">{request.item?.item_name || "Unknown Item"}</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500">{request.item?.item_category || "Unknown Category"}</CardDescription>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <Badge className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              expiryInfo.expired 
                                ? 'bg-red-100 text-red-800' 
                                : isUrgent 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-blue-100 text-blue-800'
                            }`}>
                              {expiryInfo.expired ? 'Expired' : isUrgent ? 'Urgent' : 'Reserved'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Image Display */}
                      {request.item?.image_url && (
                        <div className="relative w-full aspect-[3/4] mb-2 px-8 pt-2 p-3 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center">
                          <div className="w-full h-full">
                            <img
                              src={request.item.image_url || '/placeholder.jpg'}
                              alt={`Cover of ${request.item?.item_name || "Library Item"}`}
                              className="object-contain max-w-[70%] max-h-[80%] mx-auto rounded-md bg-gray-50"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.jpg"
                              }}
                            />
                            {expiryInfo.expired && (
                              <div className="absolute inset-0 bg-red-600 bg-opacity-75 flex items-center justify-center rounded-md">
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  EXPIRED
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <CardContent className="flex-grow flex flex-col p-3 pt-2">
                        <div className="flex-grow">
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                            <div>
                              <span className="font-medium">Reserved:</span> {new Date(request.request_date).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Due:</span> {new Date(request.required_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className={`h-3 w-3 ${
                              expiryInfo.expired 
                                ? 'text-red-600' 
                                : isUrgent 
                                  ? 'text-orange-600' 
                                  : 'text-blue-600'
                            }`} />
                            <p className={`text-xs font-medium ${
                              expiryInfo.expired 
                                ? 'text-red-600' 
                                : isUrgent 
                                  ? 'text-orange-600' 
                                  : 'text-blue-600'
                            }`}>
                              {expiryInfo.expired 
                                ? 'Expired' 
                                : `${expiryInfo.timeLeft} left`
                              }
                            </p>
                          </div>
                          {expiryInfo.expired && (
                            <p className="text-red-600 font-medium text-xs mt-1">
                              ⚠️ This reservation has expired
                            </p>
                          )}
                          {isUrgent && !expiryInfo.expired && (
                            <p className="text-orange-600 font-medium text-xs mt-1">
                              ⏰ Collect soon! Expires in {expiryInfo.timeLeft}
                            </p>
                          )}
                        </div>
                        
                        {expiryInfo.expired && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs mt-3 border-red-300 text-red-700 hover:bg-red-100"
                            onClick={() => handleDismissExpiredRequest(request.id)}
                          >
                            Dismiss
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )

      case 'active':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Active Loans</h2>
            {activeLoans.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active loans</h3>
                  <p className="text-gray-600">Items you collect will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeLoans.map((request) => {
                  const overdue = request.due_date && isOverdue(request.due_date)
                  const daysOverdue = request.due_date ? getOverdueDays(request.due_date) : 0
                  
                  return (
                    <Card key={request.id} className={`flex flex-col h-full hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-200 bg-white ${
                      overdue ? "border-red-200 bg-red-50" : ""
                    }`}>
                      <CardHeader className="p-3 pb-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                              <Package className="h-5 w-5 flex-shrink-0 text-purple-600" />
                              <span className="truncate">{request.item?.item_name || "Unknown Item"}</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500">{request.item?.item_category || "Unknown Category"}</CardDescription>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <Badge className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              overdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {overdue ? 'Overdue' : 'Active Loan'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Image Display */}
                      {request.item?.image_url && (
                        <div className="relative w-full aspect-[3/4] mb-2 px-8 pt-2 p-3 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center">
                          <div className="w-full h-full">
                            <img
                              src={request.item.image_url || '/placeholder.jpg'}
                              alt={`Cover of ${request.item?.item_name || "Library Item"}`}
                              className="object-contain max-w-[70%] max-h-[80%] mx-auto rounded-md bg-gray-50"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.jpg"
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <CardContent className="flex-grow flex flex-col p-3 pt-2">
                        <div className="flex-grow">
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                            <div>
                              <span className="font-medium">Collected:</span> {request.collection_date ? new Date(request.collection_date).toLocaleDateString() : "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Due:</span> {request.due_date ? new Date(request.due_date).toLocaleDateString() : "N/A"}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <p className={`text-xs font-medium ${
                              overdue ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {overdue ? `${daysOverdue} days overdue` : 'Currently reading'}
                            </p>
                          </div>
                          {overdue && (
                            <p className="text-red-600 font-medium text-xs mt-1">
                              Fine: ₹{daysOverdue * 5} (₹5/day)
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )

      case 'overdue':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Overdue Items</h2>
            {overdueItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No overdue items</h3>
                  <p className="text-gray-600">Keep up the good work! Return items on time.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {overdueItems.map((request) => {
                  const daysOverdue = request.due_date ? getOverdueDays(request.due_date) : 0
                  const fineAmount = daysOverdue * 5 // ₹5 per day
                  
                  return (
                    <Card key={request.id} className="flex flex-col h-full hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-200 bg-white border-red-300 bg-red-50">
                      <CardHeader className="p-3 pb-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                              <Package className="h-5 w-5 flex-shrink-0 text-purple-600" />
                              <span className="truncate">{request.item?.item_name || "Unknown Item"}</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500">{request.item?.item_category || "Unknown Category"}</CardDescription>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <Badge className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800">
                              Overdue
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Image Display */}
                      {request.item?.image_url && (
                        <div className="relative w-full aspect-[3/4] mb-2 px-8 pt-2 p-3 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center">
                          <div className="w-full h-full">
                            <img
                              src={request.item.image_url || '/placeholder.jpg'}
                              alt={`Cover of ${request.item?.item_name || "Library Item"}`}
                              className="object-contain max-w-[70%] max-h-[80%] mx-auto rounded-md bg-gray-50"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.jpg"
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <CardContent className="flex-grow flex flex-col p-3 pt-2">
                        <div className="flex-grow">
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                            <div>
                              <span className="font-medium">Due:</span> {request.due_date ? new Date(request.due_date).toLocaleDateString() : "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Collected:</span> {request.collection_date ? new Date(request.collection_date).toLocaleDateString() : "N/A"}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <p className="text-xs text-red-600 font-medium">
                              {daysOverdue} days overdue
                            </p>
                          </div>
                          <p className="text-red-600 font-medium text-xs mt-1">
                            Fine: ₹{fineAmount} (₹5/day)
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )

      default: // 'browse'
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Library Items</span>
                </CardTitle>
                <CardDescription>
                 Do collect within 2 hours of reserving the book.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 items-center mb-4 pb-1">
                    <div className="relative w-56">
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredItems.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                        <p className="text-gray-600">Try adjusting your search terms.</p>
                      </div>
                    ) : (
                      filteredItems.map((item) => {
                        const isReserved = reservedBookIds.has(item.id)
                        const isBorrowed = borrowedBookIds.has(item.id)
                        const isOutOfStock = item.available_quantity === 0
                        const canBorrow = canBorrowBook(item)
                        const isUnavailable = isReserved || isBorrowed || isOutOfStock
                        return (
                          <Card 
                            key={item.id} 
                            className={`flex flex-col h-full hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-200 bg-white ${isUnavailable ? 'opacity-60 bg-gray-50 border-gray-200' : ''}`}
                          >
                            <CardHeader className="px-3 py-3 mb-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                                    <Package className="h-5 w-5 flex-shrink-0 text-purple-600" />
                                    <span className="truncate">{item.item_name}</span>
                                  </CardTitle>
                                  <CardDescription className="text-xs text-gray-500">{item.item_category}</CardDescription>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <Badge className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.available_quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.available_quantity > 0 ? ` Available` : 'Out of stock'}</Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                    onClick={() => setInfoDialogOpen(item.id)}
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            {/* Image Display */}
                            {(item.image_url || item.back_image_url) && (
                              <div className="relative w-full h-32 mb-2 px-3 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center">
                                {/* Front Image */}
                                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${imageStates[item.id] ? 'opacity-0' : 'opacity-100'}`}>
                                  <img
                                    src={item.image_url || '/placeholder.jpg'}
                                    alt={`Front view of ${item.item_name}`}
                                    className="object-contain w-full h-full rounded-md bg-gray-50"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.jpg"
                                    }}
                                  />
                                </div>
                                {/* Back Image */}
                                {item.back_image_url && (
                                  <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${imageStates[item.id] ? 'opacity-100' : 'opacity-0'}`}>
                                    <img
                                      src={item.back_image_url}
                                      alt={`Back view of ${item.item_name}`}
                                      className="object-contain w-full h-full rounded-md bg-gray-50"
                                      onError={(e) => {
                                        e.currentTarget.src = "/placeholder.jpg"
                                      }}
                                    />
                                  </div>
                                )}
                                {/* Navigation Buttons */}
                                {item.back_image_url && (
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
                                {item.back_image_url && (
                                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                                    <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${!imageStates[item.id] ? 'bg-white' : 'bg-white/50'}`} />
                                    <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${imageStates[item.id] ? 'bg-white' : 'bg-white/50'}`} />
                                  </div>
                                )}
                              </div>
                            )}
                            <CardContent className="flex-grow flex flex-col p-3 pt-0">
                              {/* Remove space-y-3 from the details area to eliminate extra gap */}
                              <div className="flex-grow">
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                  <div><span className="font-medium">Available:</span> {item.available_quantity}</div>
                                  <div><span className="font-medium">Total:</span> {item.item_quantity}</div>
                                </div>
                                <div className="text-xs text-gray-500 mt-0">
                                  <span className="font-medium">Location:</span> {item.item_location}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className={`w-full h-8 text-xs mt-3 ${
                                  isUnavailable
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300' 
                                    : ''
                                }`}
                                disabled={!canBorrow}
                                onClick={() => {
                                  if (canBorrow) {
                                    setSelectedItem(item)
                                    setIsRequestDialogOpen(true)
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {isReserved 
                                  ? 'Reserved' 
                                  : isBorrowed
                                    ? 'Already Borrowed'
                                    : item.available_quantity === 0 
                                      ? 'Out of Stock' 
                                      : 'Reserve'
                                }
                              </Button>
                            </CardContent>
                          </Card>
                        )
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading library...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Library</h1>
          <p className="text-gray-600 mt-1">Reserve and manage your library items</p>
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
            currentView === 'browse' ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-200' : 'hover:ring-1 hover:ring-purple-200'
          }`}
          onClick={() => setCurrentView('browse')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className={`h-5 w-5 transition-colors duration-200 ${
                currentView === 'browse' ? 'text-purple-600' : 'text-purple-500 group-hover:text-purple-700'
              }`} />
              <div>
                <p className={`text-2xl font-bold transition-colors duration-200 ${
                  currentView === 'browse' ? 'text-purple-700' : 'text-gray-900'
                }`}>
                  {items.reduce((sum, item) => sum + item.available_quantity, 0)}
                </p>
                <p className={`text-sm transition-colors duration-200 ${
                  currentView === 'browse' ? 'text-purple-600' : 'text-gray-600'
                }`}>Available Books</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-blue-100 hover:border-blue-300 ${
            currentView === 'reserved' ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'hover:ring-1 hover:ring-blue-200'
          }`}
          onClick={() => setCurrentView('reserved')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className={`h-5 w-5 transition-colors duration-200 ${
                currentView === 'reserved' ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-700'
              }`} />
              <div>
                <p className={`text-2xl font-bold transition-colors duration-200 ${
                  currentView === 'reserved' ? 'text-blue-700' : 'text-gray-900'
                }`}>{reservedItems.length}</p>
                <p className={`text-sm transition-colors duration-200 ${
                  currentView === 'reserved' ? 'text-blue-600' : 'text-gray-600'
                }`}>Reserved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-yellow-100 hover:border-yellow-300 ${
            currentView === 'active' ? 'ring-2 ring-yellow-500 bg-yellow-50 border-yellow-200' : 'hover:ring-1 hover:ring-yellow-200'
          }`}
          onClick={() => setCurrentView('active')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className={`h-5 w-5 transition-colors duration-200 ${
                currentView === 'active' ? 'text-yellow-600' : 'text-yellow-500 group-hover:text-yellow-700'
              }`} />
              <div>
                <p className={`text-2xl font-bold transition-colors duration-200 ${
                  currentView === 'active' ? 'text-yellow-700' : 'text-gray-900'
                }`}>{activeLoans.length}</p>
                <p className={`text-sm transition-colors duration-200 ${
                  currentView === 'active' ? 'text-yellow-600' : 'text-gray-600'
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
                }`}>{overdueItems.length}</p>
                <p className={`text-sm transition-colors duration-200 ${
                  currentView === 'overdue' ? 'text-red-600' : 'text-gray-600'
                }`}>Overdue Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Content Based on Selected View */}
      {renderContent()}

      {/* Reserve Item Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reserve Library Book</DialogTitle>
            <DialogDescription>
              Reserve this item for collection. It will be held for you.
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
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Reservation Policy</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Your reservation will be held for <strong>2 hours</strong> from the time of booking. 
                      Please collect within this time or the reservation will automatically expire.
                    </p>
                  </div>
                </div>
              </div>
              
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
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Reserving..." : "Reserve Item"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Dialog for (i) button */}
      <Dialog open={!!infoDialogOpen} onOpenChange={(open) => !open && setInfoDialogOpen(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Library Book Details</DialogTitle>
          </DialogHeader>
          {infoDialogOpen && (() => {
            const item = items.find(i => i.id === infoDialogOpen)
            if (!item) return null
            return (
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Details */}
                <div className="flex-1 space-y-4 min-w-0">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{item.item_name}</h2>
                    <p className="text-sm text-gray-500">{item.item_category}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm">Total Quantity</h4>
                      <p className="text-lg font-semibold text-gray-900">{item.item_quantity}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Available</h4>
                      <p className={`text-lg font-semibold ${item.available_quantity === 0 ? 'text-red-600' : 'text-green-600'}`}>{item.available_quantity}</p>
                    </div>
                  </div>
                  {item.item_description && (
                    <div>
                      <h4 className="font-medium text-sm">Description</h4>
                      <p className="text-sm text-gray-600">{item.item_description}</p>
                    </div>
                  )}
                  {item.item_specification && (
                    <div>
                      <h4 className="font-medium text-sm">Specifications</h4>
                      <p className="text-sm text-gray-600">{item.item_specification}</p>
                    </div>
                  )}
                </div>
                {/* Right: Image Preview with toggle */}
                <div className="flex flex-col items-center justify-center w-full md:w-64">
                  <div className="relative w-full aspect-[3/4] p-2 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center">
                    {/* Front Image */}
                    <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${imageStates[item.id] ? 'opacity-0' : 'opacity-100'}`}>
                      <img
                        src={item.image_url || '/placeholder.jpg'}
                        alt={`Front view of ${item.item_name}`}
                        className="object-contain w-full h-full rounded-md bg-gray-50"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg"
                        }}
                      />
                    </div>
                    {/* Back Image */}
                    {item.back_image_url && (
                      <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${imageStates[item.id] ? 'opacity-100' : 'opacity-0'}`}>
                        <img
                          src={item.back_image_url}
                          alt={`Back view of ${item.item_name}`}
                          className="object-contain w-full h-full rounded-md bg-gray-50"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.jpg"
                          }}
                        />
                      </div>
                    )}
                    {/* Navigation Buttons */}
                    {item.back_image_url && (
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
                    {item.back_image_url && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                        <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${!imageStates[item.id] ? 'bg-white' : 'bg-white/50'}`} />
                        <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${imageStates[item.id] ? 'bg-white' : 'bg-white/50'}`} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}