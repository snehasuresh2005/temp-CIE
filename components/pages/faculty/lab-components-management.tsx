"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle, Clock, AlertTriangle, Package, X, Check, RefreshCw, Wrench } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { LabComponentsRequest } from "./lab-components-request"

interface LabComponent {
  id: string
  component_name: string
  component_description: string
  image_url: string | null
  component_quantity: number
  available_quantity: number
  component_category: string
  requests: ComponentRequest[]
}

interface Project {
  id: string;
  name: string;
}

interface ComponentRequest {
  id: string
  student_id: string
  component_id: string
  quantity: number
  request_date: string
  required_date: string
  collection_date: string | null
  return_date: string | null
  status: string
  notes: string | null
  faculty_notes: string | null
  component?: LabComponent
  project: Project
  student?: {
    user: {
      name: string
      email: string
    }
  }
  requesting_faculty?: {
    user: {
      name: string
      email: string
    }
  }
}

export function LabComponentsManagement() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-gray-600 text-center">
        All lab request management is now handled through the main dashboard tabs (Awaiting Collection, Active Loans, History, Analytics).<br/>
        Please use the dashboard tabs above to manage lab requests.
      </div>
    </div>
  );
}
