import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  phone?: string
  joinDate: Date
  profileData?: any
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        admin: true,
        faculty: true,
        student: true,
      },
    })

    if (!user) {
      return null
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return null
    }

    // Get role-specific data
    let profileData = {}
    switch (user.role) {
      case "ADMIN":
        profileData = user.admin
        break
      case "FACULTY":
        profileData = user.faculty
        break
      case "STUDENT":
        profileData = user.student
        break
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase(),
      phone: user.phone,
      joinDate: user.joinDate,
      profileData,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        admin: true,
        faculty: true,
        student: true,
      },
    })

    if (!user) {
      return null
    }

    let profileData = {}
    switch (user.role) {
      case "ADMIN":
        profileData = user.admin
        break
      case "FACULTY":
        profileData = user.faculty
        break
      case "STUDENT":
        profileData = user.student
        break
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase(),
      phone: user.phone,
      joinDate: user.joinDate,
      profileData,
    }
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}
