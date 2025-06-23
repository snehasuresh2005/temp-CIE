"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardCheck, Calendar, TrendingUp, CheckCircle, X, Clock } from "lucide-react"
import { attendanceRecords } from "@/lib/data"
import { useAuth } from "@/components/auth-provider"

export function ViewAttendance() {
  const { user } = useAuth()

  // Filter attendance records for current student
  const myAttendance = attendanceRecords
    .filter((record) => record.course_code === user?.studentClass && record.section === user?.section)
    .map((record) => ({
      ...record,
      myStatus: record.students.find((s) => s.student_id === user?.id)?.status || "absent",
    }))

  const calculateAttendancePercentage = () => {
    if (myAttendance.length === 0) return 0
    const presentCount = myAttendance.filter((record) => record.myStatus === "present").length
    return (presentCount / myAttendance.length) * 100
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4" />
      case "absent":
        return <X className="h-4 w-4" />
      case "late":
        return <Clock className="h-4 w-4" />
      default:
        return <ClipboardCheck className="h-4 w-4" />
    }
  }

  const attendancePercentage = calculateAttendancePercentage()
  const totalClasses = myAttendance.length
  const presentClasses = myAttendance.filter((record) => record.myStatus === "present").length
  const lateClasses = myAttendance.filter((record) => record.myStatus === "late").length
  const absentClasses = myAttendance.filter((record) => record.myStatus === "absent").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-600 mt-2">Track your attendance record and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{attendancePercentage.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Overall Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{presentClasses}</p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{lateClasses}</p>
                <p className="text-sm text-gray-600">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{absentClasses}</p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClipboardCheck className="h-5 w-5" />
            <span>Attendance Overview</span>
          </CardTitle>
          <CardDescription>
            Your attendance record for {user?.studentClass} - Section {user?.section}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Attendance Progress</span>
              <span className="text-sm text-gray-600">
                {presentClasses} / {totalClasses} classes attended
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  attendancePercentage >= 75
                    ? "bg-green-500"
                    : attendancePercentage >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <div className="text-center">
              <Badge variant={attendancePercentage >= 75 ? "default" : "destructive"} className="text-sm">
                {attendancePercentage >= 75
                  ? "Good Attendance"
                  : attendancePercentage >= 50
                    ? "Average Attendance"
                    : "Poor Attendance"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Attendance History</span>
          </CardTitle>
          <CardDescription>Detailed record of your class attendance</CardDescription>
        </CardHeader>
        <CardContent>
          {myAttendance.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
              <p className="text-gray-600">Your attendance will appear here once classes begin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myAttendance
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">
                        {record.course_code} - Section {record.section}
                      </h4>
                      <p className="text-sm text-gray-600">{record.date}</p>
                    </div>
                    <Badge className={getStatusColor(record.myStatus)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(record.myStatus)}
                        <span className="capitalize">{record.myStatus}</span>
                      </div>
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
