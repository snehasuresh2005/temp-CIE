"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ClipboardCheck, Users, Calendar, CheckCircle, X, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { attendanceRecords, students, type AttendanceRecord } from "@/lib/data"
import { useAuth } from "@/components/auth-provider"

export function AttendanceManagement() {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    attendanceRecords.filter((record) => record.faculty_id === user?.id),
  )
  const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const { toast } = useToast()

  const [currentAttendance, setCurrentAttendance] = useState<{
    [student_id: string]: "present" | "absent" | "late"
  }>({})

  const availableCourses = ["CS101", "CS201", "MATH101"]
  const sections = ["A", "B", "C"]

  const handleMarkAttendance = () => {
    if (!selectedCourse || !selectedSection) {
      toast({
        title: "Error",
        description: "Please select course and section",
        variant: "destructive",
      })
      return
    }

    const sectionStudents = students.filter(
      (student) => student.class === selectedCourse && student.section === selectedSection,
    )

    const attendanceRecord: AttendanceRecord = {
      id: Date.now().toString(),
      course_code: selectedCourse,
      section: selectedSection,
      date: new Date().toISOString().split("T")[0],
      faculty_id: user?.id || "",
      students: sectionStudents.map((student) => ({
        student_id: student.id,
        student_name: student.name,
        status: currentAttendance[student.id] || "absent",
      })),
    }

    setAttendance((prev) => [...prev, attendanceRecord])
    setCurrentAttendance({})
    setSelectedCourse("")
    setSelectedSection("")
    setIsMarkDialogOpen(false)

    toast({
      title: "Success",
      description: "Attendance marked successfully",
    })
  }

  const getAttendanceStats = (courseCode: string, section: string) => {
    const courseAttendance = attendance.filter(
      (record) => record.course_code === courseCode && record.section === section,
    )

    const totalClasses = courseAttendance.length
    if (totalClasses === 0) return { totalClasses: 0, averageAttendance: 0 }

    const totalStudents = courseAttendance[0]?.students.length || 0
    const totalPossibleAttendance = totalClasses * totalStudents
    const totalPresent = courseAttendance.reduce(
      (sum, record) => sum + record.students.filter((s) => s.status === "present").length,
      0,
    )

    const averageAttendance = totalPossibleAttendance > 0 ? (totalPresent / totalPossibleAttendance) * 100 : 0

    return { totalClasses, averageAttendance }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4" />
      case "absent":
        return <X className="h-4 w-4" />
      case "late":
        return <Clock className="h-4 w-4" />
      default:
        return <ClipboardCheck className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="faculty-page-title">Attendance Management</h1>
        </div>

        <Dialog open={isMarkDialogOpen} onOpenChange={setIsMarkDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>Select course and section to mark attendance</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course">Course</Label>
                  <Select onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section} value={section}>
                          Section {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCourse && selectedSection && (
                <div className="space-y-4">
                  <h3 className="font-medium">
                    Students in {selectedCourse} - Section {selectedSection}
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {students
                      .filter((student) => student.class === selectedCourse && student.section === selectedSection)
                      .map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-sm text-gray-600">{student.student_id}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant={currentAttendance[student.id] === "present" ? "default" : "outline"}
                              onClick={() => setCurrentAttendance((prev) => ({ ...prev, [student.id]: "present" }))}
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={currentAttendance[student.id] === "late" ? "default" : "outline"}
                              onClick={() => setCurrentAttendance((prev) => ({ ...prev, [student.id]: "late" }))}
                            >
                              Late
                            </Button>
                            <Button
                              size="sm"
                              variant={currentAttendance[student.id] === "absent" ? "default" : "outline"}
                              onClick={() => setCurrentAttendance((prev) => ({ ...prev, [student.id]: "absent" }))}
                            >
                              Absent
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsMarkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMarkAttendance}>Mark Attendance</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableCourses.map((course) =>
              sections.map((section) => {
                const stats = getAttendanceStats(course, section)
                return (
                  <Card key={`${course}-${section}`} className="faculty-card">
                    <CardHeader>
                      <CardTitle className="text-lg">{course} - Section {section}</CardTitle>
                      <CardDescription>
                        {stats.totalClasses} classes recorded
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average Attendance</span>
                          <span className="font-medium">{stats.averageAttendance.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${stats.averageAttendance}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              }),
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {attendance.map((record) => (
            <Card key={record.id} className="faculty-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {record.course_code} - Section {record.section}
                    </CardTitle>
                    <CardDescription>{record.date}</CardDescription>
                  </div>
                  <Badge variant="outline">{record.students.length} students</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {record.students.map((student) => (
                    <div key={student.student_id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <h4 className="font-medium">{student.student_name}</h4>
                        <p className="text-sm text-gray-600">{student.student_id}</p>
                      </div>
                      <Badge className={getStatusColor(student.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(student.status)}
                          <span className="capitalize">{student.status}</span>
                        </div>
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
