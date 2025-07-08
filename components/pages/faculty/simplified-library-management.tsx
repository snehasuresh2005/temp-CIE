"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle, XCircle, Package, Search, User, Calendar } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface LibraryRequest {
  id: string
  student?: {
    user: {
      name: string
      email: string
    }
    student_id: string
  }
  faculty?: {
    user: {
      name: string
      email: string
    }
  }
  item?: {
    item_name: string
  }
  quantity: number
  request_date: string
  required_date: string
  collection_date?: string
  return_date?: string
  status: string
  faculty_notes?: string
}

export function SimplifiedLibraryManagement() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<LibraryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCompletedRequests()
  }, [])

  const fetchCompletedRequests = async () => {
    try {
      const response = await fetch(`/api/library-requests?faculty_id=${user?.id}`)
      const data = await response.json()
      // Filter for completed transactions only
      const completedRequests = (data.requests || []).filter((req: LibraryRequest) => 
        ["RETURNED", "REJECTED", "EXPIRED"].includes(req.status)
      )
      setRequests(completedRequests)
    } catch (error) {
      console.error("Error fetching completed requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter(request =>
    request.item?.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.student?.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.faculty?.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RETURNED":
        return <Badge className="bg-green-100 text-green-800">✅ Returned</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>
      case "EXPIRED":
        return <Badge className="bg-gray-100 text-gray-800">⏰ Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRequesterInfo = (request: LibraryRequest) => {
    if (request.student) {
      return {
        name: request.student.user.name,
        email: request.student.user.email,
        id: request.student.student_id,
        type: "Student"
      }
    } else if (request.faculty) {
      return {
        name: request.faculty.user.name,
        email: request.faculty.user.email,
        id: "Faculty",
        type: "Faculty"
      }
    }
    return {
      name: "Unknown User",
      email: "",
      id: "",
      type: "Unknown"
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading transaction history...</div>
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search completed transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Completed</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Returned</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(req => req.status === "RETURNED").length}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {requests.filter(req => req.status === "REJECTED").length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completed Transactions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Transaction History</h3>
        
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No completed transactions</h3>
              <p className="text-gray-600">No completed or rejected requests yet.</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const requester = getRequesterInfo(request)
            
            return (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {requester.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{requester.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {requester.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{requester.email}</p>
                        {/* Only show ID for students, not faculty */}
                        {requester.id && requester.type === "Student" && (
                          <p className="text-xs text-gray-500">SRN: {requester.id}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{request.item?.item_name || "Unknown Item"}</span>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Requested: {new Date(request.request_date).toLocaleDateString()}</span>
                    </div>
                    
                    {request.collection_date && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Collected: {new Date(request.collection_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {request.return_date && (
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-green-600" />
                        <span>Returned: {new Date(request.return_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}