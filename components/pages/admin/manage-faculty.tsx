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
import { Plus, Mail, Phone, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Faculty {
  id: string
  userId: string
  employeeId: string
  department: string
  office: string
  specialization: string
  officeHours: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    role: string
  }
}

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

export function ManageFaculty() {
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [newFaculty, setNewFaculty] = useState({
    name: "",
    email: "",
    phone: "",
    password: "password123", // Default password
    employeeId: "",
    department: "",
    office: "",
    specialization: "",
    officeHours: "10:00 AM - 4:00 PM",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch faculty
      const facultyResponse = await fetch("/api/faculty")
      const facultyData = await facultyResponse.json()
      setFaculty(facultyData.faculty || [])

      // Fetch courses
      const coursesResponse = await fetch("/api/courses")
      const coursesData = await coursesResponse.json()
      setCourses(coursesData.courses || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load faculty data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredFaculty = faculty.filter(
    (f) =>
      f.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.employeeId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddFaculty = async () => {
    if (!newFaculty.name || !newFaculty.email || !newFaculty.employeeId || !newFaculty.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/faculty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFaculty),
      })

      if (response.ok) {
        const data = await response.json()
        setFaculty((prev) => [...prev, data.faculty])
        setNewFaculty({
          name: "",
          email: "",
          phone: "",
          password: "password123",
          employeeId: "",
          department: "",
          office: "",
          specialization: "",
          officeHours: "10:00 AM - 4:00 PM",
        })
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Faculty member added successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add faculty")
      }
    } catch (error) {
      console.error("Error adding faculty:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add faculty member",
        variant: "destructive",
      })
    }
  }

  const getFacultyCourses = (facultyId: string) => {
    return courses.filter((course) => course.created_by === facultyId)
  }

  const departments = [
    "Computer Science",
    "Information Technology",
    "Electronics",
    "Mathematics",
    "Physics",
    "Chemistry",
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading faculty data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Management</h1>
          <p className="text-gray-600 mt-2">Manage faculty members and their details</p>
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
                Add Faculty
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Faculty Member</DialogTitle>
                <DialogDescription>Enter the details for the new faculty member</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Dr. John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@college.edu"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newFaculty.phone}
                    onChange={(e) => setNewFaculty((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91-9876543210"
                  />
                </div>
                <div>
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    value={newFaculty.employeeId}
                    onChange={(e) => setNewFaculty((prev) => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="FAC001"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select onValueChange={(value) => setNewFaculty((prev) => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="office">Office</Label>
                  <Input
                    id="office"
                    value={newFaculty.office}
                    onChange={(e) => setNewFaculty((prev) => ({ ...prev, office: e.target.value }))}
                    placeholder="CS Block - 301"
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={newFaculty.specialization}
                    onChange={(e) => setNewFaculty((prev) => ({ ...prev, specialization: e.target.value }))}
                    placeholder="Data Structures and Algorithms"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddFaculty}>Add Faculty</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search faculty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredFaculty.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No faculty members found</h3>
              <p className="text-gray-600">Add your first faculty member to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredFaculty.map((member) => {
            const facultyCourses = getFacultyCourses(member.id)

            return (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{member.user.name}</span>
                        <Badge variant="default">Active</Badge>
                      </CardTitle>
                      <CardDescription>{member.department}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{member.user.email}</span>
                      </div>
                      {member.user.phone && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{member.user.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Employee ID</Label>
                        <p className="font-medium">{member.employeeId}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Office</Label>
                        <p className="font-medium">{member.office || "Not assigned"}</p>
                      </div>
                    </div>

                    {member.specialization && (
                      <div>
                        <Label className="text-sm font-medium">Specialization</Label>
                        <p className="text-sm text-gray-600">{member.specialization}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Office Hours</Label>
                      <p className="text-sm text-gray-600">{member.officeHours}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Assigned Courses</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {facultyCourses.length > 0 ? (
                          facultyCourses.map((course) => (
                            <Badge key={course.course_id} variant="outline">
                              {course.course_name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary">No courses assigned</Badge>
                        )}
                      </div>
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
