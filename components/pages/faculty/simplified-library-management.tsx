"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, User, Calendar, Package, BookOpen, CheckCircle, XCircle } from "lucide-react"
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

      {/* Completed Transactions Table */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No completed transactions</h3>
            <p className="text-gray-600">No completed or rejected requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Requester</TableHead>
                  <TableHead className="w-[200px]">Item</TableHead>
                  <TableHead className="w-[80px]">Qty</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[100px]">Requested</TableHead>
                  <TableHead className="w-[100px]">Collected</TableHead>
                  <TableHead className="w-[100px]">Returned</TableHead>
                  <TableHead className="w-[200px]">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const requester = getRequesterInfo(request)
                  
                  return (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{requester.name}</div>
                          <div className="text-xs text-gray-500">
                            {requester.type === "Student" ? `SRN: ${requester.id}` : requester.type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{request.item?.item_name || "Unknown Item"}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{request.quantity}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{new Date(request.request_date).toLocaleDateString()}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {request.collection_date ? new Date(request.collection_date).toLocaleDateString() : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {request.return_date ? new Date(request.return_date).toLocaleDateString() : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-600">
                          {request.faculty_notes ? request.faculty_notes.substring(0, 50) + (request.faculty_notes.length > 50 ? "..." : "") : "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}