"use client"

import { useState, useEffect } from "react"
import { useNotifications } from "@/components/notification-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Bell, 
  Clock, 
  BookOpen, 
  ClipboardCheck, 
  CheckCircle, 
  FolderOpen, 
  AlertTriangle, 
  Search,
  Filter,
  RefreshCw,
  Check,
  X,
  History,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

const ITEMS_PER_PAGE = 10

export function NotificationsPage() {
  const { activities, unreadActivities, loading, markAsRead, markAllAsRead, refreshNotifications } = useNotifications()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [showHistory, setShowHistory] = useState(false)

  // Filter activities based on search and filters
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter
    const matchesCategory = categoryFilter === "all" || activity.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  // Separate unread and read activities
  const filteredUnreadActivities = unreadActivities.filter(activity => {
    const matchesSearch = activity.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter
    const matchesCategory = categoryFilter === "all" || activity.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })
  
  const readActivitiesList = activities.filter(activity => {
    const isRead = !unreadActivities.some(unread => 
      unread.type === activity.type && unread.time === activity.time
    )
    
    if (!isRead) return false
    
    const matchesSearch = activity.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter
    const matchesCategory = categoryFilter === "all" || activity.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  // Get current activities based on history mode
  const currentActivities = showHistory ? readActivitiesList : filteredUnreadActivities

  // Pagination
  const totalPages = Math.ceil(currentActivities.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedActivities = currentActivities.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, categoryFilter, showHistory])

  const handleMarkAsRead = (activity: any) => {
    markAsRead(activity)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const getActivityIcon = (activity: any) => {
    const iconColors = ['text-orange-600', 'text-green-600', 'text-red-600', 'text-blue-600', 'text-purple-600', 'text-indigo-600']
    const iconColor = iconColors[Math.floor(Math.random() * iconColors.length)]
    
    switch (activity.category) {
      case 'laboratory':
      case 'component_request':
        return <Clock className={`h-5 w-5 ${iconColor}`} />
      case 'locations':
      case 'location_booking':
        return <BookOpen className={`h-5 w-5 ${iconColor}`} />
      case 'academics':
      case 'enrollment':
        return <ClipboardCheck className={`h-5 w-5 ${iconColor}`} />
      case 'project':
      case 'project_request':
      case 'project_submission':
        return <FolderOpen className={`h-5 w-5 ${iconColor}`} />
      case 'library':
      case 'library_request':
        return <BookOpen className={`h-5 w-5 ${iconColor}`} />
      default:
        return <CheckCircle className={`h-5 w-5 ${iconColor}`} />
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    const statusConfig = {
      'APPROVED': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      'COLLECTED': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      'ENROLLED': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      'ADDED': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      'BOOKED': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
    
    return (
      <Badge variant="outline" className={`${config.bg} ${config.text} ${config.border}`}>
        {status}
      </Badge>
    )
  }

  const formatTime = (time: string | Date) => {
    const date = new Date(time)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'component_request': 'Lab Components',
      'library_request': 'Library',
      'project_request': 'Projects',
      'enrollment': 'Enrollment',
      'location_booking': 'Location Booking',
      'system': 'System'
    }
    return labels[category] || category.replace('_', ' ').toUpperCase()
  }

  const unreadCount = filteredUnreadActivities.length
  const readCount = readActivitiesList.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {showHistory ? 'Notification History' : 'Notifications'}
        </h1>
        <p className="text-gray-600 mt-1">
          {showHistory 
            ? `${readCount} read notifications` 
            : unreadCount > 0 
              ? `${unreadCount} unread notifications` 
              : 'All caught up!'
          }
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Filter className="h-5 w-5 text-gray-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="COLLECTED">Collected</SelectItem>
            <SelectItem value="ENROLLED">Enrolled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="component_request">Lab Components</SelectItem>
            <SelectItem value="library_request">Library</SelectItem>
            <SelectItem value="project_request">Projects</SelectItem>
            <SelectItem value="enrollment">Enrollment</SelectItem>
            <SelectItem value="location_booking">Location Booking</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setShowHistory(!showHistory)}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <History className="h-4 w-4 mr-2" />
            {showHistory ? 'Current' : 'History'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshNotifications}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {!showHistory && unreadCount > 0 && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleMarkAllAsRead}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="h-5 w-5 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : paginatedActivities.length > 0 ? (
          <>
            {paginatedActivities.map((activity, index) => {
              const isRead = showHistory
              
              return (
                <Card 
                  key={index} 
                  className={`transition-all duration-200 hover:shadow-md ${
                    isRead ? 'opacity-75' : 'border-l-4 border-l-blue-500'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {getActivityIcon(activity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-base ${isRead ? 'text-gray-600' : 'text-gray-900'} font-medium leading-relaxed`}>
                              {activity.message}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <p className="text-sm text-gray-500">{formatTime(activity.time)}</p>
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(activity.category)}
                              </Badge>
                              {getStatusBadge(activity.status)}
                            </div>
                          </div>
                                                      <div className="flex items-center space-x-2 ml-4">
                              {!showHistory && (
                                <>
                                  <Badge variant="default" className="bg-blue-500 text-white">
                                    New
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(activity)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, currentActivities.length)} of {currentActivities.length} notifications
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showHistory ? 'No read notifications' : 'No notifications found'}
              </h3>
              <p className="text-gray-500">
                {showHistory 
                  ? 'Read notifications will appear here once you mark some as read.'
                  : searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms.'
                    : 'You\'re all caught up! New notifications will appear here.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 