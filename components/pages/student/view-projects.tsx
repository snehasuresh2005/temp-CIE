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
import { FolderOpen, Calendar, FileText, Upload, RefreshCw } from "lucide-react"
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
  submission?: ProjectSubmission
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

export function ViewProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [submissionContent, setSubmissionContent] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/student/projects")
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast({
        title: "Error",
        description: "Failed to load projects",
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

  const getStatusColor = (project: Project) => {
    const now = new Date()
    const dueDate = new Date(project.dueDate)

    if (project.submission) {
      if (project.submission.status === "GRADED") {
        return "bg-green-100 text-green-800"
      }
      return "bg-blue-100 text-blue-800"
    }

    if (now > dueDate) {
      return "bg-red-100 text-red-800"
    }

    return "bg-yellow-100 text-yellow-800"
  }

  const getStatusText = (project: Project) => {
    const now = new Date()
    const dueDate = new Date(project.dueDate)

    if (project.submission) {
      if (project.submission.status === "GRADED") {
        return "Graded"
      }
      return "Submitted"
    }

    if (now > dueDate) {
      return "Overdue"
    }

    return "Pending"
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
        <div className="text-lg">Loading projects...</div>
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
        <Button onClick={fetchProjects} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="p-8 text-center">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects assigned</h3>
              <p className="text-gray-600">Check back later for project assignments.</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => {
            const daysUntilDue = getDaysUntilDue(project.dueDate)

            return (
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
                    <Badge className={getStatusColor(project)}>{getStatusText(project)}</Badge>
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
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>Max: {project.maxMarks} marks</span>
                      </div>
                    </div>

                    {daysUntilDue > 0 && !project.submission && (
                      <div className="text-sm">
                        <span className={`font-medium ${daysUntilDue <= 3 ? "text-red-600" : "text-green-600"}`}>
                          {daysUntilDue} days remaining
                        </span>
                      </div>
                    )}

                    {project.submission && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium">Your Submission:</div>
                          <div className="text-gray-600 mt-1">{project.submission.content}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            Submitted: {new Date(project.submission.submissionDate).toLocaleDateString()}
                          </div>
                          {project.submission.marks !== null && (
                            <div className="mt-2">
                              <div className="font-medium text-green-600">
                                Grade: {project.submission.marks}/{project.maxMarks}
                              </div>
                              {project.submission.feedback && (
                                <div className="text-sm text-gray-600 mt-1">
                                  <strong>Feedback:</strong> {project.submission.feedback}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Assigned: {new Date(project.assignedDate).toLocaleDateString()}
                    </div>

                    {!project.submission && daysUntilDue >= 0 && (
                      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full" onClick={() => setSelectedProject(project)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Submit Project
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Submit Project</DialogTitle>
                            <DialogDescription>Submit your work for {selectedProject?.title}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="content">Project Content *</Label>
                              <Textarea
                                id="content"
                                value={submissionContent}
                                onChange={(e) => setSubmissionContent(e.target.value)}
                                placeholder="Describe your project work, methodology, results, and conclusions..."
                                rows={8}
                              />
                            </div>
                            <div className="text-sm text-gray-600">
                              <strong>Due Date:</strong>{" "}
                              {selectedProject && new Date(selectedProject.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsSubmitDialogOpen(false)
                                setSelectedProject(null)
                                setSubmissionContent("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSubmitProject}>Submit Project</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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
