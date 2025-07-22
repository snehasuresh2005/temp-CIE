"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FolderOpen,
  Calendar,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  Trash2,
  Settings,
  User,
  Mail,
  Info,
  Brain,
  Clipboard,
  Edit,
  Trash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FacultyProjectRequests } from "./faculty-project-requests";

interface Project {
  id: string;
  name: string;
  description: string;
  course_id?: string;
  components_needed: string[];
  expected_completion_date: string;
  created_by: string;
  modified_by?: string;
  created_date: string;
  modified_date: string;
  accepted_by?: string;
  status: string;
  type: string;
  enrollment_status: string;
  enrollment_cap?: number;
  enrollment_start_date?: string;
  enrollment_end_date?: string;
  submissions?: ProjectSubmission[];
  project_requests?: ProjectRequest[];
}

interface ProjectSubmission {
  id: string;
  projectId: string;
  studentId: string;
  student: {
    user: {
      name: string;
    };
  };
  content: string;
  attachments: string[];
  marks: number | null;
  feedback: string | null;
  status: string;
  submissionDate: string;
}

interface ProjectRequest {
  id: string;
  project_id: string;
  student_id: string;
  faculty_id: string;
  request_date: string;
  status: string;
  student_notes?: string;
  faculty_notes?: string;
  accepted_date?: string;
  rejected_date?: string;
  resume_id?: string;
  resume_path?: string;
  student: {
    user: {
      name: string;
      email: string;
    };
  };
  faculty: {
    user: {
      name: string;
      email: string;
    };
  };
  project: {
    name: string;
    description: string;
    type?: string;  // Add the type field
    components_needed_details?: any[];
  };
}

interface Course {
  id: string;
  course_name: string;
  course_description: string;
  course_start_date: string;
  course_end_date: string;
  course_enrollments: string[];
  created_by: string;
  created_date: string;
  modified_by?: string;
  modified_date: string;
  course_code: string;
}

interface LabComponent {
  id: string;
  component_name: string;
  component_description: string;
}

