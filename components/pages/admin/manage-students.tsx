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
  user_id: string
  student_id: string
  program: string
  year: string
  section: string
  gpa: number
  advisor_id: string | null
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
    student_id: "",
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
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.student_id || !newStudent.program) {
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
          student_id: "",
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

  const programs = ["CSE", "IT", "ECE", "ME", "IT"]
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
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="student_id">Student ID *</Label>
                  <Input
                    id="student_id"
                    value={newStudent.student_id}
                    onChange={(e) => setNewStudent((prev) => ({ ...prev, student_id: e.target.value }))}
                    placeholder="Enter student ID"
                  />
                </div>
                <div>
                  <Label htmlFor="program">Program *</Label>
                  <Select value={newStudent.program} onValueChange={(value) => setNewStudent((prev) => ({ ...prev, program: value }))}>
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
                    <Select value={newStudent.year} onValueChange={(value) => setNewStudent((prev) => ({ ...prev, year: value }))}>
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
                    <Select value={newStudent.section} onValueChange={(value) => setNewStudent((prev) => ({ ...prev, section: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section} value={section}>
                            {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
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

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{student.user.name}</CardTitle>
                  <Badge variant="secondary">{student.program}</Badge>
                </div>
                <CardDescription>ID: {student.student_id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{student.user.email}</span>
                </div>
                {student.user.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>📞</span>
                    <span>{student.user.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4" />
                  <span>
                    {student.year} Year, Section {student.section}
                  </span>
                </div>
                {student.gpa && (
                  <div className="text-sm text-gray-600">
                    GPA: {student.gpa.toFixed(2)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No students found matching your search." : "No students found."}
          </div>
        )}
      </div>
    </div>
  )
}
