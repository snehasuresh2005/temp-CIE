"use client"

import { useState } from "react"
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
import { Plus, MapPin, Users, Monitor, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Location {
  id: string
  name: string
  building: string
  floor: string
  capacity: number
  type: "classroom" | "lab" | "auditorium" | "seminar"
  equipment: string[]
  status: "available" | "occupied" | "maintenance"
}

const initialLocations: Location[] = [
  {
    id: "1",
    name: "A101",
    building: "Academic Block A",
    floor: "1st Floor",
    capacity: 30,
    type: "classroom",
    equipment: ["Projector", "Whiteboard", "AC"],
    status: "available",
  },
  {
    id: "2",
    name: "B205",
    building: "Academic Block B",
    floor: "2nd Floor",
    capacity: 25,
    type: "lab",
    equipment: ["Computers", "Projector", "Lab Equipment"],
    status: "occupied",
  },
  {
    id: "3",
    name: "C301",
    building: "Academic Block C",
    floor: "3rd Floor",
    capacity: 40,
    type: "classroom",
    equipment: ["Smart Board", "Sound System", "AC"],
    status: "available",
  },
]

export function ManageLocations() {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [newLocation, setNewLocation] = useState({
    name: "",
    building: "",
    floor: "",
    capacity: 30,
    type: "classroom" as const,
    equipment: [] as string[],
    status: "available" as const,
  })

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddLocation = () => {
    if (!newLocation.name || !newLocation.building) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const location: Location = {
      id: Date.now().toString(),
      ...newLocation,
    }

    setLocations((prev) => [...prev, location])
    setNewLocation({
      name: "",
      building: "",
      floor: "",
      capacity: 30,
      type: "classroom",
      equipment: [],
      status: "available",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Success",
      description: "Location added successfully",
    })
  }

  const handleStatusChange = (locationId: string, newStatus: Location["status"]) => {
    setLocations((prev) =>
      prev.map((location) => (location.id === locationId ? { ...location, status: newStatus } : location)),
    )

    toast({
      title: "Success",
      description: "Location status updated",
    })
  }

  const handleDeleteLocation = (locationId: string) => {
    setLocations((prev) => prev.filter((location) => location.id !== locationId))
    toast({
      title: "Success",
      description: "Location deleted successfully",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lab":
        return <Monitor className="h-4 w-4" />
      case "auditorium":
        return <Users className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
          <p className="text-gray-600 mt-2">Manage classrooms, labs, and other facilities</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>Enter the details for the new location</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Room Name *</Label>
                <Input
                  id="name"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="A101"
                />
              </div>
              <div>
                <Label htmlFor="building">Building *</Label>
                <Input
                  id="building"
                  value={newLocation.building}
                  onChange={(e) => setNewLocation((prev) => ({ ...prev, building: e.target.value }))}
                  placeholder="Academic Block A"
                />
              </div>
              <div>
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  value={newLocation.floor}
                  onChange={(e) => setNewLocation((prev) => ({ ...prev, floor: e.target.value }))}
                  placeholder="1st Floor"
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newLocation.capacity}
                  onChange={(e) => setNewLocation((prev) => ({ ...prev, capacity: Number.parseInt(e.target.value) }))}
                  min="1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLocation}>Add Location</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocations.map((location) => (
          <Card key={location.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    {getTypeIcon(location.type)}
                    <span>{location.name}</span>
                  </CardTitle>
                  <CardDescription>{location.building}</CardDescription>
                </div>
                <Badge className={getStatusColor(location.status)}>{location.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Floor:</span>
                    <p className="font-medium">{location.floor}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Capacity:</span>
                    <p className="font-medium">{location.capacity} people</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium capitalize">{location.type}</p>
                  </div>
                </div>

                {location.equipment.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Equipment</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {location.equipment.map((item, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant={location.status === "available" ? "default" : "outline"}
                      onClick={() => handleStatusChange(location.id, "available")}
                    >
                      Available
                    </Button>
                    <Button
                      size="sm"
                      variant={location.status === "occupied" ? "default" : "outline"}
                      onClick={() => handleStatusChange(location.id, "occupied")}
                    >
                      Occupied
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteLocation(location.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