export function ProjectManagement() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [labComponents, setLabComponents] = useState<LabComponent[]>([]);
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showFacultyRequests, setShowFacultyRequests] = useState(false);
  const [isLabComponentsCoordinator, setIsLabComponentsCoordinator] =
    useState(false);
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [enrollmentCap, setEnrollmentCap] = useState<number>(1);
  const [isApplicationsDialogOpen, setIsApplicationsDialogOpen] =
    useState(false);
  const [selectedProjectApplications, setSelectedProjectApplications] =
    useState<ProjectRequest[]>([]);
  const [isShortlistDialogOpen, setIsShortlistDialogOpen] = useState(false);
  const [shortlistResults, setShortlistResults] = useState<any>(null);
  const [savedShortlistResults, setSavedShortlistResults] = useState<Record<string, any>>({});  // Store results per project
  const [isShortlisting, setIsShortlisting] = useState(false);
  const [showAIRanking, setShowAIRanking] = useState(false);
  const [isAIResultsChoiceDialogOpen, setIsAIResultsChoiceDialogOpen] = useState(false); // New state for AI results choice
  const [selectedCandidateDetails, setSelectedCandidateDetails] =
    useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedApplicationDetails, setSelectedApplicationDetails] =
    useState<any>(null);
  const [isApplicationDetailsDialogOpen, setIsApplicationDetailsDialogOpen] =
    useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    components_needed: [] as string[],
    expected_completion_date: "",
  });

  useEffect(() => {
    fetchData();
    checkCoordinatorStatus();
  }, []);

  const checkCoordinatorStatus = async () => {
    try {
      const response = await fetch("/api/coordinators/check", {
        headers: {
          "x-user-id": user?.id || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Check if the user is coordinator for Lab Components domain
        const isLabCoordinator = data.assignedDomains?.some(
          (domain: any) => domain.name === "Lab Components"
        );
        setIsLabComponentsCoordinator(isLabCoordinator || false);
      }
    } catch (error) {
      console.error("Error checking coordinator status:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch courses (faculty's courses)
      const coursesResponse = await fetch("/api/courses", {
        headers: {
          "x-user-id": user?.id || "",
        },
      });
      const coursesData = await coursesResponse.json();
      setCourses(coursesData.courses || []);

      // Fetch lab components
      const componentsResponse = await fetch("/api/lab-components", {
        headers: {
          "x-user-id": user?.id || "",
        },
      });
      const componentsData = await componentsResponse.json();
      setLabComponents(componentsData.components || []);

      // Fetch projects
      const projectsResponse = await fetch("/api/projects", {
        headers: {
          "x-user-id": user?.id || "",
        },
      });
      const projectsData = await projectsResponse.json();
      setProjects(projectsData.projects || []);

      // Fetch project requests
      const requestsResponse = await fetch("/api/project-requests", {
        headers: {
          "x-user-id": user?.id || "",
        },
      });
      const requestsData = await requestsResponse.json();
      setProjectRequests(requestsData.projectRequests || []);

      // Fetch submissions
      const submissionsResponse = await fetch("/api/project-submissions", {
        headers: {
          "x-user-id": user?.id || "",
        },
      });
      const submissionsData = await submissionsResponse.json();
      setSubmissions(submissionsData.submissions || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    console.log("Form data:", newProject);
    console.log("User email:", user?.email);

    if (!newProject.name || !newProject.expected_completion_date) {
      console.log("Validation failed:", {
        name: !!newProject.name,
        expected_completion_date: !!newProject.expected_completion_date,
      });
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newProject,
          course_id: null,
          user_email: user?.email,
          type: "FACULTY_ASSIGNED",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects((prev) => [...prev, data.project]);
        setNewProject({
          name: "",
          description: "",
          components_needed: [],
          expected_completion_date: "",
        });
        setIsAddDialogOpen(false);

        toast({
          title: "Success",
          description:
            "Project created successfully and sent for coordinator approval",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add project");
      }
    } catch (error) {
      console.error("Error adding project:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add project",
        variant: "destructive",
      });
    }
  };

  const handleApproveRequest = async (
    requestId: string,
    status: "APPROVED" | "REJECTED",
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/project-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          status,
          faculty_notes: notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjectRequests((prev) =>
          prev.map((req) => (req.id === requestId ? data.projectRequest : req))
        );

        toast({
          title: "Success",
          description: `Project request ${status.toLowerCase()} successfully`,
        });
      } else {
        throw new Error("Failed to update request");
      }
    } catch (error) {
      console.error("Error updating request:", error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const handleGradeSubmission = async (
    submissionId: string,
    marks: number,
    feedback: string
  ) => {
    try {
      const response = await fetch("/api/project-submissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          submissionId,
          marks,
          feedback,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions((prev) =>
          prev.map((sub) => (sub.id === submissionId ? data.submission : sub))
        );

        toast({
          title: "Success",
          description: "Project graded successfully",
        });
      } else {
        throw new Error("Failed to grade submission");
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      toast({
        title: "Error",
        description: "Failed to grade submission",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "ONGOING":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "REJECTED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "GRADED":
        return "bg-green-100 text-green-800";
      case "LATE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const response = await fetch(`/api/projects?id=${projectToDelete.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id || "",
        },
      });

      if (response.ok) {
        setProjects((prev) =>
          prev.filter((project) => project.id !== projectToDelete.id)
        );
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleStartEnrollment = async () => {
    if (!selectedProject || enrollmentCap < 1) return;

    try {
      const response = await fetch(`/api/projects/enrolment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          action: "start",
          enrollment_cap: enrollmentCap,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects((prev) =>
          prev.map((project) =>
            project.id === selectedProject.id
              ? { ...project, ...data.project }
              : project
          )
        );
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start enrollment");
      }
    } catch (error) {
      console.error("Error starting enrollment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to start enrollment",
        variant: "destructive",
      });
    } finally {
      setIsEnrollmentDialogOpen(false);
      setSelectedProject(null);
      setEnrollmentCap(1);
    }
  };

  const handleCloseEnrollment = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/enrolment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          project_id: projectId,
          action: "close",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId ? { ...project, ...data.project } : project
          )
        );
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to close enrollment");
      }
    } catch (error) {
      console.error("Error closing enrollment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to close enrollment",
        variant: "destructive",
      });
    }
  };

  const handleReopenEnrollment = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/enrolment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          project_id: projectId,
          action: "reopen",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId ? { ...project, ...data.project } : project
          )
        );
        toast({
          title: "Success",
          description: "Enrollment reopened successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reopen enrollment");
      }
    } catch (error) {
      console.error("Error reopening enrollment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reopen enrollment",
        variant: "destructive",
      });
    }
  };

  const handleApplicationAction = async (
    applicationId: string,
    action: "APPROVED" | "REJECTED"
  ) => {
    try {
      // Check enrollment cap before approving
      if (action === "APPROVED" && selectedProject) {
        const currentApproved = selectedProjectApplications.filter(
          (app) => app.status === "APPROVED"
        ).length;
        const enrollmentCap = selectedProject.enrollment_cap || 1;

        if (currentApproved >= enrollmentCap) {
          toast({
            title: "Enrollment Cap Reached",
            description: `Cannot approve more students. Maximum allowed: ${enrollmentCap}. Currently approved: ${currentApproved}`,
            variant: "destructive",
          });
          return;
        }
      }

      const response = await fetch(`/api/project-requests/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          status: action,
          faculty_notes:
            action === "APPROVED"
              ? "Application approved by faculty"
              : "Application rejected by faculty",
        }),
      });

      if (response.ok) {
        // Update the applications list
        setSelectedProjectApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? {
                  ...app,
                  status: action,
                  faculty_notes:
                    action === "APPROVED"
                      ? "Application approved by faculty"
                      : "Application rejected by faculty",
                }
              : app
          )
        );

        // Refresh the projects data
        fetchData();

        toast({
          title: "Success",
          description: `Application ${action.toLowerCase()} successfully`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to ${action.toLowerCase()} application`
        );
      }
    } catch (error) {
      console.error(`Error ${action.toLowerCase()} application:`, error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${action.toLowerCase()} application`,
        variant: "destructive",
      });
    }
  };

  const handleShortlistCandidates = async (project: Project) => {
    if (!project.project_requests || project.project_requests.length === 0) {
      toast({
        title: "No Applications",
        description: "This project has no applications to shortlist",
        variant: "destructive",
      });
      return;
    }

    setSelectedProject(project);
    setIsShortlisting(true);

    // Show initial toast with loading indicator
    toast({
      title: "AI Analysis Started",
      description: "Analyzing resumes with AI... This may take 1-2 minutes",
    });

    try {
      const response = await fetch("/api/projects/shortlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          project_id: project.id,
          top_k: Math.min(5, project.project_requests.length),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Shortlist response received:", {
          success: data.success,
          candidateCount: data.shortlisted_candidates?.length,
          totalApplications: data.total_applications,
          projectName: data.project?.name,
        });

        // Ensure we have clean data without circular references
        const cleanData = {
          success: data.success,
          project: data.project,
          total_applications: data.total_applications,
          shortlisted_candidates:
            data.shortlisted_candidates?.map((candidate: any) => ({
              request_id: candidate.request_id,
              student_id: candidate.student_id,
              student_name: candidate.student_name,
              student_email: candidate.student_email,
              file_name: candidate.file_name,
              file_path: candidate.file_path,
              score: candidate.score,
              ai_analysis: {
                name: candidate.ai_analysis?.name,
                skills: candidate.ai_analysis?.skills || [],
                reasons: candidate.ai_analysis?.reasons || [],
                metadata: candidate.ai_analysis?.metadata || {},
              },
            })) || [],
        };

        setShortlistResults(cleanData);
        // Save results for this project
        setSavedShortlistResults(prev => ({
          ...prev,
          [project.id]: cleanData
        }));
        setShowAIRanking(true); // Show AI ranking in the applications dialog

        toast({
          title: "AI Analysis Complete!",
          description: `Found ${
            cleanData.shortlisted_candidates?.length || 0
          } top candidates with detailed analysis`,
        });
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData); // Debug log
        throw new Error(errorData.error || "Failed to shortlist candidates");
      }
    } catch (error) {
      console.error("Error shortlisting candidates:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to shortlist candidates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsShortlisting(false);
    }
  };

  // Helper function for AI shortlisting within applications dialog
  const handleAIShortlistInDialog = async () => {
    if (!selectedProject) return;
    
    // Check if we have saved results for this project
    const savedResults = savedShortlistResults[selectedProject.id];
    if (savedResults) {
      // Show dialog to choose between saved results or refresh
      setIsAIResultsChoiceDialogOpen(true);
      return;
    }
    
    // Run new AI analysis
    await handleShortlistCandidates(selectedProject);
  };

  // Handle using previous AI results
  const handleUsePreviousResults = () => {
    if (!selectedProject) return;
    const savedResults = savedShortlistResults[selectedProject.id];
    if (savedResults) {
      setShortlistResults(savedResults);
      setShowAIRanking(true);
    }
    setIsAIResultsChoiceDialogOpen(false);
  };

  // Handle refreshing AI analysis
  const handleRefreshAnalysis = async () => {
    setIsAIResultsChoiceDialogOpen(false);
    if (selectedProject) {
      await handleShortlistCandidates(selectedProject);
    }
  };

  // Function to show candidate details
  const showCandidateDetails = (candidate: any) => {
    setSelectedCandidateDetails(candidate);
    setIsDetailsDialogOpen(true);
  };

  // Function to show application details (notes)
  const showApplicationDetails = (application: any) => {
    setSelectedApplicationDetails(application);
    setIsApplicationDetailsDialogOpen(true);
  };

  // Function to edit project
  const handleEditProject = (project: any) => {
    setEditingProject({
      id: project.id,
      name: project.name,
      description: project.description,
      enrollment_cap: project.enrollment_cap || 1,
    });
    setIsEditProjectDialogOpen(true);
  };

  // Function to save edited project
  const handleSaveEditedProject = async () => {
    if (!editingProject?.name || !editingProject?.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          name: editingProject.name,
          description: editingProject.description,
          enrollment_cap: editingProject.enrollment_cap,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
        fetchData();
        setIsEditProjectDialogOpen(false);
        setEditingProject(null);
      } else {
        throw new Error("Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (showFacultyRequests) {
    return (
      <FacultyProjectRequests onBack={() => setShowFacultyRequests(false)} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="faculty-page-title">Project Management</h2>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFacultyRequests(true)}
          >
            Manage Faculty Project Requests
          </Button>
          <button
            className="btn-edit"
            onClick={() => fetchData()}
            style={{ background: '#fffff', color: '#00000' }}
          >
            Refresh
          </button>
          <button
            className="btn-edit"
            onClick={() => setEditMode((v) => !v)}
            style={editMode ? { background: '#002D62', color: '#fff' } : {}}
          >
            {editMode ? 'Editing' : 'Edit Mode'}
          </button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-edit flex items-center" style={{ background: '#002D62', color: '#fff' }}>
                <Plus className="h-4 w-4 mr-1" /> Create Project
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="components">Required Components</Label>
                  <Select
                    onValueChange={(value) => {
                      if (!newProject.components_needed.includes(value)) {
                        setNewProject({
                          ...newProject,
                          components_needed: [
                            ...newProject.components_needed,
                            value,
                          ],
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select components" />
                    </SelectTrigger>
                    <SelectContent>
                      {labComponents.map((component) => (
                        <SelectItem key={component.id} value={component.id}>
                          {component.component_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newProject.components_needed.map((componentId) => {
                      const component = labComponents.find(
                        (c) => c.id === componentId
                      );
                      return (
                        <Badge key={componentId} variant="secondary">
                          {component?.component_name}
                          <button
                            type="button"
                            className="ml-1 h-auto p-0 text-red-500 hover:text-red-700"
                            onClick={() =>
                              setNewProject({
                                ...newProject,
                                components_needed:
                                  newProject.components_needed.filter(
                                    (id) => id !== componentId
                                  ),
                              })
                            }
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Expected Completion Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newProject.expected_completion_date}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        expected_completion_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  className="btn-edit"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn-edit" onClick={handleAddProject}>Create Project</button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="requests">Student Projects</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const course = courses.find((c) => c.id === project.course_id);

              return (
                <Card
                  key={project.id}
                  className="faculty-card"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                          <FolderOpen className="h-6 w-6 mr-3 text-blue-500" />
                          {project.name}
                        </CardTitle>
                        {course && (
                          <CardDescription className="mt-2 text-sm text-gray-600">
                            {course.course_name}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow flex flex-col">
                    <div className="mb-4">
                      <Badge className={`${getStatusColor(project.status)}`}>
                        {project.status}
                      </Badge>
                      {project.status === "PENDING" && (
                        <div className="mt-2 flex items-center text-sm text-yellow-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Waiting for coordinator approval</span>
                        </div>
                      )}
                      {project.status === "APPROVED" &&
                        project.enrollment_status === "NOT_STARTED" && (
                          <div className="mt-2 flex items-center text-sm text-green-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Approved - Ready to start enrollment</span>
                          </div>
                        )}
                    </div>

                    <div className="flex-grow">
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700">
                            Description
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {project.description}
                          </p>
                        </div>

                        {project.components_needed &&
                          project.components_needed.length > 0 && (
                            <div>
                              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Required Components
                              </h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.components_needed
                                  .slice(0, 3)
                                  .map((componentId) => {
                                    const component = labComponents.find(
                                      (c) => c.id === componentId
                                    );
                                    return (
                                      <Badge
                                        key={componentId}
                                        variant="secondary"
                                        className="text-xs font-normal px-2 py-0.5"
                                      >
                                        {component?.component_name ||
                                          "Unknown Component"}
                                      </Badge>
                                    );
                                  })}
                                {project.components_needed.length > 3 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs font-normal px-2 py-0.5"
                                  >
                                    +{project.components_needed.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 mt-auto">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <p className="font-semibold">Due Date</p>
                          <p>
                            {new Date(
                              project.expected_completion_date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <p className="font-semibold">Submissions</p>
                          <p>{project.submissions?.length || 0} received</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-6 pt-0 space-y-3">
                    {/* Enrollment Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        Enrollment:
                      </span>
                      <Badge
                        variant={
                          project.enrollment_status === "OPEN"
                            ? "default"
                            : project.enrollment_status === "CLOSED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {project.enrollment_status?.replace("_", " ") ||
                          "NOT STARTED"}
                      </Badge>
                    </div>

                    {project.enrollment_cap && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Applications:</span>
                        <span className="font-medium">
                          {project.project_requests?.length || 0} total
                          {project.project_requests?.filter(
                            (req) => req.status === "APPROVED"
                          ).length
                            ? ` (${
                                project.project_requests.filter(
                                  (req) => req.status === "APPROVED"
                                ).length
                              } approved)`
                            : ""}
                        </span>
                      </div>
                    )}

                    {/* Enrollment Management Buttons */}
                    <div className="space-y-2">
                      {project.status === "APPROVED" &&
                        project.enrollment_status === "NOT_STARTED" && (
                          <Button
                            className="w-full"
                            onClick={() => {
                              setSelectedProject(project);
                              setIsEnrollmentDialogOpen(true);
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Start Enrollment
                          </Button>
                        )}

                      {project.enrollment_status === "OPEN" && (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => handleCloseEnrollment(project.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Close Enrollment
                        </Button>
                      )}

                      {project.enrollment_status === "CLOSED" && (
                        <Button
                          variant="outline"
                          className="w-full border-green-500 text-green-700 hover:bg-green-50"
                          onClick={() => handleReopenEnrollment(project.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Reopen Enrollment
                        </Button>
                      )}

                      {/* View Applications Button */}
                      {(project.enrollment_status === "OPEN" ||
                        project.enrollment_status === "CLOSED") &&
                        project.project_requests &&
                        project.project_requests.length > 0 && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedProjectApplications(
                                project.project_requests || []
                              );
                              setSelectedProject(project);
                              setIsApplicationsDialogOpen(true);
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Applications ({project.project_requests.length}
                            )
                          </Button>
                        )}

                      {editMode && (
                        <div className="flex gap-4 mt-2">
                          <button className="btn-edit" onClick={() => handleEditProject(project)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 1 1 3.182 3.182L7.5 20.213l-4.182.545.545-4.182 13-13z" />
                            </svg>
                            Edit
                          </button>
                          <button className="btn-delete" onClick={() => { setProjectToDelete(project); setIsDeleteDialogOpen(true); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {/* Filter to only show student-proposed projects that need faculty approval */}
          {projectRequests.filter(request => (request.project as any)?.type === "STUDENT_PROPOSED").length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projectRequests.filter(request => (request.project as any)?.type === "STUDENT_PROPOSED").map((request) => (
                <Card
                  key={request.id}
                  className="hover:shadow-lg transition-shadow duration-200"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-blue-600" />
                          <span>{request.project.name}</span>
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          Request from {request.student.user.name} (
                          {request.student.user.email})
                        </CardDescription>
                      </div>
                      <Badge className={getRequestStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700 tracking-wide">
                          Description
                        </Label>
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                          {request.project.description}
                        </p>
                      </div>
                      {request.project.components_needed_details &&
                        request.project.components_needed_details.length >
                          0 && (
                          <div>
                            <Label className="text-xs font-semibold text-gray-700 tracking-wide">
                              Required Components
                            </Label>
                            <ul className="list-disc pl-5 text-sm text-muted-foreground">
                              {request.project.components_needed_details.map(
                                (component) => (
                                  <li key={component.id}>
                                    {component.component_name}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Requested:{" "}
                          {new Date(request.request_date).toLocaleDateString()}
                        </span>
                      </div>
                      {request.status === "PENDING" && (
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="ghost"
                            className="bg-green-500 text-white hover:bg-green-600"
                            onClick={() =>
                              handleApproveRequest(request.id, "APPROVED")
                            }
                            size="sm"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            className="bg-red-500 text-white hover:bg-red-600"
                            onClick={() =>
                              handleApproveRequest(request.id, "REJECTED")
                            }
                            size="sm"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg font-medium mb-2">
                No student project requests found
              </div>
              <p className="text-sm">
                Student-proposed projects will appear here when they need your approval.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card
                key={submission.id}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader className="pb-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        Submission by {submission.student.user.name}
                      </CardTitle>
                      <Badge
                        className={getSubmissionStatusColor(submission.status)}
                      >
                        {submission.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <CardDescription className="text-sm font-medium text-gray-700">
                        Submitted on{" "}
                        {new Date(
                          submission.submissionDate
                        ).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Submission Content */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-700 tracking-wide">
                        Submission Content
                      </Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {submission.content}
                        </p>
                      </div>
                    </div>

                    {/* Attachments */}
                    {submission.attachments &&
                      submission.attachments.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-gray-700 tracking-wide">
                            Attached Files
                          </Label>
                          <div className="space-y-2">
                            {submission.attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2 p-2 bg-blue-50 rounded-md"
                              >
                                <FileText className="h-4 w-4 text-blue-600" />
                                <a
                                  href={attachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  {attachment.split("/").pop() ||
                                    `File ${index + 1}`}
                                </a>
                                <span className="text-xs text-gray-500">
                                  (Click to view)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Grading Section */}
                    {submission.status === "SUBMITTED" && (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <Label className="text-xs font-semibold text-gray-700 tracking-wide">
                          Grade Submission
                        </Label>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-2">
                            <Label
                              htmlFor={`marks-${submission.id}`}
                              className="text-sm font-medium"
                            >
                              Marks (0-100)
                            </Label>
                            <Input
                              id={`marks-${submission.id}`}
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Enter marks"
                              defaultValue={submission.marks || 0}
                              className="w-full"
                              onBlur={(e) => {
                                const marks = parseInt(e.target.value) || 0;
                                const feedback =
                                  (
                                    document.getElementById(
                                      `feedback-${submission.id}`
                                    ) as HTMLTextAreaElement
                                  )?.value || "";
                                if (marks > 0) {
                                  handleGradeSubmission(
                                    submission.id,
                                    marks,
                                    feedback
                                  );
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor={`feedback-${submission.id}`}
                              className="text-sm font-medium"
                            >
                              Feedback
                            </Label>
                            <Textarea
                              id={`feedback-${submission.id}`}
                              placeholder="Enter feedback for the student..."
                              defaultValue={submission.feedback || ""}
                              rows={3}
                              onBlur={(e) => {
                                const marks =
                                  parseInt(
                                    (
                                      document.getElementById(
                                        `marks-${submission.id}`
                                      ) as HTMLInputElement
                                    )?.value || "0"
                                  ) || 0;
                                const feedback = e.target.value;
                                if (marks > 0 && feedback.trim()) {
                                  handleGradeSubmission(
                                    submission.id,
                                    marks,
                                    feedback
                                  );
                                }
                              }}
                            />
                          </div>
                          <Button
                            onClick={() => {
                              const marks =
                                parseInt(
                                  (
                                    document.getElementById(
                                      `marks-${submission.id}`
                                    ) as HTMLInputElement
                                  )?.value || "0"
                                ) || 0;
                              const feedback =
                                (
                                  document.getElementById(
                                    `feedback-${submission.id}`
                                  ) as HTMLTextAreaElement
                                )?.value || "";
                              if (marks > 0) {
                                handleGradeSubmission(
                                  submission.id,
                                  marks,
                                  feedback
                                );
                              } else {
                                toast({
                                  title: "Error",
                                  description:
                                    "Please enter marks before grading",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Grade Submission
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Graded Results */}
                    {submission.status === "GRADED" && (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <Label className="text-xs font-semibold text-gray-700 tracking-wide">
                          Grading Results
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-green-50 rounded-md">
                            <div className="font-medium text-green-900">
                              Marks
                            </div>
                            <div className="text-lg font-bold text-green-700">
                              {submission.marks}/100
                            </div>
                          </div>
                          {submission.feedback && (
                            <div className="p-3 bg-blue-50 rounded-md col-span-2">
                              <div className="font-medium text-blue-900 mb-1">
                                Feedback
                              </div>
                              <p className="text-sm text-blue-700">
                                {submission.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {submissions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-lg font-medium mb-2">
                  No submissions found
                </div>
                <p className="text-sm">
                  Student project submissions will appear here when they submit
                  their work.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Start Enrollment Dialog */}
      <Dialog
        open={isEnrollmentDialogOpen}
        onOpenChange={setIsEnrollmentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Enrollment</DialogTitle>
            <DialogDescription>
              Set the maximum number of students who can be selected for this
              project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={selectedProject?.name || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrollment-cap">Maximum Students</Label>
              <Input
                id="enrollment-cap"
                type="number"
                min="1"
                max="50"
                value={enrollmentCap}
                onChange={(e) =>
                  setEnrollmentCap(parseInt(e.target.value) || 1)
                }
                placeholder="Enter maximum number of students"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEnrollmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStartEnrollment}>Start Enrollment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the project "
              {projectToDelete?.name}"? This action cannot be undone and will
              also delete all related submissions and requests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced View Applications Dialog */}
      <Dialog
        open={isApplicationsDialogOpen}
        onOpenChange={(open) => {
          setIsApplicationsDialogOpen(open);
          if (!open) {
            // Reset AI state when dialog closes, but preserve saved results
            setShowAIRanking(false);
            setShortlistResults(null);
            // Note: savedShortlistResults is preserved to avoid re-computation
          }
        }}
      >
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Project Applications - {selectedProject?.name}</span>
              <div className="flex gap-2">
                {!showAIRanking && selectedProjectApplications.length > 0 && (
                  <Button
                    onClick={handleAIShortlistInDialog}
                    disabled={isShortlisting}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isShortlisting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        AI Analyzing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        AI Shortlist Candidates
                      </>
                    )}
                  </Button>
                )}
                {showAIRanking && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAIRanking(false)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Show All Applications
                  </Button>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              {showAIRanking
                ? `AI has ranked the top ${
                    selectedProject?.enrollment_cap || "available"
                  } candidates for: ${selectedProject?.name}`
                : ``}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedProjectApplications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No applications yet.
              </p>
            ) : showAIRanking && shortlistResults ? (
              // AI Ranking View - Beautiful Table
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <h3 className="font-semibold text-purple-900 mb-2">
                    AI Candidate Ranking
                  </h3>
                  <p className="text-purple-800 text-sm">
                    Analyzed {shortlistResults.total_applications} applications
                    and ranked top{" "}
                    {shortlistResults.shortlisted_candidates?.length || 0}{" "}
                    candidates for{" "}
                    {selectedProject?.enrollment_cap || "available"} positions.
                    Results based on resume content, skills match, and
                    experience relevance.
                  </p>
                </div>

                {/* Candidates Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Candidate
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Match Score
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Top Skills
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Resume
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          AI Details
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {shortlistResults.shortlisted_candidates?.map(
                        (candidate: any, index: number) => {
                          const matchingApplication =
                            selectedProjectApplications.find(
                              (app) =>
                                (candidate.student_id &&
                                  app.student_id === candidate.student_id) ||
                                app.student?.user?.email?.toLowerCase() ===
                                  candidate.student_email?.toLowerCase()
                            );
                          return (
                            <tr
                              key={candidate.request_id || index}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div
                                    className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm ${
                                      index === 0
                                        ? "bg-yellow-100 text-yellow-800"
                                        : index === 1
                                        ? "bg-gray-100 text-gray-800"
                                        : index === 2
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    #{index + 1}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {candidate.student_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {candidate.student_email}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    candidate.score > 0.8
                                      ? "bg-green-100 text-green-800"
                                      : candidate.score > 0.6
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {(candidate.score * 100).toFixed(1)}%
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1 max-w-[200px]">
                                  {(candidate.ai_analysis?.skills || [])
                                    .slice(0, 3)
                                    .map(
                                      (skill: string, skillIndex: number) => (
                                        <Badge
                                          key={skillIndex}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {typeof skill === "object"
                                            ? JSON.stringify(skill)
                                            : String(skill)}
                                        </Badge>
                                      )
                                    )}
                                  {(candidate.ai_analysis?.skills || [])
                                    .length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +
                                      {(candidate.ai_analysis?.skills || [])
                                        .length - 3}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {candidate.file_path && (
                                  <a
                                    href={`/${candidate.file_path.replace(
                                      /^.*[\\\/]public[\\\/]/,
                                      ""
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center"
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    View PDF
                                  </a>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    showCandidateDetails(candidate)
                                  }
                                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                                >
                                  <Info className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                              </td>
                              {/*console.log("Matching Application:", matchingApplication)*/}
                              <td className="px-4 py-3">
                                {matchingApplication && (
                                  <div className="flex space-x-2">
                                    {matchingApplication.status ===
                                    "PENDING" ? (
                                      <>
                                        <Button
                                          size="sm"
                                          className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700"
                                          onClick={() =>
                                            handleApplicationAction(
                                              matchingApplication.id,
                                              "APPROVED"
                                            )
                                          }
                                          title="Accept Application"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="w-8 h-8 p-0"
                                          onClick={() =>
                                            handleApplicationAction(
                                              matchingApplication.id,
                                              "REJECTED"
                                            )
                                          }
                                          title="Reject Application"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className={
                                          matchingApplication.status ===
                                          "APPROVED"
                                            ? "border-green-500 text-green-700 bg-green-50"
                                            : "border-red-500 text-red-700 bg-red-50"
                                        }
                                      >
                                        {matchingApplication.status}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Regular Applications View - Beautiful Table
              <div className="space-y-4">
                {/* Applications Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Student
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Applied Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Resume
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Notes
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProjectApplications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {application.student.user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {application.student.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                application.status === "APPROVED"
                                  ? "border-green-500 text-green-700 bg-green-50"
                                  : application.status === "REJECTED"
                                  ? "border-red-500 text-red-700 bg-red-50"
                                  : "border-blue-500 text-blue-700 bg-blue-50"
                              }
                            >
                              {application.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {new Date(
                                  application.request_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {application.resume_path ? (
                              <a
                                href={`/${application.resume_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View PDF
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                No resume
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {application.student_notes ||
                            application.faculty_notes ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  showApplicationDetails(application)
                                }
                                className="text-gray-600 border-gray-300 hover:bg-gray-50"
                              >
                                <Info className="h-4 w-4 mr-1" />
                                View Notes
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                No notes
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {application.status === "PENDING" ? (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700"
                                  onClick={() =>
                                    handleApplicationAction(
                                      application.id,
                                      "APPROVED"
                                    )
                                  }
                                  title="Accept Application"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="w-8 h-8 p-0"
                                  onClick={() =>
                                    handleApplicationAction(
                                      application.id,
                                      "REJECTED"
                                    )
                                  }
                                  title="Reject Application"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">
                                Decision made
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Shortlist Results Dialog */}
      <Dialog
        open={isShortlistDialogOpen}
        onOpenChange={setIsShortlistDialogOpen}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Shortlisted Candidates</DialogTitle>
            <DialogDescription>
              Top candidates selected by AI for:{" "}
              {shortlistResults?.project?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {shortlistResults?.shortlisted_candidates?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No suitable candidates found by AI analysis.
              </p>
            ) : (
              <>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    AI Analysis Summary
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Analyzed {shortlistResults?.total_applications || 0}{" "}
                    applications and selected top{" "}
                    {shortlistResults?.shortlisted_candidates?.length || 0}{" "}
                    candidates based on:
                  </p>
                  <ul className="text-blue-800 text-sm mt-2 ml-4 list-disc">
                    <li>Skills matching project requirements</li>
                    <li>Experience level and background</li>
                    <li>Resume semantic similarity to project description</li>
                    <li>Education and previous work experience</li>
                  </ul>
                </div>

                {shortlistResults?.shortlisted_candidates?.map(
                  (candidate: any, index: number) => {
                    // Ensure all required properties exist to prevent runtime errors
                    const safeCandidate = {
                      request_id: candidate?.request_id || `temp-${index}`,
                      student_name:
                        candidate?.student_name || "Unknown Student",
                      student_email: candidate?.student_email || "No email",
                      score: candidate?.score || 0,
                      file_path: candidate?.file_path || "",
                      ai_analysis: {
                        skills: candidate?.ai_analysis?.skills || [],
                        reasons: candidate?.ai_analysis?.reasons || [],
                        metadata: candidate?.ai_analysis?.metadata || {},
                      },
                    };

                    return (
                      <Card
                        key={safeCandidate.request_id}
                        className="p-6 border-l-4 border-l-purple-500"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                              #{index + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">
                                {safeCandidate.student_name}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {safeCandidate.student_email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                              Match Score:{" "}
                              {(safeCandidate.score * 100).toFixed(1)}%
                            </div>
                            {safeCandidate.file_path && (
                              <div className="flex items-center space-x-2 mt-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <a
                                  href={`/${safeCandidate.file_path.replace(
                                    /^.*[\\\/]public[\\\/]/,
                                    ""
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  View Resume
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">
                              Key Skills
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(
                                safeCandidate.ai_analysis.skills
                              ) &&
                                safeCandidate.ai_analysis.skills
                                  .slice(0, 8)
                                  .map((skill: any, skillIndex: number) => (
                                    <Badge
                                      key={skillIndex}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {typeof skill === "object"
                                        ? JSON.stringify(skill)
                                        : String(skill)}
                                    </Badge>
                                  ))}
                              {(!Array.isArray(
                                safeCandidate.ai_analysis.skills
                              ) ||
                                safeCandidate.ai_analysis.skills.length ===
                                  0) && (
                                <span className="text-gray-500 text-sm">
                                  No skills extracted
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">
                              Why Selected by AI
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {Array.isArray(
                                safeCandidate.ai_analysis.reasons
                              ) &&
                                safeCandidate.ai_analysis.reasons
                                  .slice(0, 3)
                                  .map((reason: any, reasonIndex: number) => (
                                    <li
                                      key={reasonIndex}
                                      className="flex items-start"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                      {typeof reason === "object"
                                        ? JSON.stringify(reason)
                                        : String(reason)}
                                    </li>
                                  ))}
                              {(!Array.isArray(
                                safeCandidate.ai_analysis.reasons
                              ) ||
                                safeCandidate.ai_analysis.reasons.length ===
                                  0) && (
                                <li className="text-gray-500">
                                  No specific reasons available
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>

                        {safeCandidate.ai_analysis.metadata &&
                          Object.keys(safeCandidate.ai_analysis.metadata)
                            .length > 0 && (
                            <div className="mt-4 p-3 bg-gray-50 rounded">
                              <h4 className="font-semibold text-gray-700 mb-2">
                                Additional Details
                              </h4>
                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                {safeCandidate.ai_analysis.metadata
                                  .experience_years && (
                                  <div>
                                    <span className="font-medium text-gray-600">
                                      Experience:
                                    </span>
                                    <p className="text-gray-800">
                                      {String(
                                        safeCandidate.ai_analysis.metadata
                                          .experience_years
                                      )}{" "}
                                      years
                                    </p>
                                  </div>
                                )}
                                {safeCandidate.ai_analysis.metadata
                                  .education && (
                                  <div>
                                    <span className="font-medium text-gray-600">
                                      Education:
                                    </span>
                                    <p className="text-gray-800">
                                      {Array.isArray(
                                        safeCandidate.ai_analysis.metadata
                                          .education
                                      )
                                        ? safeCandidate.ai_analysis.metadata.education
                                            .map((edu: any) =>
                                              typeof edu === "object"
                                                ? JSON.stringify(edu)
                                                : String(edu)
                                            )
                                            .join(", ")
                                        : typeof safeCandidate.ai_analysis
                                            .metadata.education === "object"
                                        ? JSON.stringify(
                                            safeCandidate.ai_analysis.metadata
                                              .education
                                          )
                                        : String(
                                            safeCandidate.ai_analysis.metadata
                                              .education
                                          )}
                                    </p>
                                  </div>
                                )}
                                {safeCandidate.ai_analysis.metadata
                                  .job_titles && (
                                  <div>
                                    <span className="font-medium text-gray-600">
                                      Recent Role:
                                    </span>
                                    <p className="text-gray-800">
                                      {Array.isArray(
                                        safeCandidate.ai_analysis.metadata
                                          .job_titles
                                      )
                                        ? safeCandidate.ai_analysis.metadata.job_titles
                                            .map((job: any) =>
                                              typeof job === "object"
                                                ? JSON.stringify(job)
                                                : String(job)
                                            )
                                            .join(", ")
                                        : typeof safeCandidate.ai_analysis
                                            .metadata.job_titles === "object"
                                        ? JSON.stringify(
                                            safeCandidate.ai_analysis.metadata
                                              .job_titles
                                          )
                                        : String(
                                            safeCandidate.ai_analysis.metadata
                                              .job_titles
                                          )}
                                    </p>
                                  </div>
                                )}
                                {/* Handle any other metadata fields safely */}
                                {Object.entries(
                                  safeCandidate.ai_analysis.metadata
                                )
                                  .filter(
                                    ([key]) =>
                                      ![
                                        "experience_years",
                                        "education",
                                        "job_titles",
                                      ].includes(key)
                                  )
                                  .slice(0, 3)
                                  .map(([key, value]) => (
                                    <div key={key}>
                                      <span className="font-medium text-gray-600 capitalize">
                                        {key.replace(/_/g, " ")}:
                                      </span>
                                      <p className="text-gray-800">
                                        {typeof value === "object"
                                          ? JSON.stringify(value)
                                          : String(value)}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </Card>
                    );
                  }
                )}

                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-amber-900 mb-2">
                    📋 Next Steps
                  </h3>
                  <p className="text-amber-800 text-sm">
                    Review the AI recommendations above and use the "View
                    Applications" button to approve or reject individual
                    candidates. The AI analysis is a recommendation - final
                    decisions are yours!
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <Button
              onClick={() => {
                setIsShortlistDialogOpen(false);
                setShortlistResults(null);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Candidate Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
  <DialogContent className="sm:max-w-[1400px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Info className="h-5 w-5 text-purple-600" />
        AI Analysis Details
      </DialogTitle>
      <DialogDescription>
        Detailed AI analysis for {selectedCandidateDetails?.student_name}
      </DialogDescription>
    </DialogHeader>

    {selectedCandidateDetails && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: AI Reasoning */}
        <div className="lg:col-span-2 bg-purple-50 rounded-lg p-6 flex flex-col">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Why AI Selected This Candidate
          </h4>
          {(selectedCandidateDetails.ai_analysis?.reasons || []).length > 0 ? (
            <ul className="list-disc pl-6 text-base text-blue-900 space-y-3">
              {selectedCandidateDetails.ai_analysis.reasons.map(
                (reason: any, index: number) => (
                  <li key={index}>
                    {typeof reason === "object"
                      ? JSON.stringify(reason)
                      : String(reason)}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="text-gray-500 italic">
              No specific reasons available
            </p>
          )}
        </div>

        {/* Right: Profile (top) and Skills (bottom) */}
        <div className="flex flex-col gap-6">
          {/* Profile */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-2">
            <h4 className="font-semibold text-gray-900 mb-2">Profile</h4>
            <div>
              <span className="font-medium">Name: </span>
              {selectedCandidateDetails.student_name}
            </div>
            <div>
              <span className="font-medium">Email: </span>
              {selectedCandidateDetails.student_email}
            </div>
            <div>
              <Badge className="bg-green-100 text-green-800">
                Match Score: {(selectedCandidateDetails.score * 100).toFixed(1)}%
              </Badge>
            </div>
            {selectedCandidateDetails.file_path && (
              <a
                href={`/${selectedCandidateDetails.file_path.replace(
                  /^.*[\\\/]public[\\\/]/,
                  ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 underline mt-2"
              >
                <FileText className="h-4 w-4 mr-1" />
                View Resume
              </a>
            )}
          </div>

          {/* Skills */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-2">
            <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {(selectedCandidateDetails.ai_analysis?.skills || []).map(
                (skill: any, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1"
                  >
                    {typeof skill === "object"
                      ? JSON.stringify(skill)
                      : String(skill)}
                  </Badge>
                )
              )}
              {(!selectedCandidateDetails.ai_analysis?.skills ||
                selectedCandidateDetails.ai_analysis.skills.length === 0) && (
                <p className="text-gray-500 italic">No skills extracted</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="flex justify-end mt-6">
      <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
    </div>
  </DialogContent>
</Dialog>

      {/* Application Details Dialog (for notes) */}
      <Dialog
        open={isApplicationDetailsDialogOpen}
        onOpenChange={setIsApplicationDetailsDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Application Notes
            </DialogTitle>
            <DialogDescription>
              Notes for {selectedApplicationDetails?.student.user.name}
            </DialogDescription>
          </DialogHeader>

          {selectedApplicationDetails && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold">
                    {selectedApplicationDetails.student.user.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {selectedApplicationDetails.student.user.email}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Applied:{" "}
                    {new Date(
                      selectedApplicationDetails.request_date
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {selectedApplicationDetails.student_notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Student Notes</h4>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      {selectedApplicationDetails.student_notes}
                    </p>
                  </div>
                </div>
              )}

              {selectedApplicationDetails.faculty_notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Your Notes</h4>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900">
                      {selectedApplicationDetails.faculty_notes}
                    </p>
                  </div>
                </div>
              )}

              {!selectedApplicationDetails.student_notes &&
                !selectedApplicationDetails.faculty_notes && (
                  <p className="text-gray-500 italic text-center py-4">
                    No notes available
                  </p>
                )}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => setIsApplicationDetailsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog
        open={isEditProjectDialogOpen}
        onOpenChange={setIsEditProjectDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project information and requirements
            </DialogDescription>
          </DialogHeader>

          {editingProject && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  value={editingProject.name}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProject.description}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter project description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-enrollment-cap">Maximum Students</Label>
                <Input
                  id="edit-enrollment-cap"
                  type="number"
                  min="1"
                  max="50"
                  value={editingProject.enrollment_cap}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      enrollment_cap: parseInt(e.target.value) || 1,
                    })
                  }
                  placeholder="Enter maximum number of students"
                />
                <p className="text-sm text-gray-600">
                  Number of students who can be selected for this project
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEditProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEditedProject}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Results Choice Dialog */}
      <AlertDialog
        open={isAIResultsChoiceDialogOpen}
        onOpenChange={setIsAIResultsChoiceDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Analysis Results Available</AlertDialogTitle>
            <AlertDialogDescription>
              Previous AI shortlist results are already available for this project. 
              Would you like to use the previous results or run a fresh analysis?
              <br />
              <span className="text-sm text-amber-600 mt-2 block">
                Note: Fresh analysis will take 1-2 minutes to complete.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAIResultsChoiceDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={handleUsePreviousResults}
              className="mr-2"
            >
              Use Previous Results
            </Button>
            <AlertDialogAction onClick={handleRefreshAnalysis}>
              Run Fresh Analysis
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
