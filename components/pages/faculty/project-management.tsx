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
import { Plus, FolderOpen, Calendar, Users, RefreshCw, CheckCircle, XCircle, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Project {
  id: string
  name: string
  description: string
  course_id: string
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
  code: string
  name: string
  sections: string[]
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
  const { toast } = useToast()

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    course_id: "",
    components_needed: [] as string[],
    expected_completion_date: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

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
    if (!newProject.name || !newProject.course_id || !newProject.expected_completion_date) {
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
          course_id: "",
          components_needed: [],
          expected_completion_date: "",
        })
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Project created successfully",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Project Management</h2>
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
              <DialogDescription>
                Create a new project assignment for your students.
              </DialogDescription>
              </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="course">Course</Label>
                  <Select value={newProject.course_id} onValueChange={(value) => setNewProject({ ...newProject, course_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="requests">Student Requests</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                        <span className="line-clamp-2">{project.name}</span>
                      </CardTitle>
                    </div>
                    
                    <div className="space-y-2">
                      <CardDescription className="text-sm font-medium text-gray-700">
                        {courses.find(c => c.id === project.course_id)?.code} - {courses.find(c => c.id === project.course_id)?.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Project Description */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Description</Label>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{project.description}</p>
                    </div>

                    {/* Timeline and Submissions */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Project Info</Label>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900">Due Date</div>
                            <div className="text-xs text-gray-600">{new Date(project.expected_completion_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                          <Users className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900">Submissions</div>
                            <div className="text-xs text-gray-600">{project.submissions?.length || 0} received</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Creation Date */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500 text-center">
                        Created: {new Date(project.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {projectRequests.length > 0 ? (
            <div className="space-y-4">
              {projectRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{request.project.name}</CardTitle>
                          <CardDescription>
                            Request from {request.student.user.name} ({request.student.user.email})
                          </CardDescription>
                        </div>
                        <Badge className={getRequestStatusColor(request.status)}>{request.status}</Badge>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold">PROJECT DESCRIPTION</h4>
                        <p className="text-sm text-muted-foreground">{request.project.description}</p>
                      </div>

                      {request.project.components_needed_details &&
                      request.project.components_needed_details.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold">Required Components</h4>
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {request.project.components_needed_details.map((component) => (
                              <li key={component.id}>{component.component_name}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold">REQUEST DETAILS</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          <p>{new Date(request.request_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {request.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
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
                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Submission Content</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700 leading-relaxed">{submission.content}</p>
                      </div>
                    </div>

                    {/* Attachments */}
                    {submission.attachments && submission.attachments.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Attached Files</Label>
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
                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Grade Submission</Label>
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
                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Grading Results</Label>
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
    </div>
  )
}
