"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Package,
  BookOpen,
  IndianRupee,
  FileText,
  Upload,
  History
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Request {
  id: string
  item_name: string
  domain_name?: string
  quantity: number
  request_date: string
  required_date: string
  due_date?: string
  collection_date?: string
  return_date?: string
  status: string
  notes?: string
  faculty_notes?: string
  fine_amount?: number
  fine_paid?: boolean
  payment_proof?: string
  type: 'component' | 'library'
}

export function StudentRequestHistory() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      
      // Fetch component requests
      const componentResponse = await fetch("/api/component-requests", {
        headers: { "x-user-id": user?.id || "" }
      })
      const componentData = await componentResponse.json()
      
      // Fetch library requests
      const libraryResponse = await fetch("/api/library-requests", {
        headers: { "x-user-id": user?.id || "" }
      })
      const libraryData = await libraryResponse.json()

      // Combine and format requests
      const componentRequests = (componentData.requests || []).map((req: any) => ({
        ...req,
        item_name: req.component?.component_name || "Unknown Component",
        domain_name: req.component?.domain?.name,
        type: 'component' as const
      }))

      const libraryRequests = (libraryData.requests || []).map((req: any) => ({
        ...req,
        item_name: req.item?.item_name || "Unknown Item",
        domain_name: req.item?.domain?.name,
        type: 'library' as const
      }))

      setRequests([...componentRequests, ...libraryRequests])
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast({
        title: "Error",
        description: "Failed to load request history",
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

  const calculateFine = (dueDate?: string) => {
    if (!dueDate || !isOverdue(dueDate)) return 0
    const daysOverdue = getDaysOverdue(dueDate)
    return daysOverdue * 5 // ₹5 per day
  }

  const handleReturnRequest = async (requestId: string, type: 'component' | 'library') => {
    try {
      const endpoint = type === 'component' 
        ? `/api/component-requests/${requestId}` 
        : `/api/library-requests/${requestId}`
      
      const formData = new FormData()
      formData.append('status', 'PENDING_RETURN')
      if (paymentProof) {
        formData.append('payment_proof', paymentProof)
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "x-user-id": user?.id || ""
        },
        body: formData
      })

      if (response.ok) {
        await fetchRequests()
        setPaymentProof(null)
        setSelectedRequest(null)
        toast({
          title: "Success",
          description: "Return request submitted successfully"
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit return request",
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
        return <Badge className={`bg-blue-100 text-blue-800 ${baseClass}`}>Approved - Ready for Collection</Badge>
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

  const activeRequests = requests.filter(req => ["APPROVED", "COLLECTED", "PENDING_RETURN"].includes(req.status))
  const completedRequests = requests.filter(req => ["RETURNED", "REJECTED"].includes(req.status))
  const pendingRequests = requests.filter(req => req.status === "PENDING")

  const totalFines = activeRequests.reduce((sum, req) => {
    if (req.fine_amount && !req.fine_paid) {
      return sum + req.fine_amount
    }
    const calculatedFine = calculateFine(req.due_date)
    return sum + calculatedFine
  }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading request history...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Requests & History</h1>
        <p className="text-gray-600 mt-2">Track your component and library requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold">{activeRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <IndianRupee className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding Fines</p>
                <p className="text-2xl font-bold">₹{totalFines}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Active Loans</h2>
            
            {activeRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active loans</h3>
                  <p className="text-gray-600">You currently have no borrowed items.</p>
                </CardContent>
              </Card>
            ) : (
              activeRequests.map((request) => {
                const overdue = isOverdue(request.due_date)
                const daysOverdue = getDaysOverdue(request.due_date)
                const currentFine = request.fine_amount || calculateFine(request.due_date)
                
                return (
                  <Card key={request.id} className={`border-l-4 ${overdue ? 'border-l-red-400' : 'border-l-green-400'}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                          {request.type === 'component' ? (
                            <Package className="h-5 w-5 mr-2" />
                          ) : (
                            <BookOpen className="h-5 w-5 mr-2" />
                          )}
                          {request.item_name}
                        </CardTitle>
                        {getStatusBadge(request.status, overdue)}
                      </div>
                      {request.domain_name && (
                        <CardDescription>Domain: {request.domain_name}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-gray-500">Quantity</Label>
                          <p className="font-medium">{request.quantity}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Collection Date</Label>
                          <p className="font-medium">
                            {request.collection_date ? new Date(request.collection_date).toLocaleDateString() : "Not collected"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Due Date</Label>
                          <p className={`font-medium ${overdue ? 'text-red-600' : ''}`}>
                            {request.due_date ? new Date(request.due_date).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Status</Label>
                          <p className="font-medium">{request.status.replace('_', ' ')}</p>
                        </div>
                      </div>

                      {overdue && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-700">
                                Overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {currentFine > 0 && (
                              <div className="flex items-center space-x-1 text-red-600">
                                <IndianRupee className="h-4 w-4" />
                                <span className="font-medium">₹{currentFine}</span>
                              </div>
                            )}
                          </div>
                          {currentFine > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              Fine: ₹5 per day. Payment required before return.
                            </p>
                          )}
                        </div>
                      )}

                      {request.status === "COLLECTED" && (
                        <div className="flex justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Return Item
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Return Request</DialogTitle>
                                <DialogDescription>
                                  Submit a return request for {request.item_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {currentFine > 0 && (
                                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <AlertTriangle className="h-5 w-5 text-red-600" />
                                      <span className="font-medium text-red-700">Fine Payment Required</span>
                                    </div>
                                    <p className="text-sm text-red-600 mb-3">
                                      This item is overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}. 
                                      You need to pay a fine of ₹{currentFine} before returning.
                                    </p>
                                    <div>
                                      <Label htmlFor="payment-proof">Upload Payment Proof *</Label>
                                      <Input
                                        id="payment-proof"
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                                        className="mt-1"
                                      />
                                      <p className="text-xs text-gray-500 mt-1">
                                        Upload screenshot of payment or receipt (JPG, PNG, PDF)
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => {
                                    setSelectedRequest(null)
                                    setPaymentProof(null)
                                  }}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => handleReturnRequest(request.id, request.type)}
                                    disabled={currentFine > 0 && !paymentProof}
                                  >
                                    Submit Return Request
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {request.status === "PENDING_RETURN" && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-700">
                              Return request submitted - awaiting coordinator verification
                            </span>
                          </div>
                          {request.payment_proof && (
                            <p className="text-xs text-orange-600 mt-1">
                              Payment proof uploaded and under review
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pending Approval</h2>
            
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">You have no requests awaiting approval.</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-400">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        {request.type === 'component' ? (
                          <Package className="h-5 w-5 mr-2" />
                        ) : (
                          <BookOpen className="h-5 w-5 mr-2" />
                        )}
                        {request.item_name}
                      </CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.domain_name && (
                      <CardDescription>Domain: {request.domain_name}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-gray-500">Quantity</Label>
                        <p className="font-medium">{request.quantity}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Required Date</Label>
                        <p className="font-medium">{new Date(request.required_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Requested On</Label>
                        <p className="font-medium">{new Date(request.request_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Status</Label>
                        <p className="font-medium">Under Review</p>
                      </div>
                    </div>
                    
                    {request.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium text-gray-700">Purpose:</Label>
                        <p className="text-sm text-gray-600 mt-1">"{request.notes}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Request History</h2>
            
            {completedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No history</h3>
                  <p className="text-gray-600">You have no completed requests yet.</p>
                </CardContent>
              </Card>
            ) : (
              completedRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-gray-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        {request.type === 'component' ? (
                          <Package className="h-5 w-5 mr-2" />
                        ) : (
                          <BookOpen className="h-5 w-5 mr-2" />
                        )}
                        {request.item_name}
                      </CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.domain_name && (
                      <CardDescription>Domain: {request.domain_name}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-gray-500">Requested</Label>
                        <p className="font-medium">{new Date(request.request_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">
                          {request.status === "RETURNED" ? "Returned" : "Completed"}
                        </Label>
                        <p className="font-medium">
                          {request.return_date ? new Date(request.return_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      {request.fine_amount && request.fine_paid && (
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-500">Fine Paid</Label>
                          <p className="font-medium text-red-600">₹{request.fine_amount}</p>
                        </div>
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