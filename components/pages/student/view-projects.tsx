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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, Calendar, FileText, Upload, RefreshCw, Plus, Clock, CheckCircle, Trash2, User, Mail } from "lucide-react"
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

interface Project {
  id: string
  name: string
  description: string
  course_id?: string
  components_needed: string[]
  expected_completion_date: string
  created_by: string
  created_date: string
  accepted_by?: string
  status: string
  type: string
  submission?: ProjectSubmission
  project_requests?: ProjectRequest[]
  faculty_creator?: {
    id: string
    user: {
      name: string
      email: string
    }
  }
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
  course_id: string
  course_name: string
  course_description: string
  course_start_date: string
  course_end_date: string
  course_enrollments: string[]
  created_by: string
  created_date: string
  modified_by?: string
  modified_date: string
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
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [submissionContent, setSubmissionContent] = useState("")
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'my-projects' | 'available-projects'>('my-projects')
  const { toast } = useToast()

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    components_needed: [] as string[],
    expected_completion_date: "",
    accepted_by: "",
    student_notes: "",
  })

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const [projectsResponse, coursesResponse, facultyResponse, labComponentsResponse, studentResponse] = await Promise.all([
        fetch("/api/student/projects", {
          headers: {
            "x-user-id": user.id,
          },
        }),
        fetch("/api/courses"),
        fetch("/api/faculty"),
        fetch("/api/lab-components"),
        fetch("/api/students", {
          headers: { "x-user-id": user.id }
        }),
      ])

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        console.log('Fetched projects data:', projectsData)
        setProjects(projectsData.projects)
      }

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData.courses)
      }

      if (facultyResponse.ok) {
        const facultyData = await facultyResponse.json()
        setFaculty(facultyData.faculty)
      }

      if (labComponentsResponse.ok) {
        const labComponentsData = await labComponentsResponse.json()
        console.log('Lab components loaded:', labComponentsData.components?.length || 0, 'components')
        setLabComponents(labComponentsData.components)
      }

      if (studentResponse.ok) {
        const studentData = await studentResponse.json()
        if (studentData.students && studentData.students.length > 0) {
          setStudent(studentData.students[0])
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data",
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
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a project.",
        variant: "destructive",
      })
      return
    }
    try {
      const formData = new FormData()
      formData.append("projectId", selectedProject.id)
      formData.append("content", submissionContent)
      if (submissionFile) {
        formData.append("file", submissionFile)
      }
      const response = await fetch("/api/project-submissions", {
        method: "POST",
        headers: {
          "x-user-id": user.id,
        },
        body: formData,
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Submission response:', data)
        
        // Update the project with the submission data
        setProjects((prev) => {
          const updatedProjects = prev.map((project) =>
            project.id === selectedProject.id 
              ? { 
                  ...project, 
                  submission: {
                    id: data.submission.id,
                    projectId: data.submission.project_id,
                    studentId: data.submission.student_id,
                    content: data.submission.content,
                    attachments: data.submission.attachments,
                    marks: data.submission.marks,
                    feedback: data.submission.feedback,
                    status: data.submission.status,
                    submissionDate: data.submission.submission_date
                  }
                } 
              : project,
          )
          console.log('Updated projects state:', updatedProjects)
          return updatedProjects
        })
        
        setSubmissionContent("")
        setSubmissionFile(null)
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
        description: "Failed to submit project",
        variant: "destructive",
      })
    }
  }

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.expected_completion_date || !newProject.accepted_by) {
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
          type: "STUDENT_PROPOSED",
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
        if (project.submission.status === "SUBMITTED") {
          return "Submitted - Awaiting Grade"
        }
        if (project.submission.status === "GRADED") {
          return "Graded"
        }
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

  // Debug: log courses and selected value
  useEffect(() => {
    if (courses.length > 0) {
      const ids = courses.map(c => c.course_id)
      const uniqueIds = new Set(ids)
      if (ids.length !== uniqueIds.size) {
        console.warn('Duplicate course_id values found in courses:', ids)
      }
      if (ids.some(id => typeof id !== 'string')) {
        console.warn('Non-string course_id values found in courses:', ids)
      }
    }
  }, [courses])

  // Filter courses to only those the student is enrolled in
  const enrolledCourses = courses.filter(course => course.course_enrollments.includes(user?.id ?? ''))

  // Filter projects based on active tab
  const myProjects = projects.filter(project => project.created_by === user?.id)
  const availableProjects = projects.filter(project => 
    project.type === "FACULTY_ASSIGNED" && 
    (project.status === "APPROVED" || project.status === "ONGOING") &&
    project.created_by !== user?.id
  )

  // Filter projects based on search and status
  const filteredMyProjects = myProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredAvailableProjects = availableProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleApplyToProject = async (projectId: string) => {
    try {
      // Find the project to get the faculty creator
      const project = projects.find(p => p.id === projectId)
      if (!project || !project.faculty_creator) {
        throw new Error("Project or faculty information not found")
      }

      // Get the faculty ID from the faculty creator
      const facultyId = project.faculty_creator.id

      if (!student?.id) {
        throw new Error("Student profile not found")
      }

      const response = await fetch("/api/project-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          project_id: projectId,
          student_id: student.id,
          faculty_id: facultyId,
          student_notes: "I would like to apply for this project.",
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Application submitted successfully!",
        })
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to apply for project")
      }
    } catch (error) {
      console.error("Error applying for project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply for project",
        variant: "destructive",
      })
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
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
                      <SelectValue placeholder="Select lab components needed for this project" />
                    </SelectTrigger>
                    <SelectContent>
                      {labComponents.map((component) => (
                        <SelectItem key={component.id} value={component.id}>
                          {component.component_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newProject.components_needed.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newProject.components_needed.map((componentId) => {
                        const component = labComponents.find((c) => c.id === componentId)
                        return (
                          <Badge
                            key={componentId}
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100"
                            onClick={() => setNewProject({
                              ...newProject,
                              components_needed: newProject.components_needed.filter((id) => id !== componentId)
                            })}
                          >
                            {component ? component.component_name : "Unknown Component"} ✕
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
                  <div className="flex-1 space-y-2">
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
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="dueDate">Expected Completion Date</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={newProject.expected_completion_date}
                      onChange={(e) => setNewProject({ ...newProject, expected_completion_date: e.target.value })}
                    />
                  </div>
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'my-projects' | 'available-projects')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="available-projects">Available Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="my-projects" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6 gap-2">
            <Input
              placeholder="Search my projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="GRADED">Graded</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMyProjects.map((project: Project) => {
              // Debug logging
              console.log('Rendering project:', project.id, 'Status:', project.status, 'Components needed:', project.components_needed, 'Lab components available:', labComponents.length)
              
              // Find the rejected request if any
              const rejectedRequest = (project.project_requests || []).find((r: ProjectRequest) => r.status === "REJECTED")

              // Faculty display logic
              let facultyName: string | undefined
              if (project.type === "FACULTY_ASSIGNED" && project.faculty_creator) {
                // Faculty-assigned project - use the faculty creator
                facultyName = project.faculty_creator.user.name
              } else if (project.project_requests && project.project_requests.length > 0) {
                // Student-proposed project - use the faculty from the latest request
                const req = project.project_requests[project.project_requests.length - 1]
                facultyName = req.faculty?.user?.name
              }
              
              if (!facultyName) facultyName = "Unknown"
              
              let facultyLabel = ""
              if (project.status === "PENDING") {
                facultyLabel = project.type === "FACULTY_ASSIGNED" 
                  ? "Assigned by: " 
                  : "Proposed to: "
              } else {
                facultyLabel = "Faculty: "
              }

              const course = courses.find((c) => c.id === project.course_id)

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
                        <p className="text-sm text-gray-500 mt-1">
                          {facultyLabel}
                          <span className="font-semibold">{facultyName}</span>
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                    <div className="mb-4">
                      <Badge className={`${getStatusColor(project)}`}>{getStatusText(project)}</Badge>
                      {project.submission && (
                        <div className="mt-2 flex items-center text-sm">
                          {project.submission.status === "SUBMITTED" && (
                            <div className="flex items-center text-yellow-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Waiting for faculty grading</span>
                            </div>
                          )}
                          {project.submission.status === "GRADED" && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span>Graded by faculty</span>
                            </div>
                          )}
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
                              {project.components_needed.map((componentId) => {
                                const component = labComponents.find((c) => c.id === componentId)
                                console.log('Component lookup:', componentId, '-> Found:', component?.component_name || 'NOT FOUND')
                                return (
                                  <Badge key={componentId} variant="secondary" className="text-xs font-normal px-2 py-0.5">
                                    {component ? component.component_name : `Unknown Component (${componentId})`}
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {rejectedRequest && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <h3 className="text-sm font-semibold text-red-700">Rejection Reason</h3>
                            <p className="text-sm text-red-600 mt-1">{rejectedRequest.faculty_notes}</p>
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
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <p className="font-semibold">Time Left</p>
                          <p>{getDaysUntilDue(project.expected_completion_date)} days</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0">
                    {project.status === "ONGOING" && (!project.submission || project.submission.status === "REVISION_REQUESTED") && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setSelectedProject(project)
                          setIsSubmitDialogOpen(true)
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {project.submission && project.submission.status === "REVISION_REQUESTED" ? "Resubmit Project" : "Submit Project"}
                      </Button>
                    )}
                    
                    {project.submission && project.submission.status === "SUBMITTED" && (
                      <div className="space-y-2">
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Submitted ✓
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          Waiting for faculty grading
                        </p>
                      </div>
                    )}
                    
                    {project.submission && project.submission.status === "GRADED" && (
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          setSelectedProject(project)
                          setIsGradeDialogOpen(true)
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Grade
                      </Button>
                    )}

                    {/* Delete button for student-created projects */}
                    {project.created_by === user?.id && project.type === "STUDENT_PROPOSED" && (
                      <Button
                        variant="destructive"
                        className="w-full mt-2"
                        onClick={() => {
                          setProjectToDelete(project)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="available-projects" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6 gap-2">
            <Input
              placeholder="Search available projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAvailableProjects.map((project: Project) => {
              const facultyName = project.faculty_creator?.user.name || "Unknown Faculty"
              const facultyEmail = project.faculty_creator?.user.email || "Unknown"
              const course = courses.find((c) => c.id === project.course_id)
              const hasApplied = project.project_requests?.some(req => 
                req.student_id === student?.id && req.status !== "REJECTED"
              )

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
                        <div className="flex items-center space-x-2 mt-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            <span className="font-semibold">{facultyName}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{facultyEmail}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                    <div className="mb-4">
                      <Badge className="bg-green-100 text-green-800">Available</Badge>
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
                              {project.components_needed.map((componentId) => {
                                const component = labComponents.find((c) => c.id === componentId)
                                return (
                                  <Badge key={componentId} variant="secondary" className="text-xs font-normal px-2 py-0.5">
                                    {component ? component.component_name : `Unknown Component (${componentId})`}
                                  </Badge>
                                )
                              })}
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
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <p className="font-semibold">Time Left</p>
                          <p>{getDaysUntilDue(project.expected_completion_date)} days</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0">
                    {hasApplied ? (
                      <Button className="w-full bg-gray-600 hover:bg-gray-700" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Applied
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleApplyToProject(project.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Apply for Project
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isSubmitDialogOpen} onOpenChange={(isOpen) => {
        setIsSubmitDialogOpen(isOpen)
        if (!isOpen) setSelectedProject(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Project</DialogTitle>
            <DialogDescription>Upload your project submission (PDF).</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="submissionContent">Submission Notes</Label>
            <Textarea
              id="submissionContent"
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              placeholder="Enter any notes or description for your submission"
              rows={3}
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="submissionFile">Upload PDF</Label>
            <Input
              id="submissionFile"
              type="file"
              accept="application/pdf"
              onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
            />
            </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitProject} disabled={!submissionContent.trim() || !submissionFile}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Viewing Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={(isOpen) => {
        setIsGradeDialogOpen(isOpen)
        if (!isOpen) setSelectedProject(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Grade</DialogTitle>
            <DialogDescription>Your project has been graded by the faculty.</DialogDescription>
          </DialogHeader>
          {selectedProject?.submission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800">Marks</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedProject.submission.marks}/100
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800">Status</h3>
                  <p className="text-lg font-semibold text-blue-600 capitalize">
                    {selectedProject.submission.status}
                  </p>
                </div>
              </div>
              
              {selectedProject.submission.feedback && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Faculty Feedback</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">{selectedProject.submission.feedback}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Your Submission</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">{selectedProject.submission.content}</p>
                </div>
              </div>
              
              {selectedProject.submission.attachments && selectedProject.submission.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Submitted Files</Label>
                  <div className="space-y-2">
                    {selectedProject.submission.attachments.map((attachment, index) => (
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsGradeDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
