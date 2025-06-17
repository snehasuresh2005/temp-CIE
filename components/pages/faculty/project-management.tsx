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
import { Plus, FolderOpen, Calendar, Users, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Project {
  id: string
  title: string
  description: string
  courseId: string
  course: {
    code: string
    name: string
  }
  section: string
  assignedDate: string
  dueDate: string
  maxMarks: number
  attachments: string[]
  submissions?: ProjectSubmission[]
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

interface Course {
  id: string
  code: string
  name: string
  sections: string[]
}

export function ProjectManagement() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    courseId: "",
    section: "",
    dueDate: "",
    maxMarks: 100,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch courses (faculty's courses)
      const coursesResponse = await fetch("/api/courses")
      const coursesData = await coursesResponse.json()
      setCourses(coursesData.courses || [])

      // Fetch projects
      const projectsResponse = await fetch("/api/projects")
      const projectsData = await projectsResponse.json()
      setProjects(projectsData.projects || [])

      // Fetch submissions
      const submissionsResponse = await fetch("/api/project-submissions")
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
    if (!newProject.title || !newProject.courseId || !newProject.section || !newProject.dueDate) {
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
        body: JSON.stringify(newProject),
      })

      if (response.ok) {
        const data = await response.json()
        setProjects((prev) => [...prev, data.project])
        setNewProject({
          title: "",
          description: "",
          courseId: "",
          section: "",
          dueDate: "",
          maxMarks: 100,
        })
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Project assigned successfully",
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

  const handleGradeSubmission = async (submissionId: string, marks: number, feedback: string) => {
    try {
      const response = await fetch(`/api/project-submissions/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marks,
          feedback,
          status: "GRADED",
        }),
      })

      if (response.ok) {
        setSubmissions((prev) =>
          prev.map((sub) => (sub.id === submissionId ? { ...sub, marks, feedback, status: "GRADED" } : sub)),
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
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSubmissionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800"
      case "graded":
        return "bg-green-100 text-green-800"
      case "late":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAvailableSections = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    return course ? course.sections : []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading project data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600 mt-2">Assign and manage student projects</p>
        </div>

        <div className="flex space-x-2">
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign New Project</DialogTitle>
                <DialogDescription>Create a new project assignment for students</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={newProject.title}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Database Design Project"
                  />
                </div>
                <div>
                  <Label htmlFor="courseId">Course *</Label>
                  <Select onValueChange={(value) => setNewProject((prev) => ({ ...prev, courseId: value }))}>
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
                <div>
                  <Label htmlFor="section">Section *</Label>
                  <Select
                    onValueChange={(value) => setNewProject((prev) => ({ ...prev, section: value }))}
                    disabled={!newProject.courseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSections(newProject.courseId).map((section) => (
                        <SelectItem key={section} value={section}>
                          Section {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed project description and requirements..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newProject.dueDate}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, dueDate: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="maxMarks">Maximum Marks</Label>
                  <Input
                    id="maxMarks"
                    type="number"
                    value={newProject.maxMarks}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, maxMarks: Number.parseInt(e.target.value) }))}
                    min="1"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProject}>Assign Project</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">My Projects ({projects.length})</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="p-8 text-center">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No projects assigned</h3>
                  <p className="text-gray-600">Create your first project assignment to get started.</p>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <FolderOpen className="h-5 w-5" />
                          <span>{project.title}</span>
                        </CardTitle>
                        <CardDescription>
                          {project.course.code} - Section {project.section}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor("active")}>Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{project.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>Max: {project.maxMarks} marks</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Assigned: {new Date(project.assignedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <div className="grid gap-4">
            {submissions.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="p-8 text-center">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                  <p className="text-gray-600">Check back once students have submitted their projects.</p>
                </CardContent>
              </Card>
            ) : (
              submissions.map((submission) => {
                const project = projects.find((p) => p.id === submission.projectId)
                return (
                  <Card key={submission.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FolderOpen className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{project?.title}</h3>
                            <p className="text-sm text-gray-600">by {submission.student.user.name}</p>
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(submission.submissionDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">{submission.content}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className={getSubmissionStatusColor(submission.status)}>{submission.status}</Badge>
                          {submission.status.toLowerCase() === "submitted" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm">Grade</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Grade Submission</DialogTitle>
                                  <DialogDescription>
                                    Grade {submission.student.user.name}'s submission for {project?.title}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="marks">Marks (out of {project?.maxMarks})</Label>
                                    <Input
                                      id="marks"
                                      type="number"
                                      min="0"
                                      max={project?.maxMarks}
                                      placeholder="Enter marks"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="feedback">Feedback</Label>
                                    <Textarea id="feedback" placeholder="Provide feedback to the student..." rows={3} />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline">Cancel</Button>
                                    <Button
                                      onClick={() => {
                                        const marksInput = document.getElementById("marks") as HTMLInputElement
                                        const feedbackInput = document.getElementById("feedback") as HTMLTextAreaElement
                                        handleGradeSubmission(
                                          submission.id,
                                          Number(marksInput.value),
                                          feedbackInput.value,
                                        )
                                      }}
                                    >
                                      Submit Grade
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {submission.marks !== null && (
                            <div className="text-sm">
                              <div className="font-medium">
                                {submission.marks}/{project?.maxMarks}
                              </div>
                              {submission.feedback && (
                                <div className="text-xs text-gray-500 mt-1">{submission.feedback}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
