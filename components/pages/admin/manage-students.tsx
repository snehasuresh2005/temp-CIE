"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Mail, GraduationCap, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  userId: string
  studentId: string
  program: string
  year: string
  section: string
  gpa: number
  advisorId: string | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    role: string
  }
  advisor?: {
    user: {
      name: string
    }
  }
}

interface Course {
  id: string
  code: string
  name: string
  sections: string[]
}

export function ManageStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    password: "password123", // Default password
    studentId: "",
    program: "",
    year: "",
    section: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch students
      const studentsResponse = await fetch("/api/students")
      const studentsData = await studentsResponse.json()
      setStudents(studentsData.students || [])

      // Fetch courses
      const coursesResponse = await fetch("/api/courses")
      const coursesData = await coursesResponse.json()
      setCourses(coursesData.courses || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.studentId || !newStudent.program) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStudent),
      })

      if (response.ok) {
        const data = await response.json()
        setStudents((prev) => [...prev, data.student])
        setNewStudent({
          name: "",
          email: "",
          phone: "",
          password: "password123",
          studentId: "",
          program: "",
          year: "",
          section: "",
        })
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Student added successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add student")
      }
    } catch (error) {
      console.error("Error adding student:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add student",
        variant: "destructive",
      })
    }
  }

  const programs = ["BTech CSE", "BTech IT", "BTech ECE", "BTech ME", "MTech CSE", "MTech IT"]
  const years = ["2024", "2023", "2022", "2021"]
  const sections = ["A", "B", "C", "D"]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading student data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-2">Manage student records and enrollments</p>
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
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Enter the details for the new student</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@college.edu"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91-9876543210"
                  />
                </div>
                <div>
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent((prev) => ({ ...prev, studentId: e.target.value }))}
                    placeholder="STU001"
                  />
                </div>
                <div>
                  <Label htmlFor="program">Program *</Label>
                  <Select onValueChange={(value) => setNewStudent((prev) => ({ ...prev, program: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Select onValueChange={(value) => setNewStudent((prev) => ({ ...prev, year: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="section">Section</Label>
                    <Select onValueChange={(value) => setNewStudent((prev) => ({ ...prev, section: value }))}>
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
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStudent}>Add Student</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStudents.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600">Add your first student to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="h-5 w-5" />
                      <span>{student.user.name}</span>
                    </CardTitle>
                    <CardDescription>ID: {student.studentId}</CardDescription>
                  </div>
                  <Badge variant="outline">{student.program}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{student.user.email}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Year</Label>
                      <p className="font-medium">{student.year}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Section</Label>
                      <p className="font-medium">Section {student.section}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs font-medium text-gray-500">GPA</Label>
                      <p className="font-medium">{student.gpa.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Advisor</Label>
                      <p className="font-medium">{student.advisor?.user.name || "Not assigned"}</p>
                    </div>
                  </div>

                  {student.user.phone && (
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm text-gray-600">{student.user.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
