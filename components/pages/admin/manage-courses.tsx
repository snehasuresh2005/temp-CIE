"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, BookOpen, Calendar, Users, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Course {
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

export function ManageCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()

  const [newCourse, setNewCourse] = useState({
    course_name: "",
    course_description: "",
    course_start_date: "",
    course_end_date: "",
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/courses", {
        headers: {
          "x-user-id": user?.id || "",
        },
      })
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.created_by.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddCourse = async () => {
    if (!newCourse.course_name || !newCourse.course_description || !newCourse.course_start_date || !newCourse.course_end_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate dates
    const startDate = new Date(newCourse.course_start_date)
    const endDate = new Date(newCourse.course_end_date)
    if (endDate <= startDate) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify(newCourse),
      })

      if (response.ok) {
        const data = await response.json()
        setCourses((prev) => [...prev, data.course])
        setNewCourse({
          course_name: "",
          course_description: "",
          course_start_date: "",
          course_end_date: "",
        })
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Course added successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add course")
      }
    } catch (error) {
      console.error("Error adding course:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add course",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    try {
      const response = await fetch(`/api/courses?id=${courseId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id || "",
        },
      })

      if (response.ok) {
        setCourses((prev) => prev.filter((course) => course.course_id !== courseId))
        toast({
          title: "Success",
          description: "Course deleted successfully",
        })
      } else {
        throw new Error("Failed to delete course")
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading course data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-2">Manage university courses and their details</p>
        </div>

        <div className="flex space-x-2">
          <Button onClick={fetchCourses} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>Enter the details for the new course</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="course_name">Course Name *</Label>
                  <Input
                    id="course_name"
                    value={newCourse.course_name}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, course_name: e.target.value }))}
                    placeholder="Data Structures and Algorithms"
                  />
                </div>
                <div>
                  <Label htmlFor="course_description">Course Description *</Label>
                  <Textarea
                    id="course_description"
                    value={newCourse.course_description}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, course_description: e.target.value }))}
                    placeholder="Course description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course_start_date">Start Date *</Label>
                    <Input
                      id="course_start_date"
                      type="date"
                      value={newCourse.course_start_date}
                      onChange={(e) => setNewCourse((prev) => ({ ...prev, course_start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="course_end_date">End Date *</Label>
                    <Input
                      id="course_end_date"
                      type="date"
                      value={newCourse.course_end_date}
                      onChange={(e) => setNewCourse((prev) => ({ ...prev, course_end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCourse}>Add Course</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCourses.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">Add your first course to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredCourses.map((course) => (
            <Card key={course.course_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>{course.course_name}</span>
                    </CardTitle>
                    <CardDescription>{course.course_description}</CardDescription>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {new Date(course.course_start_date).toLocaleDateString()} - {new Date(course.course_end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{course.course_enrollments.length} Student(s) Enrolled</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Created by</Label>
                    <p className="text-sm text-gray-600">{course.created_by}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Created on</Label>
                    <p className="text-sm text-gray-600">{new Date(course.created_date).toLocaleDateString()}</p>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.course_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
