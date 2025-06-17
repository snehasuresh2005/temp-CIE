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
import { Plus, Calendar, Clock, MapPin, Trash2, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Course {
  id: string
  code: string
  name: string
  sections: string[]
}

interface Faculty {
  id: string
  user: {
    name: string
    email: string
  }
  department: string
}

interface ClassSchedule {
  id: string
  courseId: string
  course: {
    code: string
    name: string
  }
  facultyId: string
  faculty: {
    user: {
      name: string
      email: string
    }
  }
  room: string
  dayOfWeek: string
  startTime: string
  endTime: string
  section: string
}

export function ManageClassSchedules() {
  const [courses, setCourses] = useState<Course[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentDay, setCurrentDay] = useState<string>("all")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  const [newSchedule, setNewSchedule] = useState({
    courseId: "",
    facultyId: "",
    room: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    section: "",
  })

  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null)

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch courses
        const coursesResponse = await fetch("/api/courses")
        const coursesData = await coursesResponse.json()
        setCourses(coursesData.courses || [])

        // Fetch faculty
        const facultyResponse = await fetch("/api/faculty")
        const facultyData = await facultyResponse.json()
        setFaculty(facultyData.faculty || [])

        // Fetch schedules
        const schedulesResponse = await fetch("/api/class-schedules")
        const schedulesData = await schedulesResponse.json()
        setSchedules(schedulesData.schedules || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.faculty.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.room.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDay = currentDay === "all" || schedule.dayOfWeek === currentDay

    return matchesSearch && matchesDay
  })

  const handleAddSchedule = async () => {
    if (
      !newSchedule.courseId ||
      !newSchedule.facultyId ||
      !newSchedule.room ||
      !newSchedule.dayOfWeek ||
      !newSchedule.startTime ||
      !newSchedule.endTime ||
      !newSchedule.section
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/class-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSchedule),
      })

      if (!response.ok) {
        throw new Error("Failed to add schedule")
      }

      const data = await response.json()
      setSchedules((prev) => [...prev, data.schedule])
      setNewSchedule({
        courseId: "",
        facultyId: "",
        room: "",
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        section: "",
      })
      setIsAddDialogOpen(false)

      toast({
        title: "Success",
        description: "Class schedule added successfully",
      })
    } catch (error) {
      console.error("Error adding schedule:", error)
      toast({
        title: "Error",
        description: "Failed to add schedule. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditSchedule = async () => {
    if (!editingSchedule) return

    try {
      const response = await fetch(`/api/class-schedules/${editingSchedule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: editingSchedule.courseId,
          facultyId: editingSchedule.facultyId,
          room: editingSchedule.room,
          dayOfWeek: editingSchedule.dayOfWeek,
          startTime: editingSchedule.startTime,
          endTime: editingSchedule.endTime,
          section: editingSchedule.section,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update schedule")
      }

      const data = await response.json()
      setSchedules((prev) => prev.map((s) => (s.id === editingSchedule.id ? data.schedule : s)))
      setEditingSchedule(null)
      setIsEditDialogOpen(false)

      toast({
        title: "Success",
        description: "Class schedule updated successfully",
      })
    } catch (error) {
      console.error("Error updating schedule:", error)
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return

    try {
      const response = await fetch(`/api/class-schedules/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete schedule")
      }

      setSchedules((prev) => prev.filter((s) => s.id !== id))

      toast({
        title: "Success",
        description: "Class schedule deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast({
        title: "Error",
        description: "Failed to delete schedule. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getAvailableSections = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    return course ? course.sections : []
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Schedule Management</h1>
          <p className="text-gray-600 mt-2">Manage class schedules, faculty assignments, and room allocations</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Class Schedule</DialogTitle>
              <DialogDescription>Enter the details for the new class schedule</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="course">Course *</Label>
                <Select onValueChange={(value) => setNewSchedule((prev) => ({ ...prev, courseId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="faculty">Faculty *</Label>
                <Select onValueChange={(value) => setNewSchedule((prev) => ({ ...prev, facultyId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculty.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.user.name} ({f.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="section">Section *</Label>
                <Select
                  onValueChange={(value) => setNewSchedule((prev) => ({ ...prev, section: value }))}
                  disabled={!newSchedule.courseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSections(newSchedule.courseId).map((section) => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="day">Day of Week *</Label>
                <Select onValueChange={(value) => setNewSchedule((prev) => ({ ...prev, dayOfWeek: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule((prev) => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule((prev) => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="room">Room *</Label>
                <Input
                  id="room"
                  value={newSchedule.room}
                  onChange={(e) => setNewSchedule((prev) => ({ ...prev, room: e.target.value }))}
                  placeholder="e.g., A101"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSchedule}>Add Schedule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {editingSchedule && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Class Schedule</DialogTitle>
                <DialogDescription>Update the details for this class schedule</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="course">Course *</Label>
                  <Select
                    value={editingSchedule.courseId}
                    onValueChange={(value) => setEditingSchedule({ ...editingSchedule, courseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="faculty">Faculty *</Label>
                  <Select
                    value={editingSchedule.facultyId}
                    onValueChange={(value) => setEditingSchedule({ ...editingSchedule, facultyId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculty.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.user.name} ({f.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="section">Section *</Label>
                  <Select
                    value={editingSchedule.section}
                    onValueChange={(value) => setEditingSchedule({ ...editingSchedule, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSections(editingSchedule.courseId).map((section) => (
                        <SelectItem key={section} value={section}>
                          Section {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="day">Day of Week *</Label>
                  <Select
                    value={editingSchedule.dayOfWeek}
                    onValueChange={(value) => setEditingSchedule({ ...editingSchedule, dayOfWeek: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={editingSchedule.startTime}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={editingSchedule.endTime}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="room">Room *</Label>
                  <Input
                    id="room"
                    value={editingSchedule.room}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, room: e.target.value })}
                    placeholder="e.g., A101"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditSchedule}>Update Schedule</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <Input
          placeholder="Search schedules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />

        <Tabs value={currentDay} onValueChange={setCurrentDay} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 md:grid-cols-8">
            <TabsTrigger value="all">All</TabsTrigger>
            {daysOfWeek.map((day) => (
              <TabsTrigger key={day} value={day}>
                {day.substring(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredSchedules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40">
              <Calendar className="h-10 w-10 text-gray-400 mb-4" />
              <p className="text-gray-500">No schedules found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or add a new schedule</p>
            </CardContent>
          </Card>
        ) : (
          filteredSchedules.map((schedule) => (
            <Card key={schedule.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>
                        {schedule.course.code} - {schedule.course.name}
                      </span>
                      <Badge variant="outline">Section {schedule.section}</Badge>
                    </CardTitle>
                    <CardDescription>{schedule.faculty.user.name}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingSchedule(schedule)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDeleteSchedule(schedule.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{schedule.dayOfWeek}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{schedule.room}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
