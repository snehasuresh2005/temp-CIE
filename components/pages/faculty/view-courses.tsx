"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Plus, Trash2, BookOpen, Calendar, Users, RefreshCw, List, X, Clock, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { ManageCourses } from "@/components/pages/admin/manage-courses"

interface CourseUnit {
  id?: string
  unit_number: number
  unit_name: string
  unit_description: string
  assignment_count: number
  hours_per_unit: number
}

interface Course {
  id: string
  course_code: string
  course_name: string
  course_description: string
  course_start_date: string
  course_end_date: string
  course_enrollments: string[]
  created_by: string
  created_date: string
  modified_by?: string
  modified_date: string
  course_units: CourseUnit[]
  creator?: {
    id: string
    name: string
    email: string
  }
}

export function FacultyViewCourses() {
  // Show all courses for faculty, not just their own
  return <ManageCourses />;
}
