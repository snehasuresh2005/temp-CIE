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
    attendanceRecords.filter((record) => record.facultyId === user?.id),
  )
  const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const { toast } = useToast()

  const [currentAttendance, setCurrentAttendance] = useState<{
    [studentId: string]: "present" | "absent" | "late"
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
      courseCode: selectedCourse,
      section: selectedSection,
      date: new Date().toISOString().split("T")[0],
      facultyId: user?.id || "",
      students: sectionStudents.map((student) => ({
        studentId: student.id,
        studentName: student.name,
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
      (record) => record.courseCode === courseCode && record.section === section,
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
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-2">Mark and track student attendance</p>
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
                            <p className="text-sm text-gray-600">{student.studentId}</p>
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
                              variant={
                                currentAttendance[student.id] === "absent" || !currentAttendance[student.id]
                                  ? "default"
                                  : "outline"
                              }
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

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsMarkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMarkAttendance} disabled={!selectedCourse || !selectedSection}>
                  Mark Attendance
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableCourses.map((course) =>
              sections.map((section) => {
                const stats = getAttendanceStats(course, section)
                const sectionStudents = students.filter(
                  (student) => student.class === course && student.section === section,
                )

                return (
                  <Card key={`${course}-${section}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>
                          {course} - Section {section}
                        </span>
                      </CardTitle>
                      <CardDescription>{sectionStudents.length} students</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Classes Held:</span>
                            <p className="font-medium">{stats.totalClasses}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg. Attendance:</span>
                            <p className="font-medium">{stats.averageAttendance.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${stats.averageAttendance}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              }),
            )}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <div className="grid gap-4">
            {attendance.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
                  <p className="text-gray-600">Start marking attendance to see records here.</p>
                </CardContent>
              </Card>
            ) : (
              attendance
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((record) => (
                  <Card key={record.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5" />
                            <span>
                              {record.courseCode} - Section {record.section}
                            </span>
                          </CardTitle>
                          <CardDescription>{record.date}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            Present: {record.students.filter((s) => s.status === "present").length}/
                            {record.students.length}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {record.students.map((student) => (
                          <div key={student.studentId} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm font-medium">{student.studentName}</span>
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
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
