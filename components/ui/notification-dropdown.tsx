"use client"

import { useState, useEffect } from "react"
import { Bell, Clock, BookOpen, ClipboardCheck, CheckCircle, FolderOpen, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useNotifications } from "@/components/notification-provider"

interface NotificationDropdownProps {
  activities: Array<{
    type: string
    message: string
    time: string | Date
    user: string
    category: string
    status?: string
  }>
  loading?: boolean
  onPageChange?: (page: string) => void
}

export function NotificationDropdown({ activities, loading = false, onPageChange }: NotificationDropdownProps) {
  const { user } = useAuth()
  const { unreadActivities, unreadCount, markAsRead, markAllAsRead } = useNotifications()





  const getActivityIcon = (activity: any) => {
    const iconColors = ['text-orange-600', 'text-green-600', 'text-red-600', 'text-blue-600', 'text-purple-600', 'text-indigo-600']
    const iconColor = iconColors[Math.floor(Math.random() * iconColors.length)]
    
    switch (activity.category) {
      case 'laboratory':
      case 'component_request':
        return <Clock className={`h-4 w-4 ${iconColor}`} />
      case 'locations':
      case 'location_booking':
        return <BookOpen className={`h-4 w-4 ${iconColor}`} />
      case 'academics':
      case 'enrollment':
        return <ClipboardCheck className={`h-4 w-4 ${iconColor}`} />
      case 'project':
      case 'project_request':
      case 'project_submission':
        return <FolderOpen className={`h-4 w-4 ${iconColor}`} />
      case 'library':
      case 'library_request':
        return <BookOpen className={`h-4 w-4 ${iconColor}`} />
      default:
        return <CheckCircle className={`h-4 w-4 ${iconColor}`} />
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    const statusConfig = {
      'APPROVED': { bg: 'bg-green-100', text: 'text-green-800' },
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'COLLECTED': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'ENROLLED': { bg: 'bg-green-100', text: 'text-green-800' },
      'ADDED': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'BOOKED': { bg: 'bg-green-100', text: 'text-green-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { bg: 'bg-gray-100', text: 'text-gray-800' }
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.text}`}>
        {status}
      </span>
    )
  }

  const formatTime = (time: string | Date) => {
    return new Date(time).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-6 px-2 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <DropdownMenuItem key={index} className="flex items-start space-x-3 p-3 cursor-default">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </DropdownMenuItem>
          ))
        ) : unreadActivities.length > 0 ? (
          unreadActivities.slice(0, 8).map((activity, index) => {
            return (
              <DropdownMenuItem 
                key={index} 
                className="flex items-start space-x-3 p-3 cursor-pointer transition-colors bg-blue-50"
                onClick={() => markAsRead(activity)}
              >
                {getActivityIcon(activity)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium truncate">
                    {activity.message}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-500">{formatTime(activity.time)}</p>
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              </DropdownMenuItem>
            )
          })
        ) : (
          <DropdownMenuItem className="flex items-center justify-center p-6 cursor-default">
            <div className="text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-center text-sm text-blue-600 cursor-pointer font-medium"
          onClick={() => {
            onPageChange?.('notifications')
          }}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 