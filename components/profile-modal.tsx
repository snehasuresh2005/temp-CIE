"use client"

import { useAuth } from "@/components/auth-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { User, Mail, BadgeIcon as IdCard, GraduationCap, Users, BookOpen } from "lucide-react"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user } = useAuth()

  if (!user) return null

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "faculty":
        return "bg-blue-100 text-blue-800"
      case "student":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return <User className="h-4 w-4" />
      case "faculty":
        return <GraduationCap className="h-4 w-4" />
      case "student":
        return <BookOpen className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile Information</DialogTitle>
          <DialogDescription>View your account details and information.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <Badge className={getRoleColor(user.role)}>
                {getRoleIcon(user.role)}
                <span className="ml-1 capitalize">{user.role}</span>
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <IdCard className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-gray-600">{user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role-specific Information */}
          {user.role === "faculty" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Faculty Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Assigned Classes</p>
                    <p className="text-sm text-gray-600">Computer Science, Software Engineering</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === "student" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Class</p>
                    <p className="text-sm text-gray-600">Computer Science Engineering</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Section</p>
                    <p className="text-sm text-gray-600">Section A</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Administrator Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">You have full administrative access to the CIE Portal system.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
