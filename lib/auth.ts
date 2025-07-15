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
    let profileData = null
    let role = 'USER'

    if (user.admin) {
      role = 'ADMIN'
      profileData = user.admin
    } else if (user.faculty) {
      role = 'FACULTY'
      profileData = user.faculty
    } else if (user.student) {
      role = 'STUDENT'
      profileData = user.student
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      phone: user.phone || undefined,
      joinDate: user.join_date,
      profileData,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        admin: true,
        faculty: {
          include: {
            platform_manager_assignments: true,
            developer_assignments: true,
          }
        },
        student: true,
      },
    })

    if (!user) {
      return null
    }

    // Get role-specific data
    let profileData = null
    let role = 'USER'

    if (user.admin) {
      role = 'ADMIN'
      profileData = user.admin
    } else if (user.faculty) {
      role = 'FACULTY'
      profileData = user.faculty
      // Add platform manager and developer flags
      profileData.isPlatformManager = (user.faculty.platform_manager_assignments?.length ?? 0) > 0;
      profileData.isDeveloper = (user.faculty.developer_assignments?.length ?? 0) > 0;
    } else if (user.student) {
      role = 'STUDENT'
      profileData = user.student
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      phone: user.phone || undefined,
      joinDate: user.join_date,
      profileData,
    }
  } catch (error) {
    console.error('Get user by ID error:', error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
