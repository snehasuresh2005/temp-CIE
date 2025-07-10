"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, RefreshCw, Search, Filter } from "lucide-react"
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

  const [filters, setFilters] = useState({
    gpa: "",
    program: "All",
    section: "All",
  })

  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    password: "password123", // Default password
    student_id: "",
    program: "",
    year: "",
    section: "",
    gpa: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const studentsResponse = await fetch("/api/students")
      const studentsData = await studentsResponse.json()
      setStudents(studentsData.students || [])

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

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
  }

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchTermMatch =
        student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())

      const gpaValue = parseFloat(filters.gpa)
      const gpaFilter = isNaN(gpaValue) ? true : student.gpa >= gpaValue
      const programFilter = filters.program === "All" || student.program === filters.program
      const sectionFilter = filters.section === "All" || student.section === filters.section

      return searchTermMatch && gpaFilter && programFilter && sectionFilter
    })
  }, [students, searchTerm, filters])

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
          gpa: "",
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

  const programs = [
    { value: "BTech CSE", label: "B.Tech CSE" },
    { value: "IT", label: "B.Tech AIML" },
    { value: "ECE", label: "B.Tech ECE" },
    { value: "ME", label: "B.Tech ME" },
  ]
  const years = ["2024", "2023", "2022", "2021"]
  const sections = ["A", "B", "C", "D"]

  const getProgramLabel = (programValue: string) => {
    const program = programs.find((p) => p.value === programValue)
    return program ? program.label : programValue
  }

  // Add form validation check
  const isFormValid = useMemo(() => {
    return !!(
      newStudent.name?.trim() &&
      newStudent.email?.trim() &&
      newStudent.student_id?.trim() &&
      newStudent.program?.trim()
    )
  }, [newStudent.name, newStudent.email, newStudent.student_id, newStudent.program])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading student data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Students</h1>
          <p className="text-gray-500">View, add, and manage student records and enrollments.</p>
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Enter the details for the new student</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem key={program.value} value={program.value}>
                          {program.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                  <div>
                    <Label htmlFor="gpa">GPA</Label>
                    <Input
                      id="gpa"
                      type="number"
                      value={newStudent.gpa}
                      onChange={(e) => setNewStudent((prev) => ({ ...prev, gpa: e.target.value }))}
                      placeholder="Enter GPA"
                    />
                  </div>
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
                <div className="col-span-2 flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddStudent}
                    disabled={!isFormValid}
                    className={!isFormValid ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    Add Student
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name, email, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Filter className="h-5 w-5 text-gray-500" />
          <Select value={filters.program} onValueChange={(value) => handleFilterChange("program", value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.section} onValueChange={(value) => handleFilterChange("section", value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sections</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              value={filters.gpa}
              onChange={(e) => handleFilterChange("gpa", e.target.value)}
              placeholder="GPA ≥"
              className="w-[100px]"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">GPA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.user.name}</TableCell>
                      <TableCell>{student.student_id}</TableCell>
                      <TableCell>{student.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getProgramLabel(student.program)}</Badge>
                      </TableCell>
                      <TableCell>{student.section}</TableCell>
                      <TableCell className="text-right">{student.gpa.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

