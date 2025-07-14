"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { UserPlus, Users, RefreshCw, Trash2, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Faculty {
  id: string
  user: {
    name: string
    email: string
  }
  department: string
}

interface CoordinatorAssignment {
  id: string
  domain_name: string
  faculty: {
    id: string
    user: {
      name: string
      email: string
    }
    department: string
  }
  assigned_at: string
}

// Predefined domains based on your existing lab/library categories
const PREDEFINED_DOMAINS = [
  { id: "library", name: "Library", description: "General library items and books" },
  { id: "electronics", name: "Electronics Lab", description: "Electronic components and circuits" },
  { id: "mechanical", name: "Mechanical Lab", description: "Mechanical tools and equipment" },
  { id: "computer", name: "Computer Lab", description: "Computer hardware and software" },
  { id: "physics", name: "Physics Lab", description: "Physics experiments and equipment" },
  { id: "chemistry", name: "Chemistry Lab", description: "Chemical equipment and materials" },
  { id: "civil", name: "Civil Lab", description: "Civil engineering tools and materials" },
  { id: "biotech", name: "Biotechnology Lab", description: "Biotech equipment and materials" }
]

export function ManageDomains() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [assignments, setAssignments] = useState<CoordinatorAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  
  const [newAssignment, setNewAssignment] = useState({
    domain_name: "",
    faculty_id: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all faculty
      const facultyResponse = await fetch("/api/faculty")
      const facultyData = await facultyResponse.json()
      setFaculty(facultyData.faculty || [])

      // Fetch current coordinator assignments
      const assignmentsResponse = await fetch("/api/coordinators/assignments", {
        headers: { "x-user-id": user?.id || "" }
      })
      const assignmentsData = await assignmentsResponse.json()
      setAssignments(assignmentsData.assignments || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load faculty and assignments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCoordinator = async () => {
    if (!newAssignment.domain_name || !newAssignment.faculty_id) {
      toast({
        title: "Error",
        description: "Please select both domain and faculty member",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/coordinators/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || ""
        },
        body: JSON.stringify(newAssignment)
      })

      if (response.ok) {
        await fetchData() // Refresh data
        setNewAssignment({ domain_name: "", faculty_id: "" })
        setIsAssignDialogOpen(false)
        toast({
          title: "Success",
          description: "Coordinator assigned successfully"
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign coordinator",
        variant: "destructive",
      })
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/coordinators/assignments/${assignmentId}`, {
        method: "DELETE",
        headers: { "x-user-id": user?.id || "" }
      })

      if (response.ok) {
        await fetchData() // Refresh data
        toast({
          title: "Success",
          description: "Coordinator assignment removed successfully"
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove assignment",
        variant: "destructive",
      })
    }
  }

  const getAssignmentsForDomain = (domainId: string) => {
    return assignments.filter(assignment => assignment.domain_name === domainId)
  }

  const getAvailableFacultyForDomain = (selectedDomain: string) => {
    if (!selectedDomain) return faculty
    
    return faculty.filter(f => {
      const existingAssignment = assignments.find(a => a.faculty.id === f.id && a.domain_name === selectedDomain)
      return !existingAssignment
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading coordinator assignments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CIE Coordinator Management</h1>
          <p className="text-sm text-gray-600 mt-1">Assign faculty members as coordinators for different domains</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Assign Coordinator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign CIE Coordinator</DialogTitle>
                <DialogDescription>
                  Assign a faculty member as coordinator for a specific domain.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="select-domain" className="text-sm">Domain *</Label>
                  <Select onValueChange={(value) => setNewAssignment(prev => ({ ...prev, domain_name: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_DOMAINS.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          <div>
                            <div className="font-medium">{domain.name}</div>
                            <div className="text-xs text-gray-500">{domain.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="select-faculty" className="text-sm">Faculty Member *</Label>
                  <Select onValueChange={(value) => setNewAssignment(prev => ({ ...prev, faculty_id: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select faculty member" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableFacultyForDomain(newAssignment.domain_name).map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          <div>
                            <div className="font-medium">{f.user.name}</div>
                            <div className="text-xs text-gray-500">{f.department} • {f.user.email}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAssignCoordinator}>Assign Coordinator</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Domain Assignments */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {PREDEFINED_DOMAINS.map((domain) => {
          const domainAssignments = getAssignmentsForDomain(domain.id)
          const hasCoordinator = domainAssignments.length > 0
          
          return (
            <Card key={domain.id} className={`border shadow-sm ${hasCoordinator ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-base">
                    <Building className={`h-4 w-4 mr-2 ${hasCoordinator ? 'text-green-600' : 'text-gray-400'}`} />
                    {domain.name}
                  </CardTitle>
                  <Badge variant={hasCoordinator ? "default" : "secondary"} className="text-xs">
                    {hasCoordinator ? "Assigned" : "No Coordinator"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{domain.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {domainAssignments.length === 0 ? (
                  <div className="text-center py-3">
                    <Users className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                    <p className="text-xs text-gray-500">No coordinator assigned</p>
                    <p className="text-xs text-gray-400">Requests will be unhandled</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {domainAssignments.map((assignment) => (
                      <div key={assignment.id} className="p-2 bg-white border rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-xs">{assignment.faculty.user.name}</h4>
                            <p className="text-xs text-gray-500">{assignment.faculty.department}</p>
                            <p className="text-xs text-gray-400">{assignment.faculty.user.email}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Faculty List */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Faculty Members</CardTitle>
          <CardDescription className="text-xs">
            List of all faculty members and their current coordinator status
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {faculty.map((f) => {
              const facultyAssignments = assignments.filter(a => a.faculty.id === f.id)
              const isCoordinator = facultyAssignments.length > 0
              
              return (
                <div key={f.id} className={`p-3 border rounded-md ${isCoordinator ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{f.user.name}</h4>
                      <p className="text-xs text-gray-600">{f.department}</p>
                      <p className="text-xs text-gray-500">{f.user.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {facultyAssignments.map((assignment) => (
                          <Badge key={assignment.id} variant="outline" className="text-xs px-1 py-0">
                            {PREDEFINED_DOMAINS.find(d => d.id === assignment.domain_name)?.name || assignment.domain_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={isCoordinator ? "default" : "secondary"} className="text-xs">
                        {isCoordinator ? "Coordinator" : "Available"}
                      </Badge>
                      {facultyAssignments.length > 1 && (
                        <p className="text-xs text-gray-500 mt-1">{facultyAssignments.length} domains</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}