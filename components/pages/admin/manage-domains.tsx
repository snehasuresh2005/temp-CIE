"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { UserPlus, Users, RefreshCw, Trash2, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

interface Faculty {
  id: string
  user: {
    name: string
    email: string
  }
  department: string
}

interface CoordinatorAssignment {
  id: string
  domain_id: string
  domain_name: string
  faculty: {
    id: string
    user: {
      name: string
      email: string
    }
    department: string
  }
  assigned_at: string
}

export function ManageDomains() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [assignments, setAssignments] = useState<CoordinatorAssignment[]>([])
  const [domains, setDomains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false)
  const [isEditDomainDialogOpen, setIsEditDomainDialogOpen] = useState(false)
  const [domainToEdit, setDomainToEdit] = useState<any | null>(null)
  const [domainToDelete, setDomainToDelete] = useState<any | null>(null)
  const [newDomain, setNewDomain] = useState({ name: '', description: '' })
  const [editDomain, setEditDomain] = useState({ id: '', name: '', description: '' })
  const [newAssignment, setNewAssignment] = useState({ domain_id: '', faculty_id: '' })
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch all faculty
      const facultyResponse = await fetch("/api/faculty")
      const facultyData = await facultyResponse.json()
      setFaculty(facultyData.faculty || [])
      // Fetch current coordinator assignments
      const assignmentsResponse = await fetch("/api/coordinators/assignments", {
        headers: { "x-user-id": user?.id || "" }
      })
      const assignmentsData = await assignmentsResponse.json()
      setAssignments(assignmentsData.assignments || [])
      // Fetch domains
      const domainsResponse = await fetch("/api/domains", {
        headers: { "x-user-id": user?.id || "" }
      })
      const domainsData = await domainsResponse.json()
      setDomains(domainsData.domains || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Domain CRUD handlers
  const handleAddDomain = async () => {
    if (!newDomain.name) {
      toast({ title: "Error", description: "Domain name is required", variant: "destructive" })
      return
    }
    try {
      const response = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
        body: JSON.stringify(newDomain)
      })
      if (response.ok) {
        await fetchData()
        setNewDomain({ name: '', description: '' })
        setIsDomainDialogOpen(false)
        toast({ title: "Success", description: "Domain added" })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to add domain", variant: "destructive" })
    }
  }

  const handleEditDomain = (domain: any) => {
    setEditDomain({ id: domain.id, name: domain.name, description: domain.description || '' })
    setDomainToEdit(domain)
    setIsEditDomainDialogOpen(true)
  }

  const handleUpdateDomain = async () => {
    if (!editDomain.name) {
      toast({ title: "Error", description: "Domain name is required", variant: "destructive" })
      return
    }
    try {
      const response = await fetch(`/api/domains/${editDomain.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
        body: JSON.stringify({ name: editDomain.name, description: editDomain.description })
      })
      if (response.ok) {
        await fetchData()
        setIsEditDomainDialogOpen(false)
        setDomainToEdit(null)
        toast({ title: "Success", description: "Domain updated" })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update domain", variant: "destructive" })
    }
  }

  const handleDeleteDomain = async (domain: any) => {
    if (!window.confirm(`Are you sure you want to delete the domain '${domain.name}'? This will remove all coordinator assignments for this domain.`)) return
    try {
      const response = await fetch(`/api/domains/${domain.id}`, {
        method: "DELETE",
        headers: { "x-user-id": user?.id || "" }
      })
      if (response.ok) {
        await fetchData()
        toast({ title: "Success", description: "Domain deleted" })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to delete domain", variant: "destructive" })
    }
  }

  // Coordinator assignment logic (updated to use dynamic domains)
  const handleAssignCoordinator = async () => {
    if (!newAssignment.domain_id || !newAssignment.faculty_id) {
      toast({ title: "Error", description: "Please select both domain and faculty member", variant: "destructive" })
      return
    }
    try {
      const response = await fetch("/api/coordinators/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
        body: JSON.stringify({ domain_id: newAssignment.domain_id, faculty_id: newAssignment.faculty_id })
      })
      if (response.ok) {
        await fetchData()
        setNewAssignment({ domain_id: '', faculty_id: '' })
        setIsAssignDialogOpen(false)
        toast({ title: "Success", description: "Coordinator assigned successfully" })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to assign coordinator", variant: "destructive" })
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/coordinators/assignments/${assignmentId}`, {
        method: "DELETE",
        headers: { "x-user-id": user?.id || "" }
      })

      if (response.ok) {
        await fetchData() // Refresh data
        toast({
          title: "Success",
          description: "Coordinator assignment removed successfully"
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove assignment",
        variant: "destructive",
      })
    }
  }

  // Update getAssignmentsForDomain to use domain_id
  const getAssignmentsForDomain = (domainId: string) => {
    return assignments.filter(assignment => assignment.domain_id === domainId)
  }

  const getAvailableFacultyForDomain = (selectedDomain: string) => {
    if (!selectedDomain) return faculty
    
    return faculty.filter(f => {
      const existingAssignment = assignments.find(a => a.faculty.id === f.id && a.domain_id === selectedDomain)
      return !existingAssignment
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading coordinator assignments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="admin-page-title">CIE Coordinator Management</h1>
          <p className="text-sm text-gray-600 mt-1">Assign faculty members as coordinators for different domains</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? "Editing..." : "Edit Mode"}
          </Button>
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Assign Coordinator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign CIE Coordinator</DialogTitle>
                <DialogDescription>
                  Assign a faculty member as coordinator for a specific domain.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="select-domain" className="text-sm">Domain *</Label>
                  <Select onValueChange={(value) => setNewAssignment(prev => ({ ...prev, domain_id: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          <div>
                            <div className="font-medium">{domain.name}</div>
                            <div className="text-xs text-gray-500">{domain.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="select-faculty" className="text-sm">Faculty Member *</Label>
                  <Select onValueChange={(value) => setNewAssignment(prev => ({ ...prev, faculty_id: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select faculty member" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableFacultyForDomain(newAssignment.domain_id).map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          <div>
                            <div className="font-medium">{f.user.name}</div>
                            <div className="text-xs text-gray-500">{f.department} • {f.user.email}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAssignCoordinator}>Assign Coordinator</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDomainDialogOpen} onOpenChange={setIsDomainDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Building className="h-4 w-4 mr-1" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Domain</DialogTitle>
                <DialogDescription>
                  Add a new domain to manage coordinator assignments.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="domain-name" className="text-sm">Domain Name *</Label>
                  <input
                    type="text"
                    id="domain-name"
                    value={newDomain.name}
                    onChange={(e) => setNewDomain(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <Label htmlFor="domain-description" className="text-sm">Description (Optional)</Label>
                  <textarea
                    id="domain-description"
                    value={newDomain.description}
                    onChange={(e) => setNewDomain(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setIsDomainDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddDomain}>Add Domain</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditDomainDialogOpen} onOpenChange={setIsEditDomainDialogOpen}>
            <DialogTrigger asChild>
 
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Domain</DialogTitle>
                <DialogDescription>
                  Edit the details of the selected domain.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-domain-name" className="text-sm">Domain Name *</Label>
                  <input
                    type="text"
                    id="edit-domain-name"
                    value={editDomain.name}
                    onChange={(e) => setEditDomain(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-domain-description" className="text-sm">Description (Optional)</Label>
                  <textarea
                    id="edit-domain-description"
                    value={editDomain.description}
                    onChange={(e) => setEditDomain(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditDomainDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpdateDomain}>Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={!!domainToDelete} onOpenChange={setDomainToDelete}>
            <DialogTrigger asChild>

            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the domain '{domainToDelete?.name}'? This will remove all coordinator assignments for this domain.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setDomainToDelete(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteDomain(domainToDelete)}>
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Domain Assignments */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {domains.map((domain) => {
          const domainAssignments = getAssignmentsForDomain(domain.id)
          const isAssigned = domainAssignments.length > 0;
          return (
            <div key={domain.id} className={
              `rounded-xl p-6 shadow-sm border ` +
              (isAssigned ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100')
            }>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-base">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    {domain.name}
                  </CardTitle>
                  <Badge variant={isAssigned ? "default" : "secondary"} className="text-xs">
                    {isAssigned ? "Assigned" : "No Coordinator"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{domain.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Accordion type="single" collapsible>
                  <AccordionItem value="coordinators">
                    <AccordionTrigger>View Coordinators</AccordionTrigger>
                    <AccordionContent>
                      {domainAssignments.length === 0 ? (
                        <div className="text-center py-3">
                          <Users className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                          <p className="text-xs text-gray-500">No coordinator assigned</p>
                          <p className="text-xs text-gray-400">Requests will be unhandled</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {domainAssignments.map((assignment) => (
                            <div key={assignment.id} className="p-2 bg-white border rounded-md flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-xs">{assignment.faculty.user.name}</h4>
                                <p className="text-xs text-gray-500">{assignment.faculty.department}</p>
                                <p className="text-xs text-gray-400">{assignment.faculty.user.email}</p>
                                <div className="mt-1 text-xs text-gray-500">
                                  Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              {editMode && (
                <div className="flex justify-end gap-2 p-3 border-t bg-gray-100">
                  <button className="btn-edit" onClick={() => { setEditDomain({ id: domain.id, name: domain.name, description: domain.description || '' }); setIsEditDomainDialogOpen(true); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6v-2a2 2 0 012-2h2" /></svg>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => { setDomainToDelete(domain); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Faculty List */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="admin-page-title-2">All Faculty Members</CardTitle>
          <CardDescription className="text-xs">
            List of all faculty members and their current coordinator status
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {faculty.map((f) => {
              const facultyAssignments = assignments.filter(a => a.faculty.id === f.id)
              const isCoordinator = facultyAssignments.length > 0
              
              return (
                <div key={f.id} className="admin-card border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{f.user.name}</h4>
                      <p className="text-xs text-gray-600">{f.department}</p>
                      <p className="text-xs text-gray-500">{f.user.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {facultyAssignments.map((assignment) => (
                          <Badge key={assignment.id} variant="outline" className="text-xs px-1 py-0">
                            {domains.find(d => d.id === assignment.domain_id)?.name || assignment.domain_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={isCoordinator ? "default" : "secondary"} className="text-xs">
                        {isCoordinator ? "Coordinator" : "Available"}
                      </Badge>
                      {facultyAssignments.length > 1 && (
                        <p className="text-xs text-gray-500 mt-1">{facultyAssignments.length} domains</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}