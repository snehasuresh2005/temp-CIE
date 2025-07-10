"use client"

import { useState, useEffect, useMemo } from "react"
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
  facultyId: string
  department: string
  office: string
  specialization: string
  officeHours: string
  profilePhotoUrl?: string
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
    facultyId: "",
    department: "",
    office: "",
    specialization: "",
    officeHours: "10:00 AM - 4:00 PM",
  })

  const [newFacultyImage, setNewFacultyImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  // Image preview handler
  useEffect(() => {
    if (newFacultyImage) {
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(newFacultyImage)
    } else {
      setImagePreview(null)
    }
  }, [newFacultyImage])

  // Add form validation check
  const isFormValid = useMemo(() => {
    return !!(
      newFaculty.name?.trim() &&
      newFaculty.email?.trim() &&
      newFaculty.facultyId?.trim() &&
      newFaculty.department?.trim()
    )
  }, [newFaculty.name, newFaculty.email, newFaculty.facultyId, newFaculty.department])

  useEffect(() => {
    console.log("ManageFaculty component mounted");
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
      f.facultyId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddFaculty = async () => {
    if (!newFaculty.name || !newFaculty.email || !newFaculty.facultyId || !newFaculty.department) {
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
          facultyId: "",
          department: "",
          office: "",
          specialization: "",
          officeHours: "10:00 AM - 4:00 PM",
        })
        setNewFacultyImage(null)
        setImagePreview(null)
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Faculty member added successfully",
        })

        if (newFacultyImage) {
          const formData = new FormData();
          formData.append('file', newFacultyImage);
          formData.append('facultyId', data.faculty.id);
          await fetch('/api/faculty/upload', {
            method: 'POST',
            body: formData,
          });
        }
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

  const getImageSrc = (faculty: Faculty) => {
    // If we've already failed to load this image, use placeholder directly
    if (failedImages.has(faculty.facultyId)) {
      return '/placeholder-user.jpg';
    }
    
    // Use facultyId for image URL (from profilePhotoUrl or construct it)
    if (faculty.profilePhotoUrl) {
      // Try the URL from API first (without extension)
      return `${faculty.profilePhotoUrl}.jpg`;
    }
    
    // Fallback: construct URL using facultyId
    return `/profile-img/${faculty.facultyId}.jpg`;
  };

  const handleImageError = (faculty: Faculty, e: React.SyntheticEvent<HTMLImageElement>) => {
    const currentSrc = e.currentTarget.src;
    console.log(`Failed to load image: ${currentSrc}`);
    
    // Try different extensions in order: .jpg -> .jpeg -> .png -> placeholder
    if (currentSrc.includes('.jpg') && !currentSrc.includes('.jpeg')) {
      const jpegUrl = currentSrc.replace('.jpg', '.jpeg');
      console.log(`Trying .jpeg extension: ${jpegUrl}`);
      e.currentTarget.src = jpegUrl;
      return;
    }
    
    if (currentSrc.includes('.jpeg')) {
      const pngUrl = currentSrc.replace('.jpeg', '.png');
      console.log(`Trying .png extension: ${pngUrl}`);
      e.currentTarget.src = pngUrl;
      return;
    }
    
    // All extensions failed, use placeholder and mark as failed
    console.log(`All extensions failed for faculty ${faculty.facultyId}, using placeholder`);
    setFailedImages(prev => new Set(prev).add(faculty.facultyId));
    e.currentTarget.src = '/placeholder-user.jpg';
  };

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Faculty Member</DialogTitle>
                <DialogDescription>Enter the details for the new faculty member</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
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
                  <Label htmlFor="facultyId">Faculty ID *</Label>
                  <Input
                    id="facultyId"
                    value={newFaculty.facultyId}
                    onChange={(e) => setNewFaculty((prev) => ({ ...prev, facultyId: e.target.value }))}
                    placeholder="FAC001"
                  />
                </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
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
                <div>
                  <Label htmlFor="officeHours">Office Hours</Label>
                  <Input
                    id="officeHours"
                    value={newFaculty.officeHours}
                    onChange={(e) => setNewFaculty((prev) => ({ ...prev, officeHours: e.target.value }))}
                    placeholder="10:00 AM - 4:00 PM"
                  />
                </div>
                </div>
                
                {/* Image Upload Section - Full Width */}
                <div className="col-span-2 space-y-4 border-t pt-6">
                  <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="image">Profile Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={e => setNewFacultyImage(e.target.files?.[0] || null)}
                    className="mb-2"
                  />
                </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview</Label>
                      {imagePreview ? (
                        <div className="border rounded-lg p-2 bg-gray-50">
                          <img
                            src={imagePreview}
                            alt="Profile Preview"
                            className="w-full h-32 object-contain rounded bg-white"
                          />
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50 h-32 flex items-center justify-center">
                          <div className="text-gray-400">
                            <svg className="mx-auto h-8 w-8 mb-1" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-xs text-gray-500">No image selected</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddFaculty}
                    disabled={!isFormValid}
                    className={!isFormValid ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    Add Faculty
                  </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <div className="flex items-center gap-4">
                    <img
                      src={getImageSrc(member)}
                      alt={member.user.name}
                      className="w-16 h-16 rounded-full object-cover border"
                      onError={(e) => handleImageError(member, e)}
                    />
                    <div>
                      <CardTitle className="text-2xl font-bold">{member.user.name}</CardTitle>
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
                        <Label className="text-xs font-medium text-gray-500">Faculty ID</Label>
                        <p className="font-medium">{member.facultyId}</p>
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
