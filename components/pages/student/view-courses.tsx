"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { BookOpen, Calendar, UserPlus, Trash2, RefreshCw, List, Clock, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface CourseUnit {
  id: string
  unit_number: number
  unit_name: string
  unit_description: string
  assignment_count: number
  hours_per_unit: number
}

interface Course {
  id: string
  course_code: string
  course_name: string
  course_description: string
  course_start_date: string
  course_end_date: string
  course_enrollments: string[]
  created_by: string
  created_date: string
  modified_by?: string
  modified_date: string
  course_units: CourseUnit[]
  creator?: {
    id: string
    name: string
    email: string
  }
}

export function ViewCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isUnitsSheetOpen, setIsUnitsSheetOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const response = await fetch("/api/courses")
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

  const isEnrolled = (course: Course) => {
    return user && course.course_enrollments.includes(user.id)
  }

  const handleSignUp = async (courseId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to sign up for courses",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await fetch(`/api/courses`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ courseId, action: "enroll" }),
      })
      if (response.ok) {
        toast({ title: "Success", description: "Enrolled in course!" })
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to enroll")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enroll in course",
        variant: "destructive",
      })
    }
  }

  const openUnitsSheet = (course: Course) => {
    setSelectedCourse(course)
    setIsUnitsSheetOpen(true)
  }

  const getTotalHours = (units: CourseUnit[]) => {
    return units.reduce((total, unit) => total + unit.hours_per_unit, 0)
  }

  const getTotalAssignments = (units: CourseUnit[]) => {
    return units.reduce((total, unit) => total + unit.assignment_count, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading courses...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Courses</h1>
          <p className="text-gray-600 mt-2">Browse and sign up for available courses</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
              <p className="text-gray-600">Check back later for available courses.</p>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => {
            const enrolled = isEnrolled(course)
            const totalHours = getTotalHours(course.course_units || [])
            const totalAssignments = getTotalAssignments(course.course_units || [])
            return (
              <Card key={course.id} className="flex flex-col justify-between min-h-[280px] max-w-md mx-auto hover:shadow-lg transition-shadow rounded-xl border border-gray-200 p-4">
                <CardHeader className="pb-2 px-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-base">{course.course_name}</span>
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-1 line-clamp-2">{course.course_description}</CardDescription>
                      <span className="text-xs text-gray-400 mt-1 block">{course.course_code}</span>
                    </div>
                    <Badge variant="outline" className="ml-2 mt-1">{enrolled ? "Enrolled" : "Available"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between px-0 pb-0">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-4 text-sm mb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(course.course_start_date).toLocaleDateString()} - {new Date(course.course_end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{totalHours} hours</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>{totalAssignments} assignments</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <List className="h-4 w-4 text-gray-400" />
                        <span>{course.course_units?.length || 0} units</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-500">Created by: {course.creator?.name || course.created_by}</span>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openUnitsSheet(course)}>
                        <List className="h-4 w-4 mr-1" /> View Units
                      </Button>
                      {!enrolled && (
                        <Button size="sm" onClick={() => handleSignUp(course.id)}>
                          <UserPlus className="h-4 w-4 mr-1" /> Sign Up
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Course Units Sheet */}
      <Sheet open={isUnitsSheetOpen} onOpenChange={setIsUnitsSheetOpen}>
        <SheetContent className="w-96">
          <SheetHeader>
            <SheetTitle>Course Units</SheetTitle>
            <SheetDescription>
              {selectedCourse?.course_name}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedCourse?.course_units?.length === 0 ? (
              <p className="text-gray-500 text-center">No units added yet</p>
            ) : (
              selectedCourse?.course_units?.map((unit) => (
                <Card key={unit.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Unit {unit.unit_number}</h4>
                      <Badge variant="outline">{unit.hours_per_unit}h</Badge>
                    </div>
                    <h5 className="font-medium text-sm">{unit.unit_name}</h5>
                    <p className="text-sm text-gray-600">{unit.unit_description}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{unit.assignment_count} assignments</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
