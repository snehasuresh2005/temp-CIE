"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Clock, GraduationCap, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Course {
  id: string
  code: string
  name: string
  description: string
  credits: number
  department: string
  semester: string
  maxStudents: number
  enrolledStudents: number
  sections: string[]
  faculty?: {
    user: {
      name: string
    }
  }
}

interface Enrollment {
  id: string
  courseId: string
  studentId: string
  section: string
  enrollmentDate: string
  grade: string | null
}

export function ViewCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch all courses
      const coursesResponse = await fetch("/api/courses")
      const coursesData = await coursesResponse.json()
      setCourses(coursesData.courses || [])

      // Fetch student's enrollments
      const enrollmentsResponse = await fetch("/api/enrollments")
      const enrollmentsData = await enrollmentsResponse.json()
      setEnrollments(enrollmentsData.enrollments || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isEnrolled = (courseId: string) => {
    return enrollments.some((enrollment) => enrollment.courseId === courseId)
  }

  const getEnrollmentInfo = (courseId: string) => {
    return enrollments.find((enrollment) => enrollment.courseId === courseId)
  }

  const handleEnroll = async (courseId: string, section: string) => {
    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          section,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEnrollments((prev) => [...prev, data.enrollment])

        // Update course enrolled students count
        setCourses((prev) =>
          prev.map((course) =>
            course.id === courseId ? { ...course, enrolledStudents: course.enrolledStudents + 1 } : course,
          ),
        )

        toast({
          title: "Success",
          description: "Successfully enrolled in the course",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to enroll")
      }
    } catch (error) {
      console.error("Error enrolling:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enroll in course",
        variant: "destructive",
      })
    }
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
          <p className="text-gray-600 mt-2">Browse and enroll in courses for this semester</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            const enrolled = isEnrolled(course.id)
            const enrollmentInfo = getEnrollmentInfo(course.id)

            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>
                          {course.code} - {course.name}
                        </span>
                      </CardTitle>
                      <CardDescription>{course.department}</CardDescription>
                    </div>
                    <div className="flex flex-col space-y-1">
                      {enrolled ? (
                        <>
                          <Badge variant="default">Enrolled</Badge>
                          {enrollmentInfo?.grade && <Badge variant="outline">Grade: {enrollmentInfo.grade}</Badge>}
                        </>
                      ) : (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{course.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{course.credits} Credits</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          {course.enrolledStudents}/{course.maxStudents} Students
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          Instructor: {course.faculty?.user.name || "Not assigned"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">Semester: {course.semester}</div>
                    </div>

                    {enrolled && enrollmentInfo && (
                      <div>
                        <span className="text-sm font-medium">Your Section:</span>
                        <Badge variant="outline" className="ml-2">
                          Section {enrollmentInfo.section}
                        </Badge>
                      </div>
                    )}

                    {!enrolled && (
                      <div>
                        <span className="text-sm font-medium">Available Sections:</span>
                        <div className="flex space-x-2 mt-1">
                          {course.sections.map((section) => (
                            <Button
                              key={section}
                              variant="outline"
                              size="sm"
                              onClick={() => handleEnroll(course.id, section)}
                              disabled={course.enrolledStudents >= course.maxStudents}
                            >
                              Section {section}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(course.enrolledStudents / course.maxStudents) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round((course.enrolledStudents / course.maxStudents) * 100)}% Enrolled
                    </div>
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
