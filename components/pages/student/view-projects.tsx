"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FolderOpen, Calendar, FileText, Upload, RefreshCw, Plus, Clock } from "lucide-react"
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
  created_date: string
  accepted_by?: string
  status: string
  type: string
  submission?: ProjectSubmission
  project_requests?: ProjectRequest[]
}

interface ProjectSubmission {
  id: string
  projectId: string
  studentId: string
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
  faculty?: {
    user: {
      name: string
      email: string
    }
  }
}

interface Faculty {
  id: string
  user: {
    name: string
    email: string
  }
  department: string
  specialization: string
}

interface Course {
  id: string
  code: string
  name: string
}

interface LabComponent {
  id: string
  component_name: string
  component_description: string
}

export function ViewProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [labComponents, setLabComponents] = useState<LabComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [submissionContent, setSubmissionContent] = useState("")
  const { toast } = useToast()

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    course_id: "",
    components_needed: [] as string[],
    expected_completion_date: "",
    accepted_by: "",
    student_notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch available projects
      const projectsResponse = await fetch("/api/projects")
      const projectsData = await projectsResponse.json()
      setProjects(projectsData.projects || [])

      // Fetch faculty for project creation
      const facultyResponse = await fetch("/api/faculty")
      const facultyData = await facultyResponse.json()
      setFaculty(facultyData.faculty || [])

      // Fetch courses
      const coursesResponse = await fetch("/api/courses")
      const coursesData = await coursesResponse.json()
      setCourses(coursesData.courses || [])

      // Fetch lab components
      const componentsResponse = await fetch("/api/lab-components")
      const componentsData = await componentsResponse.json()
      setLabComponents(componentsData.components || [])
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

  const handleSubmitProject = async () => {
    if (!selectedProject || !submissionContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide submission content",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/project-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          content: submissionContent,
          attachments: [],
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Update the project with the new submission
        setProjects((prev) =>
          prev.map((project) =>
            project.id === selectedProject.id ? { ...project, submission: data.submission } : project,
          ),
        )

        setSubmissionContent("")
        setSelectedProject(null)
        setIsSubmitDialogOpen(false)

        toast({
          title: "Success",
          description: "Project submitted successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit project")
      }
    } catch (error) {
      console.error("Error submitting project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit project",
        variant: "destructive",
      })
    }
  }

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.course_id || !newProject.expected_completion_date || !newProject.accepted_by) {
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
          type: "STUDENT_PROPOSED",
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
          accepted_by: "",
          student_notes: "",
        })
        setIsCreateDialogOpen(false)

        toast({
          title: "Success",
          description: "Project request created successfully. Waiting for faculty approval.",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create project")
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (project: Project) => {
    switch (project.status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "ONGOING":
        if (project.submission) {
          return "bg-green-100 text-green-800"
        }
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

  const getStatusText = (project: Project) => {
    if (project.status === "PENDING") {
      return "Pending Approval"
    }
    if (project.status === "ONGOING") {
      if (project.submission) {
        return "Submitted"
      }
      return "In Progress"
    }
    if (project.status === "COMPLETED") {
      return "Completed"
    }
    if (project.status === "OVERDUE") {
      return "Overdue"
    }
    if (project.status === "REJECTED") {
      return "Rejected"
    }
    return project.status
  }

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-2">View and submit your course projects</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Propose a new project to a faculty member for approval.
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
                  <Label htmlFor="faculty">Faculty Advisor</Label>
                  <Select value={newProject.accepted_by} onValueChange={(value) => setNewProject({ ...newProject, accepted_by: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty advisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculty.map((fac) => (
                        <SelectItem key={fac.id} value={fac.id}>
                          {fac.user.name} - {fac.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes for Faculty</Label>
                  <Textarea
                    id="notes"
                    value={newProject.student_notes}
                    onChange={(e) => setNewProject({ ...newProject, student_notes: e.target.value })}
                    placeholder="Any additional notes for the faculty advisor..."
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project: Project) => {
          // Find the rejected request if any
          const rejectedRequest = (project.project_requests || []).find((r: ProjectRequest) => r.status === "REJECTED")

          // Faculty display logic
          let facultyName: string | undefined
          if (project.project_requests && project.project_requests.length > 0) {
            const req = project.project_requests[project.project_requests.length - 1]
            facultyName = req.faculty?.user?.name
          } else if (project.accepted_by && faculty.length > 0) {
            const fac = faculty.find(f => f.id === project.accepted_by)
            facultyName = fac?.user?.name
          }
          if (!facultyName) facultyName = "Unknown"
          let facultyLabel = ""
          if (project.status === "PENDING") facultyLabel = `Requested to ${facultyName}`
          else if (project.status === "REJECTED") facultyLabel = `Rejected by ${facultyName}`
          else facultyLabel = `Accepted by ${facultyName}`

          return (
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
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-medium">{facultyLabel}</span>
                      <Badge className={`${getStatusColor(project)} text-xs font-medium`}>
                        {getStatusText(project)}
                      </Badge>
                    </div>
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

                  {/* Required Components */}
                  {project.components_needed.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Required Components</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {project.components_needed.map((componentId: string) => {
                          const component = labComponents.find(c => c.id === componentId)
                          return (
                            <Badge key={componentId} variant="outline" className="text-xs px-2 py-1 bg-gray-50">
                              {component?.component_name}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Due Date and Time Left */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Timeline</Label>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">Due Date</div>
                          <div className="text-xs text-gray-600">{new Date(project.expected_completion_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">Time Left</div>
                          <div className="text-xs text-gray-600">{getDaysUntilDue(project.expected_completion_date)} days</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {project.status === "ONGOING" && !project.submission && (
                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          setSelectedProject(project)
                          setIsSubmitDialogOpen(true)
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Submit Project
                      </Button>
                    </div>
                  )}

                  {/* Submission Status */}
                  {project.submission && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Submission Status</Label>
                      <div className="p-3 bg-blue-50 rounded-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-blue-900">{project.submission.status}</span>
                          {project.submission.marks !== null && (
                            <Badge variant="secondary" className="text-xs">
                              {project.submission.marks}/100
                            </Badge>
                          )}
                        </div>
                        {project.submission.feedback && (
                          <p className="text-xs text-blue-700 mt-1">{project.submission.feedback}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rejection Notice */}
                  {project.status === "REJECTED" && rejectedRequest && rejectedRequest.faculty && rejectedRequest.faculty.user && rejectedRequest.faculty.user.name && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="p-3 bg-red-50 rounded-md">
                        <div className="text-sm font-medium text-red-900">
                          Rejected by {rejectedRequest.faculty.user.name}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Creation Date */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 text-center">
                      Created: {new Date(project.created_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Project</DialogTitle>
            <DialogDescription>
              Submit your work for {selectedProject?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Project Content</Label>
              <Textarea
                id="content"
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Describe your project work, findings, and any additional notes..."
                rows={6}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitProject}>Submit Project</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
