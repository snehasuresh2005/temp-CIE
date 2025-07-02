"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { CheckCircle, Clock, AlertTriangle, Package, X, Check, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface LibraryItem {
  id: string
  item_name: string
  item_description: string
  image_url: string | null
  item_quantity: number
  available_quantity: number
  item_category: string
  requests: LibraryRequest[]
}

interface LibraryRequest {
  id: string
  student_id: string
  item_id: string
  quantity: number
  request_date: string
  required_date: string
  collection_date: string | null
  return_date: string | null
  status: string
  notes: string | null
  faculty_notes: string | null
  item?: LibraryItem
}

export function LibraryManagement() {
  const { user } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [requests, setRequests] = useState<LibraryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [facultyNotes, setFacultyNotes] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true)
      const itemsResponse = await fetch(`/api/library-items?faculty_id=${user.id}`)
      const itemsData = await itemsResponse.json()
      setItems(itemsData.items || [])

      const requestsResponse = await fetch(`/api/library-requests?faculty_id=${user.id}`)
      const requestsData = await requestsResponse.json()
      setRequests(requestsData.requests || [])
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

  const pendingRequests = requests.filter((req) => req.status === "PENDING")
  const activeRequests = requests.filter((req) => ["APPROVED", "COLLECTED"].includes(req.status))
  const pendingReturnRequests = requests.filter((req) => req.status === "PENDING_RETURN")
  const overdueRequests = requests.filter((req) => req.status === "COLLECTED" && isOverdue(req.required_date))
  const completedRequests = requests.filter((req) => ["RETURNED", "REJECTED"].includes(req.status))

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
        }),
      })
      if (response.ok) {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: "RETURNED", return_date: new Date().toISOString() } : req,
          ),
        )
        fetchData()
        toast({
          title: "Item Returned",
          description: "Item has been marked as returned",
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

  const isOverdue = (expectedReturnDate: string) => {
    return new Date(expectedReturnDate) < new Date()
  }

  const getOverdueDays = (expectedReturnDate: string) => {
    const overdue = new Date().getTime() - new Date(expectedReturnDate).getTime()
    return Math.ceil(overdue / (1000 * 60 * 60 * 24))
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
          <RefreshCw className="h-4 w-4 mr-2" />
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

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Requests ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="active">Active Loans ({activeRequests.length})</TabsTrigger>
          <TabsTrigger value="pending-returns">Pending Returns ({pendingReturnRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">All library item requests have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {request.student_id.split(" ")[0][0] + request.student_id.split(" ")[1][0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{request.student_id}</h3>
                          <p className="text-sm text-gray-600">{request.student_id}@example.com</p>
                          <p className="text-xs text-gray-500">
                            Requested on: {new Date(request.request_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Required by: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          {request.notes && (
                            <p className="text-xs text-gray-600 italic mt-1 bg-gray-50 p-2 rounded">
                              "{request.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Request</DialogTitle>
                              <DialogDescription>
                                Provide a reason for rejecting this library item request
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="rejectNotes">Reason for rejection</Label>
                                <Textarea
                                  id="rejectNotes"
                                  value={facultyNotes}
                                  onChange={(e) => setFacultyNotes(e.target.value)}
                                  placeholder="Please provide a reason for rejection..."
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setFacultyNotes("")}>Cancel</Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    handleRejectRequest(request.id, facultyNotes)
                                    setFacultyNotes("")
                                  }}
                                >
                                  Reject Request
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Request</DialogTitle>
                              <DialogDescription>Add any notes for the student (optional)</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="approveNotes">Notes for student (optional)</Label>
                                <Textarea
                                  id="approveNotes"
                                  value={facultyNotes}
                                  onChange={(e) => setFacultyNotes(e.target.value)}
                                  placeholder="Any special instructions or notes..."
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setFacultyNotes("")}>Cancel</Button>
                                <Button
                                  onClick={() => {
                                    handleApproveRequest(request.id, facultyNotes)
                                    setFacultyNotes("")
                                  }}
                                >
                                  Approve Request
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
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {activeRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active loans</h3>
                  <p className="text-gray-600">All library items have been returned.</p>
                </CardContent>
              </Card>
            ) : (
              activeRequests.map((request) => (
                <Card key={request.id} className={isOverdue(request.required_date) ? "border-red-200 bg-red-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {request.student_id.split(" ")[0][0] + request.student_id.split(" ")[1][0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{request.student_id}</h3>
                          <p className="text-sm text-gray-600">{request.student_id}@example.com</p>
                          <p className="text-xs text-gray-500">
                            Required by: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          {request.collection_date && (
                            <p className="text-xs text-green-600">
                              Collected: {new Date(request.collection_date).toLocaleDateString()}
                            </p>
                          )}
                          {isOverdue(request.required_date) && (
                            <p className="text-xs text-red-600 font-medium">
                              ⚠️ OVERDUE - {getOverdueDays(request.required_date)} days late
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
                        {request.status === "APPROVED" && (
                          <div className="text-right">
                            <Button size="sm" onClick={() => handleMarkCollected(request.id)}>
                              Mark Collected
                            </Button>
                          </div>
                        )}
                        {request.status === "COLLECTED" && null}
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
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending returns</h3>
                  <p className="text-gray-600">All return requests have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              pendingReturnRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {request.student_id.split(" ")[0][0] + request.student_id.split(" ")[1][0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{request.student_id}</h3>
                          <p className="text-sm text-gray-600">{request.student_id}@example.com</p>
                          <p className="text-xs text-gray-500">
                            Required by: {new Date(request.required_date).toLocaleDateString()}
                          </p>
                          {request.collection_date && (
                            <p className="text-xs text-green-600">
                              Collected: {new Date(request.collection_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" onClick={() => handleMarkReturned(request.id)}>
                          Mark Returned
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
                  <p className="text-gray-600">No completed or rejected requests yet.</p>
                </CardContent>
              </Card>
            ) : (
              completedRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {request.student_id.split(" ")[0][0] + request.student_id.split(" ")[1][0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{request.student_id}</h3>
                          <p className="text-sm text-gray-600">{request.student_id}@example.com</p>
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
                          {request.status === "REJECTED" && (
                            <p className="text-xs text-red-600 font-medium">
                              ❌ Request rejected
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

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  )
} 