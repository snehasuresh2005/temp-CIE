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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FolderOpen, Calendar, Users, RefreshCw, CheckCircle, XCircle, FileText, Trash2, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FacultyProjectRequests } from "./faculty-project-requests"

interface Project {
  id: string
  name: string
  description: string
  course_id?: string
  components_needed: string[]
  expected_completion_date: string
  created_by: string
  modified_by?: string
  created_date: string
  modified_date: string
  accepted_by?: string
  status: string
  type: string
  submissions?: ProjectSubmission[]
  project_requests?: ProjectRequest[]
}

interface ProjectSubmission {
  id: string
  projectId: string
  studentId: string
  student: {
    user: {
      name: string
    }
  }
  content: string
  attachments: string[]
  marks: number | null
  feedback: string | null
  status: string
  submissionDate: string
}

interface ProjectRequest {
  id: string
  project_id: string
  student_id: string
  faculty_id: string
  request_date: string
  status: string
  student_notes?: string
  faculty_notes?: string
  accepted_date?: string
  rejected_date?: string
  student: {
    user: {
      name: string
      email: string
    }
  }
  faculty: {
    user: {
      name: string
      email: string
    }
  }
  project: {
    name: string
    description: string
    components_needed_details?: any[]
  }
}

interface Course {
  id: string
  course_name: string
  course_description: string
  course_start_date: string
  course_end_date: string
  course_enrollments: string[]
  created_by: string
  created_date: string
  modified_by?: string
  modified_date: string
  course_code: string
}

interface LabComponent {
  id: string
  component_name: string
  component_description: string
}

export function ProjectManagement() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [labComponents, setLabComponents] = useState<LabComponent[]>([])
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [showFacultyRequests, setShowFacultyRequests] = useState(false)
  const [isLabComponentsCoordinator, setIsLabComponentsCoordinator] = useState(false)
  const { toast } = useToast()

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    components_needed: [] as string[],
    expected_completion_date: "",
  })

  useEffect(() => {
    fetchData()
    checkCoordinatorStatus()
  }, [])

  const checkCoordinatorStatus = async () => {
    try {
      const response = await fetch("/api/coordinators/check", {
        headers: {
          "x-user-id": user?.id || "",
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Check if the user is coordinator for Lab Components domain
        const isLabCoordinator = data.assignedDomains?.some(
          (domain: any) => domain.name === "Lab Components"
        )
        setIsLabComponentsCoordinator(isLabCoordinator || false)
      }
    } catch (error) {
      console.error("Error checking coordinator status:", error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch courses (faculty's courses)
      const coursesResponse = await fetch("/api/courses", {
        headers: {
          "x-user-id": user?.id || "",
        },
      })
      const coursesData = await coursesResponse.json()
      setCourses(coursesData.courses || [])

      // Fetch lab components
      const componentsResponse = await fetch("/api/lab-components", {
        headers: {
          "x-user-id": user?.id || "",
        },
      })
      const componentsData = await componentsResponse.json()
      setLabComponents(componentsData.components || [])

      // Fetch projects
      const projectsResponse = await fetch("/api/projects", {
        headers: {
          "x-user-id": user?.id || "",
        },
      })
      const projectsData = await projectsResponse.json()
      setProjects(projectsData.projects || [])

      // Fetch project requests
      const requestsResponse = await fetch("/api/project-requests", {
        headers: {
          "x-user-id": user?.id || "",
        },
      })
      const requestsData = await requestsResponse.json()
      setProjectRequests(requestsData.projectRequests || [])

      // Fetch submissions
      const submissionsResponse = await fetch("/api/project-submissions", {
        headers: {
          "x-user-id": user?.id || "",
        },
      })
      const submissionsData = await submissionsResponse.json()
      setSubmissions(submissionsData.submissions || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddProject = async () => {
    console.log("Form data:", newProject)
    console.log("User email:", user?.email)
    
    if (!newProject.name || !newProject.expected_completion_date) {
      console.log("Validation failed:", {
        name: !!newProject.name,
        expected_completion_date: !!newProject.expected_completion_date
      })
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newProject,
          course_id: null,
          user_email: user?.email,
          type: "FACULTY_ASSIGNED",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProjects((prev) => [...prev, data.project])
        setNewProject({
          name: "",
          description: "",
          components_needed: [],
          expected_completion_date: "",
        })
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Project created successfully and sent for coordinator approval",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add project")
      }
    } catch (error) {
      console.error("Error adding project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add project",
        variant: "destructive",
      })
    }
  }

  const handleApproveRequest = async (requestId: string, status: "APPROVED" | "REJECTED", notes?: string) => {
    try {
      const response = await fetch(`/api/project-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          faculty_notes: notes,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProjectRequests((prev) =>
          prev.map((req) => (req.id === requestId ? data.projectRequest : req))
        )

        toast({
          title: "Success",
          description: `Project request ${status.toLowerCase()} successfully`,
        })
      } else {
        throw new Error("Failed to update request")
      }
    } catch (error) {
      console.error("Error updating request:", error)
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      })
    }
  }

  const handleGradeSubmission = async (submissionId: string, marks: number, feedback: string) => {
    try {
      const response = await fetch("/api/project-submissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          submissionId,
          marks,
          feedback,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSubmissions((prev) =>
          prev.map((sub) => (sub.id === submissionId ? data.submission : sub)),
        )

        toast({
          title: "Success",
          description: "Project graded successfully",
        })
      } else {
        throw new Error("Failed to grade submission")
      }
    } catch (error) {
      console.error("Error grading submission:", error)
      toast({
        title: "Error",
        description: "Failed to grade submission",
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
      case "OVERDUE":
        return "bg-red-100 text-red-800"
      case "REJECTED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800"
      case "GRADED":
        return "bg-green-100 text-green-800"
      case "LATE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return

    try {
      const response = await fetch(`/api/projects?id=${projectToDelete.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id || "",
        },
      })

      if (response.ok) {
        setProjects((prev) => prev.filter((project) => project.id !== projectToDelete.id))
        toast({
          title: "Success",
          description: "Project deleted successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete project")
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (showFacultyRequests) {
    return <FacultyProjectRequests onBack={() => setShowFacultyRequests(false)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Project Management</h2>
        <div className="flex items-center space-x-2">
          {isLabComponentsCoordinator && (
            <Button
              variant="outline"
              onClick={() => setShowFacultyRequests(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Project Requests
            </Button>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="components">Required Components</Label>
                <Select onValueChange={(value) => {
                  if (!newProject.components_needed.includes(value)) {
                    setNewProject({
                      ...newProject,
                      components_needed: [...newProject.components_needed, value]
                    })
                  }
                }}>
                    <SelectTrigger>
                    <SelectValue placeholder="Select components" />
                    </SelectTrigger>
                    <SelectContent>
                    {labComponents.map((component) => (
                      <SelectItem key={component.id} value={component.id}>
                        {component.component_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newProject.components_needed.map((componentId) => {
                    const component = labComponents.find(c => c.id === componentId)
                    return (
                      <Badge key={componentId} variant="secondary">
                        {component?.component_name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0"
                          onClick={() => setNewProject({
                            ...newProject,
                            components_needed: newProject.components_needed.filter(id => id !== componentId)
                          })}
                        >
                          ×
                        </Button>
                      </Badge>
                    )
                  })}
                </div>
                </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Expected Completion Date</Label>
                  <Input
                    id="dueDate"
                  type="datetime-local"
                  value={newProject.expected_completion_date}
                  onChange={(e) => setNewProject({ ...newProject, expected_completion_date: e.target.value })}
                  />
                </div>
              </div>
            <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              <Button onClick={handleAddProject}>Create Project</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="requests">Student Projects</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const course = courses.find(c => c.id === project.course_id)
              
              return (
                <Card key={project.id} className="flex flex-col h-full hover:shadow-lg hover:scale-105 transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                          <FolderOpen className="h-6 w-6 mr-3 text-blue-500" />
                          {project.name}
                        </CardTitle>
                        {course && (
                          <CardDescription className="mt-2 text-sm text-gray-600">
                            {course.course_name}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-grow flex flex-col">
                    <div className="mb-4">
                      <Badge className={`${getStatusColor(project.status)}`}>{project.status}</Badge>
                      {project.status === "PENDING" && (
                        <div className="mt-2 flex items-center text-sm text-yellow-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Waiting for coordinator approval</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700">Description</h3>
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                        </div>
                        
                        {project.components_needed && project.components_needed.length > 0 && (
                          <div>
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Required Components</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.components_needed.slice(0, 3).map((componentId) => {
                                const component = labComponents.find(c => c.id === componentId)
                                return (
                                  <Badge key={componentId} variant="secondary" className="text-xs font-normal px-2 py-0.5">
                                    {component?.component_name || 'Unknown Component'}
                                  </Badge>
                                )
                              })}
                              {project.components_needed.length > 3 && (
                                <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5">
                                  +{project.components_needed.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 mt-auto">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <p className="font-semibold">Due Date</p>
                          <p>{new Date(project.expected_completion_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <p className="font-semibold">Submissions</p>
                          <p>{project.submissions?.length || 0} received</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <div className="p-6 pt-0">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        setProjectToDelete(project)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {projectRequests.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projectRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-blue-600" />
                          <span>{request.project.name}</span>
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          Request from {request.student.user.name} ({request.student.user.email})
                        </CardDescription>
                      </div>
                      <Badge className={getRequestStatusColor(request.status)}>{request.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700 tracking-wide">Description</Label>
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{request.project.description}</p>
                      </div>
                      {request.project.components_needed_details && request.project.components_needed_details.length > 0 && (
                        <div>
                          <Label className="text-xs font-semibold text-gray-700 tracking-wide">Required Components</Label>
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {request.project.components_needed_details.map((component) => (
                              <li key={component.id}>{component.component_name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>Requested: {new Date(request.request_date).toLocaleDateString()}</span>
                      </div>
                      {request.status === "PENDING" && (
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="ghost"
                            className="bg-green-500 text-white hover:bg-green-600"
                            onClick={() => handleApproveRequest(request.id, "APPROVED")}
                            size="sm"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            className="bg-red-500 text-white hover:bg-red-600"
                            onClick={() => handleApproveRequest(request.id, "REJECTED")}
                            size="sm"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg font-medium mb-2">No project requests found</div>
              <p className="text-sm">Students will appear here when they request project approvals.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">Submission by {submission.student.user.name}</CardTitle>
                      <Badge className={getSubmissionStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                          </div>
                    
                    <div className="space-y-2">
                      <CardDescription className="text-sm font-medium text-gray-700">
                        Submitted on {new Date(submission.submissionDate).toLocaleDateString()}
                      </CardDescription>
                          </div>
                        </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                                <div className="space-y-4">
                    {/* Submission Content */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-700 tracking-wide">Submission Content</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700 leading-relaxed">{submission.content}</p>
                      </div>
                    </div>

                    {/* Attachments */}
                    {submission.attachments && submission.attachments.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 tracking-wide">Attached Files</Label>
                        <div className="space-y-2">
                          {submission.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-md">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <a
                                href={attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                              >
                                {attachment.split('/').pop() || `File ${index + 1}`}
                              </a>
                              <span className="text-xs text-gray-500">(Click to view)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grading Section */}
                    {submission.status === "SUBMITTED" && (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <Label className="text-xs font-semibold text-gray-700 tracking-wide">Grade Submission</Label>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`marks-${submission.id}`} className="text-sm font-medium">Marks (0-100)</Label>
                                    <Input
                              id={`marks-${submission.id}`}
                                      type="number"
                                      min="0"
                              max="100"
                                      placeholder="Enter marks"
                              defaultValue={submission.marks || 0}
                              className="w-full"
                              onBlur={(e) => {
                                const marks = parseInt(e.target.value) || 0
                                const feedback = (document.getElementById(`feedback-${submission.id}`) as HTMLTextAreaElement)?.value || ""
                                if (marks > 0) {
                                handleGradeSubmission(submission.id, marks, feedback)
                                }
                              }}
                                    />
                                  </div>
                          <div className="space-y-2">
                            <Label htmlFor={`feedback-${submission.id}`} className="text-sm font-medium">Feedback</Label>
                            <Textarea
                              id={`feedback-${submission.id}`}
                              placeholder="Enter feedback for the student..."
                              defaultValue={submission.feedback || ""}
                              rows={3}
                              onBlur={(e) => {
                                const marks = parseInt((document.getElementById(`marks-${submission.id}`) as HTMLInputElement)?.value || "0") || 0
                                const feedback = e.target.value
                                if (marks > 0 && feedback.trim()) {
                                handleGradeSubmission(submission.id, marks, feedback)
                                }
                              }}
                            />
                                  </div>
                          <Button
                            onClick={() => {
                              const marks = parseInt((document.getElementById(`marks-${submission.id}`) as HTMLInputElement)?.value || "0") || 0
                              const feedback = (document.getElementById(`feedback-${submission.id}`) as HTMLTextAreaElement)?.value || ""
                              if (marks > 0) {
                                handleGradeSubmission(submission.id, marks, feedback)
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Please enter marks before grading",
                                  variant: "destructive",
                                })
                              }
                            }}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Grade Submission
                          </Button>
                                  </div>
                                </div>
                    )}

                    {/* Graded Results */}
                    {submission.status === "GRADED" && (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <Label className="text-xs font-semibold text-gray-700 tracking-wide">Grading Results</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-green-50 rounded-md">
                            <div className="font-medium text-green-900">Marks</div>
                            <div className="text-lg font-bold text-green-700">{submission.marks}/100</div>
                              </div>
                              {submission.feedback && (
                            <div className="p-3 bg-blue-50 rounded-md col-span-2">
                              <div className="font-medium text-blue-900 mb-1">Feedback</div>
                              <p className="text-sm text-blue-700">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                      </div>
                    </CardContent>
                  </Card>
            ))}
            {submissions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-lg font-medium mb-2">No submissions found</div>
                <p className="text-sm">Student project submissions will appear here when they submit their work.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the project "{projectToDelete?.name}"? 
              This action cannot be undone and will also delete all related submissions and requests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
