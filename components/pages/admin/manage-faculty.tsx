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
import { Plus, Mail, Phone, RefreshCw, Search } from "lucide-react"
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
  const [editMode, setEditMode] = useState(false)

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

  const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFacultyData, setEditFacultyData] = useState<any>(null);
  const [facultyToDelete, setFacultyToDelete] = useState<Faculty | null>(null);
  const [editFacultyImage, setEditFacultyImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

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

  // Image preview handler for edit
  useEffect(() => {
    if (editFacultyImage) {
      const reader = new FileReader();
      reader.onload = (e) => setEditImagePreview(e.target?.result as string);
      reader.readAsDataURL(editFacultyImage);
    } else {
      setEditImagePreview(null);
    }
  }, [editFacultyImage]);

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

  // Edit handlers
  const handleEditFaculty = (faculty: Faculty) => {
    setEditFaculty(faculty);
    setEditFacultyData({
      name: faculty.user.name,
      email: faculty.user.email,
      phone: faculty.user.phone || "",
      facultyId: faculty.facultyId,
      department: faculty.department,
      office: faculty.office,
      specialization: faculty.specialization,
      officeHours: faculty.officeHours,
    });
    setIsEditDialogOpen(true);
  };
  const handleUpdateFaculty = async () => {
    if (!editFacultyData.name || !editFacultyData.email || !editFacultyData.facultyId || !editFacultyData.department) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`/api/faculty/${editFaculty?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFacultyData),
      });
      if (response.ok) {
        // Upload image if selected
        if (editFacultyImage) {
          const formData = new FormData();
          formData.append('file', editFacultyImage);
          formData.append('facultyId', editFaculty?.id);
          await fetch('/api/faculty/upload', {
            method: 'POST',
            body: formData,
          });
        }
        await fetchData();
        setIsEditDialogOpen(false);
        setEditFaculty(null);
        setEditFacultyImage(null);
        setEditImagePreview(null);
        toast({ title: "Success", description: "Faculty details updated" });
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update faculty", variant: "destructive" });
    }
  };
  // Delete handlers
  const handleDeleteFaculty = async () => {
    if (!facultyToDelete) return;
    try {
      const response = await fetch(`/api/faculty/${facultyToDelete.id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchData();
        setFacultyToDelete(null);
        toast({ title: "Success", description: "Faculty deleted" });
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to delete faculty", variant: "destructive" });
    }
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
          <h1 className="admin-page-title">Faculty Management</h1>
        </div>

        <div className="flex space-x-2">
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? "Editing..." : "Edit Mode"}
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

      <div className="flex items-center gap-2 mb-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search faculty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
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
              <div key={member.id} className="admin-card hover:shadow-lg transition-shadow">
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
                {editMode && (
                  <div className="flex justify-end gap-2 mt-4">
                    <button className="btn-edit" onClick={() => handleEditFaculty(member)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6v-2a2 2 0 012-2h2" /></svg>
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => setFacultyToDelete(member)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      {/* Edit Faculty Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Faculty Member</DialogTitle>
            <DialogDescription>Update the details for the faculty member</DialogDescription>
          </DialogHeader>
          {editFacultyData && (
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={editFacultyData.name}
                    onChange={(e) => setEditFacultyData((prev: any) => ({ ...prev, name: e.target.value }))}
                    placeholder="Dr. John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFacultyData.email}
                    onChange={(e) => setEditFacultyData((prev: any) => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@college.edu"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editFacultyData.phone}
                    onChange={(e) => setEditFacultyData((prev: any) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91-9876543210"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-facultyId">Faculty ID *</Label>
                  <Input
                    id="edit-facultyId"
                    value={editFacultyData.facultyId}
                    onChange={(e) => setEditFacultyData((prev: any) => ({ ...prev, facultyId: e.target.value }))}
                    placeholder="FAC001"
                  />
                </div>
              </div>
              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-department">Department *</Label>
                  <Select value={editFacultyData.department} onValueChange={(value) => setEditFacultyData((prev: any) => ({ ...prev, department: value }))}>
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
                  <Label htmlFor="edit-office">Office</Label>
                  <Input
                    id="edit-office"
                    value={editFacultyData.office}
                    onChange={(e) => setEditFacultyData((prev: any) => ({ ...prev, office: e.target.value }))}
                    placeholder="CS Block - 301"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-specialization">Specialization</Label>
                  <Input
                    id="edit-specialization"
                    value={editFacultyData.specialization}
                    onChange={(e) => setEditFacultyData((prev: any) => ({ ...prev, specialization: e.target.value }))}
                    placeholder="Data Structures and Algorithms"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-officeHours">Office Hours</Label>
                  <Input
                    id="edit-officeHours"
                    value={editFacultyData.officeHours}
                    onChange={(e) => setEditFacultyData((prev: any) => ({ ...prev, officeHours: e.target.value }))}
                    placeholder="10:00 AM - 4:00 PM"
                  />
                </div>
              </div>
              {/* Image Upload Section - Full Width */}
              <div className="col-span-2 space-y-4 border-t pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="edit-image">Profile Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => setEditFacultyImage(e.target.files?.[0] || null)}
                      className="mb-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview</Label>
                    {editImagePreview ? (
                      <div className="border rounded-lg p-2 bg-gray-50">
                        <img
                          src={editImagePreview}
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
                          <p className="text-xs text-gray-500">{editFaculty?.profilePhotoUrl ? 'Current image shown' : 'No image selected'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-2 flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateFaculty}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Faculty Dialog */}
      <Dialog open={!!facultyToDelete} onOpenChange={() => setFacultyToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete this faculty member?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setFacultyToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFaculty}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
