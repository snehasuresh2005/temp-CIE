"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"

interface Activity {
  type: string
  message: string
  time: string | Date
  user: string
  category: string
  status?: string
}

interface NotificationContextType {
  activities: Activity[]
  unreadActivities: Activity[]
  loading: boolean
  unreadCount: number
  markAsRead: (activity: Activity) => void
  markAllAsRead: () => void
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [readActivities, setReadActivities] = useState<Set<string>>(new Set())

  const fetchNotifications = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      let endpoint = ''
      
      // Determine the correct endpoint based on user role
      switch (user.role) {
        case 'ADMIN':
          endpoint = '/api/dashboard/admin'
          break
        case 'FACULTY':
          endpoint = '/api/dashboard/faculty'
          break
        case 'STUDENT':
          endpoint = '/api/dashboard/student'
          break
        default:
          return
      }

      const response = await fetch(endpoint, {
        headers: {
          'x-user-id': user.id
        }
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate unread activities and count
  const unreadActivities = activities.filter(activity => 
    !readActivities.has(`${activity.type}-${activity.time}`)
  )
  const unreadCount = unreadActivities.length



  const markAsRead = (activity: Activity) => {
    const activityKey = `${activity.type}-${activity.time}`
    setReadActivities(prev => new Set([...prev, activityKey]))
  }

  const markAllAsRead = () => {
    const allKeys = activities.map(activity => `${activity.type}-${activity.time}`)
    setReadActivities(new Set(allKeys))
  }

  const refreshNotifications = () => {
    fetchNotifications()
  }

  // Fetch notifications when user changes or component mounts
  useEffect(() => {
    fetchNotifications()
  }, [user?.id])

  // Don't clear read activities when activities change - keep them persistent
  // This ensures read state persists across re-renders

  const value: NotificationContextType = {
    activities,
    unreadActivities,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
} 