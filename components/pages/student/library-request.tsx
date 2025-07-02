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
import { prisma } from "@/lib/prisma"

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
}

interface LibraryRequest {
  id: string
  item_id: string
  item: LibraryItem
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

  const [newRequest, setNewRequest] = useState({
    quantity: 1,
    purpose: "",
    required_date: "",
  })

  const [imageStates, setImageStates] = useState<Record<string, boolean>>({}) // false = front, true = back

  const [returnDialogOpen, setReturnDialogOpen] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user) return
    try {
      setLoading(true)

      // Fetch available library items
      const itemsResponse = await fetch("/api/library-items")
      const itemsData = await itemsResponse.json()
      setItems(
        (itemsData.items || []).map((item: any) => ({
          ...item,
          image_url: item.front_image_id ? `/library-images/${item.front_image_id}` : null,
          back_image_url: item.back_image_id ? `/library-images/${item.back_image_id}` : null,
        }))
      )

      // Fetch user's library requests
      const requestsResponse = await fetch(`/api/library-requests?student_id=${user.id}`)
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

  useEffect(() => {
    fetchData()
  }, [user])

  // Validation functions
  const isFormValid = () => {
    return (
      newRequest.quantity > 0 &&
      newRequest.purpose.trim() !== "" &&
      newRequest.required_date !== ""
    )
  }

  const filteredItems = items.filter(
    (item) =>
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_description.toLowerCase().includes(searchTerm.toLowerCase()),
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

    if (!selectedItem || !newRequest.purpose || !newRequest.required_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (newRequest.quantity > selectedItem.available_quantity) {
      toast({
        title: "Error",
        description: "Requested quantity exceeds available quantity",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/library-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({
          item_id: selectedItem.id,
          quantity: newRequest.quantity,
          purpose: newRequest.purpose,
          required_date: newRequest.required_date,
          notes: "",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRequests((prev) => [...prev, data.request])

        // Update item availability
        setItems((prev) =>
          prev.map((itm) =>
            itm.id === selectedItem.id
              ? { ...itm, available_quantity: itm.available_quantity - newRequest.quantity }
              : itm,
          ),
        )

        setNewRequest({
          quantity: 1,
          purpose: "",
          required_date: "",
        })
        setSelectedItem(null)
        setIsRequestDialogOpen(false)

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
    }
  }

  const handleReturnItem = async (requestId: string) => {
    if (!user) return;
    try {
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
          <h1 className="text-3xl font-bold text-gray-900">Library Item Request</h1>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Items ({items.length})</TabsTrigger>
          <TabsTrigger value="requests">My Requests ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-80">
              <Input placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="flex flex-col h-full hover:shadow-lg hover:scale-105 transition-all duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Package className="h-5 w-5" />
                        <span>{item.item_name}</span>
                      </CardTitle>
                      <CardDescription>{item.item_category}</CardDescription>
                    </div>
                    <Badge className={getAvailabilityColor(item.available_quantity, item.item_quantity)}>
                      {getAvailabilityText(item.available_quantity, item.item_quantity)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <div className="space-y-4 flex-grow">
                    {/* Image Display with Fade Animation */}
                    {(item.image_url || item.back_image_url) && (
                      <div className="relative w-full h-48">
                        {/* Front Image */}
                        <div 
                          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                            imageStates[item.id] ? 'opacity-0' : 'opacity-100'
                          }`}
                        >
                          <img
                            src={item.image_url || '/placeholder.jpg'}
                            alt={`Front view of ${item.item_name}`}
                            className="w-full h-full object-contain rounded-lg bg-gray-50"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg"
                            }}
                          />
                        </div>
                        {/* Back Image */}
                        {item.back_image_url && (
                          <div 
                            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                              imageStates[item.id] ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            <img
                              src={item.back_image_url}
                              alt={`Back view of ${item.item_name}`}
                              className="w-full h-full object-contain rounded-lg bg-gray-50"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.jpg"
                              }}
                            />
                          </div>
                        )}
                        {/* Navigation Buttons */}
                        {item.back_image_url && (
                          <>
                            {/* Show right arrow when on front image */}
                            {!imageStates[item.id] && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md z-10"
                                onClick={() => setImageStates(prev => ({ ...prev, [item.id]: true }))}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            )}
                            {/* Show left arrow when on back image */}
                            {imageStates[item.id] && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md z-10"
                                onClick={() => setImageStates(prev => ({ ...prev, [item.id]: false }))}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    <div className="mb-2">
                      <Label className="text-sm font-medium text-gray-500">Description</Label>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.item_description}</p>
                    </div>
                    {item.item_specification && (
                      <div className="mb-2">
                        <Label className="text-sm font-medium text-gray-500">Specifications</Label>
                        <p className="text-sm text-gray-700">{item.item_specification}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 items-center text-sm text-gray-700 mb-2">
                      <div><span className="font-semibold">Total:</span> {item.item_quantity}</div>
                      <div><span className="font-semibold">Available:</span> {item.available_quantity}</div>
                      <div><span className="font-semibold">Location:</span> {item.item_location}</div>
                    </div>
                  </div>
                  <div className="mt-auto pt-4">
                    <Dialog open={isRequestDialogOpen && selectedItem?.id === item.id} onOpenChange={(isOpen) => {
                      setIsRequestDialogOpen(isOpen)
                      if (!isOpen) {
                        setSelectedItem(null)
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="w-full mt-2 py-2 text-sm"
                          disabled={
                            item.available_quantity === 0
                          }
                          onClick={() => setSelectedItem(item)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {item.available_quantity === 0
                            ? "Out of Stock"
                            : "Request Item"
                          }
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        {selectedItem && (
                          <>
                            <DialogHeader>
                              <DialogTitle>Request Item</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              {/* Top row: Name and Quantity */}
                              <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
                                <div className="flex-1 mb-2 md:mb-0">
                                  <h2 className="text-xl font-bold text-gray-900">{selectedItem.item_name}</h2>
                                  <p className="text-sm text-gray-500">{selectedItem.item_category}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor="quantity" className="mb-0">Quantity *</Label>
                                  <Input
                                    id="quantity"
                                    type="number"
                                    value={newRequest.quantity}
                                    onChange={(e) => setNewRequest((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) }))}
                                    min="1"
                                    max={selectedItem.available_quantity || 1}
                                    className="w-20 px-2 py-1 text-sm"
                                  />
                                  <span className="text-xs text-gray-500 ml-2">Available: {selectedItem.available_quantity}</span>
                                </div>
                              </div>
                              {/* Purpose textarea */}
                              <div className="space-y-2">
                                <Label htmlFor="purpose">Purpose *</Label>
                                <Textarea
                                  id="purpose"
                                  value={newRequest.purpose}
                                  onChange={(e) => setNewRequest((prev) => ({ ...prev, purpose: e.target.value }))}
                                  placeholder="Describe how you plan to use this item..."
                                  rows={5}
                                  className="w-full text-base p-3 min-h-[120px] resize-vertical border border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              {/* Required date */}
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
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span tabIndex={0}>
                                        <Button
                                          onClick={handleRequestItem}
                                          disabled={!isFormValid()}
                                          className={!isFormValid() ? "opacity-50 cursor-not-allowed" : ""}
                                        >
                                          Submit Request
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    {(!isFormValid()) && (
                                      <TooltipContent>
                                        <div className="max-w-xs">
                                          {!isFormValid() && (
                                            <p>Please fill in all required fields (quantity, purpose, and required date)</p>
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
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-gray-600">Submit your first library item request to get started.</p>
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
                          <h3 className="font-medium">{request.item.item_name}</h3>
                          <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
                          <p className="text-xs text-gray-500">
                            Requested: {new Date(request.request_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Return by: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          {request.purpose && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <Label className="text-xs font-medium text-blue-700">Purpose:</Label>
                              <p className="text-xs text-blue-600 mt-1">"{request.purpose}"</p>
                            </div>
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
                              {isOverdue(request.required_date) ? "⚠️ Return Overdue Item" : "Return Item"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Return</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to mark this item as returned? This will notify the faculty for confirmation.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end space-x-2 mt-4">
                              <Button variant="outline" onClick={() => setReturnDialogOpen(null)}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={async () => {
                                  await handleReturnItem(request.id)
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