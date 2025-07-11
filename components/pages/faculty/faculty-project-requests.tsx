"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { FolderOpen, Calendar, Users, RefreshCw, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Project {
  id: string
  name: string
  description: string
  components_needed: string[]
  expected_completion_date: string
  created_by: string
  created_date: string
  status: string
  type: string
  faculty_creator?: {
    id: string
    user: {
      name: string
      email: string
    }
    department: string
  }
  components_needed_details?: Array<{
    id: string
    component_name: string
    component_category: string
  }>
}

interface FacultyProjectRequestsProps {
  onBack: () => void
}

export function FacultyProjectRequests({ onBack }: FacultyProjectRequestsProps) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [facultyNotes, setFacultyNotes] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchPendingProjects()
  }, [])

  const fetchPendingProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/projects/approve", {
        headers: {
          "x-user-id": user?.id || "",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      } else {
        throw new Error("Failed to fetch pending projects")
      }
    } catch (error) {
      console.error("Error fetching pending projects:", error)
      toast({
        title: "Error",
        description: "Failed to load pending projects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveProject = async (projectId: string, status: "ONGOING" | "REJECTED", notes?: string) => {
    try {
      const response = await fetch("/api/projects/approve", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          project_id: projectId,
          status,
          notes,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Remove the project from the list since it's no longer pending
        setProjects((prev) => prev.filter((project) => project.id !== projectId))
        
        toast({
          title: "Success",
          description: data.message,
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update project")
      }
    } catch (error) {
      console.error("Error updating project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "ONGOING":
        return "bg-blue-100 text-blue-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading pending projects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Project Requests</h1>
          <p className="text-gray-600">Review and approve faculty project requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <Button onClick={fetchPendingProjects} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                      <span>{project.name}</span>
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Request from {project.faculty_creator?.user.name} ({project.faculty_creator?.user.email})
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700 line-clamp-3">{project.description}</p>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Due: {new Date(project.expected_completion_date).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Department: {project.faculty_creator?.department}</span>
                </div>

                {project.components_needed_details && project.components_needed_details.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Required Components:</h4>
                    <div className="flex flex-wrap gap-1">
                      {project.components_needed_details.slice(0, 3).map((component) => (
                        <Badge key={component.id} variant="outline" className="text-xs">
                          {component.component_name}
                        </Badge>
                      ))}
                      {project.components_needed_details.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.components_needed_details.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {project.status === "PENDING" && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="bg-green-500 text-white hover:bg-green-600"
                          size="sm"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Approve Project</DialogTitle>
                          <DialogDescription>Add any notes for the faculty (optional)</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="approveNotes">Notes for faculty (optional)</Label>
                            <Textarea
                              id="approveNotes"
                              value={facultyNotes}
                              onChange={(e) => setFacultyNotes(e.target.value)}
                              placeholder="Any special instructions or notes..."
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setFacultyNotes("")}>
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                handleApproveProject(project.id, "ONGOING", facultyNotes)
                                setFacultyNotes("")
                              }}
                            >
                              Approve Project
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="bg-red-500 text-white hover:bg-red-600"
                          size="sm"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Project</DialogTitle>
                          <DialogDescription>Add notes explaining why this project was rejected</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="rejectNotes">Rejection reason *</Label>
                            <Textarea
                              id="rejectNotes"
                              value={facultyNotes}
                              onChange={(e) => setFacultyNotes(e.target.value)}
                              placeholder="Please explain why this project is being rejected..."
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setFacultyNotes("")}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                handleApproveProject(project.id, "REJECTED", facultyNotes)
                                setFacultyNotes("")
                              }}
                              disabled={!facultyNotes.trim()}
                            >
                              Reject Project
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg font-medium mb-2">No pending project requests</div>
          <p className="text-sm">Faculty project requests will appear here when they need approval.</p>
        </div>
      )}
    </div>
  )
} 