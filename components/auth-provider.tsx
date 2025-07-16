"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "ADMIN" | "FACULTY" | "STUDENT"

export interface User {
  id: string
  email: string
  name: string
  image?: string
  role: UserRole
  phone?: string
  join_date: Date
  student_id?: string
  studentClass?: string
  section?: string
  profileData?: any
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("cie-user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        // Optionally refresh user data from server
        refreshUserData(userData.id)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("cie-user")
      }
    }
    setIsLoading(false)
  }, [])

  const refreshUserData = async (userId: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          "x-user-id": userId,
        },
      })

      if (response.ok) {
        const { user: userData } = await response.json()
        setUser(userData)
        localStorage.setItem("cie-user", JSON.stringify(userData))
        localStorage.setItem("userId", userData.id)
      } else if (response.status === 404 || response.status === 401) {
        // If user not found or session invalid, clear the session
        console.warn("User session invalid, logging out")
        logout()
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
      // If there's a network error or other issue, also log out to be safe
      logout()
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login for:", email)
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Login response status:", response.status)

      if (response.ok) {
        const { user: userData } = await response.json()
        console.log("Login successful, user data:", userData)
        
        // Force state update by setting user to null first, then to userData
        setUser(null)
        
        // Use setTimeout to ensure state update happens
        setTimeout(() => {
          setUser(userData)
          localStorage.setItem("cie-user", JSON.stringify(userData))
          console.log("User state updated after login")
        }, 0)
        
        localStorage.setItem("userId", userData.id)
        return true
      } else {
        const { error } = await response.json()
        console.error("Login error:", error)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("cie-user")
    localStorage.removeItem("userId")
  }

  const refreshUser = async () => {
    if (user) {
      await refreshUserData(user.id)
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
